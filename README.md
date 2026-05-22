# Novel Audiobook Streaming System

An async AI-powered audiobook streaming platform that:

* Scrapes novel chapters dynamically
* Detects chapter URL patterns automatically
* Converts chapters into AI-generated speech using Edge TTS
* Uploads audio to Supabase Storage
* Streams chapters progressively like Spotify/YouTube
* Supports pause/resume/stop background jobs
* Auto-plays next generated chapter

---

# Features

## Scraping

* Async chapter scraping
* Concurrent fetching
* Automatic chapter URL pattern detection
* Producer-consumer async pipeline

## Audio

* AI-generated speech using Edge TTS
* Progressive chapter streaming
* Global playback speed control
* Auto-play next chapter
* YouTube-style autoplay toggle

## Jobs System

* Background processing
* Live progress polling
* Pause jobs
* Resume jobs
* Stop jobs

## Storage

* Supabase cloud storage integration
* Automatic overwrite support (`upsert`)
* Auto cleanup architecture
* Temporary local file cleanup

## Frontend

* Real-time UI updates
* Dynamic audio player generation
* Modern cyberpunk UI
* Streaming-like experience

---

# Tech Stack

## Backend

* Python
* FastAPI
* asyncio
* aiohttp
* BeautifulSoup

## AI / TTS

* edge-tts

## Storage

* Supabase Storage
* Supabase Database

## Frontend

* HTML
* JavaScript
* TailwindCSS

---

# Project Structure

```text
project/
│
├── app/
│   ├── main.py
│   │
│   ├── scraper/
│   │   ├── async_scraper.py
│   │   └── concurrent_scraper.py
│   │
│   ├── pipeline/
│   │   └── pipeline.py
│   │
│   ├── state/
│   │   └── jobs.py
│   │
│   ├── storage/
│   │   └── storage.py
│   │
│   └── tts/
│       └── tts.py
│
├── templates/
│   └── index.html
│
├── output/
│
├── cleanup.py
│
├── .env
│
├── requirements.txt
│
└── README.md
```

---

# Supabase Setup

---

# Step 1 — Create Supabase Project

Go to:

https://supabase.com

Create a new project.

---

# Step 2 — Create Storage Bucket

Open:

```text
Storage
→ Create Bucket
```

Bucket name:

```text
audio-files
```

Enable:

```text
Public Bucket = ON
```

---

# Step 3 — Create Storage Policies

Go to:

```text
Storage
→ Policies
→ storage.objects
```

Create these policies.

---

## Allow Uploads

### Operation

```text
INSERT
```

### Roles

```text
public
```

### WITH CHECK

```sql
bucket_id = 'audio-files'
```

---

## Allow Reads

### Operation

```text
SELECT
```

### USING

```sql
bucket_id = 'audio-files'
```

---

## Allow Updates (Required for Upsert)

### Operation

```text
UPDATE
```

### USING

```sql
bucket_id = 'audio-files'
```

### WITH CHECK

```sql
bucket_id = 'audio-files'
```

---

# Alternative SQL Setup (Recommended)

Go to:

```text
SQL Editor
```

Run:

```sql
create policy "Allow uploads"
on storage.objects
for insert
to public
with check (
    bucket_id = 'audio-files'
);

create policy "Allow reads"
on storage.objects
for select
to public
using (
    bucket_id = 'audio-files'
);

create policy "Allow updates"
on storage.objects
for update
to public
using (
    bucket_id = 'audio-files'
)
with check (
    bucket_id = 'audio-files'
);
```

---

# Step 4 — Create Cleanup Tracking Table

Run:

```sql
create table audio_cleanup (
    id bigint generated always as identity primary key,
    filename text not null,
    created_at timestamp default now()
);
```

This table tracks uploaded audio files for automatic cleanup after 24 hours.

---

# Step 5 — Get API Credentials

Go to:

```text
Project Settings
→ API
```

Copy:

* Project URL
* service_role key

IMPORTANT:

```text
Use service_role key for backend uploads
```

NOT anon key.

---

# Step 6 — Create `.env`

