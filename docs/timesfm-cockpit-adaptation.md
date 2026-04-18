# TimesFM → Cockpit adaptation

This document distills **[google-research/timesfm](https://github.com/google-research/timesfm)** for engineering decisions in Cockpit (Node/TypeScript backend, Postgres, Dune/Sim integrations). It is **not** a port of TimesFM; it records when and how to use forecasting in product-appropriate ways. For Hermes-style agent loops and how TimesFM fits the optional “analytics lane,” see [agent-runtime-hermes-adaptation.md](./agent-runtime-hermes-adaptation.md) §7.

**Primary sources:** [TimesFM repository](https://github.com/google-research/timesfm) (README, `AGENTS.md`, `pyproject.toml`), [TimesFM in BigQuery ML](https://docs.cloud.google.com/bigquery/docs/timesfm-model), [ICML 2024 paper](https://arxiv.org/abs/2310.10688) (*A decoder-only foundation model for time-series forecasting*), [Google Research blog](https://research.google/blog/a-decoder-only-foundation-model-for-time-series-forecasting/).

The open GitHub project is **not** an officially supported Google product; 1P surfaces (BigQuery, Sheets, Vertex) have their own terms.

---

## 1. What TimesFM is

**TimesFM** (Time Series Foundation Model) is a **decoder-style, pretrained** model for **time-series forecasting** from history. The current line in the repo is **TimesFM 2.5**: on the order of **200M parameters**, **up to ~16k context**, optional **continuous quantile head** for long horizons (README describes an optional ~30M quantile head). Compared to 2.0, **2.5 removes the `frequency` indicator** and adds forecasting-related flags. License: **Apache-2.0**.

**Hugging Face:** checkpoints live in the [TimesFM Hugging Face collection](https://huggingface.co/collections/google/timesfm-release-674e7c42b61ca4d587b1a476) (see repo README for the exact collection URL).

---

## 2. Install and runtimes

Typical local setup (from README): `uv venv`, activate, then editable install:

| Extra | Role |
|--------|------|
| `[torch]` | PyTorch path; matches checkpoint id `google/timesfm-2.5-200m-pytorch` in the README example. |
| `[flax]` | JAX / Flax stack; README highlights **Flax for faster inference** in the 2.5-era notes—often relevant for JAX/TPU-style serving, different ops surface than PyTorch. |
| `[xreg]` | **XReg** path for **covariates** (restored for 2.5 per repo updates). |

You still install a concrete **torch** or **jax** build for your OS and accelerators.

---

## 3. Minimal inference API (PyTorch)

Illustrative pattern from the repo README:

```python
import torch
import numpy as np
import timesfm

torch.set_float32_matmul_precision("high")

model = timesfm.TimesFM_2p5_200M_torch.from_pretrained("google/timesfm-2.5-200m-pytorch")
model.compile(
    timesfm.ForecastConfig(
        max_context=1024,
        max_horizon=256,
        normalize_inputs=True,
        use_continuous_quantile_head=True,
        force_flip_invariance=True,
        infer_is_positive=True,
        fix_quantile_crossing=True,
    )
)
point_forecast, quantile_forecast = model.forecast(
    horizon=12,
    inputs=[series_a, series_b],
)
# point_forecast.shape  -> (2, 12)
# quantile_forecast.shape -> (2, 12, 10)  # mean + 10th–90th quantiles in README example
```

**`ForecastConfig`** fields called out in README include: `max_context`, `max_horizon`, `normalize_inputs`, `use_continuous_quantile_head`, `force_flip_invariance`, `infer_is_positive`, `fix_quantile_crossing`.

---

## 4. Covariates and fine-tuning

- **Covariates:** supported for 2.5 via **XReg**; use the `[xreg]` install when you need that path.
- **Fine-tuning:** example using **Hugging Face Transformers + PEFT (LoRA)** is under `timesfm-forecasting/examples/finetuning/` in the repo.

---

## 5. Agent skills in the upstream repo

The TimesFM repo ships **`AGENTS.md`** and a packaged skill under **`timesfm-forecasting/SKILL.md`** (Agent Skills–style guidance for install, API, and fine-tuning). For Cockpit, you can **vendor or symlink** that skill into project-local `.cursor/skills/` so implementation work stays aligned with upstream—useful when inference remains **Python** and the app shell is **TypeScript**.

---

## 6. When not to self-host (1P Google)

From the repo’s product pointers:

- **BigQuery ML** — SQL-first, scalable forecasting on warehouse tables.
- **Google Sheets** — spreadsheet-connected workflows for non-engineering users.
- **Vertex AI Model Garden** — containerized endpoint suitable for HTTP/agentic callers (verify current Vertex docs and SKUs).

Use these when governance, SQL ergonomics, or managed serving matter more than pinning arbitrary custom weights in a sidecar.

---

## 7. Cockpit mapping (architecture and ethics)

| Approach | When it fits |
|----------|----------------|
| **BigQuery ML TimesFM** | Metrics already in **BigQuery**; want **governed SQL**, scheduled scoring, minimal custom GPU ops. Good for **org-wide aggregates**: RPC error rates, indexer lag, credit burn, queue depth. |
| **Python batch job or sidecar** | Need **repo-pinned** behavior, **LoRA** fine-tunes, **XReg** covariates, or deployment outside GCP; expose **numeric outputs + metadata** to Cockpit via APIs or tables the TS layer already owns. |
| **Not a fit (product / ethics)** | **Per-wallet** or individualized “prediction of behavior” as a surveillance feature. TimesFM belongs on **aggregate ops KPIs** and **reliability baselines**—aligned with [agent-runtime-hermes-adaptation.md](./agent-runtime-hermes-adaptation.md) §7. |

**Dune and Cockpit data:**

- **Dune Sim** — near-realtime snapshots for dashboards and alerts; can feed **recent windows** of a series you later forecast offline.
- **Dune SQL / exports** — historical, analyst-curated series synced to **Postgres or BigQuery** as **inputs** to TimesFM; the model answers **“how might this KPI trend?”**, not chain-deanonymization.

---

## 8. Implementation checklist (if we ship it)

1. Define **metric contracts** (grain, timezone, missing-data policy) in Postgres or BQ before any model call.
2. Choose **BQ ML vs Python sidecar**; document **cold start**, **GPU**, and **checkpoint version** for the latter.
3. Store **forecasts as versioned artifacts** (run id, horizon, config hash) for audit, not only latest points in UI state.
4. Keep **PII and individual subjects** out of training and positioning; reserve forecasting for **aggregates** documented in PRD / compliance review.

---

*TimesFM is Google Research open source (Apache-2.0). Cockpit is an independent codebase; this note is for internal engineering alignment.*
