from fastapi import FastAPI
from app.scraper.async_scraper import fetch_chapter
from app.scraper.concurrent_scraper import scrape_concurrent
from fastapi.templating import Jinja2Templates
from fastapi import Request
from app.pipeline.pipeline import run_pipeline
import asyncio
import uuid
from app.state.jobs import jobs
from fastapi.responses import FileResponse

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get('/')
async def home():
    return {"message": "API Running"}

@app.get('/chapter')
async def get_chapter(url: str):
    data = await fetch_chapter(url)
    return data

@app.get('/concurrent-scrape')
async def concurrent_scrape(
    base_url: str,
    start: int,
    end: int
):
    data = await scrape_concurrent(
        base_url,start,end
    )
    return data


@app.post("/create-job")
async def create_job(
    base_url: str,
    current_chapter: int,
    start: int,
    end: int
):

    job_id = str(uuid.uuid4())

    asyncio.create_task(
        run_pipeline(
            job_id,
            base_url,
            current_chapter,
            start,
            end
        )
    )

    return {
        "job_id": job_id,
        "status": "started"
    }


@app.get("/job/{job_id}")
async def get_job(job_id: str):

    return jobs.get(
        job_id,
        {
            "error": "Job not found"
        }
    )

@app.get("/audio/{i}")
async def get_audio(i: int):

    filepath = f"output/{i}.mp3"

    return FileResponse(
        path=filepath,
        media_type="audio/mpeg"
    )


@app.get("/player")
async def player(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "request": request
        }
    )

@app.post("/pause-job/{job_id}")
async def pause_job(job_id: str):

    if job_id in jobs:
        jobs[job_id]["paused"] = True

    return {"status": "paused"}

@app.post("/pause-job/{job_id}")
async def pause_job(job_id: str):

    if job_id in jobs:
        jobs[job_id]["paused"] = True

    return {"status": "paused"}

@app.post("/stop-job/{job_id}")
async def stop_job(job_id: str):

    if job_id in jobs:
        jobs[job_id]["stopped"] = True
        jobs[job_id]["status"] = "stopped"

    return {"status": "stopped"}