#!/usr/bin/env python3
"""Run the installed wiki compiler against an explicit defence-wiki root."""

from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys


ALLOWED_COMMANDS = {"audit", "batch-plan", "lint", "learning-report", "query"}


def argument(name: str) -> str | None:
    try:
        index = sys.argv.index(name)
    except ValueError:
        return None
    return sys.argv[index + 1] if index + 1 < len(sys.argv) else None


def resolve_tool() -> Path:
    configured = os.environ.get("OBSIDIAN_KB_TOOLS")
    if configured:
        candidate = Path(configured).expanduser().resolve()
        if candidate.is_file():
            return candidate
        raise SystemExit(f"OBSIDIAN_KB_TOOLS does not point to a file: {candidate}")

    candidates = sorted(
        (Path.home() / ".codex" / "plugins" / "cache" / "andrew-local" / "obsidian-kb-compiler").glob(
            "*/skills/obsidian-kb-compiler/scripts/kb_tools.py"
        ),
        reverse=True,
    )
    if not candidates:
        raise SystemExit("Could not locate kb_tools.py. Set OBSIDIAN_KB_TOOLS explicitly.")
    return candidates[0]


def main() -> int:
    if len(sys.argv) < 2 or sys.argv[1] not in ALLOWED_COMMANDS:
        raise SystemExit(f"First argument must be one of: {', '.join(sorted(ALLOWED_COMMANDS))}")
    command = sys.argv[1]
    root_value = argument("--root") or os.environ.get("TNM_DEFENCE_WIKI_ROOT")
    if not root_value:
        raise SystemExit("Pass --root or set TNM_DEFENCE_WIKI_ROOT. The wrapper never guesses a wiki root.")
    root = Path(root_value).expanduser().resolve()
    if not (root / "raw").is_dir() or not (root / "wiki").is_dir():
        raise SystemExit(f"Not a wiki root with raw/ and wiki/: {root}")

    passthrough: list[str] = []
    skip = False
    for index, value in enumerate(sys.argv[2:]):
        if skip:
            skip = False
            continue
        if value in {"--root", "--query"}:
            skip = True
            continue
        if value == "--":
            continue
        passthrough.append(value)

    if command == "query":
        query = argument("--query")
        if query:
            passthrough.insert(0, query)

    completed = subprocess.run(
        [sys.executable, str(resolve_tool()), command, str(root), *passthrough],
        check=False,
    )
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
