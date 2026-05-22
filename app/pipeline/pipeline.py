import asyncio
from app.tts.tts import generate_tts
from app.scraper.async_scraper import fetch_chapter, detect_template
from app.state.jobs import jobs
from app.storage.storage import upload_audio
import os

queue = asyncio.Queue()

async def producer(
    url: str,
    current_chapter: int,
    start: int,
    end: int
):
    template = await detect_template(
        url, current_chapter
    )
    for i in range(start, end + 1):
        chapter_url = template.format(i)


        data = await fetch_chapter(chapter_url)

        await queue.put(
            {
                "chapter": i,
                "data": data
            }
        )

    await queue.put(None)

async def consumer(job_id: str):
    while True:
        item = await queue.get()
        if item is None:
            break
        i = item["chapter"]
        data = item["data"]
        output_file = f"output/{i}.mp3"
        jobs[job_id]["current_tts"] = i
        try:
            await generate_tts(
                data["content"],
                output_file
            )
            public_url = upload_audio(
                output_file,
                f"{i}.mp3"
            )
            jobs[job_id]["completed"].append(i)
            jobs[job_id]["audio_files"][i] = (public_url)
        except Exception as e:
            print(f"Error processing chapter {i}:", e)

        finally:

            if os.path.exists(output_file):
                os.remove(output_file)

async def run_pipeline(
    job_id: str,
    base_url: str,
    current_chapter: int,
    start: int,
    end: int
):
    jobs[job_id] = {
        "status": "running",
        "completed": [],
        "current_tts": None,
        "audio_files": {},
        "total": end - start + 1
    }
    await asyncio.gather(producer(base_url,current_chapter,start,end),consumer(job_id))
    jobs[job_id]["status"] = "completed"