#!/usr/bin/env bash
# Run before every publish. The site only deploys if this passes.
set -euo pipefail
cd "$(dirname "$0")"
python3 tests/responsive_test.py
