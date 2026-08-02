import { safeLocalReturnPath } from "@/lib/safe-return";

/**
 * Retain navigation context only for a local route. Return paths are carried
 * through sign-in and Working List flows, so never trust an arbitrary URL.
 */
export function safeAtlasReturn(value: string | undefined, fallback = "/map") {
  return safeLocalReturnPath(value, fallback);
}
