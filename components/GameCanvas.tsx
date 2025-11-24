
import React, { useRef, useEffect, useCallback } from 'react';
import { GameSettings, Snake, Cloud, Direction, GameState } from '../types';
import { SPEEDS, TILE_SIZE, YOPAL_FOODS } from '../constants';
import VirtualJoystick from './VirtualJoystick';
import { generateNarratorCommentary } from '../services/aiService';
import { setMusicIntensity, setCoffeeMode } from '../services/audioService';
import { drawGame } from '../game/renderer';
import { updateGame } from '../game/logic';

interface GameCanvasProps {
  settings: GameSettings;
  gameMode: 1 | 2;
  isPlaying: boolean;
  backgroundUrl: string | null;
  virgenUrl: string | null;
  onGameOver: (score1: number, score2: number, msg: string, context: { score: number, cause: string }, chiguirosEaten: number, winner: 'p1' | 'p2' | 'tie' | null) => void;
  onScoreUpdate: (score1: number, score2: number) => void;
  onShowCommentary: (msg: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  settings,
  gameMode,
  isPlaying,
  backgroundUrl,
  virgenUrl,
  onGameOver,
  onScoreUpdate,
  onShowCommentary
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Independent timers for independent snake speeds
  const lastMoveTime1Ref = useRef<number>(0);
  const lastMoveTime2Ref = useRef<number>(0);
  
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const virgenImageRef = useRef<HTMLImageElement | null>(null);
  
  // Game State Ref
  const stateRef = useRef<GameState>({
    snake1: { body: [], dx: 1, dy: 0, nextDx: 1, nextDy: 0, score: 0, colorType: 'orchid', name: 'P1', dead: false, immunityTimer: 0 },
    snake2: { body: [], dx: 1, dy: 0, nextDx: 1, nextDy: 0, score: 0, colorType: 'colombia', name: 'P2', dead: false, immunityTimer: 0 },
    chiguiro: { x: 0, y: 0, active: true, timer: 0, name: YOPAL_FOODS[0] },
    aguacate: { active: false, x: 0, y: 0, timer: 0 },
    virgen: { active: false, x: 0, y: 0, timer: 0 },
    cafe: { active: false, x: 0, y: 0, timer: 0 },
    bomb: { active: false, x: 0, y: 0, timer: 0 },
    bola: { active: false, x: 0, y: 0, moveTimer: 0 },
    clouds: [],
    particles: [],
    gameMode: 1,
    isRunning: false,
    winnerMsg: '',
    backgroundUrl: null,
    narratorText: '',
    chiguirosEaten: 0,
    lastMilestone: 0
  });

  // Load Background Image
  useEffect(() => {
      if (backgroundUrl) {
          const img = new Image();
          img.src = backgroundUrl;
          img.onload = () => {
              bgImageRef.current = img;
          };
      }
  }, [backgroundUrl]);

  // Load Virgen Image
  useEffect(() => {
    if (virgenUrl) {
        const img = new Image();
        img.src = virgenUrl;
        img.onload = () => {
            virgenImageRef.current = img;
        };
    }
  }, [virgenUrl]);

  const isOccupied = (x: number, y: number, s1: Snake, s2: Snake) => {
    if (s1.body.some(p => p.x === x && p.y === y)) return true;
    if (s2.body.length > 0 && s2.body.some(p => p.x === x && p.y === y)) return true;
    return false;
  };

  // Initialize Game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tilesX = Math.floor(canvas.width / TILE_SIZE);
    const tilesY = Math.floor(canvas.height / TILE_SIZE);

    // Generate Clouds with visual properties
    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
        const y = Math.random() * (canvas.height / 2);
        clouds.push({
            x: Math.random() * canvas.width,
            y: y,
            baseY: y,
            speed: 0.2 + Math.random() * 0.5,
            size: 30 + Math.random() * 40,
            wobbleOffset: Math.random() * Math.PI * 2
        });
    }

    let s1: Snake, s2: Snake;

    if (gameMode === 1) {
        s1 = {
            body: [
                {x: Math.floor(tilesX/2), y: Math.floor(tilesY/2)},
                {x: Math.floor(tilesX/2)-1, y: Math.floor(tilesY/2)},
                {x: Math.floor(tilesX/2)-2, y: Math.floor(tilesY/2)}
            ],
            dx: 1, dy: 0, nextDx: 1, nextDy: 0,
            score: 0,
            colorType: 'colombia',
            name: "El Llanero",
            dead: false,
            immunityTimer: 0
        };
        s2 = { body: [], dx: 0, dy: 0, nextDx: 0, nextDy: 0, score: 0, colorType: 'colombia', name: 'CPU', dead: true, immunityTimer: 0 };
    } else {
        s1 = {
            body: [
                {x: tilesX - 5, y: Math.floor(tilesY/2)},
                {x: tilesX - 4, y: Math.floor(tilesY/2)},
                {x: tilesX - 3, y: Math.floor(tilesY/2)}
            ],
            dx: -1, dy: 0, nextDx: -1, nextDy: 0,
            score: 0,
            colorType: 'colombia',
            name: "Tricolor",
            dead: false,
            immunityTimer: 0
        };
        s2 = {
            body: [
                {x: 4, y: Math.floor(tilesY/2)},
                {x: 3, y: Math.floor(tilesY/2)},
                {x: 2, y: Math.floor(tilesY/2)}
            ],
            dx: 1, dy: 0, nextDx: 1, nextDy: 0,
            score: 0,
            colorType: 'orchid',
            name: "Orquídea",
            dead: false,
            immunityTimer: 0
        };
    }

