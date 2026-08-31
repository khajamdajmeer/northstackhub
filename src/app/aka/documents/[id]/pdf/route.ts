import { NextResponse } from "next/server";

import { getSession } from "@/lib/admin/dal";
import { getDocument } from "@/lib/admin/hr/data";
import { pdfFilename, renderDocument } from "@/lib/pdf/render";

/**
 * Streams a generated document as a PDF.
 *
 * A route handler rather than a server action because the browser needs a real
 * URL to download from. That makes it a public endpoint, so it checks the
 * session itself — the proxy only sees whether a cookie exists, and this
 * returns salary figures.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    // Not a redirect: this is fetched as a file, and a signed-out request should
    // fail plainly rather than downloading a login page named like a PDF.
    return new NextResponse("Not authorised", { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  try {
    const pdf = await renderDocument(doc);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename(doc)}"`,
        // Salary documents must not sit in a shared cache.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(`[pdf] failed to render ${doc.reference}`, error);
    return new NextResponse(
      error instanceof Error ? error.message : "Could not render the document.",
      { status: 500 },
    );
  }
}
