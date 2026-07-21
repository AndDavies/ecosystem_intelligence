# Evidence contract

Each field-evidence object contains `id`, `sourceId`, `fieldPath`, `claimClass`, `excerpt`, `confidence`.

Keep excerpts under 1,000 characters and prefer paraphrase. Never insert browser citation tokens, copied report markers, or long copied passages. A candidate source must appear in its own `sources` array before evidence may reference it.

Mission matches use `matchClass: derived` until a reviewer changes the classification. Public demand sources use a normalized issuer hierarchy and commitment level, but capability-demand matches remain review-pending.

Evidence depth should match the candidate's public detail. Cite material profile data, public contacts, programs, relationships, and current activity when those fields are included. Prefer several complementary canonical sources over repeated citations to one generic landing page. Do not create decorative evidence or repeat the same claim under multiple field paths.

For plausible but thin records, log recovery attempts from at least three distinct source lanes before `recovery_exhausted` deferral. Missing optional public details become amber reviewer warnings. They do not justify suppressing an evidence-anchored inclusion case.
