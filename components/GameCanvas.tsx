
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameSettings, Snake, Direction, GameState, MultiplayerState, NetworkPacket, UpdatePacket, GameEvent, NarrationPayload, CollisionPayload } from '../types';
import { SPEEDS } from '../constants';
import VirtualJoystick from './VirtualJoystick';
import { generateNarratorCommentary } from '../services/ai/narrator';
import { setMusicIntensity, setCoffeeMode, playCrashSound } from '../services/audioService';
import { drawGame } from '../game/renderer';
import { updateGame, spawnParticles } from '../game/logic';
import { createInitialState } from '../game/initialization';
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
  initialGridSize: { width: number; height: number } | null;
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
  onAssetsLoaded,
  initialGridSize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({ width: '100%', height: 'auto' });
  
  // Timers
  const lastMoveTime1Ref = useRef<number>(0);
  const lastMoveTime2Ref = useRef<number>(0);
  
  // Assets
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const virgenImageRef = useRef<HTMLImageElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [virgenLoaded, setVirgenLoaded] = useState(false);

  // Buffer for remote input (Host side)
  const remoteInputRef = useRef<Direction | null>(null);

  // Game State Ref (Initialized via Factory)
  const stateRef = useRef<GameState>(createInitialState(1, null, false, 800, 800));

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
                      generateNarratorCommentary(narration.type, settings.language, narration.context).then(msg => {
                          if (stateRef.current.isRunning) onShowCommentary(msg);
                      });
                  }
                  break;
              case 'COLLISION_IMPACT':
                  const collision = event.payload as CollisionPayload;
                  if (settings.musicEnabled) playCrashSound();
                  spawnParticles(stateRef.current, collision.x, collision.y, '#FFFFFF', 20);
                  spawnParticles(stateRef.current, collision.x, collision.y, '#FF0000', 10);
                  break;
          }
      });
  }, [onScoreUpdate, onGameOver, onSessionItemsUpdate, onShowCommentary, mpState, settings.musicEnabled, settings.language]);

  // --- Network Sync ---
  
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
          gameMode: update.gameMode,
          gridSize: update.gridSize || currentState.gridSize // Sync dimensions if provided
      };
      onScoreUpdate(update.snake1.score, update.snake2.score);
  }, [onScoreUpdate]);

  const handleGameOverReceived = useCallback((payload: any) => {
      onGameOver(payload.s1, payload.s2, payload.msg, payload.context, payload.chiguirosEaten, payload.winner);
  }, [onGameOver]);

  const handleRemoteInputReceived = useCallback((dir: Direction) => {
      remoteInputRef.current = dir;
  }, []);

  useMultiplayerSync(mpState, handleUpdateReceived, handleGameOverReceived, handleRemoteInputReceived);
  
  // --- Input Logic ---

  const handleInput = useCallback((dir: Direction) => {
      if (mpState.active && mpState.role === 'client') {
          multiplayerService.send({ type: 'INPUT', payload: { dir } });
          return;
      }
      const { snake1, snake2 } = stateRef.current;
      
      if (mpState.active && mpState.role === 'host') {
          setDirection(snake1, dir);
          return;
      }

      if (gameMode === 1) {
          setDirection(snake1, dir);
      } else {
          const { controlsSwapped } = settings;
          const targetSnake = controlsSwapped ? snake2 : snake1;
          setDirection(targetSnake, dir);
      }
  }, [mpState, gameMode, settings, setDirection]);

  useGameInput(isPlaying, gameMode, settings, mpState, handleInput);
  
  // Local 2P Keyboard Handler
  useEffect(() => {
      const handleLocalKeys = (e: KeyboardEvent) => {
          if (!isPlaying || mpState.active) return;
          if (gameMode === 1) return;

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

  // --- Assets ---

  useEffect(() => {
      if (backgroundUrl) {
          setBgLoaded(false);
          const img = new Image();
          img.src = backgroundUrl;
          img.onload = () => { bgImageRef.current = img; setBgLoaded(true); };
      } else {
          setBgLoaded(true); bgImageRef.current = null;
      }
  }, [backgroundUrl]);

  useEffect(() => {
      if (virgenUrl) {
          setVirgenLoaded(false);
          const img = new Image();
          img.src = virgenUrl;
          img.onload = () => { virgenImageRef.current = img; setVirgenLoaded(true); };
      } else {
          setVirgenLoaded(true); virgenImageRef.current = null;
      }
  }, [virgenUrl]);

  useEffect(() => {
      if (bgLoaded && virgenLoaded && onAssetsLoaded) {
          onAssetsLoaded();
      }
  }, [bgLoaded, virgenLoaded, onAssetsLoaded]);

  // --- Init ---
  const initGame = useCallback(() => {
    // Use negotiated size for MP, or passed initial size for local
    const width = initialGridSize?.width || 800;
    const height = initialGridSize?.height || 800;

    // Factory Call
    stateRef.current = createInitialState(
        gameMode, 
        stateRef.current.backgroundUrl, 
        mpState.active && mpState.role === 'client',
        width,
        height
    );
    
    // Reset side effects
    onScoreUpdate(0, 0);
    setMusicIntensity(0); 
    setCoffeeMode(false);

    if (stateRef.current.isRunning) {
        generateNarratorCommentary('start', settings.language).then(msg => {
            if(stateRef.current.isRunning) onShowCommentary(msg);
        });
    }
  }, [gameMode, onScoreUpdate, onShowCommentary, mpState, initialGridSize, settings.language]);

  // --- Game Loop ---
  const gameLoop = useCallback((time: number) => {
    if (!stateRef.current.isRunning) return;

    // CLIENT: Render Only
    if (mpState.active && mpState.role === 'client') {
        const canvas = canvasRef.current;
        if (canvas) {
             const ctx = canvas.getContext('2d');
             if (ctx) drawGame(ctx, stateRef.current, { bgImage: bgImageRef.current, virgenImage: virgenImageRef.current }, time, settings.retroMode);
        }
        updateVisuals(time); 
        return;
    }

    // HOST/LOCAL: Logic
    const baseInterval = SPEEDS[settings.difficulty];
    const getDynamicInterval = (score: number) => Math.max(40, baseInterval - (Math.floor(score / 50) * 4));
    
    const speedP1 = getDynamicInterval(stateRef.current.snake1.score);
    const speedP2 = getDynamicInterval(stateRef.current.snake2.score);
    
    const intervalP1 = stateRef.current.snake1.immunityTimer > 0 ? speedP1 * 0.6 : speedP1;
    const intervalP2 = stateRef.current.snake2.immunityTimer > 0 ? speedP2 * 0.6 : speedP2;
    
    setCoffeeMode(stateRef.current.snake1.immunityTimer > 0 || stateRef.current.snake2.immunityTimer > 0);

    const deltaTime1 = time - lastMoveTime1Ref.current;
    const deltaTime2 = time - lastMoveTime2Ref.current;
    
    let moveP1 = false;
    let moveP2 = false;

    if (deltaTime1 >= intervalP1) { moveP1 = true; lastMoveTime1Ref.current = time; }
    if (gameMode === 2 && deltaTime2 >= intervalP2) { moveP2 = true; lastMoveTime2Ref.current = time; }

    const canvas = canvasRef.current;
    
    if ((moveP1 || moveP2) && canvas) {
        if (mpState.active && mpState.role === 'host' && remoteInputRef.current) {
            setDirection(stateRef.current.snake2, remoteInputRef.current);
            remoteInputRef.current = null;
        }

        const events: GameEvent[] = [];
        updateGame(stateRef.current, settings, moveP1, moveP2, events);
        handleGameEvents(events);
        
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
                    gameMode: stateRef.current.gameMode,
                    gridSize: stateRef.current.gridSize // Sync Grid Size
                 } as UpdatePacket
             };
             multiplayerService.send(packet);
        }
    }

    updateVisuals(time);

    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawGame(ctx, stateRef.current, { bgImage: bgImageRef.current, virgenImage: virgenImageRef.current }, time, settings.retroMode);
    }
  }, [settings, gameMode, mpState, setDirection, handleGameEvents]); 

  // --- Initialize and Loop ---
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
      const { width } = state.gridSize;
      
      state.clouds.forEach(c => {
          c.x += c.speed;
          c.y = c.baseY + Math.sin(time * 0.001 + c.wobbleOffset) * 5; 
          if (c.x > width) c.x = -c.size * 2;
      });
      state.particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.life -= 0.03; p.vy += 0.15;
      });
      state.particles = state.particles.filter(p => p.life > 0);
  };

  // --- Responsive Resize (Dynamic Scaling) ---
  useEffect(() => {
      const resize = () => {
          const container = canvasRef.current?.parentElement;
          if (container && stateRef.current.gridSize) {
              const gridW = stateRef.current.gridSize.width;
              const gridH = stateRef.current.gridSize.height;
              
              const availW = container.clientWidth;
              const availH = window.innerHeight - 120; 
              
              const scale = Math.min(availW / gridW, availH / gridH);
              
              setCanvasStyle({ 
                  width: `${gridW * scale}px`, 
                  height: `${gridH * scale}px`, 
                  imageRendering: settings.retroMode ? 'pixelated' : 'auto' 
              });
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, [settings.retroMode, isPlaying]); // Re-run when game starts to get grid size

  const gridSizeW = stateRef.current.gridSize?.width || 800;
  const gridSizeH = stateRef.current.gridSize?.height || 800;

  return (
    <>
        <canvas 
            ref={canvasRef} 
            width={gridSizeW}
            height={gridSizeH}
            style={canvasStyle}
            className={`mx-auto border-b-4 border-[#5D4037] touch-none ${settings.retroMode ? 'bg-[#99A906]' : 'bg-[#81C784]'}`} 
        />
        <VirtualJoystick enabled={settings.useJoystick} onDirectionChange={handleInput} />
    </>
  );
};

export default GameCanvas;
