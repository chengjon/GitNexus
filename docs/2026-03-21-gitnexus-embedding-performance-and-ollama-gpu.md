# GitNexus Embedding Performance And Ollama GPU Notes

Date: 2026-03-21
Updated: 2026-04-05

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
2. Verify that the host, WSL layer, container runtime, and Ollama can all initialize GPU successfully.
3. Only after GPU is confirmed healthy, tune `batchSize`.
4. Do not lower `nodeLimit`, disable embeddings, or swap models unless you are willing to trade away semantic quality.

On this host, the single biggest win was not a batch-size tweak. It was getting Ollama to actually use GPU. On `2026-03-21`, forcing `OLLAMA_LLM_LIBRARY=cuda_v12` fixed the active failure mode. On `2026-04-05`, the same container setting was still present, but Ollama still fell back to CPU because GPU initialization had regressed lower in the stack. The operational lesson is that `cuda_v12` helps, but it is not a sufficient health check by itself.

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

This did solve the active problem on `2026-03-21`, but it should now be treated as a point-in-time working configuration, not as a permanent guarantee. The `2026-04-05` follow-up below shows the same container env could still fall back to CPU when WSL / NVIDIA adapter visibility regressed.

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

Note that `/api/ps` is only conclusive while a model is loaded. If Ollama is idle it may return `{"models":[]}`, which does not prove GPU is healthy or broken by itself.

## 2026-04-05 Follow-Up: When `cuda_v12` Still Falls Back To CPU

The same machine later showed a different failure mode while indexing `/opt/claude/mystocks_spec` with:

```bash
gitnexus analyze --force --embeddings
```

At first glance the run looked hung. The CLI showed long pauses with little visible progress. The newer evidence shows it was not a GitNexus deadlock. It was CPU fallback during embedding generation.

### What Was Still Correct

The container configuration still looked GPU-ready:

- `docker inspect ollama` still showed GPU `DeviceRequests`
- container env still included `OLLAMA_LLM_LIBRARY=cuda_v12`
- container env still included `NVIDIA_VISIBLE_DEVICES=all`
- container env still included `NVIDIA_DRIVER_CAPABILITIES=compute,utility`

### What Was Actually Broken

GPU initialization failed below the container env layer:

- host `nvidia-smi` failed with `GPU access blocked by the operating system`
- container `nvidia-smi` failed with the same message
- `nvidia-container-cli info` failed with `WSL environment detected but no adapters were found`
- Ollama logs showed `ggml_cuda_init: failed to initialize CUDA: CUDA driver version is insufficient for CUDA runtime version`
- Ollama logs showed `offloaded 0/29 layers to GPU`
- Ollama logs showed the model running on `device=CPU`

### Why `gitnexus analyze --force --embeddings` Looked Stuck

Once Ollama fell back to CPU, each `/api/embed` request became very slow. In the captured `docker logs`, repeated embed requests took roughly `33s` to `59s` each. GitNexus only advances the visible progress bar after a batch completes, so the command looked inactive for long stretches even though it was still working.

Additional local clues matched that interpretation:

- `.gitnexus/reindexing.lock` existed during the run
- `.gitnexus/meta.json` still reflected the previous completed index state
- the previous meta state still showed `embeddings: 0`, which is expected until the rebuild finishes successfully

### Operational Conclusion

The March fix and the April regression can both be true:

- forcing `OLLAMA_LLM_LIBRARY=cuda_v12` was a real fix for the original backend-selection problem
- it is not enough when the host / WSL / NVIDIA runtime layer cannot expose a usable adapter to the container

From this point on, GPU troubleshooting should prioritize runtime health checks before container env tweaks.

## 2026-04-05 Validation Follow-Up: GPU Healthy, First Full Baseline Still Takes A Long Time

After the GPU runtime was repaired, the next question was whether GitNexus was
still stalling in cached embedding restore or whether the remaining time was
simply expected first-run embedding work.

The newer measurements on `/opt/claude/mystocks_spec` show a clear answer:

- `gitnexus doctor --gpu --json` passed the GPU-specific checks
- `docker exec ollama ollama ps` showed `qwen3-embedding:0.6b` running on `100% GPU`
- `curl http://127.0.0.1:11434/api/ps` reported non-zero `size_vram`
- `nvidia-smi` showed active GPU utilization and higher VRAM usage during embedding

### What The Large-Repo Run Actually Did

For `/opt/claude/mystocks_spec`, the observed stage flow was:

- scan files
- parse code
- detect communities / processes
- stream CSVs to disk
- load nodes / edges into Kuzu
- create search indexes
- restore cached embeddings
- load embedding model
- generate remaining embeddings

Observed stage details from the completed run:

