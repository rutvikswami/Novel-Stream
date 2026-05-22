from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from app.pipeline.pipeline import run_pipeline
import asyncio
import uuid
from app.state.jobs import jobs
from app.storage.storage import supabase
from pydantic import BaseModel
from typing import List

app = FastAPI()
templates = Jinja2Templates(directory="templates")


class DeleteFilesRequest(BaseModel):
    filenames: List[str]


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


@app.get("/")
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

@app.post("/resume-job/{job_id}")
async def resume_job(job_id: str):

    if job_id in jobs:
        jobs[job_id]["paused"] = False

    return {"status": "running"}

@app.post("/stop-job/{job_id}")
async def stop_job(job_id: str):

    if job_id in jobs:
        jobs[job_id]["stopped"] = True

    return {"status": "stopped"}


@app.get("/bucket-files")
async def get_bucket_files():
    import re
    try:
        # List files from Supabase storage bucket 'audio-files'
        files = supabase.storage.from_("audio-files").list()

        # Parse and filter files
        audio_files = []
        for file in files:
            name = file.get("name", "")
            if name.endswith(".mp3"):
                public_url = supabase.storage.from_("audio-files").get_public_url(name)
                audio_files.append({
                    "filename": name,
                    "url": public_url
                })

        # Sort in ascending order using natural sort key on filename
        def natural_sort_key(item):
            filename = item["filename"]
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', filename)]

        audio_files.sort(key=natural_sort_key)
        return audio_files
    except Exception as e:
        print("Error listing bucket files:", e)
        return []


@app.delete("/bucket-file/{filename}")
async def delete_bucket_file(filename: str):
    try:
        # Delete from Supabase storage bucket
        supabase.storage.from_("audio-files").remove([filename])

        # Also clean up from audio_cleanup table
        supabase.table("audio_cleanup").delete().eq("filename", filename).execute()

        return {"status": "deleted", "filename": filename}
    except Exception as e:
        print("Error deleting file:", e)
        return {"error": str(e)}


@app.post("/bucket-files/delete")
async def delete_bucket_files(req: DeleteFilesRequest):
    try:
        if not req.filenames:
            return {"status": "success", "message": "No files specified"}
        # Delete from Supabase storage bucket
        supabase.storage.from_("audio-files").remove(req.filenames)

        # Also clean up from audio_cleanup table
        supabase.table("audio_cleanup").delete().in_("filename", req.filenames).execute()

        return {"status": "deleted", "filenames": req.filenames}
    except Exception as e:
        print("Error deleting files:", e)
        return {"error": str(e)}