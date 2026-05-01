# Agent 5 - Structured Summary And Evidence Validation

## Mission
Ubah chunks menjadi summary terstruktur yang bisa dipertanggungjawabkan.

## Dependencies
- `agents4.md`

## Subtasks
- setup provider abstraction di `packages/ai`
- buat schema Zod untuk `PaperInsight`
- buat schema Zod untuk `InsightEvidence`
- buat prompt `summarizePaper`
- implement structured output parsing
- desain schema `paper_insights`
- desain schema `insight_evidence`
- buat migration untuk insight dan evidence tables
- validasi bahwa quote benar-benar ada di chunk source
- simpan `promptVersion`, `schemaVersion`, `modelUsed`
- tampilkan summary dan evidence di frontend
- handle invalid output dengan failure state yang jelas

## Deliverables
- summary paper terstruktur
- evidence bisa ditelusuri ke chunk
- invalid AI output tidak lolos sebagai final result

## Done Criteria
- user bisa buka summary paper dan melihat evidence per insight penting
