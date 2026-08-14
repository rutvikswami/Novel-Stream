from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.pipeline.pipeline import run_pipeline
import asyncio
import uuid
import os
import re
from app.state.jobs import jobs
from app.storage.storage import supabase
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "https://nsa37.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Assets mount handled at root level at bottom of file


class DeleteFilesRequest(BaseModel):
    filenames: List[str]


class RenameFileRequest(BaseModel):
    old_filename: str
    new_filename: str


class ConvertTextRequest(BaseModel):
    text: str
    title: str
    subtitle: str = ""


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
async def player():
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return {"message": "Frontend build not found. Please build the frontend."}

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

        # List all files from Supabase storage bucket 'audio_files' using pagination
        offset = 0
        limit = 100
        files = []
        while True:
            batch = supabase.storage.from_("audio_files").list(options={"limit": limit, "offset": offset})
            if not batch:
                break
            files.extend(batch)
            if len(batch) < limit:
                break
            offset += limit

        # Build a set of all .vtt files for quick lookup
        vtt_files = {file.get("name", "") for file in files if file.get("name", "").endswith(".vtt")}


        # Parse and filter files
        audio_files = []
        for file in files:
            name = file.get("name", "")
            if name.endswith(".mp3"):
                public_url = supabase.storage.from_("audio_files").get_public_url(name)
                vtt_name = name.replace(".mp3", ".vtt")
                vtt_url = None
                if vtt_name in vtt_files:
                    vtt_url = supabase.storage.from_("audio_files").get_public_url(vtt_name)
                
                # Fetch metadata fields
                metadata = file.get("metadata", {}) or {}
                size = metadata.get("size", 0)
                created_at = file.get("created_at", "")
                audio_files.append({
                    "filename": name,
                    "url": public_url,
                    "subtitle_url": vtt_url,
                    "size": size,
                    "created_at": created_at
                })

        # Sort in ascending order using natural sort key on filename
        def natural_sort_key(item):
            filename = item["filename"]
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', filename)]

        audio_files.sort(key=natural_sort_key)
        return audio_files
    except Exception as e:
        print("Error listing bucket files:", e)
        return {"error": f"Failed to connect to Supabase: {str(e)}"}


@app.delete("/bucket-file/{filename}")
async def delete_bucket_file(filename: str):
    try:
        # Delete from Supabase storage bucket
        supabase.storage.from_("audio_files").remove([filename])

        # Also clean up from audio_cleanup table
        supabase.table("audio_cleanup").delete().eq("filename", filename).execute()

        # Delete corresponding subtitle file if it exists
        vtt_filename = filename.replace(".mp3", ".vtt")
        try:
            supabase.storage.from_("audio_files").remove([vtt_filename])
            supabase.table("audio_cleanup").delete().eq("filename", vtt_filename).execute()
        except Exception:
            pass

        return {"status": "deleted", "filename": filename}
    except Exception as e:
        print("Error deleting file:", e)
        return {"error": str(e)}


@app.post("/bucket-file/rename")
async def rename_bucket_file(req: RenameFileRequest):
    try:
        old_name = req.old_filename
        new_name = req.new_filename

        if not old_name.endswith(".mp3"):
            return {"error": "Only renaming .mp3 files is supported directly"}
        if not new_name.endswith(".mp3"):
            new_name = new_name + ".mp3"

        # Move the main MP3 file
        supabase.storage.from_("audio_files").move(old_name, new_name)
        supabase.table("audio_cleanup").update({"filename": new_name}).eq("filename", old_name).execute()

        # Move subtitle if it exists
        old_vtt = old_name.replace(".mp3", ".vtt")
        new_vtt = new_name.replace(".mp3", ".vtt")
        try:
            supabase.storage.from_("audio_files").move(old_vtt, new_vtt)
            supabase.table("audio_cleanup").update({"filename": new_vtt}).eq("filename", old_vtt).execute()
        except Exception:
            pass

        return {"status": "success", "old_filename": old_name, "new_filename": new_name}
    except Exception as e:
        print("Error renaming file:", e)
        return {"error": str(e)}


