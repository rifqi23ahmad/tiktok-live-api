# SOP Alur Kerja & Pembagian Porsi Peran

**Perusahaan:** IKISAE (Paperclip Company — project Tiktok Stream)
**Versi:** 2.0
**Tanggal:** 15 Agustus 2026
**Pemilik:** Board (operator)

---

## 1. Tujuan

SOP ini memastikan **setiap pekerjaan dikerjakan oleh peran yang tepat sesuai porsinya**.
Tiga aturan inti:

1. **Manajer mendelegasikan, tidak mengerjakan sendiri.**
2. **Setiap task punya satu pemilik peran yang jelas (single owner).**
3. **Tidak ada task yang berhenti tanpa pemilik.** Blocked / menunggu harus ada nama + aksi.

---

## 2. Struktur Organisasi

```
CEO / Founder
├── CPO (Chief Product Officer)
│   ├── Product Manager (PM)
│   ├── Product Owner (PO)
│   └── Business Analyst (BA)
├── CTO (Chief Technology Officer)
│   ├── Engineering Manager (EM)
│   │   ├── Tech Lead
│   │   ├── QA Lead
│   │   │   └── QA Engineer
│   │   ├── Frontend Lead
│   │   │   └── Frontend Engineer
│   │   └── Backend Lead
│   │       └── Backend Engineer
│   └── DevOps / SRE
└── Scrum Master  (fasilitator lintas Product & Engineering)
```

Catatan: Scrum Master **bukan** atasan FE, BE, atau QA — dia fasilitator proses Scrum.

---

## 3. Matriks Porsi Peran

| Peran | Fokus / Tanggung Jawab | Boleh eksekusi sendiri? |
|-------|------------------------|--------------------------|
| **CEO / Founder** | Visi, misi, strategi bisnis, target, keputusan strategis, funding/investor, partnership, budaya. Mengawasi CPO & CTO. | ❌ Tidak. Hanya memutuskan & mendelegasikan. |
| **CPO** | Product vision, product strategy, roadmap eksekutif, prioritas produk tingkat tinggi, koordinasi dengan CTO soal feasibility. | ❌ Mengarahkan PM/PO/BA; tidak mengerjakan discovery/story/requirement sendiri. |
| **Product Manager** | Roadmap detail, product discovery, analisis user & kompetitor, product objective, metrics, prioritas by business value. | ⚠️ IC strategis; delegasi requirement ke BA. |
| **Product Owner** | Product Backlog, prioritas backlog, user story, acceptance criteria, prioritas sprint, acceptance hasil development. | ✅ IC. |
| **Business Analyst** | Requirement gathering, business/functional requirement, use case, business process flow, business rules, edge cases, jembatan stakeholder–Product–Engineering. | ✅ IC. |
| **CTO** | Technology strategy, technical direction, system architecture, tech selection, security, scalability, reliability, engineering standards, technical risk, infra, engineering org, hiring senior. Mengawasi EM & tech leadership. | ❌ Tidak coding. Mendelegasikan ke EM. |
| **Engineering Manager** | People management, capacity planning, resource allocation, hiring, performance, career dev, mentoring leads, engineering process, koordinasi antar tim, bottleneck, koordinasi dengan Product & Scrum Master. | ❌ Tidak coding. Mendelegasikan ke leads. |
| **Tech Lead** | Technical design, technical decision, code review, architecture implementation, coding standard, technical blocker, technical debt, mentoring developer. | ✅ IC teknis (coding + review). |
| **QA Lead** | QA strategy, testing standard, test planning, regression strategy, automation strategy, quality metrics, defect management, mentoring QA, release readiness. | ⚠️ Strategi sendiri; testing harian ke QA Engineer. |
| **QA Engineer** | Functional/regression/API/integration/UI/exploratory testing, test case, bug reporting, verification, automation, compatibility, performance/security testing. | ✅ IC. |
| **Frontend Lead** | FE architecture, coding standard, component architecture, state management, FE performance, code review, dependency management, mentoring FE. | ⚠️ Arsitektur+review; implementasi UI ke FE Engineer. |
| **Frontend Engineer** | Implementasi UI, integrasi API, state management, form & validation, responsive, error handling, FE testing, performance, bug fixing, code review. | ✅ IC. |
| **Backend Lead** | Backend/API/database architecture, business logic standard, auth, security, performance, scalability, code review, technical debt, mentoring BE. | ⚠️ Arsitektur+review; implementasi ke BE Engineer. |
| **Backend Engineer** | API development, business logic, database, auth, third-party integration, background jobs, queue, caching, testing, bug fixing. | ✅ IC. |
| **DevOps / SRE** | CI/CD, cloud/VPS, deployment, monitoring, observability, IaC, infra security, backup, DR, scaling, network, production incident. | ✅ IC. |
| **Scrum Master** | Fasilitasi Sprint Planning/Daily/Review/Retro, bantu PO, coaching team, hapus impediment, jaga Sprint Goal, perbaiki proses, lindungi tim dari process dysfunction. | ❌ Tidak coding, bukan PO, bukan bos developer. |

