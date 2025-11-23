const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

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


// Upload video + timestamps
app.post("/process", upload.single("video"), async (req, res) => {
    const timestampsRaw = req.body.timestamps;
    const fileName = req.file.originalname;
    const timestamps = parseTimestamps(timestampsRaw, fileName);

    if (!timestamps.length)
        return res.status(400).json({ error: "Invalid timestamps" });

    const inputPath = req.file.path;
    const jobs = [];
    const outputFiles = [];

    timestamps.forEach((clip, i) => {
        if (!clip) return;

        const outputFile = path.join("output", clip.name);
        outputFiles.push(clip.name);

        const cmd = `ffmpeg -i ${inputPath} -ss ${clip.start} -to ${clip.end} -c:v libx264 -preset ultrafast -c:a aac "${outputFile}"`;
        // const cmd = `ffmpeg -i ${inputPath} -ss ${clip.start} -to ${clip.end} -c copy "${outputFile}"`;

        // Bungkus dalam Promise
        const job = new Promise((resolve, reject) => {
        exec(cmd, (err) => {
            if (err) reject(err);
            else resolve();
        });
        });

        jobs.push(job);
    });

    try {
        await Promise.all(jobs);

        res.json({
        status: "done",
        message: "All clips successfully generated",
        files: outputFiles
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "FFmpeg processing failed" });
    }
});


app.use("/output", express.static("output"));

app.listen(3000, () => console.log("Server running http://localhost:3000"));
