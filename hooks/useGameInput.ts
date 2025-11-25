
import { useEffect } from 'react';
import { Direction, GameSettings, MultiplayerState } from '../types';

export const useGameInput = (
    isPlaying: boolean,
    gameMode: 1 | 2,
    settings: GameSettings,
    mpState: MultiplayerState,
    onInput: (dir: Direction) => void
) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            
            let dir: Direction | null = null;
            if (['ArrowUp', 'w', 'W'].includes(e.key)) dir = Direction.UP;
            else if (['ArrowDown', 's', 'S'].includes(e.key)) dir = Direction.DOWN;
            else if (['ArrowLeft', 'a', 'A'].includes(e.key)) dir = Direction.LEFT;
            else if (['ArrowRight', 'd', 'D'].includes(e.key)) dir = Direction.RIGHT;

            // Prevent default scrolling for arrow keys if they are game controls
            if (dir && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            if (!dir) return;

            // Multiplayer Handling (Both Host and Client map keys to generic onInput)
            if (mpState.active) {
                onInput(dir);
                return;
            }

            // Local 1P Mode (WASD or Arrows control the single snake)
            if (gameMode === 1) {
                onInput(dir);
            }

            // Note: Local 2P Mode keyboard handling (Split keys) is explicitly managed 
            // in GameCanvas.tsx to distinguish between P1 (WASD) and P2 (Arrows).
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameMode, settings, mpState, onInput]);
    
    // Swipe Handling (Universal)
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;
    
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
    
        const handleTouchEnd = (e: TouchEvent) => {
            if (!isPlaying) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) {
                    onInput(dx > 0 ? Direction.RIGHT : Direction.LEFT);
                }
            } else {
                if (Math.abs(dy) > 30) {
                    onInput(dy > 0 ? Direction.DOWN : Direction.UP);
                }
            }
        };
    
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
    
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
      }, [isPlaying, onInput]);
};