Create `.env` in project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
```

---

# Installation

---

# Step 1 — Create Virtual Environment

## Linux / Mac

```bash
python3 -m venv env
```

## Windows

```bash
python -m venv env
```

---

# Step 2 — Activate Virtual Environment

## Linux / Mac

```bash
source env/bin/activate
```

## Windows

```bash
env\Scripts\activate
```

---

# Step 3 — Install Dependencies

```bash
pip install fastapi uvicorn aiohttp beautifulsoup4 edge-tts supabase python-dotenv jinja2
```

---

# Step 4 — Generate requirements.txt

```bash
pip freeze > requirements.txt
```

---

# Running the Project

---

# Start FastAPI Server

```bash
uvicorn app.main:app --reload
```

---

# Open Frontend

Open browser:

```text
http://127.0.0.1:8000/player
```

---

# API Routes

| Route | Description |
|---|---|
| `/` | Health check |
| `/player` | Frontend UI |
| `/chapter` | Fetch single chapter |
| `/concurrent-scrape` | Concurrent scraping test |
| `/create-job` | Start audiobook generation |
| `/job/{job_id}` | Get live job status |
| `/pause-job/{job_id}` | Pause job |
| `/resume-job/{job_id}` | Resume job |
| `/stop-job/{job_id}` | Stop job |

---

# Dynamic Chapter URL Detection

Instead of hardcoding chapter URLs, the system automatically detects chapter patterns.

Example:

Input URL:

```text
https://site.com/novel/chapter-120.html
```

Input current chapter:

```text
120
```

The system automatically generates:

```text
chapter-121.html
chapter-122.html
...
```

This allows compatibility across many novel websites automatically.

---

# How It Works

# 1. User Creates Job

Frontend sends:

```text
POST /create-job
```

with:

```text
url
current_chapter
start
end
```

---

# 2. Producer Fetches Chapters

Producer:

* detects URL pattern
* fetches chapters asynchronously
* pushes data into queue

---

# 3. Consumer Generates Audio

Consumer:

* converts chapter text into TTS
* uploads MP3 to Supabase
* generates public URL
* deletes local temp file

---

# 4. Frontend Polls Progress

Frontend checks:

```text
/job/{job_id}
```

every few seconds.

Completed chapters appear instantly.

---

# 5. Progressive Audio Streaming

Users can:

* play generated chapters immediately
* adjust global playback speed
* auto-play next chapter
* pause/resume generation

---

# Audio Upload Flow

```text
Generate TTS
↓
Temporary MP3 file
↓
Upload to Supabase
↓
Store cleanup metadata
↓
Delete local temp file
```

---

# Automatic Cleanup System

Uploaded files are tracked in:

```text
audio_cleanup
```

A scheduled cleanup job:

* deletes files older than 24h
* removes DB records

---

# cleanup.py

The project includes:

```text
cleanup.py
```

which automatically removes expired files.

---

# Render Deployment

## Recommended Stack

| Service | Recommendation |
|---|---|
| Backend | Render |
| Database | Supabase |
| Storage | Supabase Storage |
| Cleanup Scheduler | Render Cron Job |

---

# Deploy Backend to Render

Go to:

https://dashboard.render.com

Create:

```text
New +
→ Web Service
```

Connect GitHub repository.

---

# Build Command

```bash
pip install -r requirements.txt
```

---

# Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port 10000
```

---

# Environment Variables

Add:

```env
SUPABASE_URL=
SUPABASE_KEY=
```

---

# Render Cleanup Cron Job

Create:

```text
New +
→ Cron Job
```

---

# Cron Build Command

```bash
pip install -r requirements.txt
```

---

# Cron Start Command

```bash
python cleanup.py
```

---

# Cron Schedule

Every hour:

```text
0 * * * *
```

---

# Future Improvements

* WebSockets instead of polling
* Redis queues
* Multiple TTS workers
* Docker deployment
* Authentication
* Chapter caching
* Rate limiting
* GPU TTS models
* Distributed workers

---

# Notes

* Edge TTS may rate limit extremely large jobs
* Supabase free tier is sufficient for MVP testing
* Local temp files are deleted automatically
* Use service_role key only on backend
* Producer-consumer architecture enables concurrent processing

---

# License

This project is for educational and personal use.