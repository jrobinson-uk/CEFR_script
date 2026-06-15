# CEFR Vocabulary Analyser

Analyses definition text and flags words above a given CEFR level threshold. Built for the UK computing education glossary project.

## How it works

The Python API wraps the `cefrpy` library, which looks up each word's CEFR level from a reference dataset. No AI is involved — results are fully deterministic.

Each call to `/analyse` returns:
- **`compliance_pct`** — percentage of scored words within the target level
- **`flagged_words`** — words above the threshold, with their levels
- **`ceiling_level`** — the highest level word found

Words not in the cefrpy dataset (domain terms, proper nouns, etc.) are excluded from scoring automatically.

---

## Deploying to Render

1. Push this repo to GitHub (public).
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. Click **New → Web Service** and select this repo.
4. Render will detect `render.yaml` and configure everything automatically.
5. Click **Deploy**. The first deploy takes 2–3 minutes.
6. Copy the URL Render gives you (e.g. `https://cefr-analyser.onrender.com`).

> **Note:** The free Render tier spins down after 15 minutes of inactivity. The first request after a period of inactivity may take 30–60 seconds to respond while the service starts up. Subsequent requests are fast.

---

## Connecting to Google Sheets

1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Paste the contents of `sheets/cefr_functions.gs` into the editor.
4. Replace `https://your-service.onrender.com` with your Render URL.
5. Click **Save**, then close the Apps Script editor.

You can now use these custom functions in any cell:

| Function | Returns |
|---|---|
| `=CEFR_PCT(B2, "A2")` | Compliance percentage, e.g. `85` |
| `=CEFR_FLAGS(B2, "A2")` | Flagged words, e.g. `"cell (B1), analysis (B1)"` |

**Suggested column layout** (repeat for each definition column):

| Term | Simple definition | Simple % | Simple flags | Technical definition | Technical % | Technical flags |
|---|---|---|---|---|---|---|
| Data type | A set of... | `=CEFR_PCT(B2,"A2")` | `=CEFR_FLAGS(B2,"A2")` | An attribute... | `=CEFR_PCT(E2,"B1")` | `=CEFR_FLAGS(E2,"B1")` |

---

## Local development

```bash
pip install -r requirements.txt
python3 -m uvicorn api:app --reload
```

Test with curl:
```bash
curl -X POST http://localhost:8000/analyse \
  -H "Content-Type: application/json" \
  -d '{"text": "A tool that controls what kind of data can be entered into a cell.", "target": "A2"}'
```
