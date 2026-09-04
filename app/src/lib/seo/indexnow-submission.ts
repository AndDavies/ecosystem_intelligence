import { indexNowEndpoint, singleUrlIndexNowPayload } from "@/lib/seo/indexnow";

export type IndexNowSubmissionResult = {
  mode: "submitted" | "accepted_pending_key_validation";
  status: 200 | 202;
};

export async function submitSingleUrlIndexNow(
  payload: ReturnType<typeof singleUrlIndexNowPayload>,
  fetcher: typeof fetch = fetch
): Promise<IndexNowSubmissionResult> {
  const keyVerification = await fetcher(payload.keyLocation, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(10_000)
  });
  const verificationBody = keyVerification.ok ? await keyVerification.text() : "";
  if (keyVerification.status !== 200 || verificationBody !== payload.key) {
    throw new Error("IndexNow key ownership verification failed; the public key file must return the exact configured key.");
  }

  const response = await fetcher(indexNowEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000)
  });

  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the exact URL notification with HTTP ${response.status}.`);
  }

  return {
    mode: response.status === 200 ? "submitted" : "accepted_pending_key_validation",
    status: response.status
  };
}
