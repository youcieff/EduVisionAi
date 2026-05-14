const { isInvalidTranscript } = require('../services/openaiService');

async function test() {
  const service = require('../services/openaiService');
  
  const testTranscripts = [
    'تم رفع الفيديو بنجاح. تعذر تفريغ النص حالياً (قد تكون المشكلة من السيرفر).',
    'تم رفع الفيديو بنجاح. حدث خطأ أثناء التفريغ الصوتي.',
    'This is a valid long transcript. '.repeat(50),
    'غير متاح بسبب حقوق النشر'
  ];

  console.log('--- Testing isInvalidTranscript manually ---');
  for (const t of testTranscripts) {
      const summary = await service.generateSummary(t, '', '', 'ar');
      console.log(`Transcript starting with: ${t.slice(0, 30)}`);
      console.log(`Result: ${summary.slice(0, 50)}...\n`);
  }
}

test().catch(console.error);
