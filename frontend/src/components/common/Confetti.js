"use client";
import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Canvas Confetti — fires teal/cyan/gold particles for celebrations
 * Zero dependencies, pure Canvas2D
 */
const colors = ['#14B8A6', '#00D4FF', '#10B981', '#D4AF37', '#38BDF8', '#5EEAD4', '#F59E0B'];

const Confetti = ({ active, duration = 3000 }) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animFrame = useRef(null);

  const createParticle = useCallback((canvas) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 12;
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
      y: canvas.height * 0.4,
      vx: Math.cos(angle) * velocity * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.abs(Math.sin(angle) * velocity) - 2,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      opacity: 1,
      gravity: 0.15 + Math.random() * 0.1,
      drag: 0.98,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Burst particles
    particles.current = [];
    for (let i = 0; i < 150; i++) {
      particles.current.push(createParticle(canvas));
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration && particles.current.every(p => p.opacity <= 0.01)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach(p => {
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > duration * 0.6) {
          p.opacity *= 0.97;
        }

        if (p.opacity < 0.01) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animFrame.current = requestAnimationFrame(animate);
    };

    animate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [active, duration, createParticle]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
};

export default Confetti;
