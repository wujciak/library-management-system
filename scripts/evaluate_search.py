"""Measures semantic search against a keyword baseline on scripts/search_queries.csv.

    docker compose up -d && python3 scripts/evaluate_search.py

Each query describes one book in other words than its description, in English or Polish. The
semantic search is the running API (GET /api/books/search); the baseline is TF-IDF cosine
similarity over the same title, author, genre and description texts. Reports hit@1, hit@5 and the
mean reciprocal rank (MRR, over the top 10) per language.
"""

import csv
import json
import math
import re
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

API = "http://localhost:8080"
QUERIES = Path(__file__).resolve().parent / "search_queries.csv"
K = 10


def call(path: str, token: str | None = None, body: dict | None = None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"})
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def words(text: str) -> list[str]:
    return [w for w in re.findall(r"\w+", text.lower()) if len(w) > 2]


class TfIdf:
    def __init__(self, docs: dict[str, str]):
        self.tf = {title: Counter(words(text)) for title, text in docs.items()}
        df = Counter(w for tf in self.tf.values() for w in tf)
        self.idf = {w: math.log(len(docs) / n) for w, n in df.items()}
        self.vecs = {t: self.vector(tf) for t, tf in self.tf.items()}

    def vector(self, tf: Counter) -> dict[str, float]:
        v = {w: c * self.idf.get(w, 0) for w, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1
        return {w: x / norm for w, x in v.items()}

    def search(self, query: str) -> list[str]:
        q = self.vector(Counter(words(query)))
        scores = {t: sum(x * v.get(w, 0) for w, x in q.items()) for t, v in self.vecs.items()}
        return [t for t, s in sorted(scores.items(), key=lambda e: -e[1])[:K] if s > 0]


def metrics(ranks: list[int | None]) -> str:
    n = len(ranks)
    hit1 = sum(r == 1 for r in ranks) / n
    hit5 = sum(r is not None and r <= 5 for r in ranks) / n
    mrr = sum(1 / r for r in ranks if r) / n
    return f"{hit1:6.2f} {hit5:6.2f} {mrr:6.2f}"


def main() -> None:
    token = call("/api/auth/login", body={"username": "reader", "password": "reader123"})["token"]
    books = call("/api/books?size=100", token)
    catalogue = list(books["content"])
    for page in range(1, books["totalPages"]):
        catalogue += call(f"/api/books?size=100&page={page}", token)["content"]
    baseline = TfIdf({b["title"]: ". ".join(filter(None, (b["title"], "by " + b["author"],
                                                          b["genre"], b["summary"])))
                      for b in catalogue})

    rows = list(csv.DictReader(QUERIES.open(encoding="utf-8")))
    ranks: dict[tuple[str, str], list] = {}
    print(f"{'query':58s} {'semantic':>8s} {'tf-idf':>7s}")
    for row in rows:
        semantic = [r["book"]["title"] for r in call(
            "/api/books/search?" + urllib.parse.urlencode({"q": row["query"], "limit": K}), token)]
        keyword = baseline.search(row["query"])
        found = []
        for name, ranking in (("semantic", semantic), ("tf-idf", keyword)):
            rank = ranking.index(row["expected"]) + 1 if row["expected"] in ranking else None
            ranks.setdefault((name, row["language"]), []).append(rank)
            ranks.setdefault((name, "all"), []).append(rank)
            found.append(str(rank or "-"))
        print(f"{row['query'][:58]:58s} {found[0]:>8s} {found[1]:>7s}")

    print(f"\n{len(catalogue)} books, {len(rows)} queries\n")
    print(f"{'method':10s} {'queries':8s} {'hit@1':>6s} {'hit@5':>6s} {'MRR':>6s}")
    for name in ("semantic", "tf-idf"):
        for lang in ("en", "pl", "all"):
            print(f"{name:10s} {lang:8s} {metrics(ranks[(name, lang)])}")


if __name__ == "__main__":
    main()
