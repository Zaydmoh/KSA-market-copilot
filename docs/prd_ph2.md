# PRD — Phase 2: Packs + RAG (KSA Market-Entry Copilot)
**Owner:** Zayd  
**Date:** 2025-11-08  
**Scope:** (A) Multi‑Regulation Packs, (B) RAG + Clause‑Level Citations

## 0) Context & Goals
Phase 1 shipped: upload → extract (Unstract) → MISA analysis → report.  
Phase 2 will:
1) Add modular **Policy Packs** (toggle per run) for high‑impact KSA compliance areas.  
2) Implement **RAG** with a versioned Markdown knowledge base for **line‑level citations** + “view source”.

## 1) Multi‑Regulation Packs (Modular)
### In‑scope packs (v2)
- **Nitaqat (Saudization):** sector → headcount → target quota % → traffic‑light band & actions.  
- **ZATCA e‑Invoicing (Phase 2):** readiness for **UUID, QR, cryptographic stamp, clearance/reporting API, archiving; PEPPOL optional** + ERP prompts.  
- **PDPL/Data Residency:** data inventory → risk flags (cross‑border transfer, consent, DPO, breach timelines).  
- **SABER/SFDA:** HS code wizard → required certificates (CoC, IECEE, GSO) → steps/links.  
- **RHQ eligibility quick check:** revenue/footprint prompts → pass/fail + missing proofs.

### Pack behavior
Each **PolicyPack** defines:
- **Inputs** (small form)  
- **Rules/Prompt** (deterministic checks + optional LLM reasoning)  
- **Output schema** (normalized checklist with ✅/⚠/✗, score 0–100, recommendations)  
- **Evidence mapping** (templates for missing items)  
- **Version pin** (e.g., `ZATCA:v2025.10`) to tie results to KB version

## 2) RAG + Clause‑Level Citations
- Move curated regulation content into **versioned Markdown** with metadata (`sources.yml`).  
- Ingest to **pgvector** (chunks + embeddings).  
- Retrieval constrained by **pack + version**; attach citations: `reg:PDPL:v2025.10 §12.b`, **URL**, **published_on**, **confidence**.  
- UI: **confidence badge** + **“view source”** side panel (shows chunk text, link, reg code, date).

## 3) Repository Layout (matches current direction)
```
regulations/
  nitaqat/
    v2025.10/
      overview.md
      thresholds.json
      sources.yml
  zatca/
    v2025.10/
      regulations/         ← official regulation extracts (MD)
        phase2.md
        api.md
      guidelines/          ← guidance/FAQs/implementation notes (MD)
        detailed-guideline.md
      sources.yml          ← metadata (title, url, published_on, storage_url, reg_code)
  pdpl/
    v2025.10/
      articles.md
      sources.yml
  saber_sfda/
    v2025.10/
      overview.md
      sources.yml
  rhq/
    v2025.10/
      overview.md
      sources.yml
```
> Originals (PDFs) live in object storage (e.g., Supabase Storage) with URLs recorded in `sources.yml`. Markdown is the **canonical RAG source** inside the repo.

## 4) Success Criteria
- ≥2 fully functional packs (Nitaqat + ZATCA) with structured outputs & scores.  
- ≥90% checklist items carry ≥1 valid citation (correct version + working URL).  
- 50‑page doc + 2 packs finishes **≤ 3 minutes** end‑to‑end.  
- Users report outputs as “trustworthy” and “actionable”.

## 5) Non‑Goals (Phase 2)
- Full user auth, billing, or mobile app.  
- Automated government portal submissions.  
- Heavy contract redlining (only a light preview if time permits).

## 6) Risks & Mitigations
- **Reg drift:** pin versions, show badges; store `published_on`.  
- **OCR variance:** auto‑fallback to OCR modes when extracted text is sparse.  
- **Hallucinations:** cite only retrieved chunks; drop unmatched citations.  
- **Performance:** cap chunks per item; cache retrieval.

## 7) API & Data (short)
**DB (new):** `kb_sources`, `kb_chunks`, plus app entities `projects/documents/analyses/analysis_packs/citations`.  

**Endpoints:**  
- `POST /api/run` → create analysis, queue packs.  
- `POST /api/analyze?pack=<id>&analysisId=<id>` → per‑pack output + citations.  
- `GET /api/run/:analysisId/status` → orchestrator status.  
- *(Dev)* `GET /api/kb/search` → debug retrieval.

## 8) UX Flow
1) **Run setup:** select packs → fill inputs → upload PDF.  
2) **Processing:** extract → per‑pack analyze → retrieve KB chunks → attach citations.  
3) **Results:** tabs per pack; status, score, checklist with citations; “view source” panel; export.

## 9) Acceptance Criteria
- **Packs:** Nitaqat & ZATCA fully functional with inputs forms, checklist JSON, and scores.  
- **RAG:** KB built for Nitaqat & ZATCA with `v2025.10`; ≥90% items have ≥1 valid citation; “view source” panel shows chunk text + URL + version.  
- **Perf:** 50‑page doc with Nitaqat + ZATCA: **≤ 3 minutes** total.  
- **Quality:** No hallucinated citations; unknown items marked ⚠ with guidance.

## 10) Delivery Plan (6 weeks)
**Sprint 1 (Weeks 1–3)**  
- Pack framework + toggle UI + per‑pack inputs forms.  
- Nitaqat pack: calculator, outputs, minimal citations.  
- ZATCA pack: readiness rules, ERP prompts, minimal citations.  
- KB ingestion pipeline + `kb_sources`/`kb_chunks` schema.  
- “View source” side‑panel.

**Sprint 2 (Weeks 4–5)**  
- PDPL/SABER/RHQ alpha (5–7 items each).  
- Confidence scoring + citation guardrails.  
- Evidence templates (markdown) + basic ZIP exporter.  
- Report export updates (multi‑pack layout).

**Week 6 (Hardening)**  
- Performance tuning, retries, logs/telemetry.  
- Golden‑set evaluation (10 docs).  
- Demo & sign‑off.