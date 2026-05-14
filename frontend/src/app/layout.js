import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'EduVisionAI — AI-Powered Education Platform',
  description: 'Transform videos, documents, and images into smart summaries, quizzes, and flashcards instantly with AI. The ultimate study companion.',
  keywords: ['AI education', 'video summarizer', 'quiz generator', 'flashcards', 'study tool', 'EduVisionAI'],
  authors: [{ name: 'EduVisionAI Team' }],
  creator: 'EduVisionAI',
  metadataBase: new URL('https://eduvisionai.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eduvisionai.com',
    siteName: 'EduVisionAI',
    title: 'EduVisionAI — AI-Powered Education Platform',
    description: 'Transform videos, documents, and images into smart summaries, quizzes, and flashcards instantly with AI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EduVisionAI — Study Smarter with AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduVisionAI — AI-Powered Education Platform',
    description: 'Transform videos, documents, and images into smart summaries, quizzes, and flashcards instantly with AI.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo192.png',
  },
};

export const viewport = {
  themeColor: '#14B8A6',
  width: 'device-width',
  initialScale: 1,
};

// Blocking script to prevent theme flash (FOUC)
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('eduvision-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.setAttribute('data-theme', t);
  } catch(e){}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
