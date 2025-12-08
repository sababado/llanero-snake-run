
import React, { useState, useRef, useEffect } from 'react';
import { Direction } from '../types';

interface VirtualJoystickProps {
  onDirectionChange: (dir: Direction) => void;
  enabled: boolean;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onDirectionChange, enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDirRef = useRef<Direction | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  
  const maxDist = 40;
  const deadZone = 10;

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
      // Don't reset lastDirRef so we don't send a stop signal (snake keeps moving)
    };

    const updateJoystick = (touch: Touch) => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const distance = Math.hypot(dx, dy);

        // Deadzone check
        if (distance < deadZone) {
             setKnobPos({ x: 0, y: 0 });
             return; 
        }

        let newDir: Direction | null = null;
        let visualX = 0;
        let visualY = 0;

        // 4-WAY AXIS LOCK LOGIC
        // Determine dominant axis and snap both Logic and Visuals to it.
        if (absX > absY) {
             // Horizontal Axis Dominant
             const sign = Math.sign(dx);
             // Snap visual knob to X axis, clamp to maxDist
             visualX = sign * Math.min(absX, maxDist);
             visualY = 0; 
             newDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
             // Vertical Axis Dominant
             const sign = Math.sign(dy);
             // Snap visual knob to Y axis, clamp to maxDist
             visualX = 0;
             visualY = sign * Math.min(absY, maxDist);
             newDir = dy > 0 ? Direction.DOWN : Direction.UP;
        }

        setKnobPos({ x: visualX, y: visualY });

        // Only fire event if direction actually changed
        if (newDir && newDir !== lastDirRef.current) {
            lastDirRef.current = newDir;
            onDirectionChange(newDir);
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
      className="md:hidden fixed bottom-12 left-1/2 -translate-x-1/2 sm:absolute sm:bottom-4 sm:left-10 sm:translate-x-0 w-[140px] h-[140px] rounded-full bg-black/40 border-4 border-white/20 touch-none z-50 backdrop-blur-sm shadow-2xl"
      style={{
          // Crosshair background to indicate axes
          backgroundImage: `
            linear-gradient(to bottom, transparent 48%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.15) 52%, transparent 52%),
            linear-gradient(to right, transparent 48%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.15) 52%, transparent 52%)
          `
      }}
    >
      <div 
        className="absolute top-1/2 left-1/2 w-[60px] h-[60px] bg-yellow-400 rounded-full border-4 border-orange-700 shadow-lg pointer-events-none"
        style={{
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
            transition: isActive ? 'transform 0.05s linear' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Visual Grip Details */}
        <div className="absolute inset-2 border-2 border-orange-500/50 rounded-full"></div>
      </div>
    </div>
  );
};

export default VirtualJoystick;
