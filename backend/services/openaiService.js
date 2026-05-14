const fs = require('fs');
const Groq = require('groq-sdk');

// Lazy-initialized Groq clients for Load Balancing
let groqClients = [];
let currentClientIndex = 0;

function initGroqClients() {
  if (groqClients.length > 0) return;
  const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  const keys = keysString.split(',').map(k => k.trim()).filter(k => k);
  
  if (keys.length === 0) {
    console.warn("⚠️ No GROQ API keys found!");
    return;
  }
  
  groqClients = keys.map(key => new Groq({ apiKey: key }));
  if (groqClients.length > 1) {
    console.log(`🤖 Initialized ${groqClients.length} Groq API keys for Load Balancing.`);
  }
}

function getGroq() {
  initGroqClients();
  if (groqClients.length === 0) return null;
  return groqClients[currentClientIndex];
}

function rotateGroqKey() {
  if (groqClients.length <= 1) return false;
  currentClientIndex = (currentClientIndex + 1) % groqClients.length;
  console.log(`🔄 Rotated Groq API Key to index ${currentClientIndex + 1}/${groqClients.length}`);
  return true;
}

// Legacy alias — all existing code uses `groq.xxx`, so we proxy it to the currently active client
const groq = new Proxy({}, { 
  get: (_, prop) => {
    const client = getGroq();
    return client ? client[prop] : undefined;
  }
});

// ═══════════════════════════════════════════════════════════════
// MODEL ROUTING — Smart selection per task type (Groq Free Tier)
// ═══════════════════════════════════════════════════════════════
// PRIMARY: Llama 3.3 70B Versatile — top-tier reasoning, generation, and JSON output
const REASONING_MODEL = 'llama-3.3-70b-versatile';
// GENERAL: Same model — unified for consistency and simplicity
const GENERAL_MODEL = 'llama-3.3-70b-versatile';
// LITE: Llama 3.1 8B Instant — lightning fast fallback when rate limits are hit
const LITE_MODEL = 'llama-3.1-8b-instant';
// VISION: Llama 3.2 11B Vision — native multimodal vision support
const VISION_MODEL = 'llama-3.2-11b-vision-preview';
// Legacy alias
const MODEL = GENERAL_MODEL;

// Retry helper for AI API calls (handles Groq rate limits and timeouts)
async function retryAsync(fn, retries = 4, delay = 3000, fallbackFn = null) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        if (fallbackFn) {
          console.log('🔄 Attempting last-resort fallback with lighter model...');
          return await fallbackFn();
        }
        throw error;
      }
      
      let waitTime = delay * Math.pow(2, attempt); // 3s, 6s, 12s
      const errorStr = (error.message || '').toLowerCase();
      
      if (errorStr.includes('429') || errorStr.includes('rate_limit') || errorStr.includes('too many requests')) {
        // If it's a TPD (Tokens Per Day) error, switch to fallback immediately if available
        if (errorStr.includes('tpd') || errorStr.includes('tokens per day')) {
          console.log('⚠️ Tokens Per Day (TPD) Limit Hit!');
          if (fallbackFn) return await fallbackFn();
        }
        
        // Load Balancer: Attempt Key Rotation first!
        if (rotateGroqKey()) {
          console.log('♻️ Successfully rotated API key. Retrying immediately...');
          continue; // Instantly go to next loop iteration without waiting
        }

        // TPM (Tokens Per Minute) cooldown: 15s -> 60s -> 100s
        waitTime = attempt === 0 ? 15000 : (attempt === 1 ? 60000 : 100000);
        console.log(`⏳ Groq Rate Limit Hit! Waiting ${Math.round(waitTime/1000)}s before retry ${attempt + 1}/${retries}...`);
      } else {
        console.log(`⏳ Retry ${attempt + 1}/${retries} after ${waitTime}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}



// Detect primary language of transcript
function detectLanguage(text, title = '', preferredLang = '', userPrompt = '') {
  const combined = (title + ' ' + (text || '')).toLowerCase();
  const promptLower = (userPrompt || '').toLowerCase();

  // 1. ABSOLUTE TOP PRIORITY: Explicit User Instructions (AI Instructions box)
  if (promptLower.includes('english') || promptLower.includes('إنجليزي') || promptLower.includes('انكليزي') || promptLower.includes('انجليزي')) return 'en';
  if (promptLower.includes('arabic') || promptLower.includes('عربي')) return 'ar';

  // 2. METADATA SIGNAL - If the title explicitly says "Arabic" or "بالعربي"
  if (combined.includes('arabic') || combined.includes('بالعربي') || combined.includes('عربي')) {
    return 'ar';
  }

  if (!text) {
    // No transcript available — use preferredLang as last resort
    return preferredLang === 'ar' ? 'ar' : 'en';
  }
  
  // 3. CHARACTER-BASED ANALYSIS on the transcript (THE CONTENT DECIDES!)
  const textOnly = (text || '').toLowerCase();
  const arabicChars = (textOnly.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (textOnly.match(/[a-zA-Z]/g) || []).length;
  const total = arabicChars + latinChars;
  
  if (total === 0) return preferredLang === 'ar' ? 'ar' : 'en';

  // HEURISTIC 1: Dominant Arabic content (>30% arabic chars)
  if (total > 0 && arabicChars / total > 0.30) return 'ar';

  // HEURISTIC 2: If there's a significant amount of Arabic characters
  if (arabicChars > 80) return 'ar';

  // HEURISTIC 3: Lower density for mixed content (Arabic narration with English terms)
  if (arabicChars / total > 0.05 && arabicChars > 20) return 'ar';
  
  return 'en';
}

// Clean transcript from Whisper noise (foreign words, garbage characters)
function cleanTranscript(text, detectedLang) {
  if (!text) return text;
  let cleaned = text;

  if (detectedLang === 'ar') {
    // Remove isolated foreign-language words that Whisper hallucinates into Arabic transcripts
    // Matches standalone Latin-script words that are NOT common English technical terms
    const techTerms = new Set([
      // Physics
      'velocity', 'acceleration', 'force', 'momentum', 'energy', 'power', 'torque', 'friction',
      'newton', 'joule', 'watt', 'hertz', 'pascal', 'ohm', 'ampere', 'volt', 'coulomb',
      'vector', 'scalar', 'displacement', 'kinetic', 'potential', 'gravity', 'mass', 'weight',
      // Math
      'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'dx', 'dy', 'dt', 'integral', 'derivative',
      'matrix', 'determinant', 'eigenvalue', 'theta', 'alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega',
      // Units
      'kg', 'km', 'cm', 'mm', 'hz', 'mhz', 'ghz', 'mph', 'rpm',
      'ms', 'ns', 'kw', 'mw', 'gw', 'ev', 'kev', 'mev',
      // CS
      'cpu', 'gpu', 'ram', 'api', 'http', 'html', 'css', 'sql', 'json', 'xml',
      'python', 'java', 'javascript', 'react', 'node', 'express',
      // General academic
      'pdf', 'url', 'wifi', 'bluetooth', 'usb', 'led', 'lcd', 'ide',
    ]);

    // Remove standalone foreign words (Vietnamese, French, Spanish, etc.) that sneak in
    cleaned = cleaned.replace(/(?<=\s|^)([a-zA-ZÀ-ÿĀ-žƠ-ơƯ-ư]{2,})(?=\s|$|[.,،؛:!?])/g, (match) => {
      const lower = match.toLowerCase();
      // Keep if it's a known technical term or looks like a formula variable (single char or very short)
      if (techTerms.has(lower) || match.length <= 2) return match;
      // Keep if it looks like an acronym (all uppercase, 2-5 chars)
      if (/^[A-Z]{2,5}$/.test(match)) return match;
      // Keep if it looks like a unit or formula fragment
      if (/^[A-Za-z]\d|\d[A-Za-z]/.test(match)) return match;
      // Remove everything else (random foreign words)
      return '';
    });
  }

  // Clean extra whitespace left behind
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

// Helper: inject user prompt into system prompt
function withUserPrompt(systemPrompt, userPrompt) {
  if (!userPrompt || !userPrompt.trim()) return systemPrompt;
  return `${systemPrompt}\n\nADDITIONAL USER INSTRUCTION (HIGH PRIORITY): ${userPrompt.trim()}`;
}

// Intelligent transcript preprocessor — condenses very long transcripts while preserving educational value
function preprocessTranscript(transcript, maxChars = 24000) {
  if (!transcript || transcript.length <= maxChars) return transcript;
  
  // Split by sentence boundaries
  const sentences = transcript.match(/[^.!?،؟。]+[.!?،؟。]+/g) || [transcript];
  const targetPerSection = Math.floor(maxChars / 3);
  
  let beginning = '';
  let i = 0;
  while (i < sentences.length && beginning.length < targetPerSection) {
    beginning += sentences[i] + ' ';
    i++;
  }
  
  const midStart = Math.floor(sentences.length / 2) - Math.floor(sentences.length / 6);
  let middle = '';
  let j = midStart;
  while (j < sentences.length && middle.length < targetPerSection) {
    middle += sentences[j] + ' ';
    j++;
  }
  
  let ending = '';
  let k = sentences.length - 1;
  const endParts = [];
  while (k >= 0 && ending.length < targetPerSection) {
    endParts.unshift(sentences[k]);
    ending = endParts.join(' ');
    k--;
  }
  
  return `${beginning.trim()}\n\n[...محتوى متوسط...]\n\n${middle.trim()}\n\n[...محتوى متأخر...]\n\n${ending.trim()}`;
}

/**
 * Finds the most relevant chunk of transcript for a given query (RAG-lite)
 * This avoids over-saturating the context window with irrelevant parts of a 1-hour lecture.
 */
function findRelevantChunk(transcript, query, chunkSize = 6000) {
  if (!transcript || transcript.length <= chunkSize) return transcript;
  
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Slide a window across the transcript to find high-density keyword areas
  const sentences = transcript.match(/[^.!?،؟。]+[.!?،؟。]+/g) || [transcript];
  let bestWindow = '';
  let maxScore = -1;
  
  // 3000 chars overlap for continuity 
  const step = Math.floor(chunkSize / 2); 
  
  for (let start = 0; start < transcript.length; start += step) {
    const end = Math.min(start + chunkSize, transcript.length);
    const windowText = transcript.substring(start, end);
    const windowLower = windowText.toLowerCase();
    
    let score = 0;
    keywords.forEach(kw => {
      // Bonus score for exact matches
      const occurrences = (windowLower.match(new RegExp(kw, 'g')) || []).length;
      score += occurrences;
      
      // Extra bonus for keywords in the first 500 chars of the window
      if (windowLower.substring(0, 500).includes(kw)) score += 2;
    });
    
    if (score > maxScore) {
      maxScore = score;
      bestWindow = windowText;
    }
  }
  
  return bestWindow || transcript.substring(0, chunkSize);
}

// Post-process Arabic text to fix common AI output issues
function postProcessArabic(text) {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text;
  
  // Fix reversed variable definitions: ",هي السرعة v" → "، وهي"
  cleaned = cleaned.replace(/,\s*هي\s+/g, '، وهي ');
  cleaned = cleaned.replace(/,\s*هو\s+/g, '، وهو ');
  
  // Fix "المتجهة" → "المتجه" (common AI mistake — المتجه is masculine)
  cleaned = cleaned.replace(/المتجهة/g, 'المتجه');
  
  // Fix wrong physics terms
  cleaned = cleaned.replace(/الشعاعية/g, 'القطرية');
  cleaned = cleaned.replace(/المتجه الوحدوي/g, 'متجه الوحدة');
  cleaned = cleaned.replace(/المتجه العادي(?!ة)/g, 'المتجه العمودي');
  cleaned = cleaned.replace(/التعجيل/g, 'التسارع');
  
  // Additional physics/math term corrections
  cleaned = cleaned.replace(/العزم(?!\s+الدور)/g, 'عزم الدوران');
  cleaned = cleaned.replace(/الإزاحة\s+Angular/gi, 'الإزاحة الزاوية');
  cleaned = cleaned.replace(/القوة المركزيه/g, 'القوة المركزية');
  cleaned = cleaned.replace(/السرعه/g, 'السرعة');
  cleaned = cleaned.replace(/القوه/g, 'القوة');
  cleaned = cleaned.replace(/الحركه/g, 'الحركة');
  cleaned = cleaned.replace(/الطاقه/g, 'الطاقة');
  cleaned = cleaned.replace(/المسافه/g, 'المسافة');
  cleaned = cleaned.replace(/الكتله/g, 'الكتلة');
  cleaned = cleaned.replace(/المسأله/g, 'المسألة');
  cleaned = cleaned.replace(/الزاويه/g, 'الزاوية');
  cleaned = cleaned.replace(/القيمه/g, 'القيمة');
  cleaned = cleaned.replace(/النتيجه/g, 'النتيجة');
  cleaned = cleaned.replace(/المعادله/g, 'المعادلة');
  cleaned = cleaned.replace(/الإجابه/g, 'الإجابة');
  
  // Fix common AI grammar issues
  cleaned = cleaned.replace(/\bهي يكون\b/g, 'تكون');
  cleaned = cleaned.replace(/\bهو تكون\b/g, 'يكون');
  
  // Remove common Whisper hallucination words (Vietnamese, French, Spanish, etc.)
  const foreignNoise = /\b(nhiều|très|beaucoup|porque|también|questo|delle|comme|merci|bonjour|gracias|obrigado|danke|bitte|cảm|ơn|của|một|những|trong|không|được|này|các|cho|người|với|là|và|có|từ|đến|trên|nhưng|sau|khi|rất|hay|như|tại|về|qua|nên|để|mà|sous|sur|pour|avec|plus|moins|alors|donc|mais|comme|très)\b/gi;
  cleaned = cleaned.replace(foreignNoise, '');
  
  // Remove Whisper repetition artifacts (same phrase repeated 3+ times)
  cleaned = cleaned.replace(/(.{10,}?)\1{2,}/g, '$1');
  
  // Remove leftover English filler words that sneak into Arabic text
  cleaned = cleaned.replace(/\b(so|and|the|that|this|which|where|what|when|how|okay|OK|right|yeah|yes|no|um|uh|ah|like)\b/gi, '');
  
  // Clean up double spaces and orphaned punctuation
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\s+([.,،؛:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,،؛:!?]){2,}/g, '$1');
  
  return cleaned.trim();
}

// Robust JSON parser: handles markdown code fences, trailing commas, and prefix/suffix chatter
function safeParseJSON(raw) {
  if (!raw) return null;
  let text = raw.trim();
  
  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();
  
  // 2. Try direct parse first
  try { return JSON.parse(text); } catch (e) { /* fall through */ }
  
  // 3. Try to extract balanced array [ ... ] or object { ... }
  // We use greedy match to get the outermost brackets
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const fragment = arrMatch[0].replace(/,\s*([\]}])/g, '$1'); // Fix common trailing commas
      return JSON.parse(fragment);
    } catch (e) { /* fall through */ }
  }
  
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const fragment = objMatch[0].replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(fragment);
    } catch (e) { /* fall through */ }
  }

  // 4. Ultimate fallback for "broken" JSON from weaker models (like 8B)
  // Sometimes they repeat the prompt or add chatter BEFORE the JSON
  if (text.includes('[') && text.includes(']')) {
    try {
      const start = text.lastIndexOf('[');
      const end = text.lastIndexOf(']') + 1;
      if (start !== -1 && end > start) {
        const lastPossibleArray = text.substring(start, end).replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(lastPossibleArray);
      }
    } catch (e) { /* fall through */ }
  }
  
  console.warn('⚠️ safeParseJSON failed to find valid JSON in:', text.substring(0, 100) + '...');
  return null;
}

class AIService {
  // Transcribe audio — supports uploaded video files and YouTube chunks
  // Intelligent fallback: Groq → OpenAI → Groq Retry (with backoff)
  async transcribeAudio(audioPath, languageHint = '') {
    try {
      console.log(`🎤 Transcribing audio... (lang hint: ${languageHint || 'auto'})`);
      
      // Helper: build fresh whisper options (file stream must be recreated per attempt)
      const buildOptions = (model = 'whisper-large-v3-turbo') => {
        const opts = {
          file: fs.createReadStream(audioPath),
          model,
          response_format: 'text',
        };
        if (languageHint === 'ar') {
          opts.language = 'ar';
          opts.prompt = 'محاضرة تعليمية باللغة العربية في الفيزياء والرياضيات والعلوم الهندسية';
        } else if (languageHint === 'en') {
          opts.language = 'en';
          opts.prompt = 'Educational lecture in English on physics, mathematics, and engineering.';
        } else {
          opts.prompt = 'Educational lecture transcript.';
        }
        return opts;
      };

      const isRetryable = (err) => {
        const code = err?.status || err?.statusCode;
        return code === 429 || code === 500 || code === 503 || err?.code === 'insufficient_quota';
      };

      // ── ATTEMPT 1: Groq Whisper (primary) ──
      if (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY) {
        try {
          const transcription = await groq.audio.transcriptions.create(
            buildOptions('whisper-large-v3-turbo'),
            { timeout: 180000 }
          );
          if (transcription && transcription.trim().length > 0) {
            console.log('✅ Transcription completed with Groq Whisper!');
            return transcription.trim();
          }
        } catch (groqErr) {
          console.log(`⚠️ Groq Whisper failed (${groqErr.status || 'unknown'}): ${groqErr.message}`);
        }
      }

      // ── ATTEMPT 2: OpenAI Whisper (fallback) ──
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const transcription = await openai.audio.transcriptions.create(
            buildOptions('whisper-1'),
            { timeout: 180000 }
          );
          if (transcription && transcription.trim().length > 0) {
            console.log('✅ Transcription completed with OpenAI Whisper!');
            return transcription.trim();
          }
        } catch (openaiErr) {
          console.log(`⚠️ OpenAI Whisper failed (${openaiErr.status || 'unknown'}): ${openaiErr.message}`);
        }
      }

      // ── ATTEMPT 3: Groq Retry with exponential backoff ──
      if (process.env.GROQ_API_KEY) {
        const retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s
        for (let i = 0; i < retryDelays.length; i++) {
          console.log(`🔄 Groq Whisper retry ${i + 1}/${retryDelays.length} in ${retryDelays[i] / 1000}s...`);
          await new Promise(r => setTimeout(r, retryDelays[i]));
          try {
            const transcription = await groq.audio.transcriptions.create(
              buildOptions('whisper-large-v3-turbo'),
              { timeout: 180000 }
            );
            if (transcription && transcription.trim().length > 0) {
              console.log(`✅ Groq Whisper retry ${i + 1} succeeded!`);
              return transcription.trim();
            }
          } catch (retryErr) {
            console.log(`⚠️ Groq retry ${i + 1} failed: ${retryErr.message}`);
            if (!isRetryable(retryErr)) break; // Non-retryable error, stop
          }
        }
      }

      return 'تم رفع الفيديو بنجاح. تعذر تفريغ النص حالياً (قد تكون المشكلة من السيرفر).';
    } catch (error) {
      console.error('Transcription Error:', error);
      return 'تم رفع الفيديو بنجاح. حدث خطأ أثناء التفريغ الصوتي.';
    }
  }

  // Analyze image using Groq Vision API
  async analyzeImage(imagePath, userPrompt = '') {
    try {
      console.log('🖼️ Analyzing image with Groq Vision...');

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = imagePath.split('.').pop().toLowerCase();
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
      const mimeType = mimeMap[ext] || 'image/jpeg';

      const defaultPrompt = `You are an expert educational AI assistant with vision capabilities. Analyze this image thoroughly and provide a comprehensive educational analysis.

Your analysis should follow these rules:
1. DETECT what type of content the image contains:
   - If it contains TEXT or NOTES: transcribe the text accurately and provide a clear summary.
   - If it contains MATH PROBLEMS or EQUATIONS: solve each problem step-by-step with full explanation.
   - If it contains DIAGRAMS, CHARTS, or GRAPHS: describe what they represent and explain the concepts.
   - If it contains CODE: explain the code, identify any bugs, and suggest improvements.
   - If it contains SCIENTIFIC CONTENT: explain the concepts, formulas, and principles shown.

2. LANGUAGE: Detect the language of the content. If Arabic, respond in Arabic. If English, respond in English. If mixed, respond in the dominant language.

3. FORMAT: Write in clean plain text. Do NOT use markdown formatting (no **, no #, no bullet points with -). Use numbered lists if needed. Separate sections with blank lines.

4. Be thorough, accurate, and educational in your explanation.`;

      const systemPrompt = userPrompt
        ? `${defaultPrompt}\n\nIMPORTANT USER REQUEST: ${userPrompt}`
        : defaultPrompt;

      const response = await retryAsync(() => groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }));

      let analysis = response.choices[0].message.content.trim();
      analysis = analysis.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '');
      console.log('✅ Image analysis completed with Groq Vision');
      return analysis;
    } catch (error) {
      console.error('Image Analysis Error:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }
  }

  // Generate summary — uses GENERAL_MODEL (Llama 3.3) for fluent Arabic prose
  async generateSummary(transcript, userPrompt = '', title = '', preferredLang = '') {
    const lang = detectLanguage(transcript || '', title, preferredLang, userPrompt);
    const isArabic = lang === 'ar';
    
    try {
      console.log(`📝 Generating AI summary with Groq [${GENERAL_MODEL}]... (Pref: ${preferredLang})`);
      if (!transcript || transcript.length < 50 || transcript.includes('غير متاح')) {
        return isArabic ? 'تم رفع الفيديو بنجاح. النص قصير جداً لإنشاء ملخص ذكي.' : 'Video uploaded successfully. Transcript too short for AI summary.';
      }
      const cleanedTranscript = cleanTranscript(preprocessTranscript(transcript), lang);

      const systemPrompt = withUserPrompt(isArabic ? `أنت بروفيسور عالمي وعبقري في الشرح الأكاديمي، تصنع ملخصات "أسطورية" واستثنائية للطلاب.

المنهجية:
1. **الشمولية المطلقة**: الملخص يجب أن يغطي كل الأفكار المذكورة من البداية للنهاية.
2. **التكيف الذكي مع المحتوى**:
   - 🔬 **إذا كان المحتوى علمياً/رياضياً (STEM)**: ركز بشراسة على القوانين، المعادلات، وخطوات الحل العملي. واشرح "لماذا" تعمل هذه القوانين وكيف تُطبق في الحياة الواقعية.
   - 📚 **إذا كان المحتوى نظرياً/أدبياً**: استخرج النظريات، التسلسل المنطقي، واربط بين الأسباب والنتائج ببراعة.
3. التزم بالنص: اشرح النص المتاح، ولكن بأفضل جودة ممكنة.

معايير الجودة:
- لغة عربية أكاديمية بليغة وسلسة جداً.
- التنسيق: فقرات غنية ومتماسكة. نص عادي بدون ماركداون معقد.` : `You are a world-renowned, legendary Professor. Write an extraordinary educational summary of this transcript.

Methodology:
1. **Absolute Comprehensiveness**: Cover every idea from start to finish.
2. **Smart Content Adaptation**:
   - 🔬 **For STEM**: Focus aggressively on formulas, step-by-step problem-solving, laws, and practical applications. Explain the "Why" deeply.
   - 📚 **For Theoretical/Humanities**: Focus on concepts, logical flow, and cause-and-effect relationships.
3. Elaborate brilliantly based strictly on the provided text.

Format: Rich, cohesive plain text paragraphs. No markdown.`, userPrompt);

      const callGroq = (model) => groq.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${isArabic ? 'لخّص هذا النص تلخيصاً تعليمياً عميقاً يربط بين المفاهيم' : 'Write a deep educational summary of this transcript, connecting concepts coherently'}:\n\n${cleanedTranscript}` }
        ],
        temperature: 0.25,
        max_tokens: 2500,
      });

      const response = await retryAsync(
        () => callGroq(GENERAL_MODEL), 
        4, 
        3000, 
        () => callGroq(LITE_MODEL)
      );

      let summary = response.choices[0].message.content.trim();
      summary = summary.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '');
      if (isArabic) summary = postProcessArabic(summary);
      
      // Quality gate: reject too-short summaries and retry once
      if (summary.length < 200 && cleanedTranscript.length > 200) {
        console.log('⚠️ Summary too short, retrying...');
        const retryResponse = await callGroq(GENERAL_MODEL);
        const retrySummary = retryResponse.choices[0].message.content.trim().replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '');
        if (retrySummary.length > summary.length) summary = isArabic ? postProcessArabic(retrySummary) : retrySummary;
      }
      console.log('✅ Summary generated with Groq');
      return summary;
    } catch (error) {
      console.error('Summary Error:', error);
      return isArabic ? 'حدث خطأ أثناء إنشاء الملخص، يرجى المحاولة لاحقاً.' : 'Failed to generate summary, please try again later.';
    }
  }

  // Generate detailed description — uses GENERAL_MODEL for rich Arabic writing
  async generateDetailedDescription(transcript, userPrompt = '', title = '', preferredLang = '') {
    const lang = detectLanguage(transcript || '', title, preferredLang, userPrompt);
    const isArabic = lang === 'ar';
    
    try {
      console.log(`📄 Generating detailed description with Groq [${GENERAL_MODEL}]... (Pref: ${preferredLang})`);
      if (!transcript || transcript.length < 50 || transcript.includes('غير متاح')) {
        return isArabic ? 'عذراً، محتوى الفيديو غير كافٍ لإنشاء شرح مفصل.' : 'Sorry, transcript content is insufficient for a detailed description.';
      }
      
      const cleanedTranscript = cleanTranscript(preprocessTranscript(transcript, 20000), lang);

      let systemPrompt = isArabic
        ? `أنت بروفيسور أسطوري يكتب "المرجع الشامل والنهائي" للطالب. هذا الشرح يجب أن يكون تحفة فنية تغني الطالب عن مشاهدة المحاضرة وتحوله لخبير في الموضوع.

خطة الشرح (Legendary Quality):
1. 💡 **مقدمة عبقرية**: تمهد للموضوع وتبين أهميته العملية وتطبيقاته.
2. 🔬/📚 **تفكيك المفاهيم العميقة**: 
   - للمحتوى العلمي: استخرج كل الأسس الرياضية/الفيزيائية/البرمجية. اشرح القوانين بالتفصيل مع معاني الرموز.
   - للمحتوى النظري: حلل كل حجة، نظرية، والسبب والنتيجة باحترافية.
3. ⚙️ **أمثلة تطبيقية وأخطاء شائعة (مهم جداً)**: ضع أمثلة واضحة وموسعة واشرح خطوات الحل خطوة بخطوة. سلط الضوء على "التريكات" والأخطاء التي يقع فيها الطلاب عادة.
4. 📝 **خلاصة مكثفة**: تلمس أطراف الفهم النهائي العميق.

القيود الحديدية:
- **دقة**: اشرح ببراعة استناداً إلى النص.
- **الشرح العملي**: إذا كانت هناك مسائل، قم بشرح مسار الحل ببراعة.
- نص عادي فقط، استخدم المسافات الفارغة بين الفقرات. ممنوع علامات الماركداون المعقدة.`
        : `You are a legendary Professor writing the "Ultimate Master Reference" for a student. This must be an educational masterpiece that transforms the student into an expert.

Structure for Legendary Quality:
1. 💡 **Brilliant Introduction**: Hook the student and explain the core value and real-world application of the topic.
2. 🔬/📚 **Deep Concept Deconstruction**: 
   - For STEM: Extract all formulas, code, or scientific principles. Explain HOW and WHY they work deeply.
   - For Humanities: Analyze every argument, theory, and cause-and-effect with mastery.
3. ⚙️ **Practical Worked Examples & Common Pitfalls (CRUCIAL)**: Expand on examples meticulously. Highlight common traps and tricks students fall for.
4. 📝 **Powerful Conclusion**: A final wrap-up reinforcing the deepest insights.

Strict Constraints:
- Elevate and brilliantly explain based explicitly on the provided text.
- Format: Plain text only, separate ideas using empty lines. No complex markdown.`;

      systemPrompt = withUserPrompt(systemPrompt, userPrompt);

      const callGroq = (model) => groq.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${isArabic ? 'اكتب شرحاً تعليمياً عميقاً ومفصلاً وشاملاً لهذا المحتوى، يشمل أمثلة عملية وأخطاء شائعة' : 'Write a comprehensive, deep educational explanation of this content, including worked examples and common mistakes'}:\n\n${cleanedTranscript}` }
        ],
        temperature: 0.25,
        max_tokens: 5000,
      });

      const response = await retryAsync(
        () => callGroq(GENERAL_MODEL), 
        4, 
        3000, 
        () => callGroq(LITE_MODEL)
      );

      let description = response.choices[0].message.content.trim();
      description = description.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '');
      if (isArabic) description = postProcessArabic(description);
      
      // Quality gate: reject too-short descriptions and retry once
      if (description.length < 400 && cleanedTranscript.length > 300) {
        console.log('⚠️ Description too short, retrying...');
        const retryResponse = await callGroq(GENERAL_MODEL);
        const retryDesc = retryResponse.choices[0].message.content.trim().replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '');
        if (retryDesc.length > description.length) description = isArabic ? postProcessArabic(retryDesc) : retryDesc;
      }
      console.log('✅ Detailed description generated with Groq');
      return description;
    } catch (error) {
      console.error('Description Error:', error);
      const isAr = preferredLang === 'ar' || (transcript && transcript.match(/[\u0600-\u06FF]/));
      return isAr ? 'حدث خطأ أثناء إنشاء الشرح المفصل.' : 'Failed to generate detailed description.';
    }
  }

  // Extract key points — uses REASONING_MODEL for deep analysis
  async extractKeyPoints(transcript, userPrompt = '', title = '', preferredLang = '') {
    try {
      console.log(`🔑 Extracting key points with Groq [${REASONING_MODEL}]... (Pref: ${preferredLang})`);
      if (!transcript || transcript.length < 50 || transcript.includes('غير متاح')) {
        return ['النص قصير جداً لاستخراج النقاط الرئيسية', 'الفيديو متاح للمشاهدة'];
      }
      const lang = detectLanguage(transcript, title, preferredLang, userPrompt);
      const isArabic = lang === 'ar';
      const cleanedTranscript = cleanTranscript(preprocessTranscript(transcript, 15000), lang);

      let systemPrompt = isArabic
        ? `أنت بروفيسور متخصص تستخرج أهم النقاط التفصيلية من النص لبناء خريطة ذهنية "أسطورية" تركز على الاستيعاب العميق.

منهجية الاستخراج:
1. امسح المحتوى من البداية للنهاية، واستخرج كل فكرة رئيسية وقانون أو استنتاج.
2. لا تترك أي فكرة مهمة. يجب أن تكون النقاط معبرة عن المحتوى كاملاً.
3. بسط واشرح الأفكار بناءً على النص المُرفق بذكاء شديد.

معايير الجودة (كل نقطة يجب أن تحقق هذا):
- يجب أن تكون الجملة محددة ومفصلة وذكية.
- للقوانين: الاسم + الصيغة + التفصيل.
- ابدأ كل نقطة بالموضوع الرئيسي.

أعد ما يصل إلى 25 نقطة لتغطية النص بالكامل. أعد فقط كائن JSON صالح بالصيغة التالية بالضبط:
{"points": ["النقطة التفصيلية الأولى", "النقطة التفصيلية الثانية"]}`
        : `Extract EVERY exam-critical educational insight from this transcript to build a phenomenally comprehensive mind map.

Extraction Methodology:
1. Scan the text from start to finish. Extract ALL key laws, concepts, and relationships brilliantly.
2. Do not omit any core topic mentioned in the lecture.
3. Synthesize the provided text deeply.

Quality Standards:
- Must be detailed and specific. No vague summaries.
- For laws: full formula and profound meaning.

Return up to 25 points to ensure exhaustive coverage. Return ONLY a valid JSON object in this exact format:
{"points": ["Detailed point 1", "Detailed point 2"]}`;

      systemPrompt = withUserPrompt(systemPrompt, userPrompt);

      const callGroq = (model) => {
        const isLite = model === LITE_MODEL;
        // With response_format json_object, we don't need a special Lite prompt,
        // but we'll ensure we pass `response_format`.
        return groq.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: isLite ? cleanedTranscript.substring(0, 6000) : cleanedTranscript }
          ],
          temperature: 0.15,
          max_tokens: 6000,
          response_format: { type: 'json_object' }
        });
      };

      const response = await retryAsync(
        () => callGroq(REASONING_MODEL), 
        3, 
        3000, 
        () => callGroq(LITE_MODEL)
      );

      const rawContent = (response.choices[0].message.content || '').trim();
      const content = safeParseJSON(rawContent);
      let keyPoints = content?.points || (Array.isArray(content) ? content : null);
      
      // Fallback if the object keys were random
      if (!Array.isArray(keyPoints) && content && typeof content === 'object') {
        const values = Object.values(content).filter(v => typeof v === 'string' || Array.isArray(v));
        if (values.length > 0) {
          if (Array.isArray(values[0])) keyPoints = values[0];
          else keyPoints = values.filter(v => typeof v === 'string'); // flatten
        }
      }

      if (Array.isArray(keyPoints) && keyPoints.length > 0) {
        // Ensure all elements are clean strings for the UI
        keyPoints = keyPoints.map(p => {
          if (typeof p === 'string') return isArabic ? postProcessArabic(p) : p;
          
          if (typeof p === 'object' && p !== null) {
            const values = Object.values(p).filter(v => typeof v === 'string');
            if (values.length > 0) {
              const text = values.join(' - ');
              return isArabic ? postProcessArabic(text) : text;
            }
            return isArabic ? postProcessArabic(JSON.stringify(p)) : JSON.stringify(p);
          }
          return String(p || '');
        });
        console.log(`✅ Key points extracted successfully (${keyPoints.length} points)`);
        return keyPoints;
      }
      
      throw new Error('Failed to parse a valid JSON array from AI response');
    } catch (error) {
      console.error('❌ Key Points API Error:', error.message);
      const isAr = preferredLang === 'ar' || (transcript && transcript.match(/[\u0600-\u06FF]/));
      return [
        isAr ? 'المحتوى التعليمي متاح للمراجعة في الشرح المفصل' : 'Educational content available in detailed description',
        isAr ? 'يمكنك المشاركة في الاختبار لتقييم فهمك' : 'Join the quiz to evaluate your understanding'
      ];
    }
  }

  // Generate quiz questions
  async generateQuestions(transcript, userPrompt = '', title = '', preferredLang = '') {
    const lang = detectLanguage(transcript || '', title, preferredLang, userPrompt);
    const isArabic = lang === 'ar';
    
    try {
      console.log(`❓ Generating quiz questions with Groq [${REASONING_MODEL}]... (Pref: ${preferredLang})`);
      if (!transcript || transcript.length < 100 || transcript.includes('غير متاح')) {
        return this.generateDefaultQuestions();
      }
      const cleanedTranscript = cleanTranscript(preprocessTranscript(transcript, 15000), lang);

      let systemPrompt = isArabic
        ? `أنت أستاذ جامعي عالمي المستوى تصمم اختباراً تقييمياً "أسطورياً" واحترافياً.

مهمتك: إنشاء 20 سؤال اختيار من متعدد بناءً على النص، تقيس الفهم العميق والقدرة على حل المشكلات وليس فقط الحفظ.

قواعد الدقة والمستوى الأسطوري:
1. **للمحتوى العلمي/الرياضي (STEM)**: 80% من الأسئلة يجب أن تكون مسائل عملية قابلة للحل، و 20% أسئلة مفاهيمية "Tricky" تقيس الفهم العميق للظواهر.
2. **للمحتوى النظري**: الأسئلة يجب أن تقيس التحليل والاستنتاج.
3. **التشكيك الذكي (Distractors)**: الخيارات الخاطئة يجب أن تمثل أخطاءً شائعة يقع فيها الطالب فعلياً.
4. **شرح الإجابة (Explanation)**: اشرح خطوة بخطوة بأسلوب مبهر لماذا هذا الخيار صحيح ولماذا البقية خطأ بناءً على النص.

قواعد ثابتة:
- 100% عربي فصحى، المعادلات فقط إنجليزي.
- 6 أسئلة سهلة، 8 متوسطة، 6 صعبة جداً وتتطلب تركيز.
- استند بذكاء إلى معطيات النص المُرفق.

أعد فقط JSON صالح:
{"questions": [{"question": "نص السؤال", "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], "correctAnswer": 0, "explanation": "شرح تفصيلي خطوة بخطوة مبني ببراعة على النص"}]}`
        : `You are a world-class Professor designing an elite, legendary evaluation quiz.

Your task: Create EXACTLY 20 multiple-choice questions that test deep comprehension and problem-solving, not just rote memorization.

Legendary Tier Rules:
1. **For STEM**: 80% should be practical problem-solving questions. 20% "tricky" conceptual questions checking true understanding.
2. **For Humanities**: Focus on analysis, inferences, and critical arguments.
3. **Brilliant Distractors**: Wrong options MUST represent realistic common mistakes or misconceptions.
4. **Epic Explanations**: Provide a phenomenal, step-by-step breakdown of exactly WHY the answer is correct explicitly based on the text.

Constraints:
- 100% English.
- 6 Easy, 8 Medium, 6 Hard.
- Synthesize explicitly based on the provided transcript.

Return ONLY valid JSON:
{"questions": [{"question": "Question text here", "options": ["Op 1", "Op 2", "Op 3", "Op 4"], "correctAnswer": 0, "explanation": "Phenomenal step-by-step breakdown explicit to the text"}]}`;

      systemPrompt = withUserPrompt(systemPrompt, userPrompt);

      const callGroq = (model) => {
        const opts = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanedTranscript }
          ],
          temperature: 0.2,
          max_tokens: 10000,
          response_format: { type: 'json_object' },
        };
        return groq.chat.completions.create(opts);
      };

      const response = await retryAsync(
        () => callGroq(REASONING_MODEL), 
        3, 
        3000, 
        () => callGroq(LITE_MODEL)
      );

      const rawQuizContent = (response.choices[0].message.content || '').trim();
      const content = safeParseJSON(rawQuizContent);
      if (content?.questions && Array.isArray(content.questions) && content.questions.length > 0) {
        // Validate: ensure every question has an explanation
        content.questions.forEach(q => {
          if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.length < 5) {
            q.explanation = isArabic ? 'راجع المحاضرة للتفاصيل.' : 'Review the lecture for details.';
          }
        });
        // Post-process Arabic text in questions
        if (isArabic) {
          content.questions.forEach(q => {
            const normStr = (val) => typeof val === 'string' ? postProcessArabic(val) : String(val || '');
            q.question = normStr(q.question);
            q.explanation = normStr(q.explanation);
            if (Array.isArray(q.options)) {
              q.options = q.options.map(opt => normStr(opt));
            }
          });
        }
        console.log(`✅ ${content.questions.length} questions generated with Groq`);
        return content.questions;
      } else {
        throw new Error('Invalid question format from Groq');
      }
    } catch (error) {
      console.error('Questions Error:', error);
      return this.generateDefaultQuestions();
    }
  }

  // Generate flashcards (concept/formula cards)
  async generateFlashcards(transcript, userPrompt = '', title = '', preferredLang = '') {
    const lang = detectLanguage(transcript || '', title, preferredLang, userPrompt);
    const isArabic = lang === 'ar';
    
    try {
      console.log(`🃏 Generating flashcards with Groq [${REASONING_MODEL}]... (Pref: ${preferredLang})`);
      if (!transcript || transcript.length < 100 || transcript.includes('غير متاح')) {
        return this.generateDefaultFlashcards();
      }
      const cleanedTranscript = cleanTranscript(preprocessTranscript(transcript, 15000), lang);

      let systemPrompt = isArabic
        ? `أنت أستاذ جامعي تصمم بطاقات مراجعة (Flashcards) "أسطورية" وذكية جداً استناداً للنص.

مهمتك: إنشاء من 15 إلى 25 بطاقة تغطي أهم وأعمق تفاصيل النص من البداية للنهاية.

أنواع البطاقات المطلوبة (امزج بذكاء):
1. **للمحتوى العملي/العلمي (STEM)**: بطاقات للقوانين، الاستنتاجات، معاني الرموز، و*كيفية الحل والمطبات الشائعة*.
2. **الأسئلة العكسية**: بطاقة تطرح سؤال استنتاجي ووجهها الخلفي يجيب بشرح عبقري من النص.
3. **المفاهيم والنظريات**: تعاريف معمقة ودقيقة جداً.

القيود 철يد:
- التغطية للمحتوى كامل.
- لغة عربية أكاديمية بليغة.
- اشتق البطاقات ببراعة من النص المتوفر. 

أعد فقط JSON صالح:
{"flashcards": [{"front": "الوجه الأمامي (مثال: لماذا يحدث كذا؟ أو ما هو قانون كذا؟)", "back": "الوجه الخلفي التفصيلي المليء بالمعلومات القيمة"}]}`
        : `You are a legendary Professor designing brilliant, hyper-effective study flashcards explicitly from the given lecture.

Your task: Create 15 to 25 flashcards summarizing the deepest and most crucial parts of the transcript.

Card Types (Mix intelligently):
1. **STEM/Analytical**: Formulas, execution steps, symbols meanings, and "common pitfalls".
2. **Reverse/Deep Questions**: A thought-provoking conceptual question on the front, and a brilliant text-based explanation on the back.
3. **Concepts/Theories**: Profoundly accurate definitions.

Strict Constraints:
- MUST be 100% English.
- Absolute coverage of the text.
- Formulate deeply based on the provided text.

Return ONLY valid JSON:
{"flashcards": [{"front": "Front text (Question/Formula name)", "back": "Detailed, context-aware brilliant explanation"}]}`;

      systemPrompt = withUserPrompt(systemPrompt, userPrompt);

      const callGroq = (model) => {
        const opts = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanedTranscript }
          ],
          temperature: 0.2,
          max_tokens: 10000,
          response_format: { type: 'json_object' },
        };
        return groq.chat.completions.create(opts);
      };

      const response = await retryAsync(
        () => callGroq(REASONING_MODEL), 
        3, 
        3000, 
        () => callGroq(LITE_MODEL)
      );

      const rawFlashContent = (response.choices[0].message.content || '').trim();
      const content = safeParseJSON(rawFlashContent);
      if (content?.flashcards && Array.isArray(content.flashcards) && content.flashcards.length > 0) {
        // Post-process Arabic text in flashcards
        if (isArabic) {
          content.flashcards.forEach(card => {
            const normStr = (val) => typeof val === 'string' ? postProcessArabic(val) : String(val || '');
            card.front = normStr(card.front);
            card.back = normStr(card.back);
          });
        }
        console.log(`✅ ${content.flashcards.length} flashcards generated with Groq`);
        return content.flashcards;
      } else {
        throw new Error('Invalid flashcard format from Groq');
      }
    } catch (error) {
      console.error('Flashcards Error:', error);
      return this.generateDefaultFlashcards();
    }
  }

  // Handle interactive Chat with Video feature
  async chatWithVideo(transcript, userMessage, title = '') {
    try {
      if (!transcript || transcript.trim().length < 5) {
        return 'Not enough content to answer questions. Please try another file or wait for the video to process.';
      }
      
      const lang = detectLanguage(userMessage, title);
      const isArabic = lang === 'ar';
      
      // OPTIMIZATION: Extract relevant chunk instead of full transcript (RAG-lite)
      const relevantContext = findRelevantChunk(transcript, userMessage, 6000);
      
      let systemPrompt = isArabic
        ? `أنت معلم خصوصي ذكي، تشرح المحتوى التعليمي من السياق المعطى فقط.
          
1. استخدم سياق النص المعطى حصراً.
2. اشرح خطوة بخطوة. للمسائل: اكتب الحل والقوانين بالتفصيل.
3. استخدم تشبيهات واقعية.
4. لو سأل عن ملاحظاته، انصحه لتطويرها.
5. اختم بنصيحة امتحانية.
6. لا ماركداون (لا ** ولا - ولا #).
7. السياق: "${relevantContext}"`
        : `You are a smart personal tutor. Answer ONLY from the provided context.
          
1. Use provided context strictly.
2. Explain step-by-step. For math: show formula and steps.
3. Use real-world analogies.
4. Analyze user notes if asked and provide tips.
5. End with a brief exam tip.
6. Plain text only. No markdown (no ** or # or -).
7. Context: "${relevantContext}"`;

      const response = await retryAsync(() => groq.chat.completions.create({
        model: GENERAL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }));

      let reply = response.choices[0].message.content.trim();
      reply = reply.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
      if (isArabic) reply = postProcessArabic(reply);
      
      return reply;
    } catch (error) {
      console.error('Chat Error:', error);
      return 'Sorry, I am having trouble processing your question right now. Please try again later.';
    }
  }

  generateDefaultQuestions() {
    return [
      {
        question: 'عذراً، لم يتمكن الذكاء الاصطناعي من تحليل المحتوى بشكل كافٍ لإنشاء أسئلة. يرجى إعادة المحاولة.',
        options: ['إعادة المحاولة', 'تخطي', 'المحتوى غير كافٍ', 'حدث خطأ تقني'],
        correctAnswer: 0
      }
    ];
  }

  generateDefaultFlashcards() {
    return [
      {
        front: 'لم يتمكن الذكاء الاصطناعي من إنشاء بطاقات مراجعة',
        back: 'يرجى إعادة المعالجة أو التأكد من أن المحتوى كافٍ للتحليل.'
      }
    ];
  }

  async generateSpeech(text, voiceId = 'pNInz6obpgDQGcFmaJgB', isArabic = true) {
    // Attempt ElevenLabs first
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) throw new Error('No ElevenLabs API Key');
      const modelId = 'eleven_multilingual_v2';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (elevenError) {
      console.log('⚠️ ElevenLabs failed, falling back to OpenAI TTS:', elevenError.message);
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('No OpenAI API Key');
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
            input: text
          })
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        return await response.arrayBuffer();
      } catch (openAiError) {
        console.error('❌ Both ElevenLabs and OpenAI TTS failed:', openAiError);
        throw openAiError;
      }
    }
  }
}

// Export singleton for production use
const aiService = new AIService();

// Export utility functions for testing
module.exports = aiService;
module.exports.utils = {
  detectLanguage,
  cleanTranscript,
  preprocessTranscript,
  postProcessArabic,
  safeParseJSON,
  withUserPrompt,
};
// Export internals for reuse in other controllers (e.g. userController study plan)
module.exports.groq = groq;
module.exports.retryAsync = retryAsync;
module.exports.GENERAL_MODEL = GENERAL_MODEL;
module.exports.LITE_MODEL = LITE_MODEL;