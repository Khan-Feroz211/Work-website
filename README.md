# ADRAK Digital

ADRAK Digital marketing website and embedded AI chatbot powered by Groq.

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env`
   - Add your Groq API key in `.env`
3. Run app:
   - `npm start`
4. Open:
   - `http://localhost:3000`

## Tech

- Node.js + Express
- Single-file frontend (`public/index.html`)
- Groq model: `llama-3.3-70b-versatile`
- Railway support via `nixpacks.toml` and `Procfile`
