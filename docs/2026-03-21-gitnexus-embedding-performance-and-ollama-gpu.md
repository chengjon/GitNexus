# GitNexus Embedding Performance And Ollama GPU Notes

Date: 2026-03-21

## Scope

This note captures the highest-value ways to reduce `gitnexus analyze --embeddings`
wall time without reducing GitNexus semantic search quality.

It is based on:

- GitNexus CLI behavior in this repo
- Local measurements on this machine
- Ollama running in Docker on WSL2
- The current embedding model: `qwen3-embedding:0.6b`

## Environment Snapshot

- GitNexus repo version under test: `1.4.0`
- Ollama version: `0.16.3`
- Host OS: `WSL2` on Windows
- Docker Engine: `29.3.0`
- NVIDIA Container Toolkit: `1.19.0`
- GPU: `NVIDIA GeForce RTX 2080`
- Windows NVIDIA driver seen from host: `595.79`
- Container-visible CUDA reported by `nvidia-container-cli info`: `13.2`
- Test corpus size referenced here: `78,145` embeddable nodes

## Executive Summary

The most effective optimizations, in order, are:

1. Do not use `--force` on repos that already have embeddings.
2. Make sure Ollama is actually using GPU.
3. After GPU is working, raise `batchSize`.
4. Do not lower `nodeLimit`, disable embeddings, or swap models unless you are willing to trade away semantic quality.

On this host, the single biggest win was not a batch-size tweak. It was fixing Ollama so it actually used the GPU. After that, `batchSize=64` was the best observed setting in local tests.

## Highest-Value Optimization: Avoid `--force`

GitNexus only reuses cached embeddings when all of the following are true:

- `--embeddings` is enabled
- an existing index is present
- `--force` is not used

The relevant logic is in:

- `gitnexus/src/cli/analyze.ts`

Observed behavior in `mystocks_spec`:

- Existing index already had `78,541` embeddings.
- Running `gitnexus analyze --force --embeddings` skipped reuse and rebuilt embeddings from zero.

Recommendation:

- Use `gitnexus analyze --embeddings` for normal refreshes.
- Use `gitnexus analyze --force --embeddings` only when the index is actually corrupt or when a full rebuild is intentional.

This preserves semantic quality and usually saves more time than any batch-size change.

## Why Ollama Was Slow Before

The original `ollama` container requested GPU access, but the active model still ran on CPU.

Evidence:

- `docker inspect ollama` showed GPU device requests.
- `docker exec ollama ollama ps` showed `qwen3-embedding:0.6b ... 100% CPU`.
- Ollama logs repeatedly showed:
  - CUDA backend discovery
  - `ggml_cuda_init: failed to initialize CUDA: CUDA driver version is insufficient for CUDA runtime version`
  - `offloaded 0/... layers to GPU`

Important finding:

- The host driver itself was not obviously too old.
- The real problem was backend selection inside the container.
- `ollama/ollama:latest` was auto-selecting `cuda_v13` in this environment.
- Forcing `cuda_v12` made the same model load and run fully on GPU.

## How GPU Was Made To Work

The fix was to run Ollama with:

```bash
OLLAMA_LLM_LIBRARY=cuda_v12
```

The rebuilt container was started like this:

```bash
docker run -d \
  --name ollama \
  --restart unless-stopped \
  --gpus all \
  -e OLLAMA_HOST=0.0.0.0:11434 \
  -e OLLAMA_LLM_LIBRARY=cuda_v12 \
  -p 11434:11434 \
  -v /home/docker/ollama:/root/.ollama \
  ollama/ollama:latest
```

After the change:

- `curl http://localhost:11434/api/ps` reported non-zero `size_vram`
- Ollama logs showed `loaded CUDA backend from /usr/lib/ollama/cuda_v12/libggml-cuda.so`
- Ollama logs showed `offloaded 29/29 layers to GPU`

### Verification Commands

Use these to confirm GPU is really active:

```bash
docker exec ollama ollama ps
curl -s http://localhost:11434/api/ps
docker logs --tail 200 ollama | grep -E 'loaded CUDA backend|offloaded|driver version is insufficient|library=CUDA'
```

Healthy output should include:

- `size_vram` greater than `0`
- `offloaded ... layers to GPU`
- no new `CUDA driver version is insufficient...` messages

## Batch Size Research

### Test Method

The measurements below used:

- provider: Ollama
- model: `qwen3-embedding:0.6b`
- dimensions: `384`
- input shape similar to GitNexus embedding text output
- single-run local microbenchmarks against `/api/embed`

These numbers are useful for choosing `batchSize`, but they are not the total
end-to-end `gitnexus analyze` time. Full runs also include parsing, Kuzu load,
FTS creation, metadata writes, and index warmup.

### GPU-Enabled Results

These measurements were taken after forcing `OLLAMA_LLM_LIBRARY=cuda_v12`.

| Batch Size | Total Batches For 78,145 Nodes | Items/Sec | Estimated Embed-Only Time |
| --- | ---: | ---: | ---: |
| 8 | 9,769 | 25.961 | 50.2 min |
| 16 | 4,885 | 33.673 | 38.7 min |
| 32 | 2,443 | 36.497 | 35.7 min |
| 48 | 1,629 | 36.982 | 35.2 min |
| 64 | 1,222 | 40.275 | 32.3 min |
| 96 | 815 | 37.210 | 35.0 min |
| 128 | 611 | 37.939 | 34.3 min |
| 192 | 408 | 34.852 | 37.4 min |
| 256 | 306 | 37.848 | 34.4 min |

### What The Numbers Mean

- `batchSize=64` was the best observed setting on this machine.
- `batchSize=32` and `48` were close, but clearly slower than `64`.
- `96`, `128`, and `256` did not beat `64` in the measured runs.
- `192` regressed.

Practical interpretation:

- If you want the best observed throughput on this exact host, use `64`.
- If you want a slightly more conservative setting with still-good throughput, use `32`.

### CPU-Fallback Comparison

Before GPU was fixed, the same environment ran embeddings on CPU. Real-world
observation from the live GitNexus run:

- progress reached only `8032 / 78145` after more than two hours
- that implied a many-hours total runtime

This is why GPU enablement is a larger optimization than any batch-size tweak.

## Embedding Dimensions: Why `384` Is The Right Choice Today

For the current GitNexus implementation, `384` is not just a default. It is an
effective system contract.

### Current State

GitNexus currently assumes `384` dimensions in multiple places:

- default embedding config uses `dimensions: 384`
- Kuzu embedding table schema is `FLOAT[384]`
- the core semantic search query casts vectors as `FLOAT[384]`
- Ollama responses are validated against the requested dimension count
- MCP query embedding logic also uses the default embedding dimensions

In practice, that means:

- `dimensions=384` is the safe, correct choice
- increasing dimensions is not a free tuning knob
- moving to a larger dimension requires coordinated code and schema changes

### Why Not Set A Larger Dimension Right Now

A larger vector is not automatically better in this system.

Potential upside:

- a higher-dimensional embedding may preserve more semantic detail for some models

Immediate downsides in the current GitNexus stack:

- larger vectors increase storage size
- vector indexing becomes heavier
- query-time vector operations become more expensive
- all existing embeddings must be regenerated
- schema and search code must be updated together
- retrieval quality must be revalidated after the change

Because GitNexus is still built around `384`, increasing dimensions today adds
engineering risk and operational cost before it adds proven retrieval value.

### Recommendation

Use `dimensions=384` for the current codebase.

Treat any move to a larger dimension as a real feature/refactor, not as a quick
performance or quality tweak.

### If You Ever Decide To Increase Dimensions

At minimum, review and update all of these areas:

- `gitnexus/src/core/embeddings/types.ts`
- `gitnexus/src/core/kuzu/schema.ts`
- `gitnexus/src/core/embeddings/embedding-pipeline.ts`
- `gitnexus/src/core/embeddings/ollama-client.ts`
- `gitnexus/src/mcp/core/embedder.ts`
- any query path that casts vectors with a fixed `FLOAT[384]`
- index creation and any migration path for existing `.gitnexus` data

Operationally, a dimension change would also require:

- full re-indexing of embeddings
- recreation of the vector index
- regression checks on semantic search quality and latency

## Recommended Settings

### Best General-Purpose Choice For This Host

```bash
gitnexus config embeddings set --batch-size 64
```

### Conservative Choice

```bash
gitnexus config embeddings set --batch-size 32
```

Use `32` if you want to stay closer to the original defaults while still
getting most of the throughput benefit.

## Settings That Save Time Without Lowering Semantic Quality

These are the recommended no-quality-loss changes:

- Keep the model as `qwen3-embedding:0.6b`
- Keep embeddings enabled
- Do not reduce the embedding node limit
- Do not reduce snippet quality or switch to a smaller model without separate evaluation
- Prefer incremental runs without `--force`
- Run Ollama on GPU
- Increase `batchSize`

## Settings To Avoid If Semantic Quality Must Stay Intact

- Lowering `GITNEXUS_EMBEDDING_NODE_LIMIT`
- Disabling `--embeddings`
- Swapping to another embedding model without validating retrieval quality
- Changing GitNexus text generation behavior just to shorten inputs

Those may save time, but they are not no-regret optimizations.

## Suggested Operational Workflow

### One-Time Container Fix

Make sure the Ollama container includes:

```bash
-e OLLAMA_LLM_LIBRARY=cuda_v12
```

### One-Time GitNexus Batch Update

```bash
gitnexus config embeddings set --batch-size 64
```

### Normal Refresh

```bash
gitnexus analyze --embeddings
```

### Full Rebuild Only When Necessary

```bash
gitnexus analyze --force --embeddings
```

## Quick Triage Checklist

If embeddings are slow again, check these in order:

1. Is the command using `--force` unnecessarily?
2. Does `curl -s http://localhost:11434/api/ps` show non-zero `size_vram`?
3. Does `docker exec ollama ollama ps` show GPU instead of `100% CPU`?
4. Did the Ollama container lose `OLLAMA_LLM_LIBRARY=cuda_v12`?
5. Did `batchSize` revert back to `8` or another low value?

## Recommended Next Steps

For the current machine:

1. Keep the rebuilt Ollama container with `OLLAMA_LLM_LIBRARY=cuda_v12`
2. Set GitNexus `batchSize` to `64`
3. Re-run the target repo with `gitnexus analyze --embeddings`
4. Use `--force` only when a real full rebuild is required

## References

- Ollama Docker docs: <https://docs.ollama.com/docker>
- Ollama Troubleshooting: <https://docs.ollama.com/troubleshooting>
- NVIDIA CUDA Toolkit Release Notes: <https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html>

## Local Evidence Sources

The following local commands produced the key evidence for this note:

```bash
docker inspect ollama
docker exec ollama ollama ps
docker logs --tail 200 ollama
nvidia-container-cli info
curl -s http://localhost:11434/api/ps
gitnexus config embeddings show
```
