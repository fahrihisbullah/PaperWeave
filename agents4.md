# Agent 4 - Extraction And Chunking Pipeline

## Mission
Bangun pipeline backend untuk membaca PDF, extract text, dan menyimpan chunks per paper.

## Dependencies
- `agents3.md`

## Subtasks
- desain schema `analysis_jobs`
- desain schema `paper_chunks`
- buat migration untuk dua tabel tersebut
- buat status enum untuk job dan paper
- buat trigger atau endpoint untuk enqueue analysis
- download PDF dari storage di backend
- implement PDF text extraction
- implement chunking strategy per page / paragraph
- simpan chunks beserta metadata page dan order
- simpan error detail jika extraction gagal
- update status job dan paper di setiap step

## Deliverables
- job analisis bisa dibuat
- text paper tersimpan sebagai chunk
- state processing bisa dilihat

## Done Criteria
- 1 paper bisa sampai tahap extraction dan chunking tanpa manual intervention
