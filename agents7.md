# Agent 7 - Multi-Paper Processing

## Mission
Perluas workspace dari single-paper menjadi multi-paper processing yang stabil.

## Dependencies
- `agents6.md`

## Subtasks
- support multiple PDF upload
- queue analysis jobs per paper
- tampilkan daftar paper dan latest processing status
- tampilkan success dan failure state per paper
- optimasi query daftar paper per project
- pastikan kegagalan satu paper tidak memblok paper lain
- buat bulk action untuk analyze / retry jika perlu

## Deliverables
- banyak paper bisa diproses dalam satu project
- status per paper terlihat jelas
- partial failure tetap aman

## Done Criteria
- satu project bisa memproses banyak paper tanpa state kacau
