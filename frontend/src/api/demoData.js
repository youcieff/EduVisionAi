/**
 * EduVisionAI - Mock Data and Engines for Offline Showcase (Demo Mode)
 */

export const mockUser = {
  id: 'demo-user',
  username: 'Guest Student',
  email: 'guest@eduvision.ai',
  role: 'user',
  subscription: 'premium',
  createdAt: '2026-06-25T12:00:00.000Z'
};

export const mockDashboard = {
  stats: {
    xp: 1450,
    streak: 7,
    level: 4,
    nextLevelXp: 2500,
    completedVideos: 8,
    completedQuizzes: 6,
    studyTimeHours: 12.4,
    flashcardsReviewed: 87
  },
  recentActivity: [
    { id: 'act1', type: 'quiz', title: 'Completed Advanced React Quiz', xp: 120, time: '2 hours ago' },
    { id: 'act2', type: 'video', title: 'Processed video: Clean Code in JS', xp: 150, time: 'Yesterday' },
    { id: 'act3', type: 'flashcard', title: 'Reviewed 20 Flashcards', xp: 60, time: '2 days ago' },
    { id: 'act4', type: 'badge', title: 'Unlocked Badge: Fast Learner', xp: 200, time: '3 days ago' }
  ]
};

export const mockLeaderboard = {
  leaderboard: [
    { id: 'user1', username: 'AlexCoder', xp: 3720, level: 8, rank: 1 },
    { id: 'user2', username: 'HanaAI', xp: 2940, level: 6, rank: 2 },
    { id: 'demo-user', username: 'Guest Student (You)', xp: 1450, level: 4, rank: 3 },
    { id: 'user3', username: 'NoorL', xp: 1250, level: 3, rank: 4 },
    { id: 'user4', username: 'DevMaged', xp: 950, level: 2, rank: 5 }
  ]
};

export const mockRecommendations = {
  recommendations: [
    { id: 'rec1', title: 'React 19 Server Components Deep Dive', type: 'video', reason: 'Matches your focus on web engineering', xp: 150 },
    { id: 'rec2', title: 'Fundamentals of Large Language Models', type: 'quiz', reason: 'Recommended to reach Level 5', xp: 250 },
    { id: 'rec3', title: 'Basic Data Structures Overview', type: 'flashcards', reason: 'Based on your review list', xp: 80 }
  ]
};

export const mockNotifications = {
  notifications: [
    { id: 'notif1', title: '🎉 Level Up!', message: 'Amazing progress! You just leveled up to Level 4.', read: false, createdAt: '2 hours ago' },
    { id: 'notif2', title: '🏆 Performance Unlocked', message: 'You earned the "Weekly Streak Master" badge!', read: false, createdAt: '1 day ago' },
    { id: 'notif3', title: '📚 New Recommendation', message: 'Check your customized study plan for new AI lessons.', read: true, createdAt: '3 days ago' }
  ]
};

export const mockVideos = [
  {
    _id: '6a2cbe8fb9e8657651b03fdf',
    title: 'ALL OF MATH explained in 14 minutes',
    duration: '14:09',
    thumbnail: 'https://i.ytimg.com/vi_webp/1srQ7Mq_ToI/maxresdefault.webp',
    originalUrl: 'https://youtu.be/1srQ7Mq_ToI',
    sourceType: 'video',
    processingStatus: 'completed',
    createdAt: '2026-06-13T02:21:03.291Z',
    views: 6,
    likes: [],
    isPublic: true
  },
  {
    _id: '6a2cb0d6da49ab8966f030d6',
    title: '00 - Oracle Database - Introduction and Installation - شرح قواعد بيانات',
    duration: null,
    thumbnail: 'https://i.ytimg.com/vi/7GsfAfQPc9o/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLD73tRiAy-LfakcNb8IoZTx8lliCw',
    originalUrl: 'https://www.youtube.com/watch?v=7GsfAfQPc9o&list=PLsfs9DojDVqOVtJiWhUZ2yKWTbQqcbmEF',
    sourceType: 'video',
    processingStatus: 'completed',
    createdAt: '2026-06-13T01:22:30.922Z',
    views: 1,
    likes: [],
    isPublic: true
  },
  {
    _id: '6a2caba5ffd0bb84e2c45e5d',
    title: '06- من ERD إلى جداول: خطوات الـ Mapping بالتفصيل',
    duration: null,
    thumbnail: 'https://i.ytimg.com/vi/YuRmghkoaRI/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLBwUoidbc8Mic27y89SYUBzaSfVog',
    originalUrl: 'https://www.youtube.com/watch?v=YuRmghkoaRI&list=PLuvT-i95N7yXeYtYgkfPaHbMgUzk_aYN9',
    sourceType: 'video',
    processingStatus: 'completed',
    createdAt: '2026-06-13T01:00:00.000Z',
    views: 0,
    likes: [],
    isPublic: true
  }
];

