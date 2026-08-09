#!/usr/bin/env python3
"""Compatibility launcher for running Salta7 CLI directly from a source checkout."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from salta7_cli.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
