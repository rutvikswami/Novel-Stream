import asyncio
from app.tts.tts import generate_tts
from app.scraper.async_scraper import (
    fetch_chapter,
    detect_template
)
from app.state.jobs import jobs
from app.storage.storage import upload_audio
import os
import re



async def producer(
    job_id: str,
    url: str,
    current_chapter: int,
    start: int,
    end: int,
    queue: asyncio.Queue
):

    template = await detect_template(
        url,
        current_chapter
    )

    for i in range(start, end + 1):

        # STOP SUPPORT
        if jobs[job_id]["stopped"]:
            break

        # PAUSE SUPPORT
        while jobs[job_id]["paused"]:
            await asyncio.sleep(1)

        chapter_url = template.format(i)

        data = await fetch_chapter(
            chapter_url
        )

        await queue.put({
            "chapter": i,
            "data": data
        })

    await queue.put(None)


async def consumer(job_id: str, queue: asyncio.Queue):

    while True:

        item = await queue.get()

        if item is None:
            break

        # STOP SUPPORT
        if jobs[job_id]["stopped"]:
            break

        # PAUSE SUPPORT
        while jobs[job_id]["paused"]:
            await asyncio.sleep(1)

        i = item["chapter"]

        data = item["data"]

        output_file = f"output/{i}.mp3"

        jobs[job_id]["current_tts"] = i

        try:

            await generate_tts(
                data["content"],
                output_file
            )

            # Get title and sanitize it
            chapter_title = data.get("title", f"Chapter {i}").strip()
            safe_title = re.sub(r'[\\/*?:"<>|]', '', chapter_title).strip()
            filename = f"{safe_title}({i}).mp3"

            public_url = upload_audio(
                output_file,
                filename
            )

            jobs[job_id]["completed"].append(i)

            jobs[job_id]["audio_files"][i] = public_url

        except Exception as e:

            print(
                f"Error processing chapter {i}:",
                e
            )

        finally:

            if os.path.exists(output_file):
                os.remove(output_file)


async def run_pipeline(
    job_id: str,
    url: str,
    current_chapter: int,
    start: int,
    end: int
):


    jobs[job_id] = {
        "status": "running",
        "completed": [],
        "current_tts": None,
        "audio_files": {},
        "total": end - start + 1,
        "paused": False,
        "stopped": False
    }

    queue = asyncio.Queue(maxsize=1)

    try:

        await asyncio.gather(
            producer(
                job_id,
                url,
                current_chapter,
                start,
                end,
                queue
            ),
            consumer(job_id, queue)
        )

        if jobs[job_id]["stopped"]:
            jobs[job_id]["status"] = "stopped"

        else:
            jobs[job_id]["status"] = "completed"

    except Exception as e:

        print("PIPELINE ERROR:", e)

        jobs[job_id]["status"] = "failed"

        jobs[job_id]["error"] = str(e)