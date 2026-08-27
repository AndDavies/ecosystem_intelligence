"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAtlasAdminOwner, requireAtlasUser } from "@/lib/atlas/auth";
import { isRecentSignIn } from "@/lib/auth-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { unsubscribeMailerLiteSubscriber } from "@/lib/email/mailerlite";

const deleteAccountSchema = z.object({
  confirmationEmail: z.string().trim().toLowerCase().email(),
  unsubscribe: z.string().optional()
});

export async function deleteAccount(formData: FormData) {
  const atlasUser = await requireAtlasUser("/account");
  if (isAtlasAdminOwner(atlasUser)) {
    redirect("/account?error=admin-account-protected");
  }

  const parsed = deleteAccountSchema.safeParse({
    confirmationEmail: String(formData.get("confirmationEmail") ?? ""),
    unsubscribe: String(formData.get("unsubscribe") ?? "") || undefined
  });
  if (!parsed.success || parsed.data.confirmationEmail !== atlasUser.email.toLowerCase()) {
    redirect("/account?error=confirmation-mismatch");
  }

  const supabase = await createClient({ writeCookies: true });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/sign-in?next=%2Faccount");

  if (!isRecentSignIn(user.last_sign_in_at)) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/sign-in?next=%2Faccount%3Freauth%3Ddelete&error=Sign+in+again+to+confirm+account+deletion.");
  }

  const admin = createAdminClient();
  if (parsed.data.unsubscribe) {
    const { data: signup } = await admin
      .from("pilot_update_signups")
      .select("mailing_provider_subscriber_id")
      .eq("email", atlasUser.email.toLowerCase())
      .maybeSingle();
    const { data: withdrawnSubscriberId, error: withdrawalError } = await admin.rpc("withdraw_north_signal_preferences", {
      p_email: atlasUser.email.toLowerCase(),
      p_source: "account_deletion",
      p_operation_key: `account-delete:${user.id}:${randomUUID()}`,
      p_occurred_at: new Date().toISOString()
    });
    if (withdrawalError) redirect("/account?error=newsletter-withdrawal-failed");
    if (signup?.mailing_provider_subscriber_id) {
      try {
        await unsubscribeMailerLiteSubscriber(signup.mailing_provider_subscriber_id);
        const providerSyncedAt = new Date().toISOString();
        const [globalSync, preferenceSync] = await Promise.all([
          admin.from("pilot_update_signups").update({
            mailing_provider_status: "unsubscribed",
            mailing_provider_synced_at: providerSyncedAt,
            mailing_provider_error: null
          }).eq("email", atlasUser.email.toLowerCase()),
          typeof withdrawnSubscriberId === "number"
            ? admin.from("newsletter_subscription_preferences").update({
              provider_sync_status: "synced",
              provider_synced_at: providerSyncedAt,
              provider_error: null
            }).eq("subscriber_id", withdrawnSubscriberId)
            : Promise.resolve({ error: null })
        ]);
        if (globalSync.error || preferenceSync.error) {
          throw new Error("Local newsletter state could not record the successful provider unsubscribe.");
        }
      } catch (providerError) {
        const message = providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite unsubscribe synchronization failed.";
        const [globalFailure, preferenceFailure] = await Promise.all([
          admin.from("pilot_update_signups").update({
            mailing_provider_status: "sync_failed",
            mailing_provider_error: message
          }).eq("email", atlasUser.email.toLowerCase()),
          typeof withdrawnSubscriberId === "number"
            ? admin.from("newsletter_subscription_preferences").update({
              provider_sync_status: "failed",
              provider_synced_at: null,
              provider_error: message
            }).eq("subscriber_id", withdrawnSubscriberId)
            : Promise.resolve({ error: null })
        ]);
        if (globalFailure.error || preferenceFailure.error) {
          console.error("Account deletion newsletter reconciliation failed.", {
            globalCode: globalFailure.error?.code ?? null,
            preferenceCode: preferenceFailure.error?.code ?? null
          });
        }
      }
    } else if (typeof withdrawnSubscriberId === "number") {
      const { error: unavailableError } = await admin.from("newsletter_subscription_preferences").update({
        provider_sync_status: "not_configured",
        provider_synced_at: null,
        provider_error: null
      }).eq("subscriber_id", withdrawnSubscriberId);
      if (unavailableError) {
        console.error("Account deletion newsletter provider state could not be marked unavailable.", { code: unavailableError.code });
      }
    }
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    redirect("/account?error=session-revocation-failed");
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(atlasUser.id);
  if (deleteError) {
    redirect("/sign-in?error=Your+sessions+were+closed%2C+but+the+account+could+not+be+deleted.+Please+contact+the+site+owner.");
  }

  redirect("/sign-in?success=Your+account+and+private+workspace+data+were+deleted.");
}
