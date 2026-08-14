import asyncio
from app.tts.tts import generate_tts
from app.scraper.async_scraper import (
    fetch_chapter,
    detect_template,
    detect_selector
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
    queue: asyncio.Queue,
    selector: dict = None
):

    template = await detect_template(
        url,
        current_chapter
    )
    if not template:
        current = str(current_chapter)
        if current in url:
            template = url.replace(current, "{}", 1)
        else:
            template = url

    for i in range(start, end + 1):

        # STOP SUPPORT
        if jobs[job_id]["stopped"]:
            break



        chapter_url = template.format(i) if "{}" in template else template

        data = None
        for attempt in range(3):
            try:
                data = await fetch_chapter(chapter_url, selector=selector)
                if data and "error" not in data:
                    break
                await asyncio.sleep(1)
            except Exception as e:
                print(f"Attempt {attempt+1} failed to fetch {chapter_url}: {e}")
                await asyncio.sleep(1)

        if not data or "error" in data:
            err_msg = data.get("error", "Unknown error") if data else "Network error"
            data = {
                "title": f"Chapter {i} (Fetch Error)",
                "content": f"Failed to fetch content for chapter {i}. Error: {err_msg}"
            }

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
        subtitles_file = f"output/{i}.vtt"

        jobs[job_id]["current_tts"] = i

        try:

            await generate_tts(
                data["content"],
                output_file,
                subtitles_file
            )

            # Get title and sanitize it
            chapter_title = data.get("title", f"Chapter {i}").strip()
            safe_title = re.sub(r'[\\/*?:"<>|]', '', chapter_title).strip()
            filename = f"{safe_title}({i}).mp3"
            vtt_filename = f"{safe_title}({i}).vtt"

            public_url = upload_audio(
                output_file,
                filename
            )

            vtt_url = None
            if os.path.exists(subtitles_file):
                vtt_url = upload_audio(
                    subtitles_file,
                    vtt_filename
                )

            if public_url:
                jobs[job_id]["completed"].append(i)
                jobs[job_id]["audio_files"][i] = public_url
                if vtt_url:
                    jobs[job_id]["subtitles_files"][i] = vtt_url
            else:
                print(f"Skipping chapter {i} from list due to upload failure.")

        except Exception as e:

            print(
                f"Error processing chapter {i}:",
                e
            )

        finally:

            if os.path.exists(output_file):
                os.remove(output_file)
            if os.path.exists(subtitles_file):
                os.remove(subtitles_file)


async def run_pipeline(
    job_id: str,
    url: str,
    current_chapter: int,
    start: int,
    end: int
):

    os.makedirs("output", exist_ok=True)

    jobs[job_id] = {
        "status": "running",
        "completed": [],
        "current_tts": None,
        "audio_files": {},
        "subtitles_files": {},
        "total": end - start + 1,
        "paused": False,
        "stopped": False
    }

    queue = asyncio.Queue()

    # Detect selector once at start of pipeline
    selector = None
    try:
        selector = await detect_selector(url)
        print(f"Detected content selector for job {job_id}: {selector}")
    except Exception as e:
        print(f"Failed to detect selector: {e}")

    try:

        await asyncio.gather(
            producer(
                job_id,
                url,
                current_chapter,
                start,
                end,
                queue,
                selector
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