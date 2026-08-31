/**
 * Shape returned by the document form's server action.
 *
 * Lives outside the "use server" module because such a module may only export
 * async functions — a type is fine, but the initial-state constant is not.
 */

export type DocumentFormState = {
  error: string | null;
  /** Keyed by field name, as produced by `z.flattenError(...).fieldErrors`. */
  fieldErrors: Record<string, string[] | undefined>;
};

export const emptyDocumentFormState: DocumentFormState = {
  error: null,
  fieldErrors: {},
};
