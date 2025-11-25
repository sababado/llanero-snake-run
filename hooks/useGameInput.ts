
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
            
            // Client Mode: Map WSAD and Arrows to same output
            if (mpState.active && mpState.role === 'client') {
                let dir: Direction | null = null;
                if (['ArrowUp', 'w', 'W'].includes(e.key)) dir = Direction.UP;
                if (['ArrowDown', 's', 'S'].includes(e.key)) dir = Direction.DOWN;
                if (['ArrowLeft', 'a', 'A'].includes(e.key)) dir = Direction.LEFT;
                if (['ArrowRight', 'd', 'D'].includes(e.key)) dir = Direction.RIGHT;
                if (dir) onInput(dir);
                return;
            }

            // Host Mode: Map WSAD and Arrows to same output (Host controls P1)
            if (mpState.active && mpState.role === 'host') {
                 let dir: Direction | null = null;
                 if (['ArrowUp', 'w', 'W'].includes(e.key)) dir = Direction.UP;
                 if (['ArrowDown', 's', 'S'].includes(e.key)) dir = Direction.DOWN;
                 if (['ArrowLeft', 'a', 'A'].includes(e.key)) dir = Direction.LEFT;
                 if (['ArrowRight', 'd', 'D'].includes(e.key)) dir = Direction.RIGHT;
                 if (dir) onInput(dir);
                 return;
            }

            // Local Mode
            // P1 Controls
            if (['ArrowUp', 'w', 'W'].includes(e.key)) {
                // In 1P mode, WASD works for P1 too
                if (gameMode === 1) onInput(Direction.UP); 
                else if (e.key === 'ArrowUp') onInput(Direction.UP); // Specific key checks for 2P handled in Canvas logic usually, but simplified here
            }

            // Note: For strict 2P local controls (Split keyboard), we pass the raw event to logic usually.
            // However, to keep this hook pure, we'll map specific keys to specific callback invocations if needed.
            // For now, we'll rely on the existing GameCanvas logic handling P1/P2 splitting via `handleLocalInput` 
            // which this hook's consumer will likely wrap.
            
            // Actually, to fully refactor, GameCanvas needs to know WHICH player pressed what.
            // But `handleLocalInput` in GameCanvas currently takes just a Direction and applies it to P1 or P2 based on context?
            // Re-reading GameCanvas: `handleLocalInput` sets direction for "Local Player" or handles P1.
            // The KeyboardEvent listener in GameCanvas handled strict P1 vs P2 keys.
            
            // Let's replicate the specific key mapping here:
        };
        
        // Because Local 2P logic relies on distinguishing 'w' from 'ArrowUp', 
        // a single `onInput(dir)` callback isn't enough for Local 2P.
        // We will leave the specific key mapping inside GameCanvas for Local 2P for now, 
        // OR we change the callback signature to `onInput(dir, playerIndex?)`.
        
        // For this refactor step, we will only extract the Touch handling which is generic, 
        // and leave Keyboard handling in GameCanvas because of the complexity of 2P Local mappings 
        // vs Network mappings.
        // Wait, I can expose the event! 
        
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
