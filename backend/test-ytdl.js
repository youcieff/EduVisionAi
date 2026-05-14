const youtubedl = require('youtube-dl-exec');
const fs = require('fs');

async function test() {
  const url = 'https://www.youtube.com/watch?v=MkqX2kEabC4';
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });
    console.log('Success. Title:', info.title);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