@app.post("/bucket-files/delete")
async def delete_bucket_files(req: DeleteFilesRequest):
    try:
        if not req.filenames:
            return {"status": "success", "message": "No files specified"}
        
        # Prepare subtitles files as well
        all_files_to_delete = []
        for filename in req.filenames:
            all_files_to_delete.append(filename)
            if filename.endswith(".mp3"):
                all_files_to_delete.append(filename.replace(".mp3", ".vtt"))

        # Delete from Supabase storage bucket
        supabase.storage.from_("audio_files").remove(all_files_to_delete)

        # Also clean up from audio_cleanup table
        supabase.table("audio_cleanup").delete().in_("filename", all_files_to_delete).execute()

        return {"status": "deleted", "filenames": req.filenames}
    except Exception as e:
        print("Error deleting files:", e)
        return {"error": str(e)}



@app.post("/convert-url")
async def convert_url(url: str):
    try:
        from app.scraper.async_scraper import fetch_html
        from app.tts.tts import generate_tts
        from app.storage.storage import upload_audio
        from bs4 import BeautifulSoup

        # 1. Fetch raw HTML
        html = await fetch_html(url)
        if not html:
            return {"error": "Failed to fetch content from URL (empty response)"}

        # 2. Parse HTML
        soup = BeautifulSoup(html, "html.parser")

        # 3. Clean up non-content tags
        body = soup.body if soup.body else soup

        # Decompose script, style, noscript, iframe, svg, header, footer, nav
        for tag in body(["script", "style", "noscript", "iframe", "svg", "header", "footer", "nav"]):
            tag.decompose()

        # 4. Extract all text
        content = body.get_text(separator="\n\n", strip=True)
        if not content:
            return {"error": "No text content found on the page"}

        # 5. Get title
        title = soup.title.string.strip() if (soup.title and soup.title.string) else "Webpage Content"
        if len(title) > 100:
            title = title[:97] + "..."

        # 6. Generate audio & subtitles
        os.makedirs("output", exist_ok=True)
        temp_id = str(uuid.uuid4())[:8]
        output_file = f"output/single_{temp_id}.mp3"
        subtitles_file = f"output/single_{temp_id}.vtt"

        await generate_tts(content, output_file, subtitles_file)

        # Sanitize filename
        safe_title = re.sub(r'[\\/*?:"<>|]', '', title).strip()
        filename = f"{safe_title}({temp_id}).mp3"
        vtt_filename = f"{safe_title}({temp_id}).vtt"

        public_url = await asyncio.to_thread(upload_audio, output_file, filename)
        
        vtt_url = None
        if os.path.exists(subtitles_file):
            vtt_url = await asyncio.to_thread(upload_audio, subtitles_file, vtt_filename)

        if os.path.exists(output_file):
            os.remove(output_file)
        if os.path.exists(subtitles_file):
            os.remove(subtitles_file)

        if not public_url:
            return {"error": "Failed to upload audio to storage"}

        return {
            "status": "success",
            "title": title,
            "filename": filename,
            "url": public_url,
            "subtitle_url": vtt_url
        }
    except Exception as e:
        print("Error converting URL to speech:", e)
        return {"error": str(e)}


