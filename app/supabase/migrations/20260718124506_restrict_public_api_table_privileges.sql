-- Data API roles need only the narrow privileges granted by the application
-- migrations. Structural table privileges are unnecessary and increase the
-- impact of a future policy or grant mistake.
revoke truncate, references, trigger
on all tables in schema public
from anon, authenticated;

alter default privileges for role postgres in schema public
revoke truncate, references, trigger on tables from anon, authenticated;