export const mockVideoDetails = {
  '6a2cbe8fb9e8657651b03fdf': {
    _id: '6a2cbe8fb9e8657651b03fdf',
    title: 'ALL OF MATH explained in 14 minutes',
    duration: 849,
    originalUrl: 'https://youtu.be/1srQ7Mq_ToI',
    thumbnail: 'https://i.ytimg.com/vi_webp/1srQ7Mq_ToI/maxresdefault.webp',
    processingStatus: 'completed',
    views: 6, likes: [], isPublic: true,
    createdAt: '2026-06-13T02:21:03.291Z',
    summary: `## All of Math — Summary\n\nThis video takes you from the basics of numbers and equations all the way to calculus and probability.\n\n### Topics Covered\n1. **Equations** — Linear, Quadratic, Polynomial and Exponential. Goal: isolate variables from constants.\n2. **Shapes & Geometry** — Area (B×H), Volume, Pythagorean theorem.\n3. **Trigonometry** — sin, cos, tan and the unit circle. Radians and degrees.\n4. **Calculus** — Limits, derivatives (power rule), integrals (antiderivatives).\n5. **Probability** — P(event) = favorable / total. Rules: 0 ≤ P ≤ 1, sum of all outcomes = 1.`,
    keyPoints: [
      'Infinity consists of numbers, signs and symbols.',
      'Constants are fixed; variables are unknown letters.',
      'Quadratic equations have one variable raised to power 2.',
      'Polynomial equations can have variables to any power.',
      'Area formula base: B × H (circles use πr²).',
      'The Pythagorean theorem: hypotenuse² = a² + b².',
      'sin/cos/tan relate triangle sides to angles.',
      'Derivatives measure rate of change (power rule: d/dx xⁿ = nxⁿ⁻¹).',
      'Integrals calculate area under curves.',
      'P(event) = favorable outcomes / total outcomes.'
    ],
    questions: [
      { question: 'What is the primary goal of solving an equation?', options: ['To find the value of a constant', 'To isolate the variable from the constants', 'To determine the type of equation', 'To simplify the equation'], correctAnswer: '1', explanation: 'Solving an equation means rearranging it to isolate the variable and determine its value.', difficulty: 'medium' },
      { question: 'What is the formula for the area of a circle?', options: ['A = B × H', 'A = π × r²', 'A = 2 × π × r', 'A = r × h'], correctAnswer: '1', explanation: 'Circle area = π × r² where r is the radius.', difficulty: 'medium' },
      { question: 'What is the derivative of x³?', options: ['x²', '3x²', '3x', 'x⁴/4'], correctAnswer: '1', explanation: 'By the power rule: d/dx xⁿ = nxⁿ⁻¹, so d/dx x³ = 3x².', difficulty: 'medium' },
      { question: 'The sin function gives the ratio of which two sides?', options: ['Adjacent / Hypotenuse', 'Opposite / Adjacent', 'Opposite / Hypotenuse', 'Hypotenuse / Adjacent'], correctAnswer: '2', explanation: 'sin(θ) = Opposite / Hypotenuse.', difficulty: 'medium' },
      { question: 'What is the probability rule for complementary events?', options: ['P(A\') = 1 + P(A)', 'P(A\') = 1 - P(A)', 'P(A\') = P(A) - 1', 'P(A\') = P(A)'], correctAnswer: '1', explanation: 'The complement rule: P(not A) = 1 - P(A).', difficulty: 'medium' }
    ],
    flashcards: [
      { _id: 'fc_math1', front: 'What are the two main types of equations?', back: 'Linear and Non-linear (quadratic & polynomial).' },
      { _id: 'fc_math2', front: 'What is the goal of solving an equation?', back: 'To isolate the variable and find its value using inverse operations.' },
      { _id: 'fc_math3', front: 'What is the formula for area of a shape?', back: 'Base × Height (B × H), with adjustments per shape (e.g. circles: πr²).' },
      { _id: 'fc_math4', front: 'What is trigonometry?', back: 'The study of angles and side-length ratios in triangles using sin, cos and tan.' },
      { _id: 'fc_math5', front: 'What is the unit circle?', back: 'A circle with radius 1 used to define sin, cos and tan across all angles.' },
      { _id: 'fc_math6', front: 'What does a derivative measure?', back: 'The instantaneous rate of change (slope) of a function at a given point.' },
      { _id: 'fc_math7', front: 'What is the power rule for derivatives?', back: 'If f(x) = xⁿ, then f\'(x) = n·xⁿ⁻¹.' },
      { _id: 'fc_math8', front: 'What does an integral calculate?', back: 'The area under a curve — the accumulation of a function over an interval.' },
      { _id: 'fc_math9', front: 'What is the probability of an event?', back: 'P(event) = (number of favorable outcomes) / (total possible outcomes).' },
      { _id: 'fc_math10', front: 'Explain the Pythagorean theorem.', back: 'In a right triangle: hypotenuse² = adjacent² + opposite².' }
    ]
  },
  '6a2cb0d6da49ab8966f030d6': {
    _id: '6a2cb0d6da49ab8966f030d6',
    title: '00 - Oracle Database - Introduction and Installation - شرح قواعد بيانات',
    duration: null,
    originalUrl: 'https://www.youtube.com/watch?v=7GsfAfQPc9o&list=PLsfs9DojDVqOVtJiWhUZ2yKWTbQqcbmEF',
    thumbnail: 'https://i.ytimg.com/vi/7GsfAfQPc9o/hqdefault.jpg',
    processingStatus: 'completed',
    views: 1, likes: [], isPublic: true,
    createdAt: '2026-06-13T01:22:30.922Z',
    summary: `## Oracle Database — مقدمة وتثبيت\n\nيشرح هذا الفيديو الأساسيات الكاملة لقواعد البيانات ابتداءً من تصنيف البيانات وصولاً إلى إنشاء الجداول باستخدام SQL.\n\n### محاور الفيديو\n1. **تصنيف البيانات** — Structured (علائقية) و Semi-Structured و Unstructured.\n2. **الديتابيز العلائقي** — مفهوم الجداول والأعمدة والصفوف والـ Primary/Foreign Keys.\n3. **لغة SQL** — تاريخها وأنواع الجمل (DML, DDL, DCL, TCL).\n4. **أوراكل** — استخدام Oracle Application Express وتنفيذ جمل SELECT بسيطة.`,
    keyPoints: [
      'البيانات تُصنَّف إلى Structured وSemi-Structured وUnstructured.',
      'الديتابيز العلائقي يعتمد على جداول مترابطة بـ Primary/Foreign Keys.',
      'لغة SQL وُضعت معايير ANSI عام 1970 بواسطة Dr. E.F. Codd.',
      'DML تشمل SELECT وINSERT وUPDATE وDELETE.',
      'DDL تشمل CREATE وALTER وDROP.',
      'Oracle Application Express يُتيح تنفيذ SQL عبر المتصفح.'
    ],
    questions: [
      { question: 'ما هي أنواع البيانات الثلاثة الرئيسية؟', options: ['Structured و JSON و CSV', 'Structured و Semi-Structured و Unstructured', 'SQL و NoSQL و NewSQL', 'Integer و String و Boolean'], correctAnswer: '1', explanation: 'البيانات تُصنَّف إلى Structured (جداول) وSemi-Structured (JSON/XML) وUnstructured (صور ونصوص حرة).', difficulty: 'medium' },
      { question: 'ما وظيفة الـ Primary Key؟', options: ['ربط جدولين معاً', 'تعريف نوع البيانات', 'تمييز كل صف بشكل فريد', 'حذف الصفوف المكررة'], correctAnswer: '2', explanation: 'Primary Key يُعرَّف بأنه Uniquely Identified Rule — يُميّز كل صف في الجدول.', difficulty: 'medium' },
      { question: 'ما هو اختصار DBMS؟', options: ['Data Base Management System', 'Digital Binary Management Software', 'Database Backup and Migration Service', 'Data Business Mapping Standard'], correctAnswer: '0', explanation: 'DBMS = Database Management System — البرنامج المستخدم لإدارة قواعد البيانات.', difficulty: 'medium' }
    ],
    flashcards: [
      { _id: 'fc_ora1', front: 'ما الفرق بين DML و DDL؟', back: 'DML: تعديل البيانات (SELECT, INSERT, UPDATE, DELETE). DDL: تعريف الهيكل (CREATE, ALTER, DROP).' },
      { _id: 'fc_ora2', front: 'ما هو الـ ERD؟', back: 'Entity Relationship Diagram — رسم بياني يوضح كيانات قاعدة البيانات وعلاقاتها.' },
      { _id: 'fc_ora3', front: 'ما هو الـ Foreign Key؟', back: 'مفتاح في جدول يشير إلى Primary Key في جدول آخر لإنشاء العلاقة بينهما.' },
      { _id: 'fc_ora4', front: 'ما هي أنواع العلاقات بين الجداول؟', back: 'One-to-One و One-to-Many و Many-to-Many.' },
      { _id: 'fc_ora5', front: 'ما هو SQL؟', back: 'Structured Query Language — لغة الاستعلام المعيارية للتعامل مع قواعد البيانات العلائقية.' }
    ]
  },
  '6a2caba5ffd0bb84e2c45e5d': {
    _id: '6a2caba5ffd0bb84e2c45e5d',
    title: '06- من ERD إلى جداول: خطوات الـ Mapping بالتفصيل',
    duration: null,
    originalUrl: 'https://www.youtube.com/watch?v=YuRmghkoaRI&list=PLuvT-i95N7yXeYtYgkfPaHbMgUzk_aYN9',
    thumbnail: 'https://i.ytimg.com/vi/YuRmghkoaRI/hqdefault.jpg',
    processingStatus: 'completed',
    views: 0, likes: [], isPublic: true,
    createdAt: '2026-06-13T01:00:00.000Z',
    summary: `## من ERD إلى جداول — الـ Mapping بالتفصيل\n\nيشرح الفيديو كيفية تحويل الـ Conceptual Schema (ERD) إلى Logical Schema جاهزة للتنفيذ في قاعدة البيانات.\n\n### الخطوات\n1. **Conceptual Schema** — رسم الـ ERD (Entities, Attributes, Relationships).\n2. **Logical Schema** — تحديد Primary Keys وForeign Keys وأنواع البيانات.\n3. **Mapping القواعد** — تحويل كل Entity لجدول، وتحديد العلاقات (1:1, 1:N, M:N).\n4. **التطبيق** — تحويل النماذج الورقية إلى SQL CREATE TABLE.`,
    keyPoints: [
      'الـ Conceptual Schema هي رسم ERD بكيانات وعلاقات.',
      'الـ Logical Schema تضيف Primary/Foreign Keys وأنواع البيانات.',
      'علاقة 1:1 — صف واحد في جدول يرتبط بصف واحد في جدول آخر.',
      'علاقة 1:N — صف واحد يرتبط بصفوف متعددة.',
      'علاقة M:N تحتاج جدولاً وسيطاً (Junction Table).',
      'الـ Foreign Key يُوضع في جانب الـ Many.'
    ],
    questions: [
      { question: 'ما الفرق بين Conceptual Schema و Logical Schema؟', options: ['الـ Conceptual هي SQL والـ Logical هي ERD', 'الـ Conceptual هي ERD بدون تفاصيل أنواع البيانات، والـ Logical تضيف هذه التفاصيل', 'لا فرق بينهما', 'الـ Logical هي مرحلة التثبيت فقط'], correctAnswer: '1', explanation: 'الـ Conceptual Schema (ERD) توضح الكيانات والعلاقات. الـ Logical Schema تُضيف Primary/Foreign Keys وأنواع البيانات.', difficulty: 'medium' },
      { question: 'أين يُوضع الـ Foreign Key في علاقة One-to-Many؟', options: ['في جدول الـ One', 'في جدول الـ Many', 'في جدول وسيط جديد', 'في كلا الجدولين'], correctAnswer: '1', explanation: 'في علاقة 1:N يُؤخذ Primary Key من جانب الـ One ويُوضع كـ Foreign Key في جانب الـ Many.', difficulty: 'medium' }
    ],
    flashcards: [
      { _id: 'fc_erd1', front: 'ما هو الـ Mapping في تصميم قواعد البيانات؟', back: 'تحويل الـ ERD (Conceptual Schema) إلى Logical Schema جاهزة للتنفيذ.' },
      { _id: 'fc_erd2', front: 'ماذا تعني علاقة Many-to-Many؟', back: 'كل صف في الجدول الأول يمكن أن يرتبط بصفوف متعددة في الجدول الثاني والعكس — تحتاج جدولاً وسيطاً.' },
      { _id: 'fc_erd3', front: 'ما هو Business Analyst؟', back: 'الشخص المسؤول عن استخراج متطلبات العميل (Requirement Gathering) وإعداد وثيقة SRS.' }
    ]
  },
  'vid1': {
    _id: 'vid1',
    title: 'Introduction to Artificial Intelligence (AI) for Beginners',
    duration: '09:45',
    youtubeId: '2ePf9rue1Ao',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-27T10:00:00.000Z',
    likes: 12,
    byUser: 'demo-user',
    summary: `# Introduction to Artificial Intelligence (AI)

This video covers the foundational rules and concepts of Artificial Intelligence, breaking down complex terminology for beginners.

## Key Takeaways
1. **Definition of AI:** The simulation of human intelligence processes by computer systems, focusing on learning, reasoning, and self-correction.
2. **Narrow vs. General AI:**
   - **Narrow AI (Weak AI):** Designed and trained for a specific task (e.g., Siri, self-driving cars, grammar checkers).
   - **General AI (Strong AI):** Hypothetical machines with cognitive abilities equivalent to a human being.
3. **Machine Learning (ML):** A subset of AI that allows software to learn from historical data and predict outcomes without explicit programming.
4. **Deep Learning:** A subset of ML inspired by the structure and function of the human brain (artificial neural networks).

## Applications
- **Healthcare:** Diagnosing diseases from medical imaging.
- **Finance:** Fraud detection and automated stock trading.
- **Daily Life:** E-commerce recommendations and search engines.
`,
    quiz: [
      {
        question: 'What is the primary difference between Narrow AI and General AI?',
        options: [
          'Narrow AI is slow, while General AI is fast.',
          'Narrow AI is designed for specific tasks, while General AI possesses broad human-like cognitive abilities.',
          'Narrow AI only runs on mobile devices, while General AI is server-only.',
          'There is no actual difference between them.'
        ],
        answer: 1,
        explanation: 'Narrow AI is built for specific tasks (like image recognition or voice assistants), while General AI is a theoretical AI that can understand or learn any intellectual task a human being can do.'
      },
      {
        question: 'Which of the following is a subset of Machine Learning inspired by the human brain?',
        options: [
          'Static Algorithms',
          'Linear Regression',
          'Deep Learning (Neural Networks)',
          'Robotics Process Automation'
        ],
        answer: 2,
        explanation: 'Deep learning is a subset of machine learning that utilizes multi-layered artificial neural networks modeled after structure of biological brains.'
      },
      {
        question: 'Self-driving cars and voice assistants (like Apple\'s Siri) are examples of which type of AI?',
        options: [
          'General AI',
          'Super AI',
          'Narrow AI',
          'Analog AI'
        ],
        answer: 2,
        explanation: 'They are examples of Narrow AI since they perform specific tasks they are trained to do and cannot generalise outside their domains.'
      }
    ],
    flashcards: [
      { id: 'fc1_1', front: 'What does AI stand for?', back: 'Artificial Intelligence - simulation of human intelligence by computers.' },
      { id: 'fc1_2', front: 'What is Machine Learning (ML)?', back: 'A subset of AI enabling software to improve at tasks through exposure to data, without explicit programming.' },
      { id: 'fc1_3', front: 'Difference between Supervised and Unsupervised learning?', back: 'Supervised learning uses labeled training data, whereas unsupervised learning searches for patterns in unlabeled data.' }
    ],
    mindmap: `graph TD
    A["Artificial Intelligence (AI)"] --> B["Narrow AI (Siri, FaceID)"]
    A --> C["General AI (Human-like, Theoretical)"]
    A --> D["Subsets of AI"]
    D --> E["Machine Learning (Data-Driven Learning)"]
    E --> F["Deep Learning (Artificial Neural Networks)"]
    A --> G["Applied Sectors"]
    G --> H["Healthcare Imaging"]
    G --> I["Financial Trading"]
    G --> J["E-commerce Recommendation Systems"]
`,
    transcript: [
      { start: 0, duration: 5, text: 'Hello and welcome to this introduction to artificial intelligence.' },
      { start: 5, duration: 6, text: 'Today, we will break down what AI is under the hood.' },
      { start: 11, duration: 5, text: 'AI is simply computer systems simulating human intelligence processes.' },
      { start: 16, duration: 6, text: 'This includes learning from data, reasoning, and correcting actions.' },
      { start: 22, duration: 7, text: 'We distinguish between Narrow AI, like Siri, and General AI.' }
    ]
  },
  'vid2': {
    _id: 'vid2',
    title: 'React 19 & Next.js 15: Clean Architecture Principles',
    duration: '12:20',
    youtubeId: '8aGhZQkoFbQ',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-28T09:30:00.000Z',
    likes: 8,
    byUser: 'demo-user',
    summary: `# Clean Architecture in Next.js 15

How to structure Next.js App Router projects to scale cleanly and isolate business logic from presentation components.

## Core Pillars
1. **Separation of Concerns:** Separate data fetching, state management, UI, and business rules.
2. **Domain-Driven Directory Layout:**
   - \`src/app\`: Routing, layouts, and page entry files only.
   - \`src/components\`: Pure UI and reusable layout items (buttons, inputs, cards).
   - \`src/store\`: Centralized client state (Zustand, Redux).
   - \`src/api\`: Client axios instances and network interfaces.
   - \`src/hooks\`: Custom utility hooks.
3. **Server vs. Client Components:**
   - Keep layout and structural pages as Server Components (default) to maximize performance.
   - Use Client Components (\`use client\`) only at the leaf nodes (interactive forms, toggle buttons, charts).
`,
    quiz: [
      {
        question: 'Which directory should strictly contain routing structure in Next.js App Router?',
        options: [
          'src/components',
          'src/app',
          'src/views',
          'src/api'
        ],
        answer: 1,
        explanation: 'In the App Router, the `src/app` (or `app`) directory houses files that control paths (like page.js and layout.js).'
      },
      {
        question: 'What is the benefit of keeping parent layout files as Server Components?',
        options: [
          'They allow using browser APIs directly.',
          'They decrease bundle size because less JS is dispatched to client.',
          'They enable the use of React state hook (useState) on server.',
          'There is no benefit.'
        ],
        answer: 1,
        explanation: 'Server Components are rendered on the server. The code stays on the server, drastically reducing the client-side JavaScript payload.'
      }
    ],
    flashcards: [
      { id: 'fc2_1', front: 'What directive declares a client component in Next.js?', back: 'The `"use client"` string at the very top of the file.' },
      { id: 'fc2_2', front: 'What is the purpose of Zustand?', back: 'An ultra-lightweight client-side state management layer focused on simple hook-based consumption.' }
    ],
    mindmap: `graph TD
    A["Clean Next.js 15 Project"] --> B["Server Side (src/app)"]
    B --> C["Layouts & page.js"]
    A --> D["Client Side ('use client')"]
    D --> E["UI Components (Buttons, Modals)"]
    D --> F["Zustand State Stores (Zustand)"]
    D --> G["Axios API Clients (src/api)"]
`,
    transcript: [
      { start: 0, duration: 4, text: 'Let us build a scalable React architecture with Next.js 15.' },
      { start: 4, duration: 5, text: 'We will look at separating concerns and managing directories.' },
      { start: 9, duration: 6, text: 'Domain logic should be abstracted away from presentation components.' }
    ]
  },
  'vid3': {
    _id: 'vid3',
    title: 'How ChatGPT and LLMs Work Under the Hood',
    duration: '15:10',
    youtubeId: '5sLYAJKMV-I',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-28T18:15:00.000Z',
    likes: 24,
    byUser: 'demo-user',
    summary: `# Large Language Models (LLMs) Under the Hood

A study of the Transformer architecture, tokenization, training loops, and inference.

## Key Architectures
1. **The Transformer (2017):** The backbone architecture using "Self-Attention" to process input sequences in parallel, replacing historical sequential models like RNNs.
2. **Tokenization:** Breaking down raw texts into smaller chunks (tokens) which are converted to numerical indexes in a vocabulary list.
3. **Training Iterations:**
   - **Pre-Training:** Training model on massive text databases to predict the "next token", establishing generalized base language understanding.
   - **Fine-Tuning (SFT):** Tuning the base model to answer requests like a helpful assistant using curated instruction datasets.
   - **RLHF (Reinforcement Learning from Human Feedback):** Aligning chatbot responses to match human preferences regarding safety and factuality.
`,
    quiz: [
      {
        question: 'Which neural network architecture introduced the Self-Attention mechanism in 2017?',
        options: [
          'Recurrent Neural Network (RNN)',
          'Convolutional Neural Network (CNN)',
          'The Transformer',
          'Long Short-Term Memory (LSTM)'
        ],
        answer: 2,
        explanation: 'The paper "Attention Is All You Need" introduced the Transformer architecture in 2017.'
      }
    ],
    flashcards: [
      { id: 'fc3_1', front: 'What is Tokenization?', back: 'The process of splitting human text into numerical values (tokens) that a math-based neural network model can understand.' },
      { id: 'fc3_2', front: 'What does RLHF stand for?', back: 'Reinforcement Learning from Human Feedback - aligning LLMs with human values.' }
    ],
    mindmap: `graph TD
    A["Large Language Models"] --> B["Transformer Architecture (2017)"]
    B --> C["Self-Attention Mechanism"]
    A --> D["Operational Sequence"]
    D --> E["Tokenization (Text to numbers)"]
    D --> F["Vectors & Embeddings"]
    A --> G["Training Phases"]
    G --> H["Pre-training (Predict next word)"]
    G --> I["Supervised Fine-Tuning (SFT)"]
    G --> J["Reinforcement Learning (RLHF)"]
`,
    transcript: [
      { start: 0, duration: 4, text: 'Ever wondered how AI models like ChatGPT generate human-like answers?' },
      { start: 4, duration: 5, text: 'It all starts with tokenization and the Transformer architecture.' },
      { start: 9, duration: 5, text: 'Self-attention allows processing words relative to all other words concurrently.' }
    ]
  }
};

