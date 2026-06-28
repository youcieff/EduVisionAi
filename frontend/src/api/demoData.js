/**
 * EduVisionAI - Mock Data and Engines for Offline Showcase (Demo Mode)
 */

export const mockUser = {
  id: 'demo-user',
  username: 'Guest Student',
  email: 'guest@eduvision.ai',
  role: 'admin',
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
    _id: 'vid1',
    title: 'Introduction to Artificial Intelligence (AI) for Beginners',
    duration: '09:45',
    thumbnail: 'https://img.youtube.com/vi/2ePf9rue1Ao/0.jpg',
    youtubeId: '2ePf9rue1Ao',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-27T10:00:00.000Z',
    likes: 12,
    byUser: 'demo-user'
  },
  {
    _id: 'vid2',
    title: 'React 19 & Next.js 15: Clean Architecture Principles',
    duration: '12:20',
    thumbnail: 'https://img.youtube.com/vi/8aGhZQkoFbQ/0.jpg',
    youtubeId: '8aGhZQkoFbQ',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-28T09:30:00.000Z',
    likes: 8,
    byUser: 'demo-user'
  },
  {
    _id: 'vid3',
    title: 'How ChatGPT and LLMs Work Under the Hood',
    duration: '15:10',
    thumbnail: 'https://img.youtube.com/vi/5sLYAJKMV-I/0.jpg',
    youtubeId: '5sLYAJKMV-I',
    source: 'youtube',
    status: 'processed',
    createdAt: '2026-06-28T18:15:00.000Z',
    likes: 24,
    byUser: 'demo-user'
  }
];

export const mockVideoDetails = {
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