- `13,701` files scanned
- `90,877` graph nodes
- `225,675` edges
- `84,540` embeddings written into the finished index
- total wall time was `2664.4s` (`44.4 min`)
- `KuzuDB` load time was `24.0s`
- `FTS` creation time was `38.8s`
- `Embeddings` time was `2551.6s`
- `Restoring 2537 cached embeddings...` was effectively immediate
- the remaining work was `82003` fresh embeddings across `1282` batches at `batchSize=64`
- observed embedding throughput was `33.1 nodes/s` and `0.50 batches/s`

This matters because it changes the diagnosis:

- the restore path is no longer the dominant stall point
- the main cost on a first full baseline is now the expected embedding workload itself
- large Kuzu stages such as search-index creation can also look like a hang if you are only watching the percentage number

### Practical Reading Of A "Long Pause"

On a large repository, a long pause can now mean different things:

- `62% Streaming CSVs to disk...`
  - CPU / disk-heavy preprocessing before Kuzu import
- `85% Creating search indexes...`
  - Kuzu search-index build time, which can take tens of seconds at this scale
- `88% Restoring ... cached embeddings...`
  - should now be short if the cache is reusable
- `92% Embedding ...`
  - real model work; on a first full baseline this can still take many minutes even with GPU working

Operationally, this means a first successful `analyze --embeddings` on a large
repo and a later cache-reuse run are two very different workloads. The first one
can still be tens of minutes. The second one is where the cached-restore
optimization pays off.

### Completed Cache-Reuse Validation On The Same Large Repo

After the successful baseline finished, the index metadata `toolVersion` was
intentionally downgraded to force a rebuild without changing repository content.
That validated the cache-reuse path on the same `/opt/claude/mystocks_spec`
repository.

Observed result from the forced cache-reuse run:

- `Restoring 84540 cached embeddings...` took about `26s`
- only `6` fresh embeddings remained
- the fresh work fit in `1` batch at `batchSize=64`
- total wall time dropped to `179.4s` (`3.0 min`)
- `KuzuDB` load time was `24.1s`
- `FTS` creation time was `32.3s`
- total `Embeddings` stage time was `37.1s`
- final index metadata reported `84,546` embeddings

The practical conclusion is that the large-repo cache path is now working end to
end. On this host, the post-fix workload profile is:

- first full baseline: expensive because most embeddings are new
- repeat rebuild with reusable cache: measured in minutes, not tens of minutes

## 2026-04-06 Runtime Check: `doctor --gpu` Now Confirms Active GPU Use

After the earlier April regression was repaired, another live check was run
while `/opt/claude/mystocks_spec` was still being processed by:

```bash
gitnexus analyze --embeddings /opt/claude/mystocks_spec
```

The newer evidence matters because it explains why a user may still think Ollama
is "CPU-only" even when GPU offload is healthy:

- `gitnexus doctor /opt/claude/mystocks_spec --gpu --json` passed all GPU checks
- `gpu-ollama-runtime` reported `qwen3-embedding:0.6b` with non-zero `size_vram`
- a live `nvidia-smi --query-gpu=...` sample showed `62%` GPU utilization and `3919 MiB` VRAM in use
- at the same time, `ps` showed the `gitnexus analyze --embeddings` process mostly waiting in `epoll`
- `ps` also showed the busy work concentrated in `ollama runner`, which was consuming high CPU while the GPU was active

This is an important operational nuance on this host:

- high Ollama CPU does not automatically mean GPU is broken
- the host `nvidia-smi` process table may still look sparse or empty under WSL / containerized runs
- non-zero `size_vram` plus rising GPU utilization is a stronger signal than process-list visibility alone

The same runtime check also confirmed that `.gitnexus/reindexing.lock` should not
be cleared if the owning analyze PID is still alive. In that case, the lock is
working as intended rather than being a stale-file bug.

## 2026-04-06 Follow-Up: False "Rebuilding" Errors Were A Lock-Ownership Bug

The next investigation clarified an important adjacent issue. Some later
`detect_changes` and MCP read failures were not caused by GPU behavior and were
not primarily caused by mixed file ownership either. The main root cause was
broken `reindexing.lock` ownership semantics:

- one `gitnexus analyze` process could overwrite another process's lock
- a cleanup path could later delete a different process's live lock
- MCP stale-lock cleanup could race with a newly written live lock

The practical result was a false positive:

- GitNexus could keep reporting `GitNexus is rebuilding the index`
- but the PID stored in `.gitnexus/reindexing.lock` was already dead
- or a newer live lock had been misclassified during stale-lock cleanup

The fix was to harden lock ownership rules instead of treating this as a GPU or
generic permission problem:

- lock creation now refuses to overwrite a live owner
- lock removal is now PID-bound
- MCP stale-lock cleanup now revalidates the lock before deletion
- error output now distinguishes:
  - active rebuild with a live PID
  - stale lock for a dead PID that cannot be deleted
  - unreadable or invalid lock payload

Mixed ownership is still worth cleaning up because it can block deletion of a
dead stale lock. But for this incident it was a secondary risk, not the primary
root cause.

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

During the `2026-04-05` follow-up, a forced rebuild of `/opt/claude/mystocks_spec`
showed the same pattern for a different reason: the container still had the
expected GPU env, but Ollama had fallen back to CPU again and individual
`/api/embed` calls were taking tens of seconds each.

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

### Step 1: Avoid Unnecessary Full Rebuilds

For normal refreshes, prefer:

```bash
gitnexus analyze --embeddings
```

Use `--force` only for intentional full rebuilds or index repair.

### Step 2: Verify Host And Container GPU Health

Check these in order:

```bash
nvidia-smi
nvidia-container-cli info
docker exec ollama sh -lc 'nvidia-smi || true'
docker logs --tail 200 ollama | grep -E 'ggml_cuda_init|offloaded|device=CPU|device=CUDA'
```

If any of those fail, fix the host / WSL / NVIDIA runtime path first. Do not assume a container env tweak will be enough.

### Step 3: Verify Ollama Container Configuration

Once the lower layers are healthy, make sure the Ollama container still includes:

```bash
docker exec ollama sh -lc 'env | grep -E "OLLAMA|CUDA|NVIDIA" | sort'
```

At minimum, confirm:

- `OLLAMA_LLM_LIBRARY=cuda_v12`
- `NVIDIA_VISIBLE_DEVICES=all`
- `NVIDIA_DRIVER_CAPABILITIES=compute,utility`

### Step 4: Keep The Best Known Batch Size

```bash
gitnexus config embeddings set --batch-size 64
```

If GPU is temporarily unavailable but you must keep indexing, a smaller
temporary batch such as `8` or `16` can reduce per-request stall time. That is
only a mitigation for responsiveness, not a real fix for throughput.

### Step 5: Run The Target Command

```bash
gitnexus analyze --force --embeddings
```

Use the forced rebuild form only when you truly need it.

## Quick Triage Checklist

If embeddings are slow again, check these in order:

1. Is the command using `--force` unnecessarily?
2. Does host `nvidia-smi` succeed?
3. Does `nvidia-container-cli info` see a usable adapter instead of reporting `no adapters were found`?
4. Does `docker exec ollama sh -lc 'nvidia-smi || true'` succeed inside the container?
5. Do Ollama logs show `ggml_cuda_init` errors, `offloaded 0/... layers to GPU`, or `device=CPU`?
6. While a model is loaded, does `curl -s http://localhost:11434/api/ps` show non-zero `size_vram`?
7. Did the Ollama container lose `OLLAMA_LLM_LIBRARY=cuda_v12` or other NVIDIA env vars?
8. Did `batchSize` revert back to `8` or another low value?

## Recommended Next Steps

For the current machine:

1. Fix host-side WSL / NVIDIA visibility until both host and container `nvidia-smi` work again.
2. Treat `nvidia-container-cli info` as a gate. If it reports `no adapters were found`, stop tuning Ollama env and fix the runtime path first.
3. After runtime health is restored, keep the Ollama container on `OLLAMA_LLM_LIBRARY=cuda_v12` unless newer evidence shows another backend works better.
4. Keep GitNexus `batchSize` at `64` for normal GPU-backed runs on this machine.
5. If work must continue before GPU is restored, use a smaller temporary batch size only to make CPU fallback less opaque.
6. Re-run target repos with `gitnexus analyze --embeddings` by default, and reserve `--force` for deliberate rebuilds.

## References

- Ollama Docker docs: <https://docs.ollama.com/docker>
- Ollama Troubleshooting: <https://docs.ollama.com/troubleshooting>
- NVIDIA CUDA Toolkit Release Notes: <https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html>

## Local Evidence Sources

The following local commands produced the key evidence for this note:

```bash
uname -a
nvidia-smi
docker inspect ollama
docker exec ollama sh -lc 'env | grep -E "OLLAMA|CUDA|NVIDIA" | sort'
docker exec ollama sh -lc 'nvidia-smi || true'
docker logs --tail 200 ollama
nvidia-container-cli info
curl -s http://localhost:11434/api/ps
cat /opt/claude/mystocks_spec/.gitnexus/reindexing.lock
cat /opt/claude/mystocks_spec/.gitnexus/meta.json
gitnexus config embeddings show
```
