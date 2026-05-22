import edge_tts
import asyncio


async def generate_tts(text: str, output_file: str):

    communicate = edge_tts.Communicate(
        text,
        voice="en-US-AriaNeural"
    )

    await communicate.save(output_file)