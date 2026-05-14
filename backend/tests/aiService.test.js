/**
 * Unit Tests for AI Service Utility Functions
 * Tests all pure functions exported from openaiService.js
 */
const { utils } = require('../services/openaiService');
const {
  detectLanguage,
  cleanTranscript,
  preprocessTranscript,
  postProcessArabic,
  safeParseJSON,
  withUserPrompt,
} = utils;

// ═══════════════════════════════════════════════
// 1. detectLanguage
// ═══════════════════════════════════════════════
describe('detectLanguage', () => {
  test('returns "ar" for Arabic-dominant text', () => {
    const text = 'هذه محاضرة في الفيزياء عن قوانين نيوتن والحركة الدائرية';
    expect(detectLanguage(text)).toBe('ar');
  });

  test('returns "en" for English-dominant text', () => {
    const text = 'This is a lecture about Newton laws of motion and circular dynamics';
    expect(detectLanguage(text)).toBe('en');
  });

  test('respects explicit user prompt override to English', () => {
    const arabicText = 'هذه محاضرة في الفيزياء';
    expect(detectLanguage(arabicText, '', '', 'Respond in english please')).toBe('en');
  });

  test('respects explicit user prompt override to Arabic', () => {
    const englishText = 'This is a physics lecture';
    expect(detectLanguage(englishText, '', '', 'أجب بالعربي')).toBe('ar');
  });

  test('detects Arabic from title metadata', () => {
    expect(detectLanguage('', 'محاضرة بالعربي')).toBe('ar');
  });

  test('falls back to preferredLang when text is empty', () => {
    expect(detectLanguage('', '', 'ar')).toBe('ar');
    expect(detectLanguage('', '', 'en')).toBe('en');
  });

  test('defaults to English when no signals available', () => {
    expect(detectLanguage('')).toBe('en');
  });

  test('detects mixed content with Arabic majority', () => {
    const mixed = 'هذا الدرس يشرح velocity والتسارع acceleration في الفيزياء العامة ومبادئ القوة والحركة';
    expect(detectLanguage(mixed)).toBe('ar');
  });
});

// ═══════════════════════════════════════════════
// 2. cleanTranscript
// ═══════════════════════════════════════════════
describe('cleanTranscript', () => {
  test('returns original text when no cleaning needed', () => {
    const text = 'هذا نص عربي بسيط';
    expect(cleanTranscript(text, 'ar')).toBe(text);
  });

  test('preserves technical terms in Arabic transcript', () => {
    const text = 'القوة F تساوي velocity مضروبة في mass حسب القانون';
    const cleaned = cleanTranscript(text, 'ar');
    expect(cleaned).toContain('velocity');
    expect(cleaned).toContain('mass');
  });

  test('removes random foreign words from Arabic transcript', () => {
    const text = 'هذا الدرس beaucoup يشرح الفيزياء merci';
    const cleaned = cleanTranscript(text, 'ar');
    expect(cleaned).not.toContain('beaucoup');
    expect(cleaned).not.toContain('merci');
  });

  test('preserves acronyms like CPU, API in Arabic text', () => {
    const text = 'نستخدم CPU و API في البرمجة';
    const cleaned = cleanTranscript(text, 'ar');
    expect(cleaned).toContain('CPU');
    expect(cleaned).toContain('API');
  });

  test('handles null/undefined input gracefully', () => {
    expect(cleanTranscript(null, 'ar')).toBeNull();
    expect(cleanTranscript(undefined, 'en')).toBeUndefined();
  });

  test('cleans extra whitespace', () => {
    const text = 'جملة   بها   مسافات   كثيرة';
    const cleaned = cleanTranscript(text, 'ar');
    expect(cleaned).not.toMatch(/\s{2,}/);
  });
});

// ═══════════════════════════════════════════════
// 3. preprocessTranscript
// ═══════════════════════════════════════════════
describe('preprocessTranscript', () => {
  test('returns original text if under maxChars', () => {
    const short = 'Short text here.';
    expect(preprocessTranscript(short, 8000)).toBe(short);
  });

  test('truncates long text to approximately maxChars', () => {
    const longText = 'This is a sentence. '.repeat(1000); // ~20000 chars
    const result = preprocessTranscript(longText, 3000);
    expect(result.length).toBeLessThan(longText.length);
    expect(result.length).toBeLessThan(5000); // should be roughly around maxChars
  });

  test('preserves beginning and ending of long text', () => {
    const sentences = [];
    for (let i = 0; i < 100; i++) {
      sentences.push(`Sentence number ${i} about physics.`);
    }
    const longText = sentences.join(' ');
    const result = preprocessTranscript(longText, 2000);
    expect(result).toContain('Sentence number 0');
    expect(result).toContain('Sentence number 99');
  });

  test('handles null/empty input', () => {
    expect(preprocessTranscript(null)).toBeNull();
    expect(preprocessTranscript('')).toBe('');
  });

  test('includes section separators for condensed text', () => {
    const longText = 'This is a test sentence. '.repeat(500);
    const result = preprocessTranscript(longText, 2000);
    expect(result).toContain('[...محتوى متوسط...]');
  });
});

