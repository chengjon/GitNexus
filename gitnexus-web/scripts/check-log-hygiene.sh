#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

check_absent() {
  local pattern="$1"
  local file="$2"
  local description="$3"

  if rg -n --fixed-strings "$pattern" "$file" >/tmp/gitnexus_log_hygiene_match.txt 2>/dev/null; then
    echo "FAIL: $description"
    cat /tmp/gitnexus_log_hygiene_match.txt
    status=1
  fi
}

check_absent 'runPipeline called with clusteringConfig' \
  'src/workers/ingestion.worker.ts' \
  'worker pipeline entry logging should not be unconditional'

check_absent 'Clustering config saved for background enrichment' \
  'src/workers/ingestion.worker.ts' \
  'background enrichment config logging should not be unconditional'

check_absent 'AGENT SYSTEM PROMPT' \
  'src/core/llm/agent.ts' \
  'full system prompt logging should be removed'

check_absent 'type:${msgType} content:${!!hasContent} tools:${hasToolCalls}' \
  'src/core/llm/agent.ts' \
  'per-chunk stream tracing should be removed'

check_absent 'Stream completed normally, yielding done' \
  'src/core/llm/agent.ts' \
  'normal completion tracing should be removed'

check_absent 'File content (first 300 chars):' \
  'src/core/ingestion/import-processor.ts' \
  'query failure logging should not dump file content excerpts'

if [[ "$status" -ne 0 ]]; then
  exit "$status"
fi

echo "PASS: targeted log hygiene checks"
