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


def upload_audio(filepath: str, filename: str, content_type: str = None):
    try:
        if not content_type:
            if filename.endswith(".vtt"):
                content_type = "text/vtt"
            else:
                content_type = "audio/mpeg"

        with open(filepath, "rb") as f:

            response = supabase.storage.from_(
                "audio_files"
            ).upload(
                path=filename,
                file=f,
                file_options={
                    "content-type": content_type,
                    "upsert": "true"
                }
            )
        
        supabase.table(
            "audio_cleanup"
        ).insert({
            "filename": filename
        }).execute()

        public_url = supabase.storage.from_(
            "audio_files"
        ).get_public_url(filename)

        print("Upload success:", response)

        return public_url

    except Exception as e:
        print("Upload error:", e)
        return None
