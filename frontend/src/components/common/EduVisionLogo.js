"use client";
import React from 'react';
import Image from 'next/image';

/**
 * EduVisionAI Logo — AI Brain-Lightbulb Icon
 * Uses the generated PNG for maximum clarity at any size.
 */
const EduVisionLogo = ({ size = 24, className = '' }) => (
  <Image
    src="/eduvision-logo.png"
    alt="EduVisionAI"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    priority
  />
);

export default EduVisionLogo;
