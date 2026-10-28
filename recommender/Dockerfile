FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /bin/uv
RUN useradd --system --create-home recommender
WORKDIR /app
RUN chown recommender /app
USER recommender
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_NO_CACHE=1 HF_HOME=/app/hf
COPY --chown=recommender pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY --chown=recommender app.py ./
# bake the model into the image, so the container starts without network access
RUN .venv/bin/python -c "from app import load_model; load_model()"
ENV HF_HUB_OFFLINE=1
EXPOSE 8000
CMD [".venv/bin/uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
