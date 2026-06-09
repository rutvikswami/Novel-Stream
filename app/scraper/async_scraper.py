from bs4 import BeautifulSoup
import re
import asyncio
import nodriver as uc
import aiohttp

def detect_content_selector(html: str):
    soap = BeautifulSoup(html, "html.parser")
    
    # Decompose script, style, noscript, and iframe elements first to avoid noise
    for tag in soap(["script", "style", "noscript", "iframe"]):
        tag.decompose()

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

            class_words = set(re.findall(r'[a-zA-Z0-9]+', class_id_str))

            positive_keywords = {"chapter", "content", "novel", "text", "txt", "story", "read", "reader", "reading", "book", "entry", "post", "body"}
            negative_keywords = {"comment", "comments", "footer", "header", "nav", "sidebar", "menu", "author", "recommend", "recommended", "related", "ad", "ads", "advertisement", "social", "share", "widget", "meta", "reply", "list", "aside"}

            for word in positive_keywords:
                if word in class_words:
                    score += 5
            for word in negative_keywords:
                if word in class_words:
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
    best_element = None
    best_score = -999999
    for element, score in candidates:
        if score > best_score:
            best_score = score
            best_element = element

    if not best_element or best_score < 0:
        return None

    # Construct the selector dictionary
    selector = {"tag": best_element.name}
    elem_id = best_element.get("id")
    if elem_id:
        selector["id"] = elem_id
    else:
        classes = best_element.get("class")
        if classes:
            if isinstance(classes, str):
                classes = [classes]
            selector["class"] = classes
            
    return selector

async def fetch_html(url: str) -> str:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    if "Enable JavaScript and cookies to continue" not in html and "cf-challenge" not in html:
                        print("Successfully fetched without uc:", url)
                        return html
    except Exception as e:
        print("Failed to fetch without uc, falling back to uc:", e)

    browser = await uc.start()
    try:
        page = await browser.get(url)
        await asyncio.sleep(5)
        html = await page.get_content()
    finally:
        await browser.stop()
        
    if "Enable JavaScript and cookies to continue" in html or "cf-challenge" in html:
        raise Exception("Failed to bypass Cloudflare challenge (Enable JavaScript and cookies to continue)")

    return html

async def detect_selector(url: str):
    html = await fetch_html(url)
    return detect_content_selector(html)

async def fetch_chapter(url: str, selector: dict = None):
    html = await fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    best_element = None

    if selector:
        tag_name = selector.get("tag", "div")
        if "id" in selector:
            best_element = soup.find(tag_name, id=selector["id"])
        elif "class" in selector:
            target_classes = selector["class"]
            if isinstance(target_classes, str):
                target_classes = [target_classes]
            # Find elements matching all classes in selector['class']
            for elem in soup.find_all(tag_name):
                elem_classes = elem.get("class") or []
                if isinstance(elem_classes, str):
                    elem_classes = [elem_classes]
                if all(c in elem_classes for c in target_classes):
                    best_element = elem
                    break
        else:
            best_element = soup.find(tag_name)

    # Fallback to heuristics if selector wasn't provided or not found
    if not best_element:
        detected_sel = detect_content_selector(html)
        if detected_sel:
            tag_name = detected_sel.get("tag", "div")
            if "id" in detected_sel:
                best_element = soup.find(tag_name, id=detected_sel["id"])
            elif "class" in detected_sel:
                target_classes = detected_sel["class"]
                for elem in soup.find_all(tag_name):
                    elem_classes = elem.get("class") or []
                    if all(c in elem_classes for c in target_classes):
                        best_element = elem
                        break
            else:
                best_element = soup.find(tag_name)

    if not best_element:
        return {
            "error": "Chapter content not found"
        }

    # remove scripts
    for tag in best_element.find_all(["script", "style"]):
        tag.decompose()

    paragraphs = []

    for p in best_element.find_all("p"):
        text = p.get_text(" ", strip=True)

        if not text:
            continue

        if "Visit and read more novel" in text:
            continue

        paragraphs.append(text)

    novel_title = soup.select_one("h1.tit")
    chapter_title = soup.select_one("span.chapter")
    
    chapter_title_text = chapter_title.get_text(strip=True) if chapter_title else ""
    title_val = chapter_title_text if chapter_title_text else (soup.title.string.strip() if (soup.title and soup.title.string) else "No title")

    return {
        "title": title_val,
        "novel": novel_title.get_text(strip=True) if novel_title else "",
        "chapter": chapter_title_text,
        "content": "\n\n".join(paragraphs)
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
