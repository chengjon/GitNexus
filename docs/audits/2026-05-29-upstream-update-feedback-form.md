# 2026-05-29 Upstream Update Feedback Form

Last reviewed: 2026-05-29

## Purpose

This is a fillable feedback form for the 2026-05-29 upstream GitNexus update.
It is intended for project maintainers, local operators, and downstream users
who experienced the update in real projects.

Use this form together with:

- [2026-05-29-upstream-version-update-summary.md](/opt/claude/GitNexus/docs/audits/2026-05-29-upstream-version-update-summary.md)
- [../ai-cli-local-quick-start.md](/opt/claude/GitNexus/docs/ai-cli-local-quick-start.md)

## Reviewer Information

| Field | Response |
| --- | --- |
| Reviewer name / role |  |
| Review date |  |
| Environment / host |  |
| GitNexus checkout path | `/opt/claude/GitNexus` |
| GitNexus commit reviewed |  |
| Node version |  |
| Primary AI host(s) |  |
| External projects tested |  |

## 1. Migration And Graph Store Recovery

### Summary

Current GitNexus uses `.gitnexus/lbug` as the LadybugDB graph store. The old
`.gitnexus/kuzu` path is retired and should not be recreated.

### Questions

| Question | Response |
| --- | --- |
| Did users understand that `.gitnexus/kuzu` is retired? |  |
| Did users understand that `.gitnexus/lbug` is now the success criterion? |  |
| How many projects had `.gitnexus/meta.json` but no `.gitnexus/lbug`? |  |
| Which projects required forced rebuild? |  |
| Did `gitnexus analyze` recover missing `.gitnexus/lbug` automatically? |  |
| Were recovery messages clear enough? |  |
| Did any project require deleting `.gitnexus/lbug*` sidecars? |  |

### Evidence To Attach

```text
Project path:
Before recovery:
After recovery:
Command used:
Log excerpt:
Notes:
```

## 2. Analyze Runtime, Workers, And Parser Stalls

### Questions

| Question | Response |
| --- | --- |
| Which repos made `gitnexus analyze` appear stuck or silent? |  |
| How long did operators wait before interrupting? |  |
| Did bounded workers help? |  |
| Did `--worker-timeout` help? |  |
| Did `--max-file-size` help? |  |
| Were native worker abort messages actionable? |  |
| Which files appeared in timeout / quarantine / exhausted logs? |  |
| Should GitNexus print more progress during long parser jobs? |  |

### Evidence To Attach

```text
Command:
Elapsed time:
CPU / memory observation:
Log lines:
Offending file paths:
Final result:
```

## 3. External Project Boundary And Operator Safety

### Questions

| Question | Response |
| --- | --- |
| Was the boundary between GitNexus recovery and target-project edits clear? |  |
| Did any recovery require target-project file edits? |  |
| Should GitNexus generate `.gitnexusignore` suggestions instead of editing files? |  |
| Should recovery reports be written to `/tmp` or `.gitnexus/` instead of project docs? |  |
| Should CLI warnings explicitly say `commit/fetch/push` are out of recovery scope? |  |
| Did any operator accidentally mix recovery with target-project git changes? |  |

### Proposed Boundary Feedback

```text
What should GitNexus be allowed to do automatically?

What should require explicit project-owner approval?

What should never happen during recovery?
```

## 4. MCP Host And Transport Behavior

### Questions

| Question | Response |
| --- | --- |
| Which MCP hosts were tested? |  |
| Did any host report `Transport closed`? |  |
| Did users know to restart/reconnect the MCP host? |  |
| Did shell-spawned `gitnexus mcp` processes cause confusion? |  |
| Did `gitnexus status` show the local CLI was healthy while MCP was disconnected? |  |
| Should `gitnexus doctor --json` add stronger MCP reconnect guidance? |  |
| Was multi-repo registry behavior clear when many repos were indexed? |  |

### Evidence To Attach

