// Parse timestamps "00:00 - 02:30 Something"
function parseTimestamps(raw, fileName) {
  if (!raw || typeof raw !== "string") return [];

  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(l => typeof l === "string" && l.trim().length > 0);

  return lines.map((line, index) => {
    // Contoh: "00:00 - 02:53 Opening & intro"
    const match = line.match(
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/
    );

    if (!match) {
      console.warn("Invalid timestamp format, skipped:", line);
      return null;
    }

    return {
      start: normalizeTime(match[1]),
      end: normalizeTime(match[2]),
      name: `[Part - ${index + 1}] ${fileName}`,
      raw: line
    };
  }).filter(Boolean);
}

function normalizeTime(t) {
  // Converts "2:53" → "00:02:53"
  const parts = t.split(":");
  if (parts.length === 2) return `00:${parts[0].padStart(2, "0")}:${parts[1]}`;
  if (parts.length === 3) {
    return [
      parts[0].padStart(2, "0"),
      parts[1].padStart(2, "0"),
      parts[2].padStart(2, "0")
    ].join(":");
  }
  return t;
}

module.exports = { parseTimestamps };