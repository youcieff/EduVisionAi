"use client";
import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — EduVisionAI` : 'EduVisionAI';
    return () => { document.title = prev; };
  }, [title]);
};

export default useDocumentTitle;
