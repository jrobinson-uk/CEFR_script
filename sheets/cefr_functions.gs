// CEFR Vocabulary Analyser — Google Apps Script
// Paste this into Extensions → Apps Script in your Google Sheet.
// Fill in API_URL below once your service is deployed to Render.

const API_URL = "https://your-service.onrender.com"; // ← replace after deploying


/**
 * Returns the percentage of words in the text that are within the CEFR target level.
 * @param {string} text The definition text.
 * @param {string} target The CEFR threshold: A1, A2, B1, B2, C1, or C2.
 * @return {number} Compliance percentage (0–100).
 * @customfunction
 */
function CEFR_PCT(text, target) {
  if (!text || text.toString().trim() === "") return "";
  const result = _callAPI(text.toString(), target || "B1");
  return result.compliance_pct;
}


/**
 * Returns a comma-separated list of words above the CEFR target level, with their levels.
 * @param {string} text The definition text.
 * @param {string} target The CEFR threshold: A1, A2, B1, B2, C1, or C2.
 * @return {string} Flagged words, e.g. "cell (B1), analysis (B1)". Empty if none.
 * @customfunction
 */
function CEFR_FLAGS(text, target) {
  if (!text || text.toString().trim() === "") return "";
  const result = _callAPI(text.toString(), target || "B1");
  return result.flagged_words.map(w => `${w.word} (${w.level})`).join(", ");
}


function _callAPI(text, target) {
  const payload = JSON.stringify({ text, target });
  const options = {
    method: "post",
    contentType: "application/json",
    payload,
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(API_URL + "/analyse", options);
  if (response.getResponseCode() !== 200) {
    throw new Error("CEFR API error: " + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}