```text
Host:
MCP error:
CLI status:
Process list:
Reconnect action:
Outcome:
```

## 5. Local Source Deployment Versus NPM Install

### Questions

| Question | Response |
| --- | --- |
| Were users clear that this environment uses a local source checkout? |  |
| Did any message still recommend `npm install -g gitnexus@latest` incorrectly? |  |
| Is the local update flow clear: merge upstream, build, restart host clients? |  |
| Should GitNexus detect local-source installs and tailor recovery guidance? |  |
| Are absolute-path MCP configs clear enough? |  |

### Evidence To Attach

```bash
which gitnexus
readlink -f "$(which gitnexus)"
gitnexus --version
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js status
```

## 6. Optional Grammars And Language Coverage

### Questions

| Question | Response |
| --- | --- |
| Which optional grammars were unavailable? |  |
| Were unavailable-grammar warnings clear? |  |
| Which languages improved most after the update? |  |
| Which languages still miss important edges? |  |
| Which `impact`, `query`, or `detect_changes` results were wrong? |  |

### Evidence To Attach

```text
doctor --json language-support excerpt:
Project language mix:
Expected edge:
Actual GitNexus result:
Impact on workflow:
```

## 7. API Route, Shape, And Cross-Repo Contract Tools

### Questions

| Question | Response |
| --- | --- |
| Did `route_map` return expected route handlers and consumers? |  |
| Did `shape_check` report useful mismatches? |  |
| Did `api_impact` provide enough pre-change context? |  |
| Were group contracts understandable? |  |
| Which frameworks need better extraction? |  |
| Were any route or response-shape reports false positives? |  |
| Were any route or response-shape reports false negatives? |  |

### Evidence To Attach

```text
Route:
Handler file:
Consumer file:
Expected shape:
GitNexus reported shape:
Mismatch details:
Framework:
```

## 8. Embeddings, Search, And Wiki

### Questions

| Question | Response |
| --- | --- |
| Did users understand embeddings are optional? |  |
| Were existing embeddings accidentally dropped? |  |
| Did `gitnexus config embeddings show` explain effective settings? |  |
| Which provider was used: Ollama, Hugging Face, OpenAI-compatible, other? |  |
| Did wiki timeout / retry / language flags solve large-repo problems? |  |
| Are BM25-only results good enough for routine use? |  |
| Which queries require semantic search? |  |

### Evidence To Attach

```text
.gitnexus/meta.json stats.embeddings:
Embedding provider:
Model:
Endpoint:
Batch size:
Node limit:
Query examples:
Wiki command:
```

## 9. Web UI And Visualization

### Questions

| Question | Response |
| --- | --- |
| Did Tree View improve navigation? |  |
| Did Circles View improve exploration? |  |
| Was selected-node edge emphasis correct? |  |
| Were code-reference panels accurate? |  |
| Did Nexus AI stop behavior match expectations? |  |
| Was local backend / Docker configuration clear? |  |

### Evidence To Attach

```text
Browser:
Repository size:
View used:
Problem route or screenshot:
Backend URL:
Agent prompt and stop action:
Observed result:
```

## 10. Prioritized Maintainer Answers

Fill these first if time is limited.

| Priority | Question | Response |
| --- | --- | --- |
| 1 | Which external projects still fail or stall after `.gitnexus/lbug` recovery? |  |
| 2 | Which files trigger worker timeout, quarantine, or native abort? |  |
| 3 | Which messages still point local-source operators to the wrong update channel? |  |
| 4 | Which MCP host most often reports transport or stale-index confusion? |  |
| 5 | Which language/framework extractor gives the highest-value new signal? |  |
| 6 | Which route or response-shape reports are wrong enough to block adoption? |  |
| 7 | Which actions should GitNexus automate, and which should remain explicitly approved? |  |

## Maintainer Decision Notes

```text
Accepted feedback:

Rejected feedback:

Follow-up issues to create:

Urgent fixes:

Documentation changes:

Product / architecture decisions:
```
