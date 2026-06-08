import aiohttp
from bs4 import BeautifulSoup
import re

async def fetch_chapter(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            html = await response.text()

    soap = BeautifulSoup(html, "html.parser")

    # Decompose script, style, noscript, and iframe elements first to avoid noise
    for tag in soap(["script", "style", "noscript", "iframe"]):
        tag.decompose()

    best_element = None
    best_score = -999999

    # Candidates are typically div, article, section, or main elements
    candidates = []
    for tag_name in ["div", "article", "section", "main"]:
        for element in soap.find_all(tag_name):
            text = element.get_text(strip=True)
            length = len(text)
            
            # Skip/ignore very short elements as candidates
            if length < 200:
                continue

            score = 0

            # 1. Text length scoring
            if length > 1000:
                score += 5
            if length > 2000:
                score += 10
            if length > 5000:
                score += 15
            if length > 10000:
                score += 20

            # 2. Tag name scoring
            if tag_name == "article":
                score += 5

            # 3. Class and ID scoring
            classes = element.get("class") or []
            if isinstance(classes, str):
                classes = [classes]
            class_id_str = " ".join(classes).lower() + " " + (element.get("id") or "").lower()

            # Boost for explicit chapter-content wrapper to remain backwards-compatible
            if any(term in class_id_str for term in ["chapter-content", "chapter_content", "chaptercontent"]):
                score += 50

            positive_keywords = ["chapter", "content", "novel", "text", "story", "read", "book", "entry", "post", "main-content", "body"]
            negative_keywords = ["comment", "footer", "header", "nav", "sidebar", "menu", "author", "recommend", "related", "ad", "social", "share", "widget", "meta", "reply", "list", "aside"]

            for word in positive_keywords:
                if word in class_id_str:
                    score += 5
            for word in negative_keywords:
                if word in class_id_str:
                    score -= 10

            # 4. Paragraph count scoring
            p_count = len(element.find_all("p"))
            if p_count > 5:
                score += 5
            if p_count > 10:
                score += 10
            if p_count > 20:
                score += 15

            # 5. Link density penalty
            links = element.find_all("a")
            link_text_len = sum(len(a.get_text(strip=True)) for a in links)
            link_density = link_text_len / length if length > 0 else 0
            if link_density > 0.2:
                score -= 15
            if link_density > 0.5:
                score -= 30

            candidates.append((element, score))

    # To prefer specific nested child candidates over broad parent wrapper candidates:
    # If candidate A contains candidate B, and candidate B's score is at least 80% of candidate A's score,
    # then candidate A is likely a parent wrapper, so we penalize it.
    for i in range(len(candidates)):
        elem_a, score_a = candidates[i]
        for j in range(len(candidates)):
            if i == j:
                continue
            elem_b, score_b = candidates[j]
            # Check if elem_a is an ancestor of elem_b
            parent = elem_b.parent
            is_descendant = False
            while parent:
                if parent == elem_a:
                    is_descendant = True
                    break
                parent = parent.parent
            if is_descendant:
                if score_b >= score_a * 0.8:
                    # Penalize parent wrapper
                    score_a -= 10
                    candidates[i] = (elem_a, score_a)
                    break

    # Find candidate with the highest score
    for element, score in candidates:
        if score > best_score:
            best_score = score
            best_element = element

    if not best_element or best_score < 0:
        return {
            "error": "Chapter content not found"
        }

    # Clean up any child elements inside best_element that represent comments, ads, footers, etc.
    for child in best_element.find_all(["div", "p", "span", "section"]):
        classes = child.get("class") or []
        if isinstance(classes, str):
            classes = [classes]
        class_id_str = " ".join(classes).lower() + " " + (child.get("id") or "").lower()
        negative_keywords = ["comment", "footer", "header", "nav", "sidebar", "menu", "author", "recommend", "related", "ad", "social", "share", "widget", "meta", "reply", "list", "aside"]
        if any(word in class_id_str for word in negative_keywords):
            child.decompose()

    # Extract text from paragraphs if available
    paragraphs = best_element.find_all('p')
    if len(paragraphs) >= 3:
        clean_text = []
        for p in paragraphs:
            text = p.get_text(strip=True)
            if text:
                clean_text.append(text)
        final_text = "\n\n".join(clean_text)
    else:
        # Fallback for sites with text directly in the div or separated by <br> tags
        elem_copy = BeautifulSoup(str(best_element), "html.parser")
        for br in elem_copy.find_all("br"):
            br.replace_with("\n")
        for p in elem_copy.find_all("p"):
            p.insert_before("\n")
            p.insert_after("\n")
        raw_text = elem_copy.get_text()
        lines = [line.strip() for line in raw_text.splitlines()]
        clean_text = []
        for line in lines:
            if line:
                clean_text.append(line)
        final_text = "\n\n".join(clean_text)

    title = soap.title.string if soap.title else "No title"
    return {
        "title": title.strip() if title else "No title",
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
