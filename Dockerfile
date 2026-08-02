# Art In Glass API — Render / production image
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Render injects PORT; default for local docker runs
ENV PORT=8000
# Fallbacks if Dashboard env is empty (overridden by real Render env when set)
ENV ENVIRONMENT=production
ENV DATABASE_NAME=resin_art_db
ENV PUBLIC_BASE_URL=https://art-in-glass.onrender.com
ENV CORS_ORIGINS=*
ENV MONGODB_URI=mongodb+srv://saurabhsonmale01_db_user:tsYpWrUvNMkJ0Rtd@resin-art-db.bnbn7tk.mongodb.net/resin_art_db?retryWrites=true&w=majority
ENV JWT_SECRET_KEY=195c9c1887a0744f65f063e6bd4e54451eb5d9a83ff0b8becb5df9b6fcbb2f2c
EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
