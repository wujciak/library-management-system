"""Embedding service: turns book descriptions and search queries into vectors.

    uv run uvicorn app:app --port 8000

The library backend stores the vectors and does the ranking; this service only runs the model.
The model is multilingual, so a query in Polish finds books described in English.
"""

import os
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field, StringConstraints

MODEL_NAME = os.environ.get(
    "MODEL_NAME", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

Text = Annotated[str, StringConstraints(min_length=1, max_length=4000)]


class EmbedRequest(BaseModel):
    texts: list[Text] = Field(min_length=1, max_length=256)


class EmbedResponse(BaseModel):
    model: str
    dimension: int
    vectors: list[list[float]]


def load_model(name: str = MODEL_NAME):
    from sentence_transformers import SentenceTransformer  # heavy import, only when serving

    return SentenceTransformer(name, device="cpu")


def create_app(model=None) -> FastAPI:
    """`model` is anything with a sentence-transformers style `encode`; tests pass a fake."""

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.model = model or load_model()
        yield

    app = FastAPI(title="Library recommender", lifespan=lifespan)

    @app.get("/health")
    def health() -> dict:
        return {"status": "UP", "model": MODEL_NAME}

    @app.post("/embed")
    def embed(body: EmbedRequest, request: Request) -> EmbedResponse:
        # unit-length vectors, so the backend can rank by a plain dot product
        vectors = request.app.state.model.encode(
            body.texts, batch_size=32, normalize_embeddings=True, convert_to_numpy=True
        )
        return EmbedResponse(model=MODEL_NAME, dimension=vectors.shape[1], vectors=vectors.tolist())

    return app


app = create_app()
