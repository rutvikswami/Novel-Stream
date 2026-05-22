import asyncio

from app.scraper.async_scraper import fetch_chapter

async def scrape_concurrent(
    base_url: str,
    start: int,
    end: int
):
    tasks = []
    for i in range(start, end + 1):
        url = f"{base_url}_{i}.html"
        task = fetch_chapter(url)
        tasks.append(task)
    results = await asyncio.gather(*tasks)
    return results