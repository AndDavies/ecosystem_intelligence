-- Add a bounded acquisition-navigation stage without changing the consent
-- ledger, provider integration, 30-day retention or existing access policies.

alter table public.pilot_events
  drop constraint if exists pilot_events_event_name_check;

alter table public.pilot_events
  add constraint pilot_events_event_name_check check (event_name in (
    'atlas_search',
    'filter_apply',
    'marker_select',
    'result_select',
    'dossier_open',
    'evidence_open',
    'export',
    'save',
    'submission',
    'connection',
    'subscription',
    'newsletter_impression',
    'newsletter_open',
    'newsletter_cta_click',
    'newsletter_form_start',
    'newsletter_submit',
    'newsletter_landing_view',
    'newsletter_sample_open',
    'newsletter_success',
    'newsletter_error',
    'newsletter_dismiss',
    'feedback',
    'share',
    'profile_engagement'
  ));

comment on table public.pilot_events is
  'Private, bounded product and North Signal funnel events retained for 30 days. Subscriber email is never stored in event metadata.';
