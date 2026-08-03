-- Keep the True North Map consent ledger authoritative while recording the
-- minimum state needed to reconcile it with the external mailing provider.

alter table public.pilot_update_signups
  add column mailing_provider text,
  add column mailing_provider_subscriber_id text,
  add column mailing_provider_status text,
  add column mailing_provider_synced_at timestamptz,
  add column mailing_provider_error text,
  add constraint pilot_update_signups_mailing_provider_check
    check (mailing_provider is null or mailing_provider = 'mailerlite'),
  add constraint pilot_update_signups_mailing_provider_status_check
    check (mailing_provider_status is null or mailing_provider_status in (
      'active',
      'unsubscribed',
      'unconfirmed',
      'bounced',
      'junk',
      'deleted',
      'sync_failed'
    )),
  add constraint pilot_update_signups_mailing_provider_error_check
    check (mailing_provider_error is null or char_length(mailing_provider_error) <= 1000);

create unique index pilot_update_signups_mailing_provider_subscriber_idx
  on public.pilot_update_signups (mailing_provider, mailing_provider_subscriber_id)
  where mailing_provider is not null and mailing_provider_subscriber_id is not null;

comment on column public.pilot_update_signups.mailing_provider is
  'External delivery provider used for this consent record. The local consent ledger remains authoritative.';
comment on column public.pilot_update_signups.mailing_provider_subscriber_id is
  'Provider subscriber identifier used for reconciliation and webhook updates.';
comment on column public.pilot_update_signups.mailing_provider_status is
  'Last delivery status reported by the provider; separate from the local consent status.';
comment on column public.pilot_update_signups.mailing_provider_synced_at is
  'Time of the latest successful provider synchronization or webhook reconciliation.';
comment on column public.pilot_update_signups.mailing_provider_error is
  'Bounded private diagnostic from the latest failed provider synchronization.';
