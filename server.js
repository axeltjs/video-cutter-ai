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
function parseTimestamps(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  return lines.map((line, index) => {
    const [range, ...titleParts] = line.split(" ");
    const [start, end] = range.split("-");
    return {
      start: start.trim(),
      end: end.trim(),
      filename: `clip_${index + 1}.mp4`,
      title: titleParts.join(" ")
    };
  });
}

// Upload video + timestamps
app.post("/process", upload.single("video"), (req, res) => {
  const videoPath = req.file.path;
  const timestamps = parseTimestamps(req.body.timestamps);
  const outputDir = "output";

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const results = [];

  let pending = timestamps.length;

  timestamps.forEach(item => {
    const outFile = path.join(outputDir, item.filename);
    const cmd = `ffmpeg -i ${videoPath} -ss ${item.start} -to ${item.end} -c copy ${outFile}`;

    exec(cmd, (err) => {
      if (err) console.log("FFmpeg error:", err);

      results.push({
        title: item.title,
        file: `/output/${item.filename}`
      });

      pending--;
      if (pending === 0) res.json({ clips: results });
    });
  });
});

app.use("/output", express.static("output"));

app.listen(3000, () => console.log("Server running http://localhost:3000"));
