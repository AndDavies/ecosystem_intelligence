"use server";

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
    await admin
      .from("pilot_update_signups")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("email", atlasUser.email.toLowerCase());
    if (signup?.mailing_provider_subscriber_id) {
      try {
        await unsubscribeMailerLiteSubscriber(signup.mailing_provider_subscriber_id);
        await admin.from("pilot_update_signups").update({
          mailing_provider_status: "unsubscribed",
          mailing_provider_synced_at: new Date().toISOString(),
          mailing_provider_error: null
        }).eq("email", atlasUser.email.toLowerCase());
      } catch (providerError) {
        await admin.from("pilot_update_signups").update({
          mailing_provider_status: "sync_failed",
          mailing_provider_error: providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite unsubscribe synchronization failed."
        }).eq("email", atlasUser.email.toLowerCase());
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
