import edge_tts
import asyncio


async def generate_tts(text: str, output_file: str, subtitles_file: str = None):

    communicate = edge_tts.Communicate(
        text,
        voice="en-US-AriaNeural"
    )

    if subtitles_file:
        submaker = edge_tts.SubMaker()
        with open(output_file, "wb") as file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    file.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    submaker.feed(chunk)
        
        with open(subtitles_file, "w", encoding="utf-8") as file:
            file.write(submaker.get_vtt())
    else:
        await communicate.save(output_file)