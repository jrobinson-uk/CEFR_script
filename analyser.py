"""
CEFR Vocabulary Analyser
Analyses text and flags words above a given CEFR threshold.
"""

import re
from cefrpy import CEFRAnalyzer, CEFRLevel

# Initialised once at module level — cefrpy loads a large dataset
_analyzer = CEFRAnalyzer()

# Map string labels to CEFRLevel enum values for threshold comparison
_LEVEL_MAP = {str(l): l for l in CEFRLevel}


def analyse(text: str, target: str = "B1", glossary_terms=None) -> dict:
    """
    Analyse text and return CEFR scoring results.

    Args:
        text: The definition text to analyse.
        target: CEFR threshold — words at this level or above are flagged.
        glossary_terms: Domain vocabulary to exclude from scoring.

    Returns:
        dict with keys: ceiling_level, target_met, flagged_words, scored_words, excluded_words
    """
    if glossary_terms is None:
        glossary_terms = []

    glossary_set = {t.lower().strip() for t in glossary_terms}
    target_value = _LEVEL_MAP[target].value

    # Tokenise: split on whitespace and punctuation, lowercase
    tokens = re.findall(r"[a-zA-Z]+(?:'[a-zA-Z]+)?", text.lower())

    scored_words = []
    flagged_words = []
    excluded_words = []
    seen = set()  # deduplicate within a single text

    for token in tokens:
        if token in seen:
            continue
        seen.add(token)

        # Skip glossary terms
        if token in glossary_set:
            excluded_words.append(token)
            continue

        level_enum = _analyzer.get_average_word_level_CEFR(token)

        # Not in cefrpy dataset — treat as domain/unknown, exclude silently
        if level_enum is None:
            excluded_words.append(token)
            continue

        level_str = str(level_enum)
        entry = {"word": token, "level": level_str}
        scored_words.append(entry)

        if level_enum.value > target_value:
            flagged_words.append(entry)

    # Ceiling = highest level among scored words
    ceiling_level = None
    if scored_words:
        ceiling_level = max(scored_words, key=lambda w: _LEVEL_MAP[w["level"]].value)["level"]

    target_met = ceiling_level is None or _LEVEL_MAP[ceiling_level].value <= target_value

    total = len(scored_words)
    within = total - len(flagged_words)
    compliance_pct = round((within / total) * 100) if total > 0 else 100

    return {
        "ceiling_level": ceiling_level,
        "target_met": target_met,
        "compliance_pct": compliance_pct,
        "flagged_words": flagged_words,
        "scored_words": scored_words,
        "excluded_words": excluded_words,
    }


if __name__ == "__main__":
    examples = [
        {
            "label": "Simplified definition (target A2)",
            "text": "A set of step-by-step instructions that a computer follows to solve a problem.",
            "target": "A2",
            "glossary_terms": ["algorithm", "computer"],
        },
        {
            "label": "Technical definition (target B1)",
            "text": "A process of focusing on a specific aspect whilst ignoring irrelevant detail.",
            "target": "B1",
            "glossary_terms": ["abstraction"],
        },
        {
            "label": "Educator explanation (target B2)",
            "text": "Abstraction involves the decomposition of a complex system into discrete, manageable components, suppressing implementation detail to expose only the salient interface.",
            "target": "B2",
            "glossary_terms": ["abstraction", "decomposition", "implementation"],
        },
    ]

    for ex in examples:
        result = analyse(ex["text"], ex["target"], ex["glossary_terms"])
        print(f"\n{'='*60}")
        print(f"  {ex['label']}")
        print(f"  Text: {ex['text'][:80]}")
        print(f"  Target: {ex['target']}  |  Ceiling: {result['ceiling_level']}  |  Target met: {result['target_met']}")
        if result["flagged_words"]:
            flags = ", ".join(f"{w['word']} ({w['level']})" for w in result["flagged_words"])
            print(f"  Flagged: {flags}")
        else:
            print("  Flagged: none")
        print(f"  Excluded (glossary/unknown): {', '.join(result['excluded_words']) or 'none'}")
