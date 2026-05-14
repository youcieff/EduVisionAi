require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  console.log('🔑 GROQ API Key:', process.env.GROQ_API_KEY ? '✅ Found' : '❌ Missing');

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    console.log('🧪 Testing Groq (Llama 3.3 70B)...');
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say "مرحباً من EduVisionAI!" in Arabic, one line only' }],
      max_tokens: 50,
    });
    console.log('✅ Groq is working! Response:', result.choices[0].message.content.trim());
  } catch (error) {
    console.error('❌ Groq Error:', error.message);
  }
}

testGroq();
