import aiohttp
from bs4 import BeautifulSoup
import re

async def fetch_chapter(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            html = await response.text()

    soap = BeautifulSoup(html, "html.parser")

    chapter_div = soap.find(
        "div",
        class_="chapter-content"
    )
    if not chapter_div:
        return {
            "error": "Chapter content not found"
        }
    for s in chapter_div.find_all("script"):
        s.decompose()
    
    paragraphs = chapter_div.find_all('p')
    clean_text = []
    for p in paragraphs:
        text = p.get_text(strip=True)

        if text:
            clean_text.append(text)
    final_text = "\n\n".join(clean_text)
    title = soap.title.string if soap.title else "No title"
    return {
        "title": title,
        "content": final_text
    }

async def detect_template(
    url: str,
    current_chapter: int
):
    current = str(current_chapter)
    matches = list(
        re.finditer(
            re.escape(current),
            url
        )
    )

    for m in matches:
        s,e = m.span()
        print(m,s,e)

        test_url = (
            url[:s] + str(current_chapter + 1) + url[e:]
        )

        try:
            data = await fetch_chapter(test_url)
            if (
                data and data.get("content") and len(data["content"]) > 300
            ):
                template = (
                    url[:s] + "{}" + url[e:]
                )
                return template
        except:
            pass
    return None
