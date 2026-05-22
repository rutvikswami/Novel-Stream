from datetime import datetime,timedelta
from app.storage.storage import supabase

cutoff = datetime.utcnow() - timedelta(hours=24)


rows = supabase.table(
    "audio_cleanup"
).select("*").lt(
    "created_at",
    cutoff.isoformat()
).execute()

for row in rows.data:
    filename = row["filename"]
    try:
        supabase.storage.from_(
            "audio-files"
        ).remove([filename])
        supabase.table(
            "audio_cleanup"
        ).delete().eq(
            "id",
            row["id"]
        ).execute()
        print(f"Deleted: {filename}")
    except Exception as e:
        print("Delete failed:", e)