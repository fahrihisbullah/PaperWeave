# Agent 3 - Paper Upload And Storage

## Mission
Bangun upload PDF yang aman, tervalidasi, dan tersimpan rapi di storage serta database.

## Dependencies
- `agents2.md`

## Subtasks
- desain schema `papers`
- buat migration `papers`
- tentukan bucket dan storage path convention
- implement validasi file PDF dan max size
- buat upload UI untuk single PDF
- implement upload handler ke Supabase Storage
- simpan metadata file ke database
- tampilkan daftar paper di project detail
- tambahkan state upload success dan upload failure

## Deliverables
- file PDF bisa diupload
- metadata paper tersimpan
- daftar paper tampil di UI

## Done Criteria
- 1 PDF berhasil masuk ke project dan terlihat di frontend