    // Initial Food
    const randomFood = YOPAL_FOODS[Math.floor(Math.random() * YOPAL_FOODS.length)];
    
    let chiguiro = { 
        x: Math.floor(Math.random() * tilesX), 
        y: Math.floor(Math.random() * tilesY), 
        active: true, 
        timer: 0,
        name: randomFood
    };

    while (isOccupied(chiguiro.x, chiguiro.y, s1, s2)) {
        chiguiro.x = Math.floor(Math.random() * tilesX);
        chiguiro.y = Math.floor(Math.random() * tilesY);
    }

    stateRef.current = {
        snake1: s1,
        snake2: s2,
        chiguiro,
        aguacate: { active: false, x: 0, y: 0, timer: 0 },
        virgen: { active: false, x: 0, y: 0, timer: 0 },
        cafe: { active: false, x: 0, y: 0, timer: 0 },
        bomb: { active: false, x: 0, y: 0, timer: 0 },
        bola: { active: false, x: 0, y: 0, moveTimer: 0 },
        clouds,
        particles: [],
        gameMode,
        isRunning: true,
        winnerMsg: '',
        backgroundUrl: stateRef.current.backgroundUrl,
        narratorText: '',
        chiguirosEaten: 0,
        lastMilestone: 0
    };
    
    onScoreUpdate(0, 0);
    setMusicIntensity(0); // Reset audio
    setCoffeeMode(false);

