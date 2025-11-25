

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameSettings, Snake, Cloud, Direction, GameState, MultiplayerState, NetworkPacket, InitPacket, UpdatePacket, GameEvent, NarrationPayload } from '../types';
import { SPEEDS, TILE_SIZE, YOPAL_FOODS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../constants';
import VirtualJoystick from './VirtualJoystick';
import { generateNarratorCommentary } from '../services/ai/narrator';
import { setMusicIntensity, setCoffeeMode } from '../services/audioService';
import { drawGame } from '../game/renderer';
import { updateGame, getRandomSafePosition, isOccupied } from '../game/logic';
import { multiplayerService } from '../services/multiplayerService';
import { useGameInput } from '../hooks/useGameInput';
import { useMultiplayerSync } from '../hooks/useMultiplayerSync';
import { useGameLoop } from '../hooks/useGameLoop';

interface GameCanvasProps {
  settings: GameSettings;
  gameMode: 1 | 2;
  isPlaying: boolean;
  backgroundUrl: string | null;
  virgenUrl: string | null;
  onGameOver: (score1: number, score2: number, msg: string, context: { score: number, cause: string }, chiguirosEaten: number, winner: 'p1' | 'p2' | 'tie' | null) => void;
  onScoreUpdate: (score1: number, score2: number) => void;
  onShowCommentary: (msg: string) => void;
  onSessionItemsUpdate: (items: string[]) => void;
  mpState: MultiplayerState;
  onMpInitData: (settings: GameSettings, bg: string | null, virgen: string | null) => void;
  onAssetsLoaded?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  settings,
  gameMode,
  isPlaying,
  backgroundUrl,
  virgenUrl,
  onGameOver,
  onScoreUpdate,
  onShowCommentary,
  onSessionItemsUpdate,
  mpState,
  onMpInitData,
  onAssetsLoaded
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({ width: '100%', height: 'auto' });
  
  // Independent timers for independent snake speeds
  const lastMoveTime1Ref = useRef<number>(0);
  const lastMoveTime2Ref = useRef<number>(0);
  
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const virgenImageRef = useRef<HTMLImageElement | null>(null);
  
  // Track loading status
  const [bgLoaded, setBgLoaded] = useState(false);
  const [virgenLoaded, setVirgenLoaded] = useState(false);

  // Buffer for remote input (Host side)
  const remoteInputRef = useRef<Direction | null>(null);

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
    lastMilestone: 0,
    sessionEatenItems: [],
    weather: 'sunny',
    rainIntensity: 0
  });

  const setDirection = useCallback((snake: Snake, dir: Direction) => {
      if (snake.dead) return;
      if (dir === Direction.UP && snake.dy === 0) { snake.nextDx = 0; snake.nextDy = -1; }
      if (dir === Direction.DOWN && snake.dy === 0) { snake.nextDx = 0; snake.nextDy = 1; }
      if (dir === Direction.LEFT && snake.dx === 0) { snake.nextDx = -1; snake.nextDy = 0; }
      if (dir === Direction.RIGHT && snake.dx === 0) { snake.nextDx = 1; snake.nextDy = 0; }
  }, []);

  // --- Event Handling (Controller) ---
  const handleGameEvents = useCallback((events: GameEvent[]) => {
      events.forEach(event => {
          switch(event.type) {
              case 'SCORE_UPDATE':
                  onScoreUpdate(event.payload.s1, event.payload.s2);
                  break;
              case 'GAME_OVER':
                  const p = event.payload;
                  // If Host, broadcast Game Over
                  if (mpState.active && mpState.role === 'host') {
                      multiplayerService.send({ type: 'GAME_OVER', payload: p });
                  }
                  onSessionItemsUpdate(stateRef.current.sessionEatenItems);
                  onGameOver(p.score1, p.score2, p.msg, p.context, p.chiguirosEaten, p.winner);
                  break;
              case 'MUSIC_INTENSITY':
                  setMusicIntensity(event.payload);
                  break;
              case 'NARRATION':
                  const narration = event.payload as NarrationPayload;
                  if (narration.text) {
                      onShowCommentary(narration.text);
                  } else {
                      generateNarratorCommentary(narration.type, narration.context).then(msg => {
                          if (stateRef.current.isRunning) onShowCommentary(msg);
                      });
                  }
                  break;
          }
      });
  }, [onScoreUpdate, onGameOver, onSessionItemsUpdate, onShowCommentary, mpState]);

  // --- Handlers for Hook Callbacks ---
  
  const handleUpdateReceived = useCallback((update: UpdatePacket) => {
      const currentState = stateRef.current;
      stateRef.current = {
          ...currentState,
          snake1: update.snake1,
          snake2: update.snake2,
          chiguiro: update.chiguiro,
          aguacate: update.aguacate,
          virgen: update.virgen,
          cafe: update.cafe,
          bomb: update.bomb,
          bola: update.bola,
          weather: update.weather,
          rainIntensity: update.rainIntensity,
          isRunning: update.isRunning,
          gameMode: update.gameMode 
      };
      onScoreUpdate(update.snake1.score, update.snake2.score);
  }, [onScoreUpdate]);

  const handleGameOverReceived = useCallback((payload: any) => {
      onGameOver(payload.s1, payload.s2, payload.msg, payload.context, payload.chiguirosEaten, payload.winner);
  }, [onGameOver]);

  const handleRemoteInputReceived = useCallback((dir: Direction) => {
      remoteInputRef.current = dir;
  }, []);

  // --- Use Custom Hooks ---

  // Network Sync Logic
  useMultiplayerSync(mpState, handleUpdateReceived, handleGameOverReceived, handleRemoteInputReceived);
  
  // Local Input Logic
  const handleInput = useCallback((dir: Direction) => {
      // If Client, send to Host
      if (mpState.active && mpState.role === 'client') {
          multiplayerService.send({ type: 'INPUT', payload: { dir } });
          return;
      }
      
      const { snake1, snake2 } = stateRef.current;
      
      // If Host, controls P1
      if (mpState.active && mpState.role === 'host') {
          setDirection(snake1, dir);
          return;
      }

      // Local Mode
      if (gameMode === 1) {
          setDirection(snake1, dir);
      } else {
          // Note: Specific key mapping for Local 2P (WASD vs Arrows) is handled in the useEffect below
          // This callback handles the generic "Direction Received" from Touch/Swipe or specific Key
          const { controlsSwapped } = settings;
          
          // Heuristic: If we are in 2P Local, we assume this generic input comes from 
          // a Swipe or Virtual Joystick, which defaults to controlling P1 (or the 'Arrow' snake)
          // For proper 2P Keyboard support, see the Keyboard Event listener below.
          const targetSnake = controlsSwapped ? snake2 : snake1;
          setDirection(targetSnake, dir);
      }
  }, [mpState, gameMode, settings, setDirection]);

  // Use Universal Input Hook (Touch + basic Keyboard)
  useGameInput(isPlaying, gameMode, settings, mpState, handleInput);
  
  // Specialized Keyboard Handler for Local 2P (WASD vs Arrows)
  useEffect(() => {
      const handleLocalKeys = (e: KeyboardEvent) => {
          if (!isPlaying || mpState.active) return; // MP handled by useGameInput
          if (gameMode === 1) return; // 1P handled by useGameInput

          const { snake1, snake2 } = stateRef.current;
          const { controlsSwapped } = settings;
          
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
      };

      window.addEventListener('keydown', handleLocalKeys);
      return () => window.removeEventListener('keydown', handleLocalKeys);
  }, [isPlaying, gameMode, settings, mpState.active, setDirection]);


  // Handle Asset Loading and Readiness
  useEffect(() => {
      if (backgroundUrl) {
          setBgLoaded(false);
          const img = new Image();
          img.src = backgroundUrl;
          img.onload = () => {
              bgImageRef.current = img;
              setBgLoaded(true);
          };
      } else {
          setBgLoaded(true); 
          bgImageRef.current = null;
      }
  }, [backgroundUrl]);

  useEffect(() => {
      if (virgenUrl) {
          setVirgenLoaded(false);
          const img = new Image();
          img.src = virgenUrl;
          img.onload = () => {
              virgenImageRef.current = img;
              setVirgenLoaded(true);
          };
      } else {
          setVirgenLoaded(true); 
          virgenImageRef.current = null;
      }
  }, [virgenUrl]);

  useEffect(() => {
      if (bgLoaded && virgenLoaded) {
          if (onAssetsLoaded) onAssetsLoaded();
      }
  }, [bgLoaded, virgenLoaded, onAssetsLoaded]);


  // Initialize Game
  const initGame = useCallback(() => {
    // HOST: Broadcast INIT packet to ensure clients are synced on start/restart
    if (mpState.active && mpState.role === 'host') {
        setTimeout(() => {
            const initPacket: NetworkPacket = {
                type: 'INIT',
                payload: {
                    settings,
                    backgroundUrl, 
                    virgenUrl
                } as InitPacket
            };
            multiplayerService.send(initPacket);
        }, 200);
    }

    // CLIENT: Set running and sync mode
    if (mpState.active && mpState.role === 'client') {
        stateRef.current.isRunning = true; 
        stateRef.current.gameMode = gameMode; // Force Mode 2 for MP
        
        // Reset local snakes to "Alive" to prevent "Game Over" flash before first UPDATE packet
        stateRef.current.snake1.dead = false;
        stateRef.current.snake2.dead = false;
        stateRef.current.snake1.body = [{x: -10, y: -10}]; 
        stateRef.current.snake2.body = [{x: -10, y: -10}];
        
        return; 
    }

    // Use Fixed Logic Resolution
    const tilesX = Math.floor(LOGICAL_WIDTH / TILE_SIZE);
    const tilesY = Math.floor(LOGICAL_HEIGHT / TILE_SIZE);

    // Generate Clouds 
    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
        const y = Math.random() * (LOGICAL_HEIGHT / 2);
        clouds.push({
            x: Math.random() * LOGICAL_WIDTH,
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
    
    let pos = getRandomSafePosition(tilesX, tilesY);
    let chiguiro = { 
        x: pos.x, 
        y: pos.y, 
        active: true, 
        timer: 0,
        name: randomFood
    };

    while (isOccupied(chiguiro.x, chiguiro.y, s1, s2)) {
        pos = getRandomSafePosition(tilesX, tilesY);
        chiguiro.x = pos.x;
        chiguiro.y = pos.y;
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
        lastMilestone: 0,
        sessionEatenItems: [],
        weather: 'sunny',
        rainIntensity: 0
    };
    
    onScoreUpdate(0, 0);
    setMusicIntensity(0); 
    setCoffeeMode(false);

    // Trigger Start Commentary
    generateNarratorCommentary('start').then(msg => {
        if(stateRef.current.isRunning) onShowCommentary(msg);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, onScoreUpdate, onShowCommentary, mpState]);

  // Game Loop Function
  const gameLoop = useCallback((time: number) => {
    // If not running, stop
    if (!stateRef.current.isRunning) return;

    // CLIENT MODE: Skip logic, just render state
    if (mpState.active && mpState.role === 'client') {
        const canvas = canvasRef.current;
        if (canvas) {
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 drawGame(
                    ctx, 
                    stateRef.current, 
                    { bgImage: bgImageRef.current, virgenImage: virgenImageRef.current }, 
                    time, 
                    settings.retroMode
                 );
             }
        }
        updateVisuals(time); 
        return;
    }

    // HOST/LOCAL MODE: Run Logic
    const baseInterval = SPEEDS[settings.difficulty];

    const getDynamicInterval = (score: number) => {
        const reduction = Math.floor(score / 50) * 4;
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
        
        // Host: Apply buffered remote input for Snake 2 before update
        if (mpState.active && mpState.role === 'host' && remoteInputRef.current) {
            setDirection(stateRef.current.snake2, remoteInputRef.current);
            remoteInputRef.current = null; // Consume input
        }

        const events: GameEvent[] = [];
        updateGame(
            stateRef.current,
            settings,
            moveP1,
            moveP2,
            events // Pass array to collect side effects
        );

        // Handle Side Effects
        handleGameEvents(events);
        
        // Host: Broadcast State
        if (mpState.active && mpState.role === 'host') {
             const packet: NetworkPacket = {
                 type: 'UPDATE',
                 payload: {
                    snake1: stateRef.current.snake1,
                    snake2: stateRef.current.snake2,
                    chiguiro: stateRef.current.chiguiro,
                    aguacate: stateRef.current.aguacate,
                    virgen: stateRef.current.virgen,
                    cafe: stateRef.current.cafe,
                    bomb: stateRef.current.bomb,
                    bola: stateRef.current.bola,
                    weather: stateRef.current.weather,
                    rainIntensity: stateRef.current.rainIntensity,
                    isRunning: stateRef.current.isRunning,
                    gameMode: stateRef.current.gameMode
                 } as UpdatePacket
             };
             multiplayerService.send(packet);
        }
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
                settings.retroMode
            );
        }
    }
  }, [settings.difficulty, settings.retroMode, settings.bombsEnabled, settings, gameMode, mpState, setDirection, handleGameEvents]); 

  // Initialize and Loop Hook
  useEffect(() => {
      if (isPlaying) {
          initGame();
          lastMoveTime1Ref.current = performance.now();
          lastMoveTime2Ref.current = performance.now();
      } else {
          stateRef.current.isRunning = false;
      }
  }, [isPlaying, initGame]);

  useGameLoop(gameLoop, isPlaying);


  const updateVisuals = (time: number) => {
      const state = stateRef.current;
      
      // Update Clouds (Dynamic floating)
      state.clouds.forEach(c => {
          c.x += c.speed;
          c.y = c.baseY + Math.sin(time * 0.001 + c.wobbleOffset) * 5; 
          if (c.x > LOGICAL_WIDTH) c.x = -c.size * 2;
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

  // Responsive Scaling Logic (Letterbox/Fit)
  useEffect(() => {
      const resize = () => {
          const container = canvasRef.current?.parentElement;
          if (container) {
              const availW = container.clientWidth;
              const availH = window.innerHeight - 120; 
              const scale = Math.min(availW / LOGICAL_WIDTH, availH / LOGICAL_HEIGHT);

              setCanvasStyle({
                  width: `${LOGICAL_WIDTH * scale}px`,
                  height: `${LOGICAL_HEIGHT * scale}px`,
                  imageRendering: settings.retroMode ? 'pixelated' : 'auto'
              });
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, [settings.retroMode]);

  return (
    <>
        <canvas 
            ref={canvasRef} 
            width={LOGICAL_WIDTH}
            height={LOGICAL_HEIGHT}
            style={canvasStyle}
            className={`mx-auto border-b-4 border-[#5D4037] touch-none ${settings.retroMode ? 'bg-[#99A906]' : 'bg-[#81C784]'}`} 
        />
        <VirtualJoystick enabled={settings.useJoystick} onDirectionChange={handleInput} />
    </>
  );
};

export default GameCanvas;
