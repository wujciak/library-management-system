"""Builds the demo catalogue as a Liquibase changeset.

    python3 scripts/fetch_catalogue.py

Titles, authors, years and genres come from scripts/catalogue.csv, with a fallback summary
for books whose Open Library description is missing or not in English. For each book Open Library
(data under CC0) supplies an English edition with an ISBN-13, its publisher and cover, and the
English description of the work. The output, backend/src/main/resources/db/changelog/
004-catalogue.sql, is committed: the app never calls Open Library at runtime except for covers.
Responses are cached in scripts/.cache, so a rerun after editing the CSV is fast.
"""

import csv
import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "backend/src/main/resources/db/changelog/004-catalogue.sql"
CACHE = ROOT / ".cache"
API = "https://openlibrary.org"
JUNK_PUBLISHER = re.compile(r"\[|unknown|not identified|createspace|independently|lulu", re.I)
ENGLISH_WORDS = {"the", "and", "of", "a", "to", "in", "is", "his", "her", "with", "that", "for"}


def get(path: str, **params) -> dict:
    url = f"{API}{path}?{urllib.parse.urlencode(params)}" if params else f"{API}{path}"
    cached = CACHE / (hashlib.sha1(url.encode()).hexdigest() + ".json")
    if cached.exists():
        return json.loads(cached.read_text())
    req = urllib.request.Request(url, headers={"User-Agent": "library-management-system demo data"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            CACHE.mkdir(exist_ok=True)
            cached.write_text(json.dumps(data))
            return data
        except OSError:
            time.sleep(2 * (attempt + 1))
    return {}


def english(text: str) -> bool:
    words = re.findall(r"[a-z]+", text.lower())
    return len(words) > 20 and sum(w in ENGLISH_WORDS for w in words) / len(words) > 0.08


def clean(text) -> str:
    if isinstance(text, dict):
        text = text.get("value", "")
    source_notes = r"\n-{3,}|\(\[source\]|\[source\]|\(source:|Contains:"
    text = re.split(source_notes, text or "", flags=re.I)[0]
    text = html.unescape(re.sub(r"<[^>]+>", "", text))
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)  # markdown links
    text = re.sub(r"[*_]{1,2}([^*_]+)[*_]{1,2}", r"\1", text)  # markdown emphasis
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 900:
        cut = text[:900]
        text = cut[: cut.rfind(". ") + 1] or cut
    return text


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def work(title: str, author: str) -> dict | None:
    """The work with the most editions whose title starts like ours; by author surname first,
    then by title alone, since transliterated names (Dostoevsky, Dostoyevsky) often miss."""
    surname = author.split(",")[0].split()[-1]
    for params in ({"title": title, "author": surname}, {"title": title}):
        fields = "key,title,edition_count"
        docs = get("/search.json", **params, limit=20, fields=fields).get("docs", [])
        docs = [d for d in docs if norm(d["title"]).startswith(norm(title)[:12])]
        if docs:
            return max(docs, key=lambda d: d.get("edition_count", 0))
    return None


def isbn13(e: dict) -> str | None:
    return next((i for i in e.get("isbn_13", []) if re.fullmatch(r"97[89]\d{10}", i)), None)


def is_english(e: dict) -> bool:
    """Marked English, or unmarked with an ISBN from the English-language groups (978-0, 978-1)."""
    languages = [x["key"] for x in e.get("languages", [])]
    return languages == ["/languages/eng"] or (not languages and isbn13(e)[:4] in ("9780", "9781"))


def has_cover(e: dict) -> bool:
    return bool(e.get("covers")) and e["covers"][0] > 0


def has_real_publisher(e: dict) -> bool:
    return any(not JUNK_PUBLISHER.search(p) for p in e["publishers"])


def edition(work_key: str) -> dict | None:
    """An edition with an ISBN-13 and a publisher: preferably English, with a cover and a real
    publisher name, relaxing one requirement at a time. The work's cover fills in a missing one."""
    entries = [e for e in get(f"{work_key}/editions.json", limit=500).get("entries", [])
               if isbn13(e) and e.get("publishers")]
    for keep in ((is_english, has_cover, has_real_publisher), (is_english, has_cover),
                 (is_english, has_real_publisher), (is_english,)):
        e = next((e for e in entries if all(f(e) for f in keep)), None)
        if e:
            break
    else:
        return None
    covers = e.get("covers") or get(f"{work_key}.json").get("covers") or [0]
    publishers = e["publishers"]
    publisher = next((p for p in publishers if not JUNK_PUBLISHER.search(p)), publishers[0])
    return {"isbn": isbn13(e), "publisher": publisher.strip(" ,;:"),
            "cover": covers[0] if covers[0] > 0 else None,
            "description": clean(e.get("description"))}


def books() -> list[dict]:
    rows = list(csv.DictReader((ROOT / "catalogue.csv").open(encoding="utf-8")))
    out, missing = [], []
    for row in rows:
        w = work(row["title"], row["author"])
        ed = edition(w["key"]) if w else None
        if not ed:
            missing.append(f"{row['title']} (no edition)")
            continue
        summary = clean(get(f"{w['key']}.json").get("description"))
        if not english(summary):
            summary = ed["description"] if english(ed["description"]) else row.get("summary", "")
        if not summary:
            missing.append(f"{row['title']} (no English description)")
            continue
        cover = f"https://covers.openlibrary.org/b/id/{ed['cover']}-M.jpg" if ed["cover"] else None
        out.append({
            "isbn": ed["isbn"], "title": row["title"], "author": row["author"],
            "publisher": ed["publisher"][:255], "year": int(row["year"]), "genre": row["genre"],
            "summary": summary, "cover": cover,
            # stable pseudo-random stock of 0-4 copies, mostly available
            "copies": [0, 1, 1, 2, 2, 3, 4][hashlib.md5(ed["isbn"].encode()).digest()[0] % 7],
        })
    print(f"{len(out)} of {len(rows)} books; skipped:", *missing, sep="\n  ")
    return out


def sql(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def main() -> None:
    rows = books()
    cols = ("isbn", "title", "author", "publisher", "year", "copies", "genre", "summary", "cover")
    values = ",\n".join("    (" + ", ".join(sql(b[c]) for c in cols) + ")" for b in rows)
    OUT.write_text(
        "--liquibase formatted sql\n\n"
        "-- Generated by scripts/fetch_catalogue.py from scripts/catalogue.csv and Open Library"
        " (CC0).\n"
        "--changeset wujciak:004-catalogue\n"
        "INSERT INTO books (isbn, title, author, publisher, publication_year, available_copies,"
        " genre, summary, cover_url) VALUES\n" + values + ";\n",
        encoding="utf-8",
    )
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()