// ═══════════════════════════════════════════════
// 4. postProcessArabic
// ═══════════════════════════════════════════════
describe('postProcessArabic', () => {
  test('corrects المتجهة to المتجه', () => {
    expect(postProcessArabic('المتجهة العمودية')).toContain('المتجه');
  });

  test('corrects التعجيل to التسارع', () => {
    expect(postProcessArabic('التعجيل يساوي')).toContain('التسارع');
  });

  test('fixes ta marbouta errors (السرعه → السرعة)', () => {
    expect(postProcessArabic('السرعه')).toBe('السرعة');
    expect(postProcessArabic('القوه')).toBe('القوة');
    expect(postProcessArabic('الحركه')).toBe('الحركة');
    expect(postProcessArabic('الطاقه')).toBe('الطاقة');
  });

  test('removes Whisper hallucination foreign words', () => {
    const text = 'هذا الدرس beaucoup يشرح très الفيزياء';
    const cleaned = postProcessArabic(text);
    expect(cleaned).not.toContain('beaucoup');
    expect(cleaned).not.toContain('très');
  });

  test('removes English filler words from Arabic text', () => {
    const text = 'القوة so تساوي and الكتلة okay مضروبة';
    const cleaned = postProcessArabic(text);
    expect(cleaned).not.toMatch(/\bso\b/i);
    expect(cleaned).not.toMatch(/\band\b/i);
    expect(cleaned).not.toMatch(/\bokay\b/i);
  });

  test('removes Whisper repetition artifacts', () => {
    const text = 'هذا المفهوم مهم جداً في الفيزياء.هذا المفهوم مهم جداً في الفيزياء.هذا المفهوم مهم جداً في الفيزياء.';
    const cleaned = postProcessArabic(text);
    expect(cleaned.length).toBeLessThan(text.length);
  });

  test('handles null/undefined gracefully', () => {
    expect(postProcessArabic(null)).toBeNull();
    expect(postProcessArabic(undefined)).toBeUndefined();
    expect(postProcessArabic('')).toBe('');
  });

  test('cleans double spaces and orphaned punctuation', () => {
    const text = 'كلمة  كلمة   كلمة';
    const cleaned = postProcessArabic(text);
    expect(cleaned).not.toMatch(/\s{2,}/);
  });
});

// ═══════════════════════════════════════════════
// 5. safeParseJSON
// ═══════════════════════════════════════════════
describe('safeParseJSON', () => {
  test('parses valid JSON directly', () => {
    const input = '{"key": "value"}';
    expect(safeParseJSON(input)).toEqual({ key: 'value' });
  });

  test('parses JSON array', () => {
    const input = '["item1", "item2", "item3"]';
    expect(safeParseJSON(input)).toEqual(['item1', 'item2', 'item3']);
  });

  test('strips markdown code fences (```json ... ```)', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(safeParseJSON(input)).toEqual({ key: 'value' });
  });

  test('strips plain code fences (``` ... ```)', () => {
    const input = '```\n["a", "b"]\n```';
    expect(safeParseJSON(input)).toEqual(['a', 'b']);
  });

  test('extracts JSON from surrounding chatter text', () => {
    const input = 'Here is the result:\n\n{"grade": "A+", "score": 95}\n\nHope this helps!';
    const result = safeParseJSON(input);
    expect(result).toHaveProperty('grade');
    expect(result.score).toBe(95);
  });

  test('handles trailing commas', () => {
    const input = '["item1", "item2", ]';
    expect(safeParseJSON(input)).toEqual(['item1', 'item2']);
  });

  test('returns null for completely invalid input', () => {
    expect(safeParseJSON('this is not json at all')).toBeNull();
  });

  test('returns null for null/empty input', () => {
    expect(safeParseJSON(null)).toBeNull();
    expect(safeParseJSON('')).toBeNull();
  });

  test('extracts array when mixed with prefix text', () => {
    const input = 'Sure, here are the key points:\n["Point 1", "Point 2", "Point 3"]';
    const result = safeParseJSON(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });
});


// ═══════════════════════════════════════════════
// 7. withUserPrompt
// ═══════════════════════════════════════════════
describe('withUserPrompt', () => {
  test('appends user prompt to system prompt', () => {
    const result = withUserPrompt('You are a professor.', 'Focus on Newton laws');
    expect(result).toContain('You are a professor.');
    expect(result).toContain('ADDITIONAL USER INSTRUCTION');
    expect(result).toContain('Focus on Newton laws');
  });

  test('returns original prompt when userPrompt is empty', () => {
    const system = 'You are a professor.';
    expect(withUserPrompt(system, '')).toBe(system);
    expect(withUserPrompt(system, null)).toBe(system);
    expect(withUserPrompt(system, '   ')).toBe(system);
  });
});
