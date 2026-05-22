from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def upload_audio(filepath: str, filename: str):
    try:
        with open(filepath, "rb") as f:

            response = supabase.storage.from_(
                "audio-files"
            ).upload(
                path=filename,
                file=f,
                file_options={
                    "content-type": "audio/mpeg",
                    "upsert": "true"
                }
            )
        
        supabase.table(
            "audio_cleanup"
        ).insert({
            "filename": filename
        }).execute()

        public_url = supabase.storage.from_(
            "audio-files"
        ).get_public_url(filename)

        print("Upload success:", response)

        return public_url

    except Exception as e:
        print("Upload error:", e)
        return None