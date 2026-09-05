import { describe, expect, it, vi } from "vitest";
import { runSignalsPublication, SignalsPublicationUncertainError, type PublicationObservation } from "../src/lib/signals/publication";
function operations() {
  return { prepare: vi.fn(async () => {}), finalize: vi.fn(async () => {}), inspect: vi.fn(async (): Promise<PublicationObservation> => "unpublished"), rollback: vi.fn(async () => {}), package: vi.fn(async () => ({ count: 2, platforms: ["linkedin", "x"], inserted: 2 })), verify: vi.fn(async () => {}), record: vi.fn(async () => {}) };
}
describe("Signals publication commit boundary", () => {
  it.each(["edition", "item", "source", "snapshot", "record link"])("rolls back a failed precommit %s write", async (stage) => {
    const ops = operations(); ops.prepare.mockRejectedValue(new Error(`${stage} failed`));
    await expect(runSignalsPublication(ops)).rejects.toThrow(`${stage} failed`);
    expect(ops.rollback).toHaveBeenCalledOnce(); expect(ops.finalize).not.toHaveBeenCalled(); expect(ops.package).not.toHaveBeenCalled();
  });
  it("rolls back a rejected finalizer but preserves evidence when its state is unknown", async () => {
    const ops = operations(); ops.finalize.mockRejectedValue(new Error("RPC interrupted"));
    ops.inspect.mockResolvedValue("unknown");
    await expect(runSignalsPublication(ops)).rejects.toBeInstanceOf(SignalsPublicationUncertainError);
    expect(ops.rollback).not.toHaveBeenCalled(); expect(ops.package).not.toHaveBeenCalled();
    ops.inspect.mockResolvedValue("unpublished");
    await expect(runSignalsPublication(ops)).rejects.toThrow("RPC interrupted"); expect(ops.rollback).toHaveBeenCalledOnce();
  });
  it("recovers a committed RPC with a lost response without duplicate publication", async () => {
    const ops = operations(); ops.finalize.mockRejectedValue(new Error("response lost")); ops.inspect.mockResolvedValue("published");
    expect(await runSignalsPublication(ops)).toMatchObject({ publicationStatus: "published", publicationVerified: true });
    expect(ops.finalize).toHaveBeenCalledOnce(); expect(ops.rollback).not.toHaveBeenCalled();
  });
  it.each(["package", "verify", "record"] as const)("keeps the article committed when postcommit %s fails", async (stage) => {
    const ops = operations(); ops[stage].mockRejectedValue(new Error("temporary failure"));
    const result = await runSignalsPublication(ops);
    expect(result.publicationStatus).toBe("published"); expect(ops.rollback).not.toHaveBeenCalled();
    if (stage === "package") expect(result.packaging.socials).toBe("pending");
    if (stage === "verify") expect(result.publicationVerified).toBe(false);
    if (stage === "record") expect(result.reportPending).toBe(true);
  });
  it("records pending optional copy without claiming the article failed", async () => {
    const ops = operations(); ops.package.mockResolvedValue({ count: 0, platforms: [], inserted: 0 });
    expect(await runSignalsPublication(ops)).toMatchObject({ publicationVerified: true, packaging: { socials: "pending" } });
  });
  it("reports rollback failures without losing the original cause", async () => {
    const ops = operations(); ops.prepare.mockRejectedValue(new Error("write failed")); ops.rollback.mockRejectedValue(new Error("cleanup failed"));
    await expect(runSignalsPublication(ops)).rejects.toBeInstanceOf(AggregateError);
  });
});
