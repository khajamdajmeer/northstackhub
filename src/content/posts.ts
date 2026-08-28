import { authors, type Post } from "@/content/types";

export const posts: Post[] = [
  {
    slug: "rag-that-actually-answers-correctly",
    title: "RAG that actually answers correctly",
    description:
      "Why naive vector search underperforms, chunking that follows document structure, hybrid retrieval with reranking, and the evaluation set you need before tuning.",
    date: "2026-07-28",
    category: "Architecture",
    tags: ["rag", "retrieval", "evaluation", "python"],
    author: authors.backend,
    body: `Retrieval-augmented generation demos beautifully and fails quietly. You embed a folder of PDFs, wire up a vector store, and the first ten questions come back plausible. Then someone asks about the cancellation clause in this year's contract and the system quotes last year's with total confidence. We have rebuilt enough of these to state the pattern plainly: the failure is almost never the model. It is retrieval, an engineering problem with measurable answers.

## Why naive vector search underperforms

Embedding similarity is not relevance. Three failure modes cover the gap.

**Identifiers do not embed.** Part numbers, error codes, statute references, surnames. Ask "what does error E-4412 mean" and the query vector lands near every other error paragraph in the corpus: the encoder captures the shape of the sentence and discards the token carrying all the meaning. Dense vectors compress, and identifiers are what compression throws away.

**Chunk boundaries destroy answers.** A fixed 512-token window splits a table from its header row, or a clause from the definition of the term it uses. The chunk still scores well and contains nothing usable, so the model invents the missing half. That reads as a hallucination but is a retrieval bug.

**Similarity has no idea what is current.** A superseded policy, a draft, a support ticket quoting the old rule and the live handbook all sit near the query in vector space. Cosine distance will never tell you which is true today.

On one client corpus of roughly 40,000 pages of compliance material, plain top-5 dense retrieval put the correct passage into context for 61% of our test questions. Structure-aware chunking, hybrid retrieval and a cross-encoder reranker took that to 89% with no change to the generation model.

## Chunk on structure, not character count

Chunking is where most of the win lives. The rules we apply:

- **Split on the document's own boundaries first**: headings, articles, clauses, list items, slides, ticket threads. Character-count splitting is the fallback for a section that is genuinely too long.
- **Keep tables whole**, serialized as Markdown with the header row intact. A table split across two chunks is worse than no table at all.
- **Prepend the heading path** to every chunk's embedded text. "This must be requested within 30 days." is useless alone; "Refunds > Consumer returns > Timing: This must be requested within 30 days." retrieves and reads correctly.
- **Target 300 to 800 tokens.** Below that you lose the context the sentence depends on. Above it, one chunk covers several topics and its embedding averages all of them.
- **Overlap is a patch, not a strategy.** 10 to 15% helps at awkward boundaries. Needing 50% means your splitter is ignoring the document structure.
- **Store metadata beside the text and filter on it**: source id, heading path, effective date, version, access scope. Half the "wrong answer" tickets we investigate are a scoping problem a filter would have solved.

## Hybrid retrieval, then rerank

Run lexical and dense search in parallel and fuse the results. BM25 finds the error code; the dense index finds the paraphrase. Reciprocal rank fusion is our default because it fuses ranks rather than scores, so nothing needs normalizing. Postgres does both sides well enough for most corpora, which saves running a second datastore:

\`\`\`sql
-- pgvector + tsvector, fused with reciprocal rank fusion (k = 60)
with dense as (
  select id, row_number() over (order by embedding <=> $1) as rank
  from chunks
  where tenant_id = $2 and effective_to is null
  order by embedding <=> $1
  limit 50
),
lexical as (
  select id, row_number() over (
           order by ts_rank_cd(tsv, websearch_to_tsquery('english', $3)) desc
         ) as rank
  from chunks
  where tenant_id = $2
    and effective_to is null
    and tsv @@ websearch_to_tsquery('english', $3)
  limit 50
)
select c.id,
       c.heading_path,
       c.content,
       coalesce(1.0 / (60 + d.rank), 0) + coalesce(1.0 / (60 + l.rank), 0) as score
from chunks c
left join dense   d on d.id = c.id
left join lexical l on l.id = c.id
where d.id is not null or l.id is not null
order by score desc
limit 50;
\`\`\`

Note the \`effective_to is null\` predicate: recency and supersession belong in the query, not in the system prompt.

Then rerank. A cross-encoder scores the query and a candidate together instead of comparing two independent vectors, which is why it is far more accurate and far slower. Take 50 candidates down to 8. On a small GPU a base-size reranker scores 50 pairs in roughly 40ms; on CPU budget 250 to 400ms and cache. That step alone was worth 14 points of recall@5 on the compliance corpus, more than any embedding model swap we tried.

## Build the evaluation set before you tune anything

Without a labeled set, every change is judged by typing three questions into a chat window and forming an impression, which cannot detect a regression. Write 150 to 200 questions with a domain expert, each labeled with the chunk ids that genuinely answer it. Include the categories that break systems: exact-identifier lookups, answers spanning two sections, superseded content, near-duplicate topics needing disambiguation, and 20 to 30 questions the corpus **cannot** answer.

Measure retrieval separately from generation. If recall@10 is 0.6, no amount of prompt engineering will save you.

\`\`\`python
# eval/harness.py
import json
import statistics
from dataclasses import dataclass


@dataclass
class Case:
    qid: str
    question: str
    gold_chunks: set[str]   # empty set means "the system should abstain"
    category: str


def recall_at_k(retrieved: list[str], gold: set[str], k: int) -> float:
    if not gold:
        return 1.0
    return len(gold & set(retrieved[:k])) / len(gold)


def reciprocal_rank(retrieved: list[str], gold: set[str]) -> float:
    for position, chunk_id in enumerate(retrieved, start=1):
        if chunk_id in gold:
            return 1.0 / position
    return 0.0


def run(cases: list[Case], retrieve, answer) -> dict:
    rows = []
    for case in cases:
        ranked = [chunk.id for chunk in retrieve(case.question)]
        result = answer(case.question, ranked[:8])
        cited = set(result.citations)
        rows.append(
            {
                "qid": case.qid,
                "category": case.category,
                "recall@5": recall_at_k(ranked, case.gold_chunks, 5),
                "mrr": reciprocal_rank(ranked, case.gold_chunks),
                # every cited passage must be one we actually put in context
                "citation_valid": float(bool(cited) and cited <= set(ranked[:8])),
                "abstained": result.abstained,
                "should_abstain": not case.gold_chunks,
            }
        )

    def mean(key: str) -> float:
        return round(statistics.fmean(float(row[key]) for row in rows), 3)

    unanswerable = [row for row in rows if row["should_abstain"]]
    summary = {
        "n": len(rows),
        "recall@5": mean("recall@5"),
        "mrr": mean("mrr"),
        "citation_valid": mean("citation_valid"),
        "false_answer_rate": round(
            sum(1 for row in unanswerable if not row["abstained"])
            / max(1, len(unanswerable)),
            3,
        ),
    }
    print(json.dumps(summary, indent=2))
    return summary
\`\`\`

Run it in CI on every change to the chunker, the prompt, the retriever weights or the model version, and fail the build on a regression greater than two points. An afternoon of work, and the difference between tuning and guessing.

## Citations have to be verifiable

Ask a model to cite its sources and it will produce citation-shaped text whether or not it used them. Make citations structural: give every retrieved passage an id in the prompt, require the answer as JSON with a \`citations\` array of those ids, then validate server-side that each id was in the context you supplied. In the UI, a citation links to the exact passage with the matched text highlighted, never to a 90-page PDF. Once reviewers can click through, they report *which* passage was wrong, and you get labeled evaluation cases out of real usage.

## Saying "I don't know"

Abstention is a feature, and it needs a threshold rather than a polite instruction. We gate on the reranker score of the top passage: below a calibrated cut-off the pipeline never calls the generation model and returns the nearest passages as suggested reading. Calibrate that cut-off against the unanswerable questions in your evaluation set.

Then instruct explicitly: answer only from the supplied passages, and when they do not contain the answer, say so and name what is missing. "The provided policy documents cover EU returns but not US returns" is a useful answer. A confident invention is worse than silence, and in a regulated domain it ends the project.

## How we work

We build the evaluation set in week one, with the client's domain expert in the room, before any tuning happens. Retrieval quality is reported as a number on every release, ingestion is a reproducible pipeline rather than a one-off notebook, and abstention thresholds are tuned against real questions. Clients get the harness with the code, so when they add 5,000 documents next year they can tell whether the system got better or worse without asking us.
`,
  },
  {
    slug: "guardrails-for-autonomous-agents",
    title: "Guardrails for autonomous agents",
    description:
      "Narrow tool scoping, approval gates on irreversible actions, step and spend budgets, full run tracing and replay, and when a queue plus rules beats an agent.",
    date: "2026-07-07",
    category: "Engineering",
    tags: ["agents", "llm", "reliability", "tracing"],
    author: authors.lead,
    body: `An agent that can call tools is a program whose control flow is decided at runtime by a language model. That is a useful capability and an uncomfortable thing to point at production data. The teams who ship agents successfully are not the ones with the best prompts. They are the ones who assumed the model would do something stupid on run 400 and built so it would not matter.

## Scope the tools, not the prompt

The most common design error is exposing a general capability and describing its limits in English. \`run_sql(query: string)\` with "only read from the analytics schema, never write" in the system message is not a constraint. It is a suggestion, and it will be ignored under prompt injection or an unlucky sample.

Tools should be as narrow as a well-designed API endpoint:

- One verb, one resource. \`refund_order\`, not \`manage_order(action)\`.
- Enumerations instead of free text wherever the value set is known.
- Validate arguments against a schema, then re-check authorization server-side against the run's identity, as you would for a browser request.
- Scope every query by tenant inside the handler. The model never supplies the tenant id.
- Separate read tools from write tools so budgets and approvals can treat them differently.

\`\`\`ts
// src/agent/tools/refund-order.ts
import { z } from "zod";
import { defineTool } from "@/agent/kernel";

const Input = z.object({
  orderId: z.string().uuid(),
  amountCents: z.number().int().positive().max(50_000),
  reason: z.enum(["damaged", "not_received", "duplicate_charge", "goodwill"]),
});

export const refundOrder = defineTool({
  name: "refund_order",
  description: "Refund part or all of a single order that is already paid.",
  input: Input,
  effect: "irreversible",           // drives the approval gate
  costCents: (i) => i.amountCents,  // drives the spend budget
  async execute(input, ctx) {
    const order = await db.order.findFirst({
      where: { id: input.orderId, orgId: ctx.orgId }, // orgId never comes from the model
    });
    if (!order || order.status !== "paid") {
      return { ok: false as const, error: "order_not_refundable" };
    }
    if (input.amountCents > order.totalCents - order.refundedCents) {
      return { ok: false as const, error: "amount_exceeds_remaining" };
    }

    const refund = await stripe.refunds.create(
      { payment_intent: order.paymentIntentId, amount: input.amountCents },
      { idempotencyKey: \`refund:\${ctx.runId}:\${ctx.stepId}\` },
    );
    return { ok: true as const, refundId: refund.id };
  },
});
\`\`\`

Failures come back as structured results rather than thrown exceptions. An agent that reads \`order_not_refundable\` will try something else. An agent that hits a 500 just calls the same tool again.

## Approval gates on anything irreversible

Classify every tool by effect and let the class drive policy, rather than making a judgement call per tool:

- **Reversible**: reads, drafts, internal notes, anything in a sandbox. Runs freely.
- **Externally visible**: sending an email, posting to a channel, changing a public status. Free below a threshold, gated above it.
- **Irreversible**: money movement, deletion, production writes, anything a customer experiences as final. Always gated, or gated above a value you can defend later.

The gate has to be a real pause, which means the run has to be durable. An agent holding an open HTTP connection while a human decides breaks the first time the process restarts. We persist run state, emit an approval request containing the proposed call and the steps that led to it, and resume from the stored state when a decision arrives. An unanswered gate after 24 hours fails the run rather than sitting open forever.

Show the approver the arguments and the last few steps, because "send_email" alone tells them nothing and they will approve on reflex. Record the decision, the approver and the timestamp: the first serious incident review will ask exactly who approved what.

## Budgets: steps, tokens, money, wall clock

Every run gets hard ceilings enforced by the loop, not by the model:

- **Step budget.** 12 to 20 tool calls covers almost every task we ship. Hitting the ceiling is a signal that the task was wrong for an agent, or that the tools are too fine-grained.
- **Token budget** per run, so a context growing with every observation cannot quietly cost twenty times the estimate.
- **Spend budget** in real currency, covering model cost and the value of actions taken. A refund agent with a 5,000 cent daily ceiling per operator cannot become an incident.
- **Wall clock.** Kill a run at ten minutes and surface it rather than letting it retry into next week.
- **Loop detection.** Hash the tool name plus normalized arguments. The same hash three times means the agent is stuck, and stopping there saves money and gives a clearer trace.

## Trace every run, replay any run

You cannot debug an agent from application logs. What you need is the ordered record of every step: messages sent, model and version, sampling parameters, tool called, arguments, raw result, token counts, latency. Append-only rows, keyed by run.

\`\`\`sql
create table agent_runs (
  id                 uuid primary key,
  org_id             uuid        not null,
  goal               text        not null,
  status             text        not null,  -- running|awaiting_approval|done|failed
  step_budget        int         not null,
  spend_budget_cents int         not null,
  spend_cents        int         not null default 0,
  started_at         timestamptz not null default now(),
  ended_at           timestamptz
);

create table agent_steps (
  run_id        uuid        not null references agent_runs(id),
  step_no       int         not null,
  kind          text        not null,      -- model_call|tool_call|approval|error
  model         text,
  tool_name     text,
  input         jsonb       not null,
  output        jsonb,
  prompt_tokens int,
  output_tokens int,
  cost_cents    int         not null default 0,
  latency_ms    int,
  created_at    timestamptz not null default now(),
  primary key (run_id, step_no)
);

create index agent_steps_tool_idx on agent_steps (tool_name, created_at desc);
\`\`\`

That table gives you replay for free. Feed the recorded steps back through the loop with each tool stubbed by its stored output, and you can test a prompt change against 200 real historical runs before it touches traffic. It is the closest thing an agent system has to a regression test, and it turns "the new prompt feels better" into a diff you can read. Sample and label too: a weekly review of 20 random runs, scored by a human, gives you a quality number that survives contact with reality.

## Retries and idempotency

Agent loops retry constantly. The model retries because a result looked wrong, the framework retries on a timeout, the queue redelivers because the worker died holding the job. Every tool call therefore executes at least once and possibly several times.

The fix is the one payments taught us. Derive a deterministic key from the run and step, pass it to any downstream that supports idempotency, and keep a local table of executed keys and results for those that do not. On a repeat, return the stored result instead of acting again. \`runId:stepId\` is stable across retries of the same step and different for a genuinely new decision.

Distinguish retryable from terminal errors in the tool contract. A 429 or a connection reset is retryable with backoff. A validation failure, an authorization failure or "order already refunded" is terminal: hand it back to the model and let it choose differently.

## When an agent is the wrong tool

This is the section the vendor demos leave out. A loop that plans its own steps is the right shape when the task genuinely branches, the input is unstructured, and the paths are too numerous to enumerate: triaging inbound support mail, investigating a failure across several systems, drafting from messy source material.

It is the wrong shape when the process is already known. If you can draw the flowchart, build the flowchart. A queue, a rules table and three well-tested functions will be faster, cheaper by an order of magnitude, deterministic, and debuggable by anyone on the team at 2am. We have replaced two "agents" with a state machine plus one narrow model call for classification, and both got more accurate and roughly 30 times cheaper.

The test we apply: if a competent new hire could follow written instructions and do this without judgement calls, it is a workflow, not an agent. Use the model for the step that needs judgement and ordinary code for the rest.

## How we work

We ship agents with the boring parts first: typed tools with server-side authorization, an effect classification per tool, budgets enforced in the loop, a run table with full traces, and a replay harness before the first production run. Approval policy is written down with the client, tool by tool, thresholds attached. And we say plainly when part of a workflow does not need an agent, because a small model call inside a well-understood pipeline is usually the version still working a year later.
`,
  },
  {
    slug: "nextjs-app-router-architecture-that-scales",
    title: "The Next.js App Router architecture that actually scales",
    description:
      "How we lay out App Router projects: route groups, server and client boundaries, data fetching without waterfalls, caching, and where state really belongs.",
    date: "2026-06-02",
    category: "Architecture",
    tags: ["nextjs", "react", "architecture", "app-router"],
    author: authors.frontend,
    featured: true,
    body: `Most App Router projects don't fall over because of a bad framework decision. They fall over because the directory tree grew organically for six months, \`"use client"\` crept upward into layouts, and nobody could say where a given piece of state actually lived. We've inherited enough of those codebases to have opinions. Here's the structure we start from on every Next.js build.

## Directory layout

Route groups do the heavy lifting. A typical project root looks like this:

\`\`\`text
src/
  app/
    (marketing)/           # public, static, own layout
      page.tsx
      pricing/page.tsx
    (auth)/
      layout.tsx
      login/page.tsx
    (app)/                 # authenticated surface
      layout.tsx           # sidebar, session guard
      dashboard/
        page.tsx
        loading.tsx
        _components/revenue-chart.tsx
      invoices/[id]/page.tsx
    api/webhooks/stripe/route.ts
  components/ui/           # primitives only
  features/invoices/       # queries, actions, schema
  lib/                     # db, auth, stripe, utils
\`\`\`

Three boundaries, enforced in review:

- \`src/components/ui\` holds primitives with no business knowledge. A \`Button\` never imports from \`features/\`.
- \`src/features/<domain>\` holds queries, server actions, zod schemas, domain types. Most of the code lives here.
- \`src/lib\` holds infrastructure clients and pure helpers. It never imports React.

Anything used by exactly one route goes in a private \`_components\` folder next to that route. The underscore keeps it out of routing, and deleting the route deletes its UI. Promotion to \`features/\` happens on the second consumer, not the first.

We cap nesting at roughly four segments. Past that, imports turn into \`../../../../\` archaeology. Deep hierarchies usually mean the URL is modeling database joins instead of user intent.

## The server/client boundary

The rule: client components are leaves. Interactivity lives at the edge of the tree, not the trunk.

Putting \`"use client"\` on a layout is the most expensive mistake in App Router. Everything imported below that boundary compiles into the client bundle, including your date library and your markdown renderer. On one rescue project the authenticated layout was a client component and the shared entry chunk was 612 KB gzipped. Moving the interactive shell one level down and passing \`children\` through brought it to 188 KB.

That \`children\` slot is the workhorse. A client component can render server content as long as it arrives as a prop rather than an import:

\`\`\`tsx
// src/components/app-shell.tsx
"use client";

import { useState, type ReactNode } from "react";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside data-open={open} className="w-64 shrink-0 border-r">{sidebar}</aside>
      <main className="flex-1">
        <button onClick={() => setOpen((v) => !v)}>Toggle</button>
        {children}
      </main>
    </div>
  );
}
\`\`\`

\`sidebar\` and \`children\` can both be server components that hit the database. The client shell only owns the open/closed boolean. Props crossing the boundary must be serializable: no functions, no class instances, no \`Date\` objects buried in ORM models you forgot to map.

## Data fetching

Fetch where the data is used. A component rendering invoice totals should query invoice totals, not receive them threaded through four layers of props. React's \`cache()\` dedupes identical calls within a request, so two components asking for the same organization do one query.

Waterfalls are the real cost. Sequential \`await\`s mean the second query waits on the first for no reason. We use \`Promise.all\` for independent reads and \`Suspense\` to stream the slow ones:

\`\`\`tsx
// src/app/(app)/dashboard/page.tsx
import { Suspense } from "react";
import { getOrg, getUsageSummary } from "@/features/billing/queries";
import { RevenueChart } from "./_components/revenue-chart";
import { ActivityFeed } from "./_components/activity-feed";

export default async function DashboardPage() {
  const [org, usage] = await Promise.all([getOrg(), getUsageSummary()]);

  return (
    <>
      <header>
        <h2>{org.name}</h2>
        <p>{usage.seatsUsed} of {usage.seatLimit} seats</p>
      </header>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart orgId={org.id} />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed orgId={org.id} />
      </Suspense>
    </>
  );
}
\`\`\`

\`RevenueChart\` runs an aggregate that takes 900ms against a year of data. Wrapped in \`Suspense\`, it stops blocking first paint. On that dashboard p95 TTFB went from 820ms to 190ms. \`loading.tsx\` gives the whole route the same treatment during navigation.

Route handlers are for things outside your React tree: webhooks, uploads with a custom content type, endpoints a mobile client consumes. Calling your own \`/api/invoices\` from a server component adds a network hop and loses type safety.

## Caching

Next is dynamic by default now, which is the honest posture: you opt into caching deliberately. For catalog-shaped pages (public listings, docs, marketing) ISR plus \`revalidateTag\` on write is still the best ratio of effort to result. In Next 15/16 the newer direction is \`use cache\` with \`cacheLife\` and \`cacheTag\` at the function level, a better fit because the decision attaches to the data rather than the route.

The point worth internalizing: cache correctness is a data-ownership question. Before setting a TTL, answer who writes this record and what should happen the moment they do. A 40-row country lookup gets a 12-hour TTL and nobody cares. Invoice status gets tagged and invalidated on write, because a client refreshing after payment and seeing "unpaid" files a ticket.

## Server actions

Server actions suit mutations that originate in your own UI: form submits, toggles, deletes. They keep the round trip typed and skip the API layer.

They are not free. A server action is a POST endpoint with a public ID, and anyone can call it with any payload. Every action validates with zod and re-checks authorization on the server, no exceptions:

\`\`\`ts
"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { requireOrgMember } from "@/lib/auth";

const UpdateInvoice = z.object({
  invoiceId: z.string().uuid(),
  status: z.enum(["draft", "sent", "paid", "void"]),
});

export async function updateInvoiceStatus(input: unknown) {
  const { invoiceId, status } = UpdateInvoice.parse(input);
  const { orgId } = await requireOrgMember();

  const { count } = await db.invoice.updateMany({
    where: { id: invoiceId, orgId },
    data: { status },
  });
  if (count === 0) return { ok: false as const };

  revalidateTag(\`invoice:\${invoiceId}\`);
  return { ok: true as const };
}
\`\`\`

Note the \`orgId\` in the \`where\` clause. Scoping the query is what stops one tenant editing another's records. When a mobile app or third party needs the same operation, we expose a versioned route handler and let both call the shared function.

## Where state belongs

URL search params are the default store. Filters, pagination, sort order, active tab, open drawer with an ID: all of it goes in the URL. It's shareable, survives refresh, and works with the back button for free.

Server state stays on the server. If it lives in Postgres, don't mirror it into a client cache and then fight to keep the two in sync.

Client state is for genuinely ephemeral things: an unsubmitted form, a hover preview, an optimistic row. \`useState\` handles nearly all of it. Context is fine for low-frequency values like theme or locale. Zustand earns its place when several distant components share fast-changing state, say a canvas editor or a wizard with cross-step validation. On a standard CRUD dashboard, that's roughly never.

## What we don't do

- No monorepo on day one. One Next app plus one FastAPI service is not a monorepo problem. Turborepo goes in when there's a second deployable.
- No global store scaffolded in week one. Adding it later is an afternoon. Removing it is a refactor.
- No barrel \`index.ts\` in every folder. Re-export files defeat tree-shaking in ways that are hard to trace, and they create import cycles that only surface at build time.
- No \`any\` at the fetch boundary. Parse external data with zod and let types flow from the schema.

## How we work

On client projects we stand this skeleton up in the first few days and write it into the repo's conventions file, so the structure holds after we hand off. Handover includes the route map, the boundary rules, a caching table showing what's tagged versus time-based, and a note on where each kind of state lives. Most of the above costs nothing to adopt early and a lot to retrofit at month six. That asymmetry is the whole argument.
`,
  },
  {
    slug: "offline-first-mobile-sync",
    title: "Offline-first React Native: an app that works with no signal",
    description:
      "Local-first writes, an outbox queue, choosing between last-write-wins, per-field merge and CRDTs, background sync, and testing the failure paths on purpose.",
    date: "2026-05-12",
    category: "Engineering",
    tags: ["react-native", "offline-first", "mobile", "sync"],
    author: authors.frontend,
    body: `Field apps get used in basements, in lifts, on sites with one bar of EDGE, and on phones whose owners turned mobile data off to protect their allowance. If the app's answer to that is a spinner, it is not finished. Offline-first is not a feature you add in month four. It is a decision about where the truth lives, and retrofitting it means rewriting every screen that touches data.

## The device database is the source of truth

One rule makes everything else fall into place: **the UI reads from and writes to the device only.** The network is a background process reconciling the device with the server. No screen awaits a request in order to render, and no button waits on a round trip before showing its effect.

That inverts the usual React Native data layer. Instead of a query hook that fetches and caches, you have a local store the UI subscribes to and a sync worker that feeds it. We use SQLite through \`expo-sqlite\` or \`op-sqlite\` with a thin repository layer, or WatermelonDB when the model is large enough that its observable collections pay for themselves. Realm and PowerSync are reasonable if you would rather buy a sync engine than build one, as long as you accept you are buying its conflict model too.

Every record carries three columns beyond its domain fields: \`updated_at\` as last seen from the server, \`local_updated_at\` from the device, and a \`dirty\` flag set when the device has changed a row the server has not acknowledged.

## The outbox is the whole sync design

A write goes to two places in one transaction: the domain table, and an outbox of **intents**. Not row snapshots, intents. "Set job status to complete" survives reordering and redelivery. "PUT this entire job object" overwrites whatever else happened in the meantime.

\`\`\`sql
-- device-local schema
create table outbox (
  id              text    primary key,   -- uuid, doubles as the idempotency key
  entity          text    not null,      -- 'job' | 'note' | 'photo'
  entity_id       text    not null,
  op              text    not null,      -- 'create' | 'update' | 'delete'
  payload         text    not null,      -- json of changed fields only
  base_version    integer,               -- server version the edit was made against
  created_at      integer not null,
  attempts        integer not null default 0,
  next_attempt_at integer not null default 0,
  last_error      text
);

create index outbox_ready on outbox (next_attempt_at, created_at);
\`\`\`

Three properties earn their keep. The row id is generated on the device and used as the idempotency key, so redelivery after a dropped response costs nothing. \`payload\` holds only changed fields, which makes per-field merging possible later. \`base_version\` records what the edit was made against, letting the server detect a genuine conflict instead of guessing.

Generate entity ids on the device too. UUIDv7 sorts by creation time, so a record created offline has its final identity immediately. Server-assigned ids force a mapping table and a class of bugs where a local child points at a parent that does not exist yet.

Drain the outbox in order, per entity, and stop the chain on a hard failure:

\`\`\`ts
export async function drainOutbox(signal: AbortSignal) {
  const now = Date.now();
  const batch = await db.all<OutboxRow>(
    "select * from outbox where next_attempt_at <= ? order by created_at limit 25",
    [now],
  );

  for (const row of batch) {
    if (signal.aborted) return;

    try {
      const res = await api.push(row, { idempotencyKey: row.id, signal });
      if (res.status === "conflict") {
        await resolveConflict(row, res.server);
      } else {
        await applyServerEcho(row.entity, res.record);
      }
      await db.run("delete from outbox where id = ?", [row.id]);
    } catch (err) {
      if (isValidationError(err) || isAuthzError(err)) {
        await moveToDeadLetter(row, err); // can never succeed, so surface it
        continue;
      }

      const attempts = row.attempts + 1;
      const backoff = Math.min(2 ** attempts * 1_000, 5 * 60_000);
      const jitter = Math.random() * backoff * 0.3;
      await db.run(
        "update outbox set attempts = ?, next_attempt_at = ?, last_error = ? where id = ?",
        [attempts, now + backoff + jitter, String(err), row.id],
      );

      if (isOffline(err)) return; // no point burning the rest of the batch
    }
  }
}
\`\`\`

The dead-letter path is not optional. A write that can never succeed, say an update to a job the server says someone else closed, has to become something the user can see and act on. Dropping it silently is how field staff lose an hour of work and start keeping paper backups.

## Choosing a conflict strategy, honestly

Conflicts are rare and expensive. Pick the cheapest strategy that is actually correct for that entity.

**Last-write-wins**, compared on a server-assigned version or a hybrid logical clock rather than device wall clock. Phone clocks are wrong, sometimes by hours, and one misconfigured device can silently win every conflict for a week. LWW is right where a record has a single owner at a time: a technician's notes, a draft, a preference. It loses data by design, so use it only where losing the older edit is correct.

**Per-field merge.** Because the outbox stores changed fields rather than whole rows, you can apply only the fields the device touched and keep the server's value for the rest. Two people editing the same job, one setting the status and the other adding a phone number, both succeed. This covers the large majority of real conflicts in line-of-business apps, for the cost of a per-field timestamp. It is our default.

**CRDTs.** Justified when several people edit the same content concurrently and character-level or set-level convergence is a requirement: shared notes, a collaborative checklist, tag sets. Automerge and Yjs do it correctly, and you pay in bundle size, document growth, and a mental model most teams find hard to debug. We use them for one document type inside an app, never for the whole data layer.

For a small class of high-value conflicts, a fourth option is to show both versions and let a human decide. Whichever you pick, deletes need tombstones with a retention window, or a record deleted on the server reappears the moment an offline device pushes its stale copy.

## Background sync

Foreground sync on connectivity change and on app resume covers most of the need. \`@react-native-community/netinfo\` tells you when the transport changed; treat that as a hint, and let a failed request be the real signal. \`expo-background-task\`, or WorkManager and BGTaskScheduler natively, handles the rest, with realistic expectations: iOS decides when your task runs and it may be hours later.

Practical rules:

- Cap batch size so an app resumed with 400 queued writes does not churn for two minutes before the first screen paints.
- Push photos and other large payloads through a separate lane with resumable uploads, so one 8MB image on a bad connection cannot block 30 status updates.
- Show queue state in the UI: pending change count and the time of the last successful sync. Users tolerate offline gracefully when the app is honest about it.

## Test the failure paths deliberately

The happy path gets tested by accident. The failure paths need intent:

- **Kill the process mid-drain.** The outbox row must survive and the operation must not apply twice.
- **Drop the response after the server committed.** Force a timeout on a request the server processed, retry, and assert exactly one record exists. The most valuable test in an offline app.
- **Clock skew.** Set the device clock two hours back and run a conflict scenario. If the past wins, your ordering depends on device time and needs fixing.
- **Long offline period.** Queue 200 mixed operations across a simulated week offline, reconnect, and assert the final state matches a server-side replay of the same intents.
- **Reordering.** Shuffle the batch in a test build. Intent-based writes survive it; whole-object writes do not.

Run the drain logic in plain Node against in-memory SQLite so these stay fast unit tests rather than device automation. Keep a smaller set of Detox or Maestro flows for airplane-mode journeys through the real UI.

## How we work

On mobile builds we settle the sync model in the first week, with the client, because it shapes the API as much as the app. That means naming the conflict strategy per entity in writing, agreeing what a stale write should do, and building the outbox and its dead-letter surface before the second screen exists. Failure-path tests land with the first sync code, not after the first support ticket. It is the difference between an app field staff rely on and one they work round.
`,
  },
  {
    slug: "fastapi-backend-production-checklist",
    title: "The FastAPI production checklist we run before launch",
    description:
      "Settings, dependency injection, async database sessions, background workers, structured logging, health checks and OpenAPI hygiene, before a service takes traffic.",
    date: "2026-04-21",
    category: "Engineering",
    tags: ["fastapi", "python", "backend", "production"],
    author: authors.backend,
    featured: true,
    body: `FastAPI gets you to a working API in an afternoon, which is exactly why so many of them reach production half-dressed. Nothing in the framework forces you to think about connection pools, correlation IDs, or what happens when the container gets a SIGTERM mid-request. This is the checklist we walk before a FastAPI service goes live.

## Settings: one object, validated at boot

Scattered \`os.getenv("STRIPE_KEY")\` calls are how you find out at 2am that a worker started fine and then blew up on the first webhook. One \`Settings\` class, validated at import, is the fix.

\`\`\`python
# app/config.py
from functools import lru_cache
from pydantic import PostgresDsn, RedisDsn, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="forbid")

    environment: str = "production"
    database_url: PostgresDsn
    redis_url: RedisDsn
    stripe_secret_key: str = Field(min_length=20)
    jwt_secret: str = Field(min_length=32)
    cors_origins: list[str] = []
    db_pool_size: int = 5
    db_max_overflow: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
\`\`\`

\`extra="forbid"\` catches typos in env var names, which otherwise fail silently. The \`@lru_cache\` accessor gives one instance per process and doubles as a DI provider you can override in tests. We call \`get_settings()\` during startup so a missing \`JWT_SECRET\` kills the container immediately instead of surfacing as a 500 on the first login.

## Dependency injection is your test seam

\`Depends\` is not decoration. It's the cleanest way to swap the database, the current user, or a feature flag lookup in tests without monkeypatching imports.

\`\`\`python
async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
\`\`\`

In tests, \`app.dependency_overrides[get_db] = _test_db\` swaps in a session bound to a transaction rolled back after each case. Same for \`get_current_user\`, so you never mint real JWTs in unit tests. Anything a route reaches for that isn't pure computation should arrive through \`Depends\`.

## Async sessions and pool math

SQLAlchemy 2.0 async with \`async_sessionmaker\`, one session per request, commit on success and rollback on exception. The lifespan owns the engine:

\`\`\`python
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    engine = create_async_engine(
        str(s.database_url),
        pool_size=s.db_pool_size,
        max_overflow=s.db_max_overflow,
        pool_pre_ping=True,
        pool_recycle=1800,
    )
    app.state.engine = engine
    app.state.sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan, title="Billing API", version="1.0.0")
\`\`\`

Do the pool arithmetic before deploy. Peak connections is \`workers x (pool_size + max_overflow)\`. Four Uvicorn workers at 5 + 5 is 40 connections from one container. Add a second container, a migration job, and a worker fleet, against a managed Postgres with \`max_connections = 100\`, and you're one autoscale event from \`FATAL: sorry, too many clients already\`. We size for peak, leave 20% headroom for admin sessions, and put PgBouncer in transaction mode in front of anything that scales horizontally.

The other classic: a blocking call inside an \`async def\` handler. One \`requests.post()\` to Stripe, or a Pillow resize, and the event loop for that worker stalls while every other in-flight request waits. Use an async client (\`httpx.AsyncClient\`), push the work to \`run_in_threadpool\`, or define the route as plain \`def\` and let Starlette run it in the threadpool. That last option is underrated.

## Background work

\`BackgroundTasks\` runs after the response, in the same process, with no persistence and no retries. If the pod restarts, the work is gone. Fine for things you can afford to lose: a cache warm, a non-critical audit write.

Anything a client would notice going missing needs a real queue. We reach for arq when Redis is already in the stack and the job graph is simple, Celery when there are beat schedules, chains, and priority queues. Three rules regardless of tool:

- Jobs are idempotent. Pass an ID, not an object graph, and make the handler safe to run twice. At-least-once delivery means it will run twice.
- Retries use exponential backoff with jitter. Five attempts at 2s, 8s, 30s, 2m, 10m covers most transient failures without hammering a downstream that's already struggling.
- Exhausted jobs go to a dead-letter queue with the original payload and the last traceback, and something alerts when that queue is non-empty. A DLQ nobody watches is a delete.

## Structured logging and request IDs

JSON logs to stdout, one line per event, \`structlog\` doing the formatting. Every request gets an ID from the inbound \`X-Request-ID\` header or a fresh UUID, bound into a \`ContextVar\` so it appears on every log line downstream without being threaded through function signatures.

\`\`\`python
import time, uuid, structlog
from starlette.middleware.base import BaseHTTPMiddleware

log = structlog.get_logger()

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        structlog.contextvars.bind_contextvars(request_id=rid)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.clear_contextvars()
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        log.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
        )
        response.headers["x-request-id"] = rid
        return response
\`\`\`

Propagate that header on outbound calls so a trace survives across services. Never log tokens, API keys, card data, full request bodies, or plaintext email addresses. To correlate a user, log the user ID. INFO for request lines and state changes, WARNING for handled degradation, ERROR only when a human should look. Debug logs left on in production are how a \`duration_ms\` field ends up buried under 40 lines of SQL echo.

## Health checks

Two endpoints, different jobs. \`/healthz\` returns 200 as long as the process is alive and does nothing else. It must not touch the database: a brief Postgres blip would otherwise make Kubernetes restart every healthy pod at once, turning a 30-second incident into a 10-minute one.

\`/readyz\` checks dependencies and controls traffic:

\`\`\`python
async def _probe(name: str, coro_fn, seconds: float) -> tuple[str, str]:
    try:
        async with asyncio.timeout(seconds):
            await coro_fn()
        return name, "ok"
    except Exception:
        return name, "fail"


@router.get("/readyz", include_in_schema=False)
async def readyz(db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    results = await asyncio.gather(
        _probe("db", lambda: db.execute(text("SELECT 1")), 2.0),
        _probe("cache", redis.ping, 1.0),
    )
    checks = dict(results)
    ok = all(v == "ok" for v in checks.values())
    return JSONResponse({"checks": checks}, status_code=200 if ok else 503)
\`\`\`

Timeouts are the point. A readiness probe without one hangs for the full probe timeout and tells you nothing.

## OpenAPI hygiene

The schema is a contract, so treat it like one. Every route declares \`response_model\` and an explicit \`status_code\` (201 on create, 204 on delete). Routes are grouped under \`tags\` and mounted at \`/api/v1\`. Errors use a single envelope model registered via \`responses={404: {"model": ErrorResponse}}\`, so clients parse one shape instead of guessing. Bare \`HTTPException(400, "bad")\` strings leak into the frontend as untyped noise.

Once the schema is clean, generate the frontend client from it instead of hand-writing fetch wrappers. \`openapi-typescript\` in CI, with the build failing when committed types drift from the live schema. A renamed field then breaks the frontend build rather than a user's checkout.

## The last mile

- Gunicorn with \`uvicorn.workers.UvicornWorker\`, workers roughly \`2 x cores\`, lower if handlers are memory-heavy. Set \`--graceful-timeout 30\` so in-flight requests finish during a rolling deploy.
- Graceful shutdown in the lifespan: dispose the engine, close the Redis pool, drain the HTTP client.
- Timeouts at every layer: a server-side ceiling, \`httpx.Timeout(connect=3, read=10)\` on outbound calls, \`statement_timeout\` on the database role.
- CORS listing exact origins. \`allow_origins=["*"]\` with \`allow_credentials=True\` is ignored by browsers anyway.
- Rate limiting on auth and anything expensive, keyed by user ID where possible, IP as fallback.

## How we work

We run this checklist before every FastAPI handover, and the answers go into the repo rather than a conversation. That means a \`.env.example\` matching the \`Settings\` model field for field, the pool math written next to the deploy config, a runbook for the DLQ, and probe paths already wired into the platform's health checks. Clients usually inherit these services with a small internal team or a maintenance retainer, so the goal is that the next engineer can work out why something is set the way it is without asking us.
`,
  },
  {
    slug: "webgl-that-does-not-tank-your-lighthouse",
    title: "WebGL that doesn't tank your Lighthouse score",
    description:
      "Shipping three.js and GSAP on a marketing site: server-rendered content, lazy mounting after LCP, dpr clamping, and a fallback state designed on purpose.",
    date: "2026-03-24",
    category: "Performance",
    tags: ["threejs", "webgl", "gsap", "core-web-vitals"],
    author: authors.frontend,
    body: `A three.js hero looks incredible in the pitch deck and can take a marketing site from a 96 to a 41. The failure is predictable: a renderer in the critical path, a canvas that paints before the copy does, a device pixel ratio of 3 on a mid-range Android drawing nine times the fragments it can afford. None of that is inherent to WebGL. It comes from mounting the canvas as though it were content.

## The content is not the canvas

Start from a rule that settles most of the arguments: **every word, link and call to action on the page must exist in the server-rendered HTML with the canvas removed entirely.** The 3D layer is decoration on top of a page that already works.

That buys you three things. The LCP element becomes a heading or a hero image, both of which the browser can paint within a few hundred milliseconds. Crawlers and link previews see a complete page. And the no-WebGL fallback stops being a special case, because it is simply the page without its ornament.

Concretely: never render the headline as text inside the canvas, never gate navigation behind a scroll animation that needs the renderer, and never let the canvas establish page height. If it sits \`position: fixed\` behind normal document flow, most failure modes disappear before you write a line of shader code.

## Mount after LCP, not on hydration

Importing three.js at the top of a client component puts it in the entry chunk, parsed and compiled before the page becomes interactive. Even code-split, mounting inside a bare \`useEffect\` fires during hydration and competes with everything else for the main thread.

We wait for two conditions: the largest paint has happened, and the canvas is actually near the viewport.

\`\`\`tsx
"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hasWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

export function SceneMount() {
  const holder = useRef<HTMLDivElement>(null);
  const [Scene, setScene] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !hasWebGL()) return;
    if (navigator.hardwareConcurrency <= 4) return; // low-end device, stay static

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // yield until the main thread is idle, then pull in the renderer
        requestIdleCallback(
          () => {
            void import("./scene").then((mod) => {
              if (!cancelled) setScene(() => mod.Scene);
            });
          },
          { timeout: 2_000 },
        );
      },
      { rootMargin: "200px" },
    );

    if (holder.current) observer.observe(holder.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={holder} aria-hidden className="absolute inset-0 -z-10">
      {Scene ? <Scene /> : <StaticPoster />}
    </div>
  );
}
\`\`\`

\`StaticPoster\` is a compressed still frame of the scene, 25 to 60KB in AVIF. It renders immediately, it is what reduced-motion and no-WebGL visitors keep permanently, and it removes the flash of empty space while the module downloads. Render it as a real \`img\` with explicit dimensions so it contributes nothing to CLS.

Watch the LCP consequence though. If the poster is large enough to become the LCP element, you have moved the problem rather than solved it. Keep it behind the text, dimmed, so a heading remains the LCP candidate.

## dpr clamping and frameloop

Two settings account for most of the runtime cost.

**Device pixel ratio.** Rendering at dpr 3 means nine times the fragments of dpr 1. On a phone that is the difference between a steady 60fps and a warm chassis at 24. Clamp to \`[1, 1.5]\` on mobile and \`[1, 2]\` on desktop. Nobody picks the difference on a soft-focus background in a blind comparison; everybody notices the frame rate.

**Frame loop.** A scene rendering continuously burns battery and holds the main thread even when nothing is moving. If the animation is scroll- or pointer-driven, set \`frameloop="demand"\` and invalidate only when something actually changed.

\`\`\`tsx
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";

function PauseWhenHidden() {
  const { invalidate } = useThree();

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [invalidate]);

  return null;
}

export function Scene() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
      camera={{ fov: 40, position: [0, 0, 6] }}
    >
      <PauseWhenHidden />
      <Particles count={4_000} />
    </Canvas>
  );
}
\`\`\`

\`antialias: false\` plus a cheap SMAA pass is usually faster than MSAA and visually close enough. \`powerPreference: "low-power"\` keeps laptops on the integrated GPU, which for a decorative background is the right trade. Always stop rendering when \`document.hidden\` is true; a scene animating in a background tab is pure waste and it turns up as battery complaints rather than as a metric.

Dispose properly on unmount as well. Geometries, materials and textures are not reclaimed on their own, and a route change leaking a few megabytes each time will crash a tab during a long session.

## Budgets, set before anyone models anything

Give the design or 3D partner numbers up front. Retrofitting a budget onto delivered assets means someone redoes work for free, and it will not be the person who set the budget late.

- **Renderer payload**: three.js core plus your scene under 180KB gzipped, loaded lazily, never in the entry chunk. Import from \`three/examples/jsm\` selectively; a wildcard import drags in loaders you will never call.
- **Geometry**: under 150k triangles on screen for a marketing hero, with repeated objects instanced rather than duplicated. Under 60 draw calls; merge static geometry and share materials.
- **Textures**: KTX2 with Basis compression, not PNG. A 2048px PNG at 5MB becomes roughly 350KB as KTX2 and uploads to the GPU without a decode stall on the main thread. Cap total texture memory near 40MB.
- **Models**: glTF, Draco-compressed.
- **Shaders**: watch compile time. A heavy shader can compile for 200ms on a mid-range phone, synchronously, and that lands squarely in your INP.

Measure on a real mid-range Android, not a MacBook with a 4x CPU throttle. The throttle is a rough proxy for the main thread and tells you nothing about the GPU.

## GSAP without layout thrash

Scroll-driven animation is where Core Web Vitals quietly die. The rules are short:

- Animate \`transform\` and \`opacity\` only. Animating \`top\`, \`height\` or \`margin\` forces layout every frame.
- Never let a ScrollTrigger pin change document height after first paint. Reserve the space in CSS.
- Do not interleave your own \`getBoundingClientRect()\` calls inside \`onUpdate\`. GSAP batches reads and writes internally and a stray measurement defeats it.
- Kill triggers on route change. Orphaned ScrollTriggers accumulate across client-side navigations and every one of them runs on every scroll event.

For simple entrance animations, use CSS or the Web Animations API and skip GSAP entirely. It earns its 40 to 60KB when there is a real scrubbed timeline. For a fade-in it does not.

## The fallback is a design deliverable

Reduced motion is not an edge case. Somewhere around 5 to 10% of desktop users have it enabled, and on a corporate fleet with animation disabled by policy it is far higher. Treat the static state as a designed state with its own artboard, not as whatever happens when JavaScript fails.

In practice the static version needs real composition: the poster image, the same typography and spacing, gradients or an SVG standing in for the depth the scene provided. We build that state first and demo it to the client on its own, which reliably prevents a design that only makes sense in motion. Respect the preference at runtime too, not only at mount, since people toggle it: listen for \`change\` on the media query and tear the scene down when it flips.

## How we work

We agree the poster frame, the reduced-motion state and the asset budgets during design, before anything is modelled, and the numbers go in the same document as the acceptance criteria. Every 3D build ships with Lighthouse and field measurements taken on the same page with and without the canvas, so the cost of the effect is a number the client can look at rather than a feeling. The rule we hold to: if the scene cannot be an enhancement, it does not go on the marketing site.
`,
  },
  {
    slug: "stripe-webhooks-without-double-charging",
    title: "Stripe webhooks without double charging anyone",
    description:
      "Idempotency keys, signature verification, replayed and out-of-order events, reconciliation: the Stripe failure cases that quietly cost real money.",
    date: "2026-02-17",
    category: "Payments",
    tags: ["stripe", "webhooks", "payments", "idempotency"],
    author: authors.backend,
    body: `Every payments bug we have been called in to fix looked the same from the outside: a customer got charged twice, or paid and never got the thing they bought. Underneath, the causes are boringly repetitive. Stripe's API is well designed, but it hands you a distributed system whether you wanted one or not, and the happy-path integration quietly assumes network calls succeed exactly once. They don't. Here is what we build into every Stripe integration, and why each piece exists.

## Idempotency on the write path

Any POST to Stripe accepts an \`Idempotency-Key\` header. Stripe stores the key alongside the response it produced. If the same key arrives again within 24 hours, Stripe does not perform the operation; it replays the original response body and status, with an \`Idempotent-Replay: true\` header. That is the whole mechanism, and it turns "did my PaymentIntent get created before the connection dropped?" from a guess into a retry.

The common mistake is generating the key with \`crypto.randomUUID()\` at call time. A random key is fresh on every attempt, so a retry after a timeout creates a second PaymentIntent, and now you have two authorizations against one cart. The key has to be derived from something stable in your own domain:

\`\`\`ts
const key = \`pi:create:\${order.id}:\${order.version}\`;
\`\`\`

Order id plus a version counter that increments only when the amount or currency legitimately changes. Deterministic, survives a process restart, survives a queue redelivery.

The subtle failure is reusing a key with different parameters. Send the same \`Idempotency-Key\` with a different \`amount\` and Stripe returns a 400 \`idempotency_error\`, not the new charge. We hit this where the key was \`order-{id}\` and a coupon applied after the first attempt changed the total. Checkout was hard-broken for anyone using a promo code. Hence the version suffix.

## Verifying the webhook signature

Stripe signs every webhook with the endpoint's signing secret and sends it in the \`Stripe-Signature\` header as a timestamp plus one or more HMAC-SHA256 signatures. You verify with \`stripe.webhooks.constructEvent\` in Node or \`stripe.Webhook.construct_event\` in Python.

The trap: verification runs over the **raw request bytes**. Any JSON body parser that has already deserialized and re-serialized the payload changes key ordering or whitespace, and the signature fails with no obvious clue. In Express you need \`express.raw({ type: 'application/json' })\` on that route only. In Next.js App Router, \`await req.text()\`. In FastAPI, \`await request.body()\`.

Two more details worth holding onto:

- The default tolerance window is 300 seconds. If your container's clock drifts past five minutes, every webhook fails verification. We have seen this on a self-hosted box with no NTP running. Alert on clock skew.
- Every endpoint gets its own signing secret, and test mode secrets differ from live. Store them as separate env vars (\`STRIPE_WEBHOOK_SECRET_ORDERS\`, \`..._CONNECT\`) rather than one shared value, so rotating one endpoint doesn't take down the others.

## Delivery semantics you have to design around

Stripe webhooks are **at-least-once**. Three facts follow from that:

1. **Duplicates happen.** A network blip on your side means Stripe never saw your 200, so it sends the event again. Same event id, same payload.
2. **Order is not guaranteed.** We have seen \`payment_intent.succeeded\` land after \`charge.refunded\` for the same charge. If your handler naively writes status from whichever event arrives last, the order flips back to paid after a refund.
3. **Retries continue for up to 3 days** with exponential backoff, in live mode. Any 2xx is an ack; anything else, including a 500 from an unhandled exception, is a retry.

So the handler must be fast. Verify, record, enqueue, return 200. All real work happens in a background worker. On one client's checkout the handler was calling their ERP synchronously; the ERP took 12 seconds under load, Stripe timed out at 10, and every slow order got processed three or four times.

## The event ledger

Deduplication belongs in the database, not in application logic. One table, one unique constraint, and the insert itself is the lock.

\`\`\`sql
create table stripe_events (
  event_id      text primary key,
  event_type    text        not null,
  api_version   text        not null,
  created_at    timestamptz not null,      -- Stripe's \`created\`, not ours
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  attempts      int         not null default 0,
  payload       jsonb       not null
);

create index stripe_events_unprocessed_idx
  on stripe_events (received_at)
  where processed_at is null;
\`\`\`

The handler inserts with \`on conflict (event_id) do nothing\` and checks the row count. Zero rows means we already have it: ack and stop.

\`\`\`ts
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET_ORDERS!);
  } catch (err) {
    // Bad signature or stale timestamp. Never retry-able, so don't 500.
    return new Response("invalid signature", { status: 400 });
  }

  const { rowCount } = await db.query(
    \`insert into stripe_events (event_id, event_type, api_version, created_at, payload)
     values ($1, $2, $3, to_timestamp($4), $5)
     on conflict (event_id) do nothing\`,
    [event.id, event.type, event.api_version, event.created, event.data.object],
  );

  if (rowCount === 1) {
    await queue.enqueue("stripe.process", { eventId: event.id });
  }

  return new Response(null, { status: 204 });
}
\`\`\`

Out-of-order arrival is handled in the worker, not here. Before applying a state change we compare the event's \`created\` timestamp against the last applied timestamp on the order, and for objects that carry one, the Stripe object version. Older event, drop it. This is the same pattern as a last-write-wins register, and it is what stops a late \`succeeded\` from resurrecting a refunded order.

## Fulfilment follows the webhook, never the redirect

The success page is a courtesy, not a signal. The user closes the tab, the phone loses signal in a lift, the redirect fires but your page throws on render. The money moved regardless. Any code path that grants entitlement, ships an order, or provisions a seat must be triggered by \`checkout.session.completed\` or \`payment_intent.succeeded\` in the worker. The success page reads state that the webhook wrote, and shows a "confirming your payment" spinner if it hasn't landed yet. Usually it lands in under two seconds.

## Reconciliation

Webhooks can be silently misconfigured. A nightly job lists Stripe charges for the previous 48 hours (overlapping window, deliberately) and diffs them against orders:

- Charge in Stripe with no matching paid order: customer paid, got nothing. Page someone.
- Order marked paid with no charge: a bug in your own code, or a test-mode key in production.
- Amount mismatch, usually partial refunds or disputes applied on Stripe's side only.

Drift over a threshold posts to Slack. The monthly client report is a one-page CSV: gross charges, refunds, disputes, net, and any unresolved rows.

## Testing it properly

\`stripe listen --forward-to localhost:3000/api/stripe/webhook\` gives a local endpoint with its own signing secret, and \`stripe trigger payment_intent.succeeded\` fires real events. For subscriptions, test clocks let you advance a customer 35 days and watch renewals and dunning without waiting.

The test that earns its keep in CI: build a signed payload, POST it twice, assert one order row and one fulfilment record. It fails loudly the first time someone adds a side effect outside the dedupe path.

## How we work

We treat payments as its own workstream on every build. The event ledger, the reconciliation job, and the replay test go in during the first Stripe ticket, not after launch, because retrofitting idempotency into a live checkout means reasoning about charges that already exist. Clients get the reconciliation report from day one, so the first month of real traffic is measured rather than assumed. It costs maybe a day and a half of extra work up front, and it is the difference between a payments integration you can leave alone and one that generates support tickets every weekend.
`,
  },
  {
    slug: "sql-or-nosql-choosing-your-data-layer",
    title: "SQL or NoSQL: choosing a data layer you won't regret",
    description:
      "An honest framework for picking Postgres, Mongo or both, based on access patterns, consistency requirements and what a migration would actually cost you.",
    date: "2025-12-09",
    category: "Architecture",
    tags: ["postgres", "mongodb", "database", "architecture"],
    author: authors.lead,
    body: `"Should we use Postgres or Mongo?" is the wrong first question, and it gets asked at the start of nearly every project. The right one is what the application actually does with the data, in what shapes, at what frequency. Answer that and the database mostly picks itself. What follows is the framework we use on client work, including the parts where the answer is not Postgres.

## Start from access patterns

Before anyone draws an ERD or a document schema, write down the ten queries the product runs most often. Real ones, in English, with the filters and the sort order:

- The 20 most recent orders for one customer, with line items and the product name on each line.
- Revenue summed by month across all tenants for the admin dashboard.
- One workspace's settings blob, fetched on every page load.
- All documents where \`tags\` contains "urgent" and status is open, for the current tenant.
- Append a telemetry event, roughly 400 per second at peak, never updated after write.

Now look at the list. Do things join? Do you aggregate across entities? Is one hot record read and rewritten as a whole unit? Those properties determine the fit. A team that skips this step picks the database it used last time and finds the mismatch six months in, when the reporting requirements land.

## Why Postgres is our default

For the typical product we build, a multi-tenant SaaS or a marketplace, Postgres wins on breadth. Foreign keys and check constraints keep data out of shapes your code doesn't handle. Real transactions mean "create the order, decrement the stock, write the ledger entry" either happens completely or not at all, with no compensating-transaction machinery in application code.

Joins matter more than people expect. Every product grows a screen that combines three entities, and every analytics request is a join. Denormalizing to avoid joins is a fine optimization once you know the access pattern; doing it up front is a bet you usually lose.

The flexible-document argument is largely handled by \`jsonb\`: schemaless storage per row, indexed, queryable, in the same transaction as your relational data.

\`\`\`sql
create table listings (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null references tenants(id),
  status      text not null check (status in ('draft','open','closed')),
  attrs       jsonb not null default '{}'::jsonb,
  -- pulled out of the blob so it indexes and sorts normally
  price_cents int generated always as ((attrs->>'price_cents')::int) stored,
  created_at  timestamptz not null default now()
);

-- jsonb_path_ops: smaller and faster than the default opclass
-- when you only ever use containment (@>)
create index listings_attrs_gin on listings using gin (attrs jsonb_path_ops);

-- partial index: 90% of queries only touch open listings
create index listings_open_recent on listings (tenant_id, created_at desc)
  where status = 'open';

select id, attrs->>'title' as title, price_cents
from listings
where tenant_id = $1
  and status = 'open'
  and attrs @> '{"features": ["parking"], "furnished": true}'
order by created_at desc
limit 20;
\`\`\`

That containment query runs off the GIN index. On a 4M-row listings table we measured p95 at 34ms with the index and just over 2 seconds without it.

Postgres also ships full-text search with \`tsvector\`, native arrays, range types, and \`LISTEN/NOTIFY\` for lightweight pub/sub. None of these beat a dedicated tool. All of them are good enough to push the "we need a second database" conversation out by a year or two, which on a small team is worth a great deal.

## When a document store is the right answer

We reach for Mongo (or a DynamoDB-shaped store) when the access patterns genuinely say so:

- **Aggregates read and written whole.** A CMS page, a form definition, a game save. You always want the entire tree, you never query inside it from three directions, and there is no cross-document integrity to enforce.
- **High-volume self-contained writes.** Telemetry, audit trails, webhook payloads. Append-only, no joins, retention by TTL index.
- **Schema that genuinely varies per tenant.** If tenant A's "patient record" has 40 fields and tenant B's has 300 under different names, the relational model becomes an EAV table, and EAV in Postgres is worse than documents in Mongo.
- **Real horizontal scale.** Sharding when a single writer is no longer plausible. Be honest here: most apps we see never pass 200GB or 5k writes/sec, and a well-tuned single Postgres instance handles that without complaint.

## Consistency, and what you give up

Mongo has supported multi-document transactions since 4.0, and they work. They also cost: locks held across shards, a default 60-second limit, and throughput under contention noticeably below single-document writes. If you find yourself wrapping most writes in a transaction, the data was relational and you modeled it as documents.

Secondary reads are eventually consistent. Read your own write from a secondary and you may not see it. Fine for a dashboard, not fine for "did my payment go through". Set read concern deliberately rather than inheriting the default.

The phrase to distrust is "we'll handle consistency in application code". It means the invariant lives in whichever service happened to write last, enforced by whoever remembered. That is where orphaned rows and double-decremented inventory come from.

## Running both without regret

Polyglot persistence works under one rule: **one system of record per entity.** Postgres holds the truth. Derived stores get fed from it, via an outbox table written in the same transaction as the business change and relayed by a worker (or by Debezium reading the WAL if you want proper CDC):

\`\`\`sql
create table outbox (
  id           bigint generated always as identity primary key,
  aggregate    text        not null,   -- 'listing', 'order'
  aggregate_id text        not null,
  event_type   text        not null,
  payload      jsonb       not null,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

create index outbox_unpublished on outbox (id) where published_at is null;
\`\`\`

The relay reads unpublished rows in id order and pushes to OpenSearch, a Mongo read model, or a Redis cache. Derived stores can be rebuilt from scratch, so a bug in the projection is an afternoon, not an incident.

The pattern that fails is two systems of record for the same entity: user profiles written to both Postgres and Mongo by different services. They diverge within weeks, and there is no principled way to decide which one is right.

## The real cost of migrating later

The schema is the cheap part; a translation script for a mid-size app is a few days. The expensive parts:

- Every query and ORM call rewritten, with the behavior differences you only find in production.
- Reporting and BI, usually written straight against SQL by someone outside engineering.
- The analytics pipeline and anything downstream of it.
- The team's fluency. People debug well in the system they know.

For a mid-size app, roughly 60 tables and 250k lines, budget 8 to 14 engineer-weeks plus a period of dual writes. Not fatal, but it is a quarter spent shipping nothing new.

## A checklist a stakeholder can run

1. Does the data have relationships you'll report across? Postgres.
2. Do money, inventory, or bookings have to be exactly right? Postgres.
3. Is the main object a self-contained document, read and written whole? A document store is reasonable.
4. Are writes above roughly 10k/sec sustained today, not in a slide? Then scale-out matters.
5. Does the team already run one of these well? Weight that heavily.
6. Still unsure? Postgres with \`jsonb\`, revisit at real load.

## How we work

On new builds we default to Postgres and say so in the first architecture note, with the access-pattern list attached so the client sees the reasoning rather than the conclusion. Where a document store fits, usually telemetry, per-tenant custom forms, or a cached read model, we add it as a derived store fed by an outbox and keep Postgres as the source of truth. On inherited codebases we don't migrate for aesthetics. We measure the queries that hurt, fix those, and propose a data layer change only when the numbers justify the quarter it costs.
`,
  },
  {
    slug: "redis-caching-invalidation-that-works",
    title: "Redis caching and invalidation that actually works",
    description:
      "Cache-aside versus write-through, TTL tiers and jitter, key naming, stampede protection, tag invalidation, and how to prove your cache is still correct.",
    date: "2025-10-14",
    category: "Performance",
    tags: ["redis", "caching", "performance", "invalidation"],
    author: authors.backend,
    body: `Most caching bugs we get called in to fix are not performance problems. They are correctness problems that show up only under load, for one customer, and nobody can reproduce them. The cache was added in an afternoon, it worked, and six months later the support queue is full of "my cart shows the old price". Here is how we build Redis caching that stays correct.

## Pick a write strategy on purpose

**Cache-aside** reads Redis, and on a miss reads Postgres and populates. Writes go to the database and invalidate the entry. It is the default because it fails safe: if Redis dies, every read is a miss and you degrade to database load instead of serving garbage. The cost is a cold-start penalty per key and the fact that cache and database can disagree.

**Write-through** puts the cache in the write path. It earns its place for small, hot, high-fanout data: feature flags, pricing tiers, a tenant config blob that 400 requests per second read and one admin edits weekly. It adds latency to every write and needs a story for partial failure, because a successful Redis write with a failed Postgres commit is a lie you serve until the TTL runs out.

**Write-behind** buffers writes and flushes asynchronously. Fast, and it loses data when a node dies. We use it for view counters and last-seen timestamps, never for anything a customer would notice missing.

### The race that makes naive cache-aside wrong

Request A misses, reads \`price = 100\`, then stalls 30ms on GC. Request B writes \`price = 120\` and sets the cache to 120. Request A wakes up and writes its stale 100. That value is wrong until the TTL expires.

Two rules fix it. **Delete on write, do not update on write**: a delete is idempotent and cannot resurrect a stale read. And if you read from Postgres replicas, add a **delayed double-delete**: delete the key, commit, then schedule a second delete 500ms to 1s later to catch anything a reader pulled from a lagging replica in between. We run that second delete through the same worker queue as our outbox events so it survives a restart.

## Key naming is a schema

\`\`\`text
app:v3:user:{user_id}:cart
app:v3:product:{sku}:detail:{locale}
app:v3:category:{slug}:tree
\`\`\`

- **Embed a schema version** (\`v3\`). When the payload shape changes, bump it in config and the whole old generation goes cold in one deploy. No migration, no scan, no stale JSON deserializing into a null field.
- **Never put unbounded user input in a key.** A raw search query is a memory exhaustion vector. We cap free text at a 16-char \`sha1\` prefix.
- **Keep keys short.** Redis costs the key string plus roughly 50 to 90 bytes of overhead per entry. A 40k-key namespace at 80 bytes is about 6MB before a single value is stored. On a 512MB managed instance that is real money.

## TTL is the safety net, not the mechanism

"Cache forever and invalidate perfectly" is a trap. You will miss a path: a migration script, an admin panel, a Stripe webhook that predates the cache layer. The TTL limits the blast radius of the bug you have not found yet.

Tier by volatility: session and cart 30 minutes, product detail 10 minutes, category tree and nav 24 hours. Then add jitter. Populate 8,000 product keys during a deploy with an identical 600s TTL and they all expire in the same second. We use plus or minus 10 percent, enough to smear expiry across a minute.

## Stampede protection

When a hot key expires and 900 concurrent requests miss it, all 900 hit Postgres with the same query. We have watched a healthy database go from 12 percent CPU to pool exhaustion in four seconds because one category key rolled over during a spike. Three defenses:

1. **Single-flight lock.** \`SET lock:key 1 NX PX 5000\`. One caller rebuilds; the rest wait briefly or return stale.
2. **Stale-while-revalidate.** Store a logical expiry inside the payload and a longer physical TTL. Past logical expiry, serve stale and rebuild in the background.
3. **Probabilistic early expiration (XFetch).** Each reader rolls a dice weighted by rebuild cost and proximity to expiry, so one unlucky request refreshes early while the rest stay warm.

\`\`\`python
import asyncio, json, random, time
from redis.asyncio import Redis

async def cache_aside(r: Redis, key: str, ttl: int, loader, jitter=0.1, beta=1.0):
    raw = await r.get(key)
    if raw is not None:
        env = json.loads(raw)
        gap = env["expires_at"] - time.time()
        if gap > beta * (env["build_ms"] / 1000) * random.expovariate(1.0):
            return env["value"]

    lock = f"lock:{key}"
    if not await r.set(lock, "1", nx=True, px=5_000):
        if raw is not None:
            return json.loads(raw)["value"]   # serve stale; someone is rebuilding
        await asyncio.sleep(0.05)
        again = await r.get(key)
        if again is not None:
            return json.loads(again)["value"]

    try:
        started = time.perf_counter()
        value = await loader()
        physical = int(ttl * (1 + random.uniform(-jitter, jitter)))
        envelope = {
            "value": value,
            "expires_at": time.time() + physical,
            "build_ms": (time.perf_counter() - started) * 1000,
        }
        # Physical TTL outlives logical expiry so stale-while-revalidate works.
        await r.set(key, json.dumps(envelope), ex=physical * 2)
        return value
    finally:
        await r.delete(lock)
\`\`\`

## Tag-based invalidation

Sooner or later one write must invalidate 40 keys across three templates. Maintain a tag index: one Redis set per tag holding dependent keys. On populate, \`SADD tag:product:SKU-1183 app:v3:product:SKU-1183:detail:en\`. On invalidate, \`SMEMBERS\` the tag, \`UNLINK\` members in batches of 500, then \`UNLINK\` the set. \`UNLINK\` frees memory on a background thread; \`DEL\` on a 10k-member set blocks the event loop long enough to show up in your latency graph.

Never run \`KEYS *\` in production. It is O(N) and it blocks; use \`SCAN\` with \`COUNT 500\`. Budget for the index too: tag sets run 5 to 8 percent of cache memory in our deployments, and they leak unless each gets a TTL slightly longer than its longest member.

## Knowing your cache is correct

Hit rate tells you the cache is being used. A 99 percent hit rate on stale data is worse than no cache.

- **Shadow reads.** On 1 percent of traffic, fetch from cache and source, compare, log mismatches with both payloads. We caught a broken invalidation on discounted variants this way, three days before a sale.
- **A \`?nocache=1\` debug path** behind staff auth. Support answers "stale or genuinely wrong" in one request.
- **Metrics:** hit rate per namespace, miss latency p95 (your worst-case user), \`evicted_keys\` per minute, \`used_memory\` against \`maxmemory\`. Rising evictions while hit rate looks fine is the warning before the cliff.
- **Eviction policy is a decision.** \`allkeys-lru\` when Redis is pure disposable cache. \`volatile-ttl\` when the same instance holds rate limiters or job locks that must not vanish. The default \`noeviction\` turns a full instance into write errors.

\`\`\`bash
# Hit ratio, evictions, memory pressure
redis-cli INFO stats  | grep -E 'keyspace_(hits|misses)|evicted_keys'
redis-cli INFO memory | grep -E 'used_memory_human|maxmemory_human|fragmentation'

# Walk a namespace without blocking the server
redis-cli --scan --pattern 'app:v3:product:*' --count 500 | head -50

# What one entry costs, and how hot it is (OBJECT FREQ needs an LFU policy)
redis-cli MEMORY USAGE app:v3:product:SKU-1183:detail:en
redis-cli OBJECT FREQ  app:v3:product:SKU-1183:detail:en
redis-cli TTL          app:v3:product:SKU-1183:detail:en

redis-cli --bigkeys -i 0.01   # sampled scan for fat keys
\`\`\`

### What never goes in a cache

Authorization decisions. Cache a role if you must, but re-evaluate permissions per request; a cached "yes" outliving a revoked role is a security incident, not a stale page. Payment and subscription state lives in Postgres and Stripe, read at the decision point.

Decide where the cache sits, too. Redis in front of the database helps every consumer including background jobs. CDN caching is far cheaper per request but only helps anonymous responses. Most storefronts need both.

## How we work

On NorthStackHub projects, caching is designed alongside the data model, not bolted on at the end. We define the key schema and every invalidation path up front, wire metrics before the first key is written, and keep TTLs short enough that a missed invalidation heals itself in minutes. On a recent catalog API, moving to a versioned namespace with tag invalidation and single-flight locks took p95 from 820ms to 190ms and halved the Postgres instance at renewal. The number we watch afterward is not hit rate. It is stale-data tickets in the client's inbox.
`,
  },
  {
    slug: "core-web-vitals-for-ecommerce",
    title: "Core Web Vitals on real ecommerce pages",
    description:
      "LCP, INP and CLS on product pages: image and font strategy, ISR, third-party scripts, and measuring on real traffic instead of a lab score.",
    date: "2025-08-05",
    category: "Performance",
    tags: ["core-web-vitals", "ecommerce", "performance", "nextjs"],
    author: authors.frontend,
    body: `Most storefronts we inherit have a green Lighthouse score and a red Search Console report. That gap is the whole story: Lighthouse runs one simulated load on a fast machine, while ranking and revenue are decided by field data from real phones on real networks. Below is how we actually move LCP, INP and CLS on product pages, and how we prove it moved.

## What you are being measured on

The three Core Web Vitals have fixed thresholds, evaluated at the **75th percentile of real users over a rolling 28-day window**:

- **LCP** (Largest Contentful Paint): good under 2.5s, poor over 4.0s
- **INP** (Interaction to Next Paint): good under 200ms, poor over 500ms
- **CLS** (Cumulative Layout Shift): good under 0.1, poor over 0.25

Two consequences people miss. First, the 28-day window means a fix you ship today shows up in CrUX gradually over the next month, so judge the fix on your own RUM data, not on the public dataset. Second, p75 means your worst quarter of traffic sets the number. A catalog that is fast on desktop and 4.1s on mid-range Android will fail, because Android is usually more than 25% of sessions.

## LCP on a product detail page

On a PDP the LCP element is the hero product image roughly nine times out of ten. The instinct is to compress it harder. That is usually the wrong lever.

Break LCP into its parts before touching anything: TTFB, resource load delay, resource load time, render delay. If TTFB is 900ms you cannot reach 2.5s LCP by shaving 40KB off a JPEG. Fix the server response first, then the image.

The most common real defect is **request chain depth**. The browser cannot start the hero image until it has parsed the HTML, and if the image URL is only known after a client component hydrates and fetches, you have added two round trips before the download even starts. Render the hero server-side with a known URL.

Then get the sizing right:

\`\`\`tsx
import Image from "next/image";
import { Suspense } from "react";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const product = await getProduct(sku); // cached, ISR-backed

  return (
    <main className="grid gap-8 md:grid-cols-2">
      <Image
        src={product.heroUrl}
        alt={product.name}
        width={1200}
        height={1200}
        priority
        sizes="(min-width: 768px) 42vw, 100vw"
        className="w-full h-auto"
      />
      <div>
        <h1>{product.name}</h1>
        {/* Price and stock are volatile: stream them, don't block the page */}
        <Suspense fallback={<PriceSkeleton />}>
          <LivePrice sku={sku} />
        </Suspense>
      </div>
    </main>
  );
}
\`\`\`

A wrong \`sizes\` is the most expensive one-line bug in ecommerce frontends. Without it the browser assumes \`100vw\` and pulls a 1600px-wide file into a 380px slot. On one furniture catalog that single attribute cut the hero transfer from 412KB to 78KB and moved mobile LCP from 3.1s to 2.0s on a throttled 4G profile.

The rest of the image checklist:

- Serve AVIF with a WebP fallback, quality 65 to 75. Above 80 you are paying bytes nobody can see.
- \`priority\` (which sets \`fetchpriority="high"\` and skips lazy loading) on the hero only. Marking six images priority means none of them is prioritized.
- \`preconnect\` to the image CDN origin if it differs from your own.
- Never put the hero inside a carousel that initializes in JavaScript. Render slide one as plain markup and enhance afterwards.

## Fonts

Fonts hurt twice: they delay text paint and they shift layout when the real face swaps in.

Self-host through \`next/font\` so the file comes from your origin with a stable hash and no extra DNS lookup. Prefer \`display: swap\` for body copy and consider \`optional\` for decorative headings you would rather drop than wait for. Subset to the ranges you ship, and be disciplined about weights: two weights covers most storefronts, while five adds 120KB for a difference nobody can articulate.

For the swap shift, \`next/font\` computes fallback metrics with \`size-adjust\` and \`ascent-override\`. Keep that on. It reliably takes the font-swap contribution to CLS to zero.

## CLS is a discipline problem

Layout shift is almost never mysterious. The offenders repeat across every project:

- A promo bar injected after hydration, pushing the entire page down
- A cookie banner that reflows rather than overlays
- Lazy-loaded review widgets and recommendation rails with no reserved height
- Images without dimensions or \`aspect-ratio\`
- Web font swap without metric overrides

The rule we enforce in review: **anything that can appear later must have its space reserved now**. Give the promo bar a fixed height even when empty. Give the reviews rail a \`min-height\` matching its loaded state. Render banners as fixed-position overlays.

Remember CLS accumulates across the whole session, including after interaction. Opening a filter drawer that reflows the grid counts against you.

## INP is your own JavaScript

INP replaced FID, and it is far less forgiving because it measures the full path from input to the next paint, at the worst interaction in the session. Long tasks on the main thread are the cause. Concretely:

- **Hydration cost.** A PDP that ships 380KB of client JavaScript will block the thread during hydration, and a tap in that window records a 600ms INP. Push \`"use client"\` down to leaves. The gallery needs interactivity; the spec table does not.
- **Third-party tags.** A tag manager loading six vendors is usually the single largest main-thread contributor.
- **Handlers doing real work.** Filtering 900 products inside an \`onChange\` will miss the frame. Wrap the state update in \`useTransition\` so the input stays responsive, or move the filtering server-side behind a URL param.
- **Avoid \`input\` handlers that fire a network call per keystroke.** Debounce at 200ms minimum.

### Budgeting third parties

Load everything non-essential through \`next/script\` at \`afterInteractive\`, or \`lazyOnload\` for chat and support widgets. Then enforce a hard rule with the client: no new tag ships without removing one. Partytown can move some analytics into a worker, but it is a partial answer and it breaks any script that touches the DOM directly. The only method that settles arguments is measurement. Disable one vendor at a time on a preview deployment and record the delta in total blocking time. On a recent audit, three of six tags accounted for 240ms of the 310ms we removed.

## Rendering strategy

Product and category pages should be statically rendered with revalidation, not dynamic. A fully dynamic PDP puts your database in the critical path of every crawl and every cold visit. Use ISR for the page shell, then stream the parts that genuinely change: price, stock, and personalized recommendations. \`revalidateTag\` on the catalog webhook keeps the static copy honest within seconds of a merchandising change.

## Measure on real traffic

Ship the \`web-vitals\` attribution build and report to your own endpoint:

\`\`\`ts
import {
  onCLS,
  onINP,
  onLCP,
  type MetricWithAttribution,
} from "web-vitals/attribution";

function report(metric: MetricWithAttribution) {
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    // attribution names the offending element, not just the number
    attribution: metric.attribution,
    template: document.body.dataset.template ?? "unknown",
    path: location.pathname,
  });

  navigator.sendBeacon("/api/vitals", body);
}

onLCP(report);
onINP(report);
onCLS(report);
\`\`\`

Segment by template, device class and country. Aggregate numbers hide the failure: one client sat at 2.4s LCP overall while their highest-converting category template was at 3.6s. Add a bundle-size budget to CI so a regression is caught in the pull request rather than in next month's CrUX update.

## How we work

On builds and maintenance retainers we set a performance budget during architecture, not after launch: a per-route JavaScript ceiling, an LCP target for the PDP and category templates, and a hard cap on third-party tags. The budget runs as a required check in CI, and RUM reporting ships with the first release so there is field data from day one. Clients get a monthly report segmented by template and device, with the specific element named for every regression, so the conversation is about a fix rather than a score.
`,
  },
  {
    slug: "ci-cd-pipeline-for-small-teams",
    title: "A CI/CD pipeline small teams can actually run",
    description:
      "Preview environments, safe migrations, secrets, rollback that never touches the database, and why most small teams should not be running Kubernetes yet.",
    date: "2025-05-20",
    category: "DevOps",
    tags: ["ci-cd", "devops", "deployment", "migrations"],
    author: authors.infra,
    body: `Most CI/CD advice is written by people running platform teams of thirty. If you are two to eight engineers shipping a product, you need a pipeline that a single person can hold in their head, debug at 11pm, and change without a planning meeting. The version below is roughly what we set up on every project we take through to production, and it fits in one workflow file plus a deploy script.

The single number that matters most: total feedback on a pull request should land under eight minutes. Past that, people open a second PR while waiting, stop reading the output, and start merging on vibes.

## The stages, and what each one is allowed to block

Order matters because the cheap checks should fail first.

1. **Lint and typecheck**: under 90 seconds. Blocks the merge. \`eslint\`, \`tsc --noEmit\`, \`ruff\`, \`mypy\`. If this creeps past two minutes, split it or cache harder.
2. **Unit tests**: 2 to 3 minutes. Blocks. No network, no database, no sleep calls.
3. **Build**: produces the artifact you will actually deploy. Blocks. Build once, reuse downstream, never rebuild at deploy time.
4. **Integration tests**: against a real Postgres service container, not a mock or SQLite. 3 to 4 minutes. Blocks. This is where migration mistakes and query bugs surface.
5. **Deploy to preview**: per-PR environment. Does not block the merge on infra failures, but it pages whoever owns the pipeline.
6. **Smoke test**: 5 to 10 requests against the preview URL: health, login, one authenticated read, one write, one Stripe webhook replay. Blocks promotion, not the PR.
7. **Promote**: on merge to main, the same artifact moves to production behind a health gate.

Everything else (visual diffs, load tests, dependency audits) runs nightly and reports rather than blocks. A flaky check that blocks merges is worse than no check, because the team learns to re-run until green.

## The workflow file

Three things do most of the heavy lifting here: a concurrency group so pushing three times in a row does not run three full pipelines, a dependency cache, and a Postgres service container.

\`\`\`yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.head_ref || github.sha }}
  cancel-in-progress: true

jobs:
  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 12
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/app_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - run: pip install -r requirements-dev.txt
      - run: alembic upgrade head
      - run: pytest -q tests/integration --maxfail=1
\`\`\`

Keep the pipeline definition in the repo, next to the code it builds. Configuration living in a web console is configuration nobody can review, and it will drift.

## Preview environments without the cloud bill

A per-PR URL is the highest-value thing you can add for a client project. Reviewers stop asking for screenshots and start clicking.

The trap is databases. One managed Postgres instance per PR gets expensive fast and takes 90 seconds to provision. Use one Postgres instance and a schema per PR instead:

\`\`\`sql
-- provisioned at preview deploy time
CREATE SCHEMA IF NOT EXISTS pr_1482;
-- app connects with: ?options=-csearch_path%3Dpr_1482
-- teardown on merge/close:
DROP SCHEMA pr_1482 CASCADE;
\`\`\`

Seed it from a fixture set, not a production dump. We keep a \`seed_demo.py\` that creates 3 orgs, 12 users across the role matrix, and a handful of paid and unpaid subscriptions so Stripe flows are exercisable. It runs in about four seconds.

Then actually tear it down. Wire a job to the \`pull_request: [closed]\` event that drops the schema and destroys the preview service. Skip this and you will find 60 idle environments in month three, all billing.

## Migrations that cannot take the site down

Migrations run as a separate pipeline step, before the new app version rolls out, and must stay backward compatible with the currently running code. That constraint is what makes a rollback safe.

Use expand/contract, always:

1. Add the new nullable column. Deploy.
2. Backfill in batches, not one statement.
3. Dual-write to old and new columns. Deploy.
4. Switch reads to the new column. Deploy.
5. Drop the old column, weeks later, once nothing references it.

Never rename a column in one deploy. A rename is a drop plus an add wearing a costume, and it breaks every process still running the old code during the rollout window.

Guard every migration with timeouts so a lock cannot stall a busy table:

\`\`\`sql
SET lock_timeout = '3s';
SET statement_timeout = '30s';

ALTER TABLE orders ADD COLUMN fulfillment_status text;
CREATE INDEX CONCURRENTLY idx_orders_fulfillment
  ON orders (fulfillment_status);
\`\`\`

Without \`lock_timeout\`, an \`ALTER TABLE\` waiting behind a long read queues every subsequent query on that table. We have watched a 40 millisecond migration hold an exclusive lock for four minutes because it got stuck behind an analytics query, and the whole API timed out. Three seconds and a retry is the fix.

Have a tested down path, or an explicit decision that the fix is forward-only. Untested \`downgrade()\` functions are decorative.

## Secrets

No secrets in the repo, ever, including \`.env.example\` files that quietly grew real values. Use OIDC federation from CI to the cloud provider so the pipeline exchanges a short-lived token instead of holding a long-lived access key. Scope secrets per environment: the preview deploy job should not be able to read the production database password. Rotate quarterly at minimum, and immediately when someone leaves.

If a key leaks, the order is rotate, then investigate. Revoke the credential, deploy the new one, confirm the service is healthy, and only then read logs to work out the blast radius. Teams that investigate first spend 40 minutes building a timeline while the key is still live.

## Rollback in under two minutes

Four rules make this boring:

- **Immutable artifacts, tagged by commit SHA.** \`app:9f2c1ab\`, never \`app:latest\`.
- **Deploy is a pointer flip.** You are changing which already-built image the platform serves, not building anything.
- **Health-gated rollout.** New instances take traffic only after passing a real readiness check; a failing rollout reverts on its own.
- **A rollback must never require a database rollback.** If reverting the app needs a schema change too, the migration was not backward compatible. Go back to expand/contract.

Feature flags separate deploy from release. Ship the code dark, turn it on for internal accounts, then a percentage, then everyone. Turning off a flag takes seconds and needs no pipeline run.

## You probably should not run Kubernetes yet

Kubernetes is excellent and it is not free. The bill is paid in attention: control plane upgrades every few months, ingress controller behavior, cert rotation, node pool sizing, resource requests nobody tuned, and one person carrying a pager for the cluster instead of the product. On a team of five that is 15 to 20 percent of an engineer, permanently.

Use a managed platform, a container service like ECS Fargate or Cloud Run, or two VMs behind a load balancer with systemd and a deploy script. All of them do rolling deploys, health checks, and rollbacks.

Honest signals you have outgrown that: roughly a dozen or more services with real inter-service traffic, multiple teams needing independent deploy cadence, genuine multi-region requirements, or a compute bill high enough that better bin-packing pays a salary. Wanting it on the resume is not a signal.

## How we run this

On NorthStackHub projects the pipeline goes in during the first week, before there is much to deploy. Required status checks on main, a preview URL on every PR, migrations as their own gated step, artifacts tagged by SHA. By the time a client sees a staging build, we have rehearsed a rollback at least once on purpose. When we hand a project over or move into a maintenance retainer, the workflow file and the deploy script are the documentation, and a developer who has never seen the repo can read both in ten minutes.
`,
  },
  {
    slug: "scoping-a-web-project-that-does-not-blow-up",
    title: "Scoping a web project that doesn't blow up",
    description:
      "Fixed scope or hourly, acceptance criteria that are verifiable, change requests, what to cut first, and the red flags worth walking away from on both sides.",
    date: "2025-02-25",
    category: "Business",
    tags: ["scoping", "estimation", "consulting", "process"],
    author: authors.lead,
    body: `Most failed web projects were not failed builds. They were failed scopes, agreed in a paragraph of good intentions and discovered to be three different projects around week five. The technical work is rarely the hard part. This is for both sides of the table, because a scope only holds if buyer and builder both understand what they signed.

## Why scope blows up

Four causes account for nearly everything we have seen go wrong.

**The deliverable was written as a noun.** "A dashboard." "A booking system." "An admin panel." A noun has no boundary. Two reasonable people will picture work that differs by 200 hours and both will believe they read the same sentence. A verified behavior has a boundary: "an admin can filter bookings by date range and status, and export the filtered set as CSV."

**Unstated integrations.** The brief says "users can pay." It does not say Stripe Connect with split payouts to 40 vendors, tax handling in two countries, and an invoice PDF matching an accounting template. Each of those is real work, and each appears in week six as "obviously that was included."

**Unowned content and data migration.** Someone has to write 30 pages of copy, source the images, and clean the 8,000-row spreadsheet that becomes the products table. If the contract does not name that person and a date, the answer is "the developer, for free, at the worst possible time."

**The approval loop nobody budgeted.** Five business days of review, twice, is two weeks of calendar. It appears in no estimate and delays every downstream milestone.

## Write scope as verifiable statements

The test for a scope line: could a stranger read it and tell you, without asking a question, whether it is done? If not, rewrite it.

Use counts, not adjectives. "12 screens, 3 roles, 2 integrations, 1 payment flow" is a scope. "A full-featured admin panel" is a mood. Counts also give you an honest place to negotiate: cutting from 12 screens to 9 is a conversation both parties can have.

Include an exclusions section. It feels awkward to write and it saves the relationship. Ours usually names: no native mobile apps, no SSO or SAML, no multi-language, no accessibility audit beyond keyboard and contrast basics, no legacy data migration, no email template design, no load testing above 200 concurrent users.

And name suppliers with dates. Who provides the Stripe account, the DNS access, the logo files, the copy, and by when. Late credentials are the most common cause of a slipped milestone that had nothing to do with code.

\`\`\`markdown
## Milestone 3 — Booking and Payments (est. 9 working days)

**Scope**
- Booking flow: search, availability, hold, confirm (4 screens)
- Stripe Checkout, card only, single currency (GBP)
- Confirmation email via Postmark, 1 transactional template
- Admin: view, filter, and cancel bookings (2 screens)

**Acceptance criteria**
1. A guest can complete a booking end to end on mobile and desktop.
2. A double-booked slot is rejected with a clear error; verified by an
   automated concurrency test in the repo.
3. A successful payment writes a booking row and sends one email.
   A failed payment writes no booking row.
4. Cancelling in admin issues a Stripe refund and emails the guest.
5. Deployed to staging and demoed on a recorded call.

**Excluded:** refund policies beyond full refund, multi-currency,
Apple Pay, waitlists, group bookings, promo codes.

**Client supplies by Mar 4:** Stripe live keys, Postmark account,
booking terms copy, cancellation policy text.

**Payment:** 25% of contract on written acceptance of criteria 1-5.
\`\`\`

## Fixed, hourly, or hybrid

Each model moves the risk somewhere. Nobody removes it.

**Fixed price** optimizes for the buyer's budget certainty. The builder carries all estimation risk, so a competent builder prices in a 25 to 40 percent buffer. On a vague brief, fixed price is a fight scheduled for a later date: every ambiguity resolves in whichever direction costs money, and someone has to lose it.

**Hourly** optimizes for flexibility. The buyer carries the risk and needs visibility: weekly hour reports, a demo cadence, a not-to-exceed ceiling. It works well with clients who have shipped software before, badly with clients who have not.

**Hybrid** is what we use most. A paid discovery of one to two weeks, typically 8 to 12 percent of expected build cost, produces what makes a fixed price honest: a screen inventory, a data model, integration specifics confirmed against real API docs, and a milestone plan with acceptance criteria. The build is then fixed against that document. If discovery reveals the project is twice the size anyone thought, both sides learn it for a few thousand rather than for the full budget. Maintenance goes on a monthly retainer afterward, typically 10 to 20 percent of build cost annualized, covering dependency updates, monitoring, and a defined response window.

## Change requests without the drama

Changes are normal. Unrecorded changes are what kills projects.

Keep a written change log in the repo. Quote every change in hours and in calendar days before work starts, because those numbers differ and clients care about the second one. The response to a mid-project request is never "no" and never a silent yes. It is "yes, and here is what moves."

\`\`\`yaml
- id: CR-011
  raised: 2026-03-09
  by: Priya (client)
  request: Add CSV import for existing customer list
  estimate_hours: [10, 14]
  calendar_impact: +3 working days on Milestone 4
  cost: fixed-price addendum, £1,150
  alternative: manual import by us at go-live, 2 hours, no schedule impact
  decision: approved 2026-03-10, alternative declined
\`\`\`

Bake in a small change budget, say 8 hours a month, for trivial requests. Copy tweaks, a color, an extra table column. Nobody wants a signed addendum to change a button label, and the goodwill is worth more than the hours.

## Estimation you can improve

Estimate at the task level, not the feature level. "Checkout" is a guess. "Cart persistence, Stripe session creation, webhook handler, idempotency, failure states, receipt email, admin refund" is seven estimates whose errors partly cancel.

Use ranges, always, and add two line items people habitually omit: integration time and review time. Then track estimate against actual on every task. Two projects of that data and your numbers start being useful rather than aspirational.

The honest multiplier for a third-party API you have never used personally is 2x to 3x. Not because the API is bad, but because you will meet its sandbox limits, its webhook retry semantics, and its account verification delay for the first time on this project.

## What to cut when the deadline is real

In order:

1. Internal admin tooling. Do it with SQL or a scripted task for now.
2. Breadth of edge cases. Make the core path excellent and handle the rare paths with a clear error.
3. Custom before configured. Use the hosted checkout, the off-the-shelf CMS, the library component.
4. Reporting and analytics dashboards. Export the data, chart it later.
5. Anything that is not payments correctness, auth correctness, or data integrity. Those three are never on the cut list.

## Red flags, both directions

Buyers should walk when: there is no written scope, an estimate arrives 20 minutes after a two-page brief, no staging environment appears in the plan, no named person owns the work, or the builder will not put exclusions in writing.

Builders should walk when: no decision maker is in the room and approvals route through someone unnamed, the brief is "just like Airbnb but simpler," payment terms have no deposit, or the deadline comes from a marketing date with zero slack and no scope flexibility to protect it.

## How we work

We quote discovery separately, and we do not give fixed prices on briefs we have not decomposed. Milestones carry acceptance criteria written before work begins, exclusions live in the same document, and change requests get logged with hours and dates attached. It makes the first conversation longer and every conversation after it shorter. Clients who have been burned before recognize the format immediately. The ones who have not usually notice around week four, when the thing they approved is the thing that shows up on staging.
`,
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export const postCategories = [
  "All",
  ...Array.from(new Set(posts.map((p) => p.category))),
] as const;

/**
 * Posts related to `slug`: same category first, then the most recent of the
 * rest. The source array is already ordered newest first.
 */
export function relatedPosts(slug: string, limit = 3) {
  const current = getPost(slug);
  const others = posts.filter((p) => p.slug !== slug);
  if (!current) return others.slice(0, limit);

  const sameCategory = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}
