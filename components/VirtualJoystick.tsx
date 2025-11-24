
import React, { useState, useRef, useEffect } from 'react';
import { Direction } from '../types';

interface VirtualJoystickProps {
  onDirectionChange: (dir: Direction) => void;
  enabled: boolean;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onDirectionChange, enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  
  const maxDist = 40;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsActive(true);
      updateJoystick(e.touches[0]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (isActive) {
        updateJoystick(e.touches[0]);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
    };

    const updateJoystick = (touch: Touch) => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        
        const distance = Math.min(Math.hypot(dx, dy), maxDist);
        
        // Normalize direction
        let moveX = 0;
        let moveY = 0;
        let dir: Direction | null = null;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { dir = Direction.RIGHT; moveX = distance; }
            else { dir = Direction.LEFT; moveX = -distance; }
        } else {
            if (dy > 0) { dir = Direction.DOWN; moveY = distance; }
            else { dir = Direction.UP; moveY = -distance; }
        }

        setKnobPos({ x: moveX, y: moveY });

        if (dir && distance > 10) {
            onDirectionChange(dir);
        }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isActive, onDirectionChange]);

  if (!enabled) return null;

  return (
    <div 
      ref={containerRef}
      className="md:hidden fixed bottom-12 left-1/2 -translate-x-1/2 sm:absolute sm:bottom-4 sm:left-10 sm:translate-x-0 w-[140px] h-[140px] rounded-full bg-black/40 border-2 border-white/40 touch-none z-50 backdrop-blur-sm shadow-xl"
      style={{
          backgroundImage: `
            linear-gradient(to bottom, transparent 48%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.2) 52%, transparent 52%),
            linear-gradient(to right, transparent 48%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.2) 52%, transparent 52%)
          `
      }}
    >
      <div 
        className="absolute top-1/2 left-1/2 w-[60px] h-[60px] bg-yellow-400 rounded-full border-4 border-orange-700 shadow-lg pointer-events-none"
        style={{
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
            transition: isActive ? 'none' : 'transform 0.2s ease-out'
        }}
      />
    </div>
  );
};

export default VirtualJoystick;
