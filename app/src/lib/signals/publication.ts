/** Publication is irreversible to this runner after the database commit boundary. */
export type PublicationObservation = "published" | "unpublished" | "unknown";
export type SignalsPackagingResult = { count: number; platforms: string[]; inserted: number };
export type SignalsCompletion = {
  publicationStatus: "published";
  publicationVerified: boolean;
  packaging: { socials: "complete" | "pending"; socialDraftCount: number; socialDraftPlatforms: string[]; error?: string };
  verification: { scope: "database"; status: "verified" | "pending"; error?: string };
  reportPending?: boolean;
};
export function signalsErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return String(error);
}
export class SignalsPublicationUncertainError extends Error {
  constructor(cause: unknown) { super("Signals publication state could not be reconciled. Preserve the run and assembled edition; do not retry with a new identity or delete it.", { cause }); }
}

export async function runSignalsPublication(operations: {
  prepare(): Promise<void>;
  finalize(): Promise<void>;
  inspect(): Promise<PublicationObservation>;
  rollback(error: unknown): Promise<void | "published">;
  package(): Promise<SignalsPackagingResult>;
  verify(): Promise<void>;
  record(completion: SignalsCompletion): Promise<void>;
}): Promise<SignalsCompletion> {
  try {
    await operations.prepare();
    await operations.finalize();
  } catch (error) {
    const observed = await operations.inspect().catch((): PublicationObservation => "unknown");
    if (observed === "unknown") throw new SignalsPublicationUncertainError(error);
    if (observed !== "published") {
      let rollbackResult: void | "published";
      try { rollbackResult = await operations.rollback(error); }
      catch (rollbackError) { throw new AggregateError([error, rollbackError], "Signals publication failed and rollback verification also failed."); }
      if (rollbackResult !== "published") throw error;
    }
    // A lost RPC response can still represent a committed publication. Continue only after reconciliation.
  }
  const completion: SignalsCompletion = {
    publicationStatus: "published", publicationVerified: false,
    packaging: { socials: "pending", socialDraftCount: 0, socialDraftPlatforms: [] },
    verification: { scope: "database", status: "pending" }
  };
  try {
    const result = await operations.package();
    completion.packaging = { socials: result.platforms.includes("linkedin") && result.platforms.includes("x") ? "complete" : "pending", socialDraftCount: result.count, socialDraftPlatforms: result.platforms };
  } catch (error) { completion.packaging.error = signalsErrorMessage(error); }
  try {
    await operations.verify();
    completion.publicationVerified = true;
    completion.verification.status = "verified";
  } catch (error) { completion.verification.error = signalsErrorMessage(error); }
  try { await operations.record(completion); }
  catch { completion.reportPending = true; }
  return completion;
}
