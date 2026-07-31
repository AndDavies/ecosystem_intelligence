-- North Signal keeps subscriber identity in the private consent ledger and
-- records only bounded, non-identifying conversion stages in pilot_events.
-- The existing 30-day expiry and private table grants remain unchanged.

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
    'newsletter_form_start',
    'newsletter_submit',
    'newsletter_error',
    'newsletter_dismiss',
    'feedback',
    'share'
  ));

comment on table public.pilot_update_signups is
  'Private consent ledger for the weekly North Signal email. MailerLite handles delivery and unsubscribe links.';

comment on table public.pilot_events is
  'Private, bounded product and North Signal funnel events retained for 30 days. Subscriber email is never stored in event metadata.';
