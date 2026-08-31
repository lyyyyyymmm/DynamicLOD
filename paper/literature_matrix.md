# Literature Matrix

| Reference | Evidence used in this study | Boundary |
| --- | --- | --- |
| Funkhouser and Sequin (1993) | Interactive rendering can be formulated as maximizing display quality under a target frame-time budget. | Establishes adaptive frame-rate control; it does not address Web 3D Tiles request queues. |
| Garland and Heckbert (1997) | Quadric error metrics support the existing offline mesh simplification pipeline. | Supports model preparation, not the runtime scheduling novelty. |
| Suarez et al. (2015) | Mobile/WebGL LOD performance depends on camera paths, memory, GPU load, and device class. | Terrain-oriented evaluation; not a tail-constrained 3D Tiles controller. |
| Zhang et al. (2018) | Runtime prediction can select rendering quality under a resource budget on desktop and mobile platforms. | Optimizes power rather than Web tile requests or tail frame time. |
| Yang et al. (2008) | A lightweight runtime control mechanism can continuously adjust rendering quality to maintain a target frame rate. | Controls framebuffer shading resolution, not hierarchical Web tiles; motivates a control baseline rather than the proposed signal combination. |
| Auer et al. (2014) | Multiresolution Web visualization is relevant to cultural-heritage models. | Application motivation only; no claim of a comparable controller. |
| OGC 3D Tiles 1.1 (2022) | Defines hierarchical refinement, geometric error, and screen-space error. | Standard definition, not evidence of algorithmic superiority. |
| Peters et al. (2022) and official 3DBAG guidance | Documents automated multilevel building reconstruction and the open CC BY 4.0 dataset used for D1/D2. | Supports data provenance and external validity, not scheduler superiority. |

The defensible novelty statement is therefore limited to a lightweight Web 3D Tiles scheduling combination: rolling tail-frame constraint, short-horizon positive-trend forecast, public request-pressure feedback, interaction-aware asymmetric control, and explicit anti-oscillation guards, evaluated with paired PC/Android experiments.