@app.post("/convert-doc")
async def convert_doc(file: UploadFile = File(...)):
    try:
        from app.tts.tts import generate_tts
        from app.storage.storage import upload_audio
        from io import BytesIO

        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()

        # 1. Read file content
        file_bytes = await file.read()
        if not file_bytes:
            return {"error": "Uploaded file is empty"}

        content = ""

        # 2. Parse based on file extension
        if ext == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(BytesIO(file_bytes))
                text_list = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_list.append(page_text)
                content = "\n\n".join(text_list)
            except Exception as pe:
                return {"error": f"Failed to parse PDF file: {str(pe)}"}

        elif ext == ".docx":
            try:
                import docx
                doc = docx.Document(BytesIO(file_bytes))
                text_list = []
                for paragraph in doc.paragraphs:
                    if paragraph.text:
                        text_list.append(paragraph.text)
                content = "\n\n".join(text_list)
            except Exception as de:
                return {"error": f"Failed to parse DOCX file: {str(de)}"}

        elif ext in [".txt", ".md"]:
            try:
                content = file_bytes.decode("utf-8", errors="ignore")
            except Exception as te:
                return {"error": f"Failed to parse text file: {str(te)}"}
        else:
            return {"error": f"Unsupported file extension '{ext}'. Only .pdf, .docx, .txt, and .md are supported."}

        content = content.strip()
        if not content:
            return {"error": "No text content could be extracted from the document."}

        # 3. Generate audio & subtitles
        os.makedirs("output", exist_ok=True)
        temp_id = str(uuid.uuid4())[:8]
        output_file = f"output/doc_{temp_id}.mp3"
        subtitles_file = f"output/doc_{temp_id}.vtt"

        await generate_tts(content, output_file, subtitles_file)

        # Get title (use base filename without extension)
        base_title = os.path.splitext(filename)[0]
        if len(base_title) > 100:
            base_title = base_title[:97] + "..."

        # Sanitize filename
        safe_title = re.sub(r'[\\/*?:"<>|]', '', base_title).strip()
        out_filename = f"{safe_title}({temp_id}).mp3"
        out_vtt_filename = f"{safe_title}({temp_id}).vtt"

        public_url = await asyncio.to_thread(upload_audio, output_file, out_filename)
        
        vtt_url = None
        if os.path.exists(subtitles_file):
            vtt_url = await asyncio.to_thread(upload_audio, subtitles_file, out_vtt_filename)

        if os.path.exists(output_file):
            os.remove(output_file)
        if os.path.exists(subtitles_file):
            os.remove(subtitles_file)

        if not public_url:
            return {"error": "Failed to upload audio to storage"}

        return {
            "status": "success",
            "title": base_title,
            "filename": out_filename,
            "url": public_url,
            "subtitle_url": vtt_url
        }
    except Exception as e:
        print("Error converting document to speech:", e)
        return {"error": str(e)}


@app.post("/convert-text")
async def convert_text(req: ConvertTextRequest):
    try:
        from app.tts.tts import generate_tts
        from app.storage.storage import upload_audio
        import uuid
        import os
        import re

        text = req.text.strip()
        title = req.title.strip()
        subtitle = req.subtitle.strip()

        if not text:
            return {"error": "Text content is empty"}

        os.makedirs("output", exist_ok=True)
        temp_id = str(uuid.uuid4())[:8]
        output_file = f"output/text_{temp_id}.mp3"
        subtitles_file = f"output/text_{temp_id}.vtt"

        await generate_tts(text, output_file, subtitles_file)

        # Sanitize filename
        safe_title = re.sub(r'[\\/*?:"<>|]', '', title).strip()
        out_filename = f"{safe_title}({temp_id}).mp3"
        out_vtt_filename = f"{safe_title}({temp_id}).vtt"

        public_url = await asyncio.to_thread(upload_audio, output_file, out_filename)
        
        vtt_url = None
        if os.path.exists(subtitles_file):
            vtt_url = await asyncio.to_thread(upload_audio, subtitles_file, out_vtt_filename)

        if os.path.exists(output_file):
            os.remove(output_file)
        if os.path.exists(subtitles_file):
            os.remove(subtitles_file)

        if not public_url:
            return {"error": "Failed to upload audio to storage"}

        return {
            "status": "success",
            "title": title,
            "filename": out_filename,
            "url": public_url,
            "subtitle_url": vtt_url
        }
    except Exception as e:
        print("Error converting text to speech:", e)
        return {"error": str(e)}


@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        from app.storage.storage import upload_audio
        import os

        # Save to temp file
        os.makedirs("output", exist_ok=True)
        filename = file.filename
        filepath = f"output/{filename}"

        with open(filepath, "wb") as f:
            f.write(await file.read())

        public_url = await asyncio.to_thread(upload_audio, filepath, filename)

        if os.path.exists(filepath):
            os.remove(filepath)

        if not public_url:
            return {"error": "Failed to upload file to storage"}

        return {
            "status": "success",
            "filename": filename,
            "url": public_url
        }
    except Exception as e:
        print("Error uploading file:", e)
        return {"error": str(e)}

# Mount static files at root level at the end so it serves assets, favicon, etc.
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="dist")

