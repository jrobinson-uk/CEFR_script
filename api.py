from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyser import analyse

app = FastAPI(title="CEFR Vocabulary Analyser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class AnalyseRequest(BaseModel):
    text: str
    target: str = "B1"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyse")
def analyse_text(req: AnalyseRequest):
    result = analyse(req.text, req.target)
    return {
        "compliance_pct": result["compliance_pct"],
        "flagged_words": result["flagged_words"],
        "ceiling_level": result["ceiling_level"],
        "target_met": result["target_met"],
    }
