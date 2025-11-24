import { YoutubeTranscript } from 'youtube-transcript';

async function getTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    console.log("Transcript fetched successfully:");
    console.log(transcript);

    // Format jadi plain text
    const textOnly = transcript.map(item => item.text).join(' ');
    console.log("\nPlain text transcript:\n", textOnly);

    // Format untuk caption editor (start -> text)
    const formatted = transcript.map(item => ({
      start: item.offset,
      duration: item.duration,
      text: item.text
    }));

    console.log("\nFormatted transcript:\n", formatted);

    return formatted;

  } catch (error) {
    console.error("Failed to fetch transcript:", error);
  }
}

// Example usage:
getTranscript("T1NIC8SA2Ss");
export default router;