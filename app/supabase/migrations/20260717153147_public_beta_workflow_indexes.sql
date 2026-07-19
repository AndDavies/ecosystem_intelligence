-- Migration version aligned with the production history.
create index connection_requests_reviewer_idx
  on public.connection_requests (reviewer_id)
  where reviewer_id is not null;

create index contact_messages_reviewer_idx
  on public.contact_messages (reviewer_id)
  where reviewer_id is not null;