export const getMockDueFlashcards = () => {
  return [
    { _id: 'fc_due1', videoId: 'vid1', videoTitle: 'Introduction to AI', front: 'What is Narrow AI?', back: 'An AI trained to perform specific task, like face detection or speech translation.' },
    { _id: 'fc_due2', videoId: 'vid2', videoTitle: 'Next.js Architecture', front: 'What is the default rendering paradigm in Next.js App Router?', back: 'Server Components.' }
  ];
};

export const getMockChatReply = (videoId, message) => {
  const titles = {
    '6a2cbe8fb9e8657651b03fdf': 'ALL OF MATH explained in 14 minutes',
    '6a2cb0d6da49ab8966f030d6': 'Oracle Database Introduction',
    '6a2caba5ffd0bb84e2c45e5d': 'ERD Mapping في قواعد البيانات',
    'vid1': 'Introduction to Artificial Intelligence',
    'vid2': 'Next.js 15 Clean Architecture',
    'vid3': 'How LLMs Work Under the Hood'
  };
  const title = titles[videoId] || 'this study topic';
  
  const replies = [
    `That is a very insightful question about ${title}! In this course segment, the material highlights the structural layout. Let me know if you would like me to explain target sections in detail!`,
    `Regarding your query on "${message}", based on the video context, the speaker emphasizes optimizing configurations. This helps prevent latency issues.`,
    `Interesting! In ${title}, this concept is central. You can test your knowledge on this in the Quiz section, or check the generated mind map outline for visual details.`
  ];
  
  return {
    reply: replies[Math.floor(Math.random() * replies.length)]
  };
};
