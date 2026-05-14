"use client";
import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — Animates a number from 0 to target value
 * @param {number} target — final value
 * @param {number} duration — animation duration in ms  
 * @param {boolean} trigger — start animation when true
 * @returns {number} current animated value
 */
const useCountUp = (target, duration = 1200, trigger = true) => {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const animFrame = useRef(null);

  useEffect(() => {
    if (!trigger || target === 0) {
      setValue(target);
      return;
    }

    setValue(0);
    startTime.current = null;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [target, duration, trigger]);

  return value;
};

export default useCountUp;