    // Trigger Start Commentary
    generateNarratorCommentary('start').then(msg => {
        if(stateRef.current.isRunning) onShowCommentary(msg);
    });

  }, [gameMode, onScoreUpdate, onShowCommentary]);

  const setDirection = (snake: Snake, dir: Direction) => {
      if (snake.dead) return;
      if (dir === Direction.UP && snake.dy === 0) { snake.nextDx = 0; snake.nextDy = -1; }
      if (dir === Direction.DOWN && snake.dy === 0) { snake.nextDx = 0; snake.nextDy = 1; }
      if (dir === Direction.LEFT && snake.dx === 0) { snake.nextDx = -1; snake.nextDy = 0; }
      if (dir === Direction.RIGHT && snake.dx === 0) { snake.nextDx = 1; snake.nextDy = 0; }
  };

  // Input Handling
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!isPlaying) return;
          
          const { snake1, snake2 } = stateRef.current;
          const { controlsSwapped } = settings;

          if (gameMode === 1) {
              if (['ArrowUp', 'w', 'W'].includes(e.key)) setDirection(snake1, Direction.UP);
              if (['ArrowDown', 's', 'S'].includes(e.key)) setDirection(snake1, Direction.DOWN);
              if (['ArrowLeft', 'a', 'A'].includes(e.key)) setDirection(snake1, Direction.LEFT);
              if (['ArrowRight', 'd', 'D'].includes(e.key)) setDirection(snake1, Direction.RIGHT);
          } else {
              const arrowSnake = controlsSwapped ? snake2 : snake1;
              const wasdSnake = controlsSwapped ? snake1 : snake2;

              if (e.key === 'ArrowUp') setDirection(arrowSnake, Direction.UP);
              if (e.key === 'ArrowDown') setDirection(arrowSnake, Direction.DOWN);
              if (e.key === 'ArrowLeft') setDirection(arrowSnake, Direction.LEFT);
              if (e.key === 'ArrowRight') setDirection(arrowSnake, Direction.RIGHT);

              if (['w', 'W'].includes(e.key)) setDirection(wasdSnake, Direction.UP);
              if (['s', 'S'].includes(e.key)) setDirection(wasdSnake, Direction.DOWN);
              if (['a', 'A'].includes(e.key)) setDirection(wasdSnake, Direction.LEFT);
              if (['d', 'D'].includes(e.key)) setDirection(wasdSnake, Direction.RIGHT);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameMode, settings]);

  // Swipe Handling
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!stateRef.current.isRunning) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal
            if (Math.abs(dx) > 30) {
                setDirection(stateRef.current.snake1, dx > 0 ? Direction.RIGHT : Direction.LEFT);
            }
        } else {
            // Vertical
            if (Math.abs(dy) > 30) {
                setDirection(stateRef.current.snake1, dy > 0 ? Direction.DOWN : Direction.UP);
            }
        }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleGameOverWrapper = useCallback((...args: Parameters<typeof onGameOver>) => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      onGameOver(...args);
  }, [onGameOver]);

  // Game Loop
  const loop = useCallback((time: number) => {
    if (!stateRef.current.isRunning) return;

    const baseInterval = SPEEDS[settings.difficulty];

    // Dynamic Difficulty: Speed increases with score
    // Decrease interval by 4ms for every 50 points
    // This allows the game to naturally speed up as the player gets better
    const getDynamicInterval = (score: number) => {
        const reduction = Math.floor(score / 50) * 4;
        // Cap the speed at 40ms to keep it playable
        return Math.max(40, baseInterval - reduction);
    };

    const speedP1 = getDynamicInterval(stateRef.current.snake1.score);
    const speedP2 = getDynamicInterval(stateRef.current.snake2.score);
    
    // Check Coffee Logic: Boost individual speed if immune (0.6x multiplier)
    const intervalP1 = stateRef.current.snake1.immunityTimer > 0 
        ? speedP1 * 0.6 
        : speedP1;
    
    const intervalP2 = stateRef.current.snake2.immunityTimer > 0 
        ? speedP2 * 0.6 
        : speedP2;
    
    // Check Music Mode
    const hasCoffee = stateRef.current.snake1.immunityTimer > 0 || stateRef.current.snake2.immunityTimer > 0;
    setCoffeeMode(hasCoffee);

    const deltaTime1 = time - lastMoveTime1Ref.current;
    const deltaTime2 = time - lastMoveTime2Ref.current;
    
    let moveP1 = false;
    let moveP2 = false;

    // Determine if P1 should move
    if (deltaTime1 >= intervalP1) {
        moveP1 = true;
        lastMoveTime1Ref.current = time;
    }

    // Determine if P2 should move (Only in Game Mode 2)
    if (gameMode === 2 && deltaTime2 >= intervalP2) {
        moveP2 = true;
        lastMoveTime2Ref.current = time;
    }

    const canvas = canvasRef.current;
    
    // Logic Update (Only if at least one snake moves)
    if ((moveP1 || moveP2) && canvas) {
        updateGame(
            stateRef.current,
            settings,
            canvas.width,
            canvas.height,
            {
                onScoreUpdate,
                onGameOver: handleGameOverWrapper,
                onShowCommentary
            },
            moveP1,
            moveP2
        );
    }

    // Visual Update (Clouds, Particles) - Always runs for smoothness
    updateVisuals(time);

    // Draw
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            drawGame(
                ctx, 
                stateRef.current, 
                { bgImage: bgImageRef.current, virgenImage: virgenImageRef.current }, 
                time, 
                canvas.width, 
                canvas.height
            );
        }
    }
    
    requestRef.current = requestAnimationFrame(loop);
  }, [settings.difficulty, settings.bombsEnabled, onScoreUpdate, handleGameOverWrapper, onShowCommentary, settings, gameMode]); 

  useEffect(() => {
      if (isPlaying) {
          initGame();
          lastMoveTime1Ref.current = performance.now();
          lastMoveTime2Ref.current = performance.now();
          requestRef.current = requestAnimationFrame(loop);
      } else {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          stateRef.current.isRunning = false;
      }
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [isPlaying, initGame, loop]);

  const updateVisuals = (time: number) => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Update Clouds (Dynamic floating)
      state.clouds.forEach(c => {
          c.x += c.speed;
          c.y = c.baseY + Math.sin(time * 0.001 + c.wobbleOffset) * 5; // Gentle up/down
          if (c.x > canvas.width) c.x = -c.size * 2;
      });

      // Update Particles
      state.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03; 
          p.vy += 0.15; // Gravity
      });
      state.particles = state.particles.filter(p => p.life > 0);
  };

  // Resize Logic
  useEffect(() => {
      const resize = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const container = canvas.parentElement;
          if (container) {
              const width = Math.min(container.clientWidth, 900);
              
              // Responsive height calculation
              // Subtract rough header height (160px) and padding
              const availableHeight = window.innerHeight - 180; 
              // Set a reasonable min/max range for gameplay
              const height = Math.min(Math.max(300, availableHeight), 800);
              
              canvas.width = Math.floor(width / TILE_SIZE) * TILE_SIZE;
              canvas.height = Math.floor(height / TILE_SIZE) * TILE_SIZE;
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, []);

  const handleJoystickDir = useCallback((dir: Direction) => {
      setDirection(stateRef.current.snake1, dir);
  }, []);

  return (
    <>
        <canvas ref={canvasRef} className="bg-[#81C784] max-w-full mx-auto border-b-4 border-[#5D4037] touch-none" />
        <VirtualJoystick enabled={settings.useJoystick} onDirectionChange={handleJoystickDir} />
    </>
  );
};

export default GameCanvas;