---

## 4. Rantai Delegasi (wajib)

Format subtask: `parentId` = task induk, `assignee` = direct report, sertakan konteks + acceptance criteria.

### 4.1 CEO → Direct Report

| Jenis task | Delegasi ke |
|------------|-------------|
| Code, bug, fitur, infra, devtools, teknis | **CTO** |
| Product vision/strategy/roadmap/discovery/requirement/backlog | **CPO** |
| Proses Scrum, impediment, retro | **Scrum Master** |
| Lintas-fungsi / tidak jelas | Pecah per departemen (CTO + CPO); teknis+produk → CTO & CPO. |

### 4.2 CPO → Tim Produk

| Jenis task produk | Delegasi ke |
|-------------------|-------------|
| Discovery, kompetitor, metrics, roadmap detail | **Product Manager (PM)** |
| Backlog, user story, acceptance criteria, sprint prioritas | **Product Owner (PO)** |
| Requirement, use case, business rules, edge cases | **Business Analyst (BA)** |

### 4.3 CTO → Engineering

| Jenis task teknis | Delegasi ke |
|-------------------|-------------|
| Tim, kapasitas, hiring, proses, koordinasi antar tim | **Engineering Manager (EM)** |
| CI/CD, infra, deploy, monitoring, SRE | **DevOps / SRE** |
| Hands-on code/design/QA | **Engineering Manager** (EM meneruskan ke lead yang tepat) |

### 4.4 Engineering Manager → Leads

| Jenis task | Delegasi ke |
|------------|-------------|
| Technical design, code review, coding standard | **Tech Lead** |
| QA strategy, test planning, release readiness | **QA Lead** |
| FE architecture, komponen, review frontend | **Frontend Lead** |
| Backend/API/DB architecture, review backend | **Backend Lead** |

### 4.5 Leads → Engineer

| Lead | Delegasi implementasi ke |
|------|--------------------------|
| QA Lead | **QA Engineer** |
| Frontend Lead | **Frontend Engineer** |
| Backend Lead | **Backend Engineer** |

---

## 5. Aturan Anti-Monopoli Kerja

1. **CEO dilarang mengeksekusi.** Selalu triage + delegasikan ke CTO/CPO/Scrum Master.
2. **CTO dilarang coding.** Delegasikan ke EM (EM meneruskan ke lead/engineer).
3. **CPO dilarang discovery/story/requirement sendiri.** Delegasikan ke PM/PO/BA.
4. **EM dilarang coding.** Delegasikan ke Tech/FE/BE/QA Lead.
5. **Lead mendelegasikan implementasi ke engineer**; lead mengerjakan arsitektur, standar, dan review.
6. **Cek "sinyal idle"** sebelum mengerjakan sendiri: "siapa direct report saya yang harusnya mengerjakan ini?" Kalau ada, delegasikan.
7. **Kalau report tidak ada**, hire dulu (via skill create-agent) — jangan dikerjakan sendiri terus-menerus.

---

## 6. Alur Task End-to-End (Board → Selesai)

```
Board kasih task
      │
      ▼
  [CEO] triage & tentukan departemen → subtask ke CTO / CPO / Scrum Master
      │
      ▼
  [CPO / CTO]  ← manajer mendelegasikan lagi ke bawah
      │
      ▼
  [EM / PM / PO / BA / Leads]  ← terus ke bawah
      │
      ▼
  [Engineer / QA / DevOps]  ← IC mengeksekusi
      │
      ▼
  [QA / Lead / PO] verifikasi & acceptance
      │
      ▼
  [Manajer] approve → issue `done`
      │
      ▼
  [CEO] (bila perlu) validasi hasil akhir & lapor ke Board
```

**Aturan status:**
- `in_progress` hanya jika ada jalur lanjutan yang hidup.
- `in_review` hanya dengan reviewer nyata / approval / interaction.
- `blocked` wajib punya `blockedByIssueIds` + nama owner + aksi.
- `done` hanya setelah hasil terverifikasi.

---

## 7. Definisi "Done" (Handoff Berkualitas)

Setiap handoff (subtask) minimal memuat:
- **Objective** — apa yang diminta.
- **Owner** — satu nama assignee.
- **Acceptance criteria** — kapan dianggap selesai.
- **Blocker saat ini** — bila ada, + owner & aksi.
- **Next action** — langkah berikutnya.

---

## 8. Checklist Harian Operator (Board)

- [ ] Semua task ada assignee tunggal yang jelas.
- [ ] Tidak ada task IC yang dipegang CEO/CTO/CPO/EM/Lead.
- [ ] Cek idle report: apakah ada engineer/QA yang menganggur padahal ada task sejenis?
- [ ] Cek `blocked`: semua punya owner + aksi.
- [ ] Cek `in_review`: semua punya reviewer nyata.
- [ ] Struktur org sudah sesuai diagram (tidak ada role lama nyangkut).
