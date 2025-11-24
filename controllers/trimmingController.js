const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const router = express.Router();
const upload = multer({ dest: "uploads/" });

const { parseTimestamps } = require("../services/parseTimestamps");

// Proses Upload video + timestamps
router.post("/", upload.single("video"), async (req, res) => {
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

module.exports = router;