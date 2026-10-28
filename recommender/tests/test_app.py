import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import create_app


class FakeModel:
    """Deterministic stand-in for the sentence-transformers model."""

    def encode(self, texts, normalize_embeddings, **_):
        v = np.array([[len(t), t.count(" ") + 1, 1.0] for t in texts], dtype=np.float32)
        return v / np.linalg.norm(v, axis=1, keepdims=True) if normalize_embeddings else v


@pytest.fixture
def client():
    with TestClient(create_app(FakeModel())) as c:
        yield c


def test_health(client):
    assert client.get("/health").json()["status"] == "UP"


def test_embed_returns_one_unit_vector_per_text(client):
    body = client.post("/embed", json={"texts": ["a book about dragons", "space"]}).json()
    vectors = np.array(body["vectors"])
    assert body["dimension"] == 3
    assert vectors.shape == (2, 3)
    assert np.allclose(np.linalg.norm(vectors, axis=1), 1)


@pytest.mark.parametrize("texts", [[], [""], ["x" * 4001]])
def test_embed_rejects_invalid_input(client, texts):
    assert client.post("/embed", json={"texts": texts}).status_code == 422
