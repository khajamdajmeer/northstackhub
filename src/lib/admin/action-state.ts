/**
 * Shared shape for the console's `useActionState` forms.
 *
 * Lives outside `app/aka/actions.ts` because a "use server" module may only
 * export async functions — a plain object export there fails the build.
 */

export type ActionState = { error: string | null; ok: boolean };

export const emptyActionState: ActionState = { error: null, ok: false };
