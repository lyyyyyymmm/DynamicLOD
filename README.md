# learnMapmost

## Tail Frame-Time LOD Research Benchmark

This directory contains the protocol-v2 implementation for **Predictive Dynamic LOD Scheduling for Web 3D Tiles under Tail Frame-Time Constraints**.

Core artifacts:

- `lod-benchmark.html`: modular Cesium experiment UI.
- `lod-controller.mjs`: proposed predictive scheduler.
- `lod-methods.mjs`: fixed, Cesium dynamic, reactive, and discrete PI baselines.
- `benchmark-server.mjs`: LAN server, isolated run routes, result checkpointing, and diagnostic network profiles.
- `experiment-config.mjs`: frozen protocol, manifests, randomized queues, ablations, and PI grid.
- `analysis/analyze_results.py`: device-stratified Friedman/Wilcoxon-Holm analysis.
- `analysis/quality_analysis.py`: SSIM and optional LPIPS quality analysis.
- `paper/manuscript_zh.md` and `paper/manuscript_en.md`: synchronized drafts with result placeholders.
- `paper/experiment_protocol.md`: confirmatory protocol and publication gate.

## Data

Formal protocol-v2 datasets are frozen public subsets of 3DBAG `v20250903` under CC BY 4.0:

| ID | Role | Content tiles | Local size |
| --- | --- | ---: | ---: |
| `bagAmsterdam` | D1 primary confirmation | 307 | about 193.6 MB |
| `bagRotterdam` | D2 external validation | 244 | about 180.4 MB |

Each dataset includes `provenance.json` with file sizes and SHA-256 hashes. Stanford Dragon and the generated 85-tile set are calibration/diagnostic data only. Taipei 101 and Dayanta have unresolved publication rights and are excluded from scientific evidence.

Prepare or verify data:

```powershell
npm run lod:prepare:amsterdam
npm run lod:prepare:rotterdam
npm run lod:verify-data
```

## Run

From `Cesium-1.134/Apps`:

```powershell
npm run lod:generate
npm test
npm run test:lod:py
npm run lod:serve
```

Open `http://localhost:8088/Apps/learnMapmost/lod-benchmark.html`. The page checkpoints every attempt to `results/incoming`, preserves invalid attempts, and retries each invalid condition at most twice.

The historical pages `model_perf_3dtiles.html` and earlier prototypes remain available as development records, but they are not part of protocol v2.
