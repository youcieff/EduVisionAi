const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  const url = 'https://www.youtube.com/watch?v=MkqX2kEabC4';
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    console.log('Success! Got transcript lines:', transcript.length);
    console.log('First line:', transcript[0].text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
