# Evidence contract

Each field-evidence object contains `id`, `sourceId`, `fieldPath`, `claimClass`, `excerpt`, `confidence`.

Keep excerpts under 1,000 characters and prefer paraphrase. Never insert browser citation tokens, copied report markers, or long copied passages. A candidate source must appear in its own `sources` array before evidence may reference it.

Mission matches use `matchClass: derived` until a reviewer changes the classification. Public demand sources use a normalized issuer hierarchy and commitment level, but capability-demand matches remain review-pending.
