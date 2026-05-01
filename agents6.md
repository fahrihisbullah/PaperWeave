# Agent 6 - Reliability, Retry, And Observability

## Mission
Buat pipeline cukup stabil, bisa diulang, dan mudah di-debug saat gagal.

## Dependencies
- `agents5.md`

## Subtasks
- tampilkan status `pending`, `processing`, `completed`, `failed`
- simpan `retryCount`, `lastError`, dan timestamp step terakhir
- buat action re-run analysis
- pastikan analyze endpoint idempotent
- simpan usage metadata seperti token count atau cost estimate
- tambahkan logging per step pipeline
- tambahkan guardrail untuk max pages, max chunks, dan timeout
- buat UX untuk failed state dan retry state

## Deliverables
- job gagal bisa diulang
- status pipeline lebih jelas
- dev bisa debug job dari metadata

## Done Criteria
- 1 paper yang gagal bisa diulang tanpa bikin data duplicate atau corrupt
