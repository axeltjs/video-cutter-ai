const express = require("express");
const cors = require("cors");
const trimController = require("./controllers/trimmingController");
// const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

app.use("/process", trimController);
app.use("/output", express.static("output"));

app.listen(3000, () => console.log("Server running http://localhost:3000"));
