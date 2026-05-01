# PaperWeave MVP Roadmap

## MVP 1 - Single Paper Analysis

### User Flow

```txt
Login
-> Create Project
-> Upload 1 PDF
-> Queue Analysis Job
-> Extract Text
-> Chunk Text
-> Generate Structured Summary
-> Validate Evidence
-> Save Result
-> Display Summary + Status
```

### Included
- auth
- project workspace
- single PDF upload
- background analysis job
- text extraction and chunking
- structured summary with Zod validation
- evidence validation
- summary detail UI
- processing and failed states
- re-run analysis

### Not Included Yet
- multiple PDF comparison
- theme clustering
- literature review drafting
- export DOCX
- visual graph

### Release Criteria
- 1 PDF bisa diproses end-to-end
- summary punya evidence yang bisa dicek
- failure state jelas dan bisa diulang

---

## MVP 2 - Multi-Paper Workspace

### User Flow

```txt
Multiple PDFs
-> Batch Processing Status
-> Retry Failed Jobs
-> Compare Papers
```

### Included
- multiple PDF upload
- per-paper status tracking
- retry failed analysis
- compare 2+ papers in one project
- relation summary per paper pair

### Release Criteria
- banyak paper bisa diproses tanpa saling mengganggu
- user bisa melihat mana yang selesai dan mana yang gagal
- minimal 2 paper bisa dibandingkan

---

## MVP 3 - Cross-Paper Synthesis

### User Flow

```txt
Theme Clustering
-> Paper Relations
-> Research Gap Detection
```

### Included
- theme clustering
- relation detection
- research gap detection
- synthesis view per project

### Release Criteria
- project dengan beberapa paper bisa menghasilkan tema
- relasi dan gap bisa ditampilkan dengan evidence pendukung

---

## MVP 4 - Drafting And Export

### User Flow

```txt
Generate Literature Review Draft
-> Edit / Regenerate Draft
-> Export Markdown
-> Optional DOCX
```

### Included
- draft generation
- edit draft
- regenerate draft
- markdown export
- optional DOCX export

### Release Criteria
- user bisa menghasilkan draft literature review yang usable
- hasil bisa diexport ke markdown

---

## MVP 5 - Visual Graph

### User Flow

```txt
Graph View
-> Relation Explorer
-> Advanced Filtering
```

### Included
- graph visualization
- relation explorer
- theme filter
- relation type filter

### Release Criteria
- user bisa mengeksplor hubungan paper secara visual

---

## Recommended Build Order

1. MVP 1
2. MVP 2
3. MVP 3
4. MVP 4
5. MVP 5
