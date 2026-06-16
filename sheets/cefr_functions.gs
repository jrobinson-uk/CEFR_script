const API_URL = "https://cefr-script.onrender.com";


function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CEFR")
    .addItem("Analyse column…", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setTitle("CEFR Analyser")
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}


/**
 * Returns the proportion of words within the CEFR target level (0–1).
 * Format the cell as a percentage in Sheets.
 * @param {string} text The definition text.
 * @param {string} target The CEFR threshold: A1, A2, B1, B2, C1, or C2.
 * @return {number} Compliance as a decimal, e.g. 0.85.
 * @customfunction
 */
function CEFR_PCT(text, target) {
  if (!text || text.toString().trim() === "") return "";
  const result = _callAPI(text.toString(), target || "B1");
  return result.compliance_pct;
}


/**
 * Returns a comma-separated list of words above the CEFR target level.
 * @param {string} text The definition text.
 * @param {string} target The CEFR threshold: A1, A2, B1, B2, C1, or C2.
 * @param {boolean} showLevels Whether to include the CEFR level alongside each word (default true).
 * @return {string} Flagged words, e.g. "cell (B1), analysis (B1)" or "cell, analysis".
 * @customfunction
 */
function CEFR_FLAGS(text, target, showLevels) {
  if (!text || text.toString().trim() === "") return "";
  const levels = showLevels === false ? false : true;
  const result = _callAPI(text.toString(), target || "B1");
  return result.flagged_words.map(w => levels ? `${w.word} (${w.level})` : w.word).join(", ");
}


/**
 * Called from the sidebar. Processes each non-empty row in sourceCol,
 * writes compliance (0–1) to pctCol and flagged words to flagsCol.
 */
function runAnalysis(params) {
  const { sourceCol, target, pctCol, flagsCol, showLevels, startRow } = params;

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) return { processed: 0, skipped: 0 };

  const sourceValues = sheet.getRange(`${sourceCol}${startRow}:${sourceCol}${lastRow}`).getValues();

  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < sourceValues.length; i++) {
    const text = sourceValues[i][0] ? sourceValues[i][0].toString().trim() : "";
    const row = startRow + i;

    if (!text) {
      skipped++;
      continue;
    }

    const result = _callAPI(text, target);

    sheet.getRange(`${pctCol}${row}`).setValue(result.compliance_pct);

    const flagStr = result.flagged_words
      .map(w => showLevels ? `${w.word} (${w.level})` : w.word)
      .join(", ");
    sheet.getRange(`${flagsCol}${row}`).setValue(flagStr);

    processed++;
  }

  return { processed, skipped };
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
