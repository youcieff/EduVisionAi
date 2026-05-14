"use client";
import confetti from 'canvas-confetti';

const COLORS_TEAL = ['#14B8A6', '#00D4FF', '#10B981', '#2DD4BF', '#0EA5E9'];
const COLORS_GOLD = ['#D4AF37', '#F59E0B', '#FBBF24', '#FDE68A', '#F97316'];

function fireConfetti(colors, particleCount = 100) {
  const end = Date.now() + 1500;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  // Big center burst
  confetti({
    particleCount,
    spread: 120,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors,
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
  });
}

export function celebratePerfectScore() {
  fireConfetti(COLORS_GOLD, 150);
}

export function celebrateLevelUp() {
  fireConfetti(COLORS_TEAL, 120);
}

export function celebrateQuizPass() {
  confetti({
    particleCount: 60,
    spread: 80,
    origin: { y: 0.65 },
    colors: COLORS_TEAL,
    ticks: 150,
  });
}
