# NephroCore

NephroCore is a web application for following patients with chronic kidney disease (CKD). Doctors record visits and lab
results, see how each patient is changing over time, and can ask an AI assistant for a clinical analysis that is based on
the patient's data and on KDIGO guidelines. Patients get a page of their own with their results, medications, symptoms and
appointments, a plain-language AI explanation, and a chat assistant.

The interface is in Macedonian. The code, comments and API messages are in English.

> NephroCore was built as a bachelor's thesis project. It is decision support for a doctor and an educational aid for a
> patient. It is **not** a medical device and does not replace a doctor's judgement.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [How the AI part works](#how-the-ai-part-works)
- [Getting started](#getting-started)
- [Preparing the guideline search (RAG)](#preparing-the-guideline-search-rag)
- [Using the app](#using-the-app)
- [API overview](#api-overview)
- [Security and privacy](#security-and-privacy)
- [Known limitations](#known-limitations)

---

## Features

### For doctors
- **Patient list and profiles.** Create, edit, activate and deactivate patients. A doctor only ever sees their own patients.
- **Visits and lab results.** Enter results for a visit, with a CKD stage (G1 to G5) per visit. More than 20 lab parameters are
  supported (eGFR, creatinine, ACR, potassium, hemoglobin, PTH, ferritin, HbA1c and others).
- **Charts that fit the stage.** Each patient page shows the default parameters for the patient's current stage
  (for example only the five core charts for G1). Any other parameter that has values can be added from a dropdown.
  Charts use a real time axis: the first and last result show the full date.
- **AI analysis.** One button creates a clinical analysis for the doctor, with numbered guideline sources. Every analysis is
  saved, and earlier ones can be opened again in a modal window.
- **Appointments, medications and symptoms.** A calendar for appointments, a medication list for each patient, and the
  symptoms the patient reports between visits.

### For patients
- **Home page.** Current stage, latest results as a timeline, medications, symptoms, next appointment.
- **AI explanation of the results.** A plain-language text without a greeting or a letter format, with what the patient can do
  in daily life and which warning signs to watch for. Saved, with history.
- **Chat assistant.** A small chat window for questions about the patient's own results and medicines. The conversation is
  **not stored**: it exists only in the browser and disappears on refresh or logout.
- **Symptom diary and medication reminders.**

---

## Tech stack

| Part | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| Database | PostgreSQL with the pgvector extension |
| Authentication | JWT (python-jose), bcrypt password hashing |
| Frontend | React 19, TypeScript, Vite, React Router 7, MUI, Recharts, Axios |
| AI | Anthropic Claude (doctor analysis, patient explanation), OpenAI (embeddings for the guideline search, patient chat) |
| PDF and text processing | PyMuPDF, tiktoken |

---

## Project structure

```
NephroCore/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app, CORS, routers
│   │   ├── api/
│   │   │   ├── deps.py          login check, role checks (doctor/patient), ownership checks
│   │   │   └── routes/          auth, patients, results, trends, appointment, symptoms,
│   │   │                        medications, doctors, ai, chat
│   │   ├── core/                settings, security (JWT, passwords), rate limiter, lab parameters
│   │   ├── db/                  database session and base class
│   │   ├── models/              SQLAlchemy tables
│   │   ├── schemas/             Pydantic request and response models
│   │   ├── ai/
│   │   │   ├── build_context.py     turns patient data into text for the prompt
│   │   │   ├── build_prompt.py      builds the system and user prompts
│   │   │   └── prompts/             the prompt texts (system, doctor, patient, chat)
│   │   └── rag/
│   │       ├── pdf_reader.py        extracts and cleans text from the guideline PDFs
│   │       ├── chunker.py           cuts the text into chunks with page metadata
│   │       ├── retriever.py         embeds a question and finds the closest chunks
│   │       └── sources.py           document titles, the ИЗВОРИ source list
│   ├── alembic/versions/        database migrations
│   ├── scripts/                 extract, chunk and load the guidelines
│   ├── data/                    guideline PDFs, extracted and polished text, chunks (JSONL)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── api/                 Axios calls and TypeScript types
        ├── components/          shared components (header, sidebar, modals, chat panel)
        ├── hooks/               one hook per resource (patients, visits, trends, AI, chat ...)
        ├── pages/               doctor and patient pages
        ├── providers/           authentication and snackbar providers
        └── utils/, constants/   helpers and clinical constants
```

---

## How the AI part works

### Doctor analysis (with guideline sources)

1. The doctor presses the button on a patient page.
2. The backend loads **all visits** with their lab values, the symptoms reported since the last visit, and the active
   medications. The patient's name and other identifying details are never sent to the AI.
3. A short search sentence is built from the latest visit (stage, etiology, out-of-range values, comorbidities). It is turned
   into an embedding with OpenAI, and the 5 closest guideline chunks are taken from the `document_chunks` table
   (cosine distance, pgvector).
4. The prompt contains the patient data and the chunks as numbered excerpts: `[Извор 1] <document title>, PDF page N` followed by the text.
5. Claude writes the analysis in Macedonian and cites only the number, for example `[Извор 3]`.
6. The backend reads the cited numbers and adds an `ИЗВОРИ` list at the bottom, taking the document title and page from the
   stored chunk. The AI never writes a document name or a page itself, so they cannot be invented.
7. The result is saved in the `ai_analyses` table.

### Patient explanation

Same data, but no guideline search and a different prompt: plain language, no greeting, what the patient can do, and which
warning signs to watch for. It is saved too.

### Patient chat

A stateless endpoint. The browser keeps the conversation and sends the last 20 messages with every question. The server adds
the patient's own data (loaded from their account) to the system prompt and calls OpenAI with `store=False`. Nothing is
saved. If a question mentions alarming symptoms (chest pain, trouble breathing, fainting), a fixed warning with the emergency
numbers is added in front of the answer, independent of the AI.

### Limits

Calls to the AI cost money, so they are limited per user: 6 analyses or explanations per hour and 30 chat messages per hour
(`backend/app/core/rate_limit.py`). The counters are kept in memory and reset when the server restarts.

---

## Getting started

### Requirements

- Python 3.12 or newer
- Node.js 20 or newer
- PostgreSQL with the **pgvector** extension available
- An Anthropic API key and an OpenAI API key (only needed for the AI features)

### 1. Database

Create an empty database, for example:

```bash
createdb nephrocore
```

The `vector` extension is created by a migration, so the database user needs the right to create extensions
(or create it once yourself with `CREATE EXTENSION vector;`).

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env` (copy `.env.example` and fill it in):

```
DATABASE_URL=postgresql+psycopg://<user>:<password>@localhost:5432/nephrocore
SECRET_KEY=<at least 32 random characters>
ACCESS_TOKEN_EXPIRE_MINUTES=360
INVITE_CODE_EXPIRE_DAYS=7

OPENAI_API_KEY=<your OpenAI key>
ANTHROPIC_API_KEY=<your Anthropic key>

# Optional. Default: http://localhost:5173 and http://localhost:3000
# CORS_ORIGINS=["http://localhost:5173"]
```

Generate a strong secret key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

`SECRET_KEY` must be at least 32 characters, otherwise the server refuses to start. The AI keys can be left empty if you do
not use the AI features, but those buttons will then fail.

Create the tables with the migrations (the schema is managed only by Alembic, the app does not create tables itself):

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. The interactive documentation is at `http://localhost:8000/docs`, and
`GET /health` returns `{"status": "ok"}`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_BASE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

The app runs on `http://localhost:5173`. Other useful commands:

```bash
npm run build      # type check and production build
npm run lint       # oxlint
```

---

## Preparing the guideline search (RAG)

The AI analysis needs the guideline text in the database. Until this is done, the analysis still works but without
guideline excerpts and without sources.

The pipeline has four steps. Run the scripts from the `backend` folder with `python -m`:

| Step | What happens | Command | Result |
|---|---|---|---|
| 1. Extract | PDFs in `data/guidelines/` are cleaned and written as text | `python -m scripts.inspect_pdf` | `data/extracted/*.txt` |
| 2. Polish | Figures and tables are described as text blocks. This step is done by hand, there is no script for it | (manual) | `data/polished/*.txt` |
| 3. Chunk | The text is cut into chunks of about 400 tokens (60 overlap), figures and tables stay whole | `python -m scripts.run_chunker` | `data/chunks/*.jsonl` |
| 4. Embed and load | Each chunk gets an OpenAI embedding and is stored in `document_chunks` | `python scripts/load_to_postgres.py` | rows in the database |

Notes:
- The guideline PDFs and the extracted text are excluded from git (`.gitignore`). The polished text and the chunk files are in the repository,
  so steps 3 and 4 can be repeated without the PDFs.
- Step 4 needs `OPENAI_API_KEY` and uses the `text-embedding-3-small` model. It can be repeated safely: existing chunks are updated.
- The guideline documents the app knows about are listed in `backend/app/rag/sources.py`. If you add a new guideline, add its
  `document_id` and title there so the source list shows a readable name.

Guidelines used: KDIGO 2024 CKD, KDIGO 2022 Diabetes in CKD, KDIGO 2021 Blood Pressure in CKD, and the KDIGO anemia guideline (2026).

---

## Using the app

1. **Register a doctor** from the home page.
2. **Add a patient** (the "create patient profile" page). The backend creates an unclaimed account and an **invite code**
   that is valid for 7 days (`INVITE_CODE_EXPIRE_DAYS`).
3. **The patient activates the account** with the invite code and chooses a username and password. From then on they log in
   as a patient.
4. **The doctor enters visits** with the "add results" page. The CKD stage is chosen for each visit.
5. Open the patient's page to see charts, add medicines, read reported symptoms and press the AI analysis button.

---

## API overview

The full, interactive list is at `/docs` when the server runs. The main groups:

| Prefix | Purpose | Who |
|---|---|---|
| `/auth` | register doctor, log in, activate a patient with an invite code | public |
| `/patients` | create, read, update, activate or deactivate patients | doctor (patients read their own profile at `/patients/me`) |
| `/results` | visits and lab results, parameter definitions | doctor (patient reads their own) |
| `/patients/{id}/trends` | chart data per parameter, with an `is_default` flag for the current stage | doctor, patient |
| `/appointments`, `/medications`, `/symptoms` | the three lists | doctor and patient, each for their own data |
| `/patients/{id}/ai-analysis` | create (POST) and list (GET) clinical analyses | doctor |
| `/patients/{id}/explain-results` | create (POST) and list (GET) patient explanations | patient |
| `/patients/{id}/chat` | one chat message (POST), nothing stored | patient |

---

## Security and privacy

- **Access control.** `patients.created_by_doctor_id` decides what a doctor can see. A doctor who asks for another doctor's
  patient gets a 404. Patients can only read their own data. Roles are checked with the `require_doctor` and `require_patient` dependencies in
  `backend/app/api/deps.py`.
- **Passwords and tokens.** Passwords are hashed with bcrypt. Tokens are JWTs (HS256) that expire after 6 hours by default.
  `SECRET_KEY` must be strong, and `.env` is never committed.
- **Data sent to AI providers.** No names or other identifying details are sent. Only the clinical data needed for the
  answer is included. The chat asks OpenAI not to store the conversation (`store=False`), and the app does not store it either.
- **Cost protection.** Per-user rate limits on all AI calls (see above).
- **Input limits.** Chat messages are limited to 1000 characters, 20 messages per request, and only the `user` and
  `assistant` roles are accepted.
- **Database changes.** Only through Alembic migrations.

---

## Known limitations

- The rate limiter keeps its counters in memory, so a server restart resets them, and it does not work across several server
  processes.
- Doctor registration is open to anyone. A real deployment would need an approval or invitation step.
- The AI analysis is a draft for a doctor. Whether a cited excerpt really supports a claim is not checked by the code, so the
  doctor must open the cited page and verify.
- The guideline search uses one query built from the latest visit and returns 5 chunks for all topics, so some topics (for
  example anemia or bone-mineral disorders) may not be covered by the retrieved excerpts.
- Patient explanations are shown to the patient without the doctor approving them first.
- Dialysis and transplant patients use the same default parameters as other patients; separate profiles are not built yet.
- Source lists show the document and page, but the PDF cannot be opened from the app yet.
- There are no automated tests in the repository.

---

## Disclaimer

NephroCore and its AI output are for education and decision support only. They do not diagnose, and they must not be used to
change a patient's treatment without a doctor's judgement. In an emergency, call 194 or 112.
