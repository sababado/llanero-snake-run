

import React, { useState, useCallback, useEffect } from 'react';
import { GameSettings, GameStats, MultiplayerState, NetworkPacket, InitPacket, ReadyPacket, AppView } from './types';
import { TRANSLATIONS, INITIAL_SETTINGS, APP_VERSION } from './constants';
import GameCanvas from './components/GameCanvas';
import { generateNarratorCommentary, speakLlaneroText } from './services/aiService';
import { initAudio, startMusic, stopMusic, playGameOverJingle } from './services/audioService';
import { getStats, updateStats } from './services/storageService';
import { multiplayerService } from './services/multiplayerService';
import { useGameAssets } from './hooks/useGameAssets';

// Import newly extracted components
import MainMenu from './components/MainMenu';
import GameOverMenu from './components/GameOverMenu';
import StatsModal from './components/StatsModal';
import SettingsModal from './components/SettingsModal';
import GastronomyModal from './components/GastronomyModal';
import MultiplayerLobby from './components/MultiplayerLobby';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [gameMode, setGameMode] = useState<1 | 2>(1);
  const [view, setView] = useState<AppView>('MENU');
  
  // Modals (Overlays)
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGastronomy, setShowGastronomy] = useState(false);
  
  // Custom Hook for AI Assets
  const { backgroundUrl, setBackgroundUrl, virgenUrl, setVirgenUrl, isGeneratingAssets } = useGameAssets();

  // Multiplayer State
  const [mpState, setMpState] = useState<MultiplayerState>({
      active: false,
      role: 'none',
      roomId: null,
      status: 'disconnected'
  });
  const [readyStatus, setReadyStatus] = useState({ host: false, client: false });
  const [countdown, setCountdown] = useState<number | null>(null);

  // Scores & Stats
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [duelStats, setDuelStats] = useState({ p1: 0, p2: 0, ties: 0 });
  const [winnerText, setWinnerText] = useState("");
  const [narratorMessage, setNarratorMessage] = useState("");
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalGames: 0, totalChiguiros: 0, totalScore: 0, leaderboard: [] });
  const [sessionItems, setSessionItems] = useState<string[]>([]);

  // In-Game Commentary Bubble
  const [commentary, setCommentary] = useState<{text: string, visible: boolean}>({text: '', visible: false});

  // Load Stats on mount
  useEffect(() => {
    setStats(getStats());
  }, []);

  // Handle Music State
  useEffect(() => {
      if (view === 'GAME' && settings.musicEnabled) {
          startMusic(settings.musicStyle);
      } else {
          stopMusic();
      }
  }, [view, settings.musicEnabled, settings.musicStyle]);

  // Centralized Countdown Timer
  useEffect(() => {
      if (countdown === null) return;

      if (countdown > 0) {
          const timer = setTimeout(() => {
              setCountdown(prev => (prev !== null ? prev - 1 : null));
          }, 1000);
          return () => clearTimeout(timer);
      } else {
          // Countdown finished (0)
          setCountdown(null);

          // HOST AUTHORITY: Only Host triggers the actual game start logic
          if (mpState.role === 'host') {
              startGame(2);
              multiplayerService.send({ type: 'START_GAME', payload: {} });
          }
      }
  }, [countdown, mpState.role]);

  const startGame = (mode: 1 | 2) => {
    initAudio();
    
    setGameMode(mode);
    setScores({ p1: 0, p2: 0 });
    setSessionItems([]);
    
    setView('GAME');
    
    setNarratorMessage("");
    setIsLoadingCommentary(false);
    setCommentary({ text: '', visible: false });
  };

  const handleMultiplayerConnected = (role: 'host' | 'client', roomId: string) => {
      initAudio();
      setMpState({ active: true, role, roomId, status: 'connected' });
      setReadyStatus({ host: false, client: false });
      setView('LOBBY');

      // If Host, send INIT packet immediately so client can start loading assets while in lobby
      if (role === 'host') {
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
           }, 500);
      }
  };

  // Called by Host via Lobby Button
  const handleStartCountdown = () => {
      if (mpState.role === 'host') {
          // 1. Notify Client first
          multiplayerService.send({ type: 'COUNTDOWN', payload: {} });
          // 2. Delay local countdown slightly to allow packet travel (Sync Hack)
          setTimeout(() => {
              setCountdown(3);
          }, 500); 
      }
  };

  // Resets UI to Lobby/Waiting Room state without disconnecting
  const handleLocalRematchReset = () => {
      setWinnerText("");
      setNarratorMessage("");
      setCountdown(null);
      
      // Critical: Clear ready status so lobby goes back to "Waiting..."
      setReadyStatus({ host: false, client: false });
      setView('LOBBY');
  };
  
  // Host Initiates Rematch
  const handleRematchAction = () => {
      if (mpState.role === 'host') {
           multiplayerService.send({ type: 'REMATCH', payload: {} });
           handleLocalRematchReset();
      }
  };

  const handleMpInitData = (newSettings: GameSettings, bg: string | null, virgen: string | null) => {
      if (bg !== backgroundUrl) setBackgroundUrl(bg);
      if (virgen !== virgenUrl) setVirgenUrl(virgen);
      setSettings(newSettings);
  };

  // Centralized MP Listeners (Replaces setCallbacks)
  useEffect(() => {
      if (!mpState.active) return;

      const handleData = (data: NetworkPacket) => {
          if (data.type === 'INIT') {
              const payload = data.payload as InitPacket;
              handleMpInitData(payload.settings, payload.backgroundUrl, payload.virgenUrl);
          } else if (data.type === 'READY') {
              const payload = data.payload as ReadyPacket;
              if (payload.role) {
                   setReadyStatus(prev => ({ ...prev, [payload.role]: true }));
              }
          } else if (data.type === 'PING') {
              if (mpState.role !== 'none' && readyStatus[mpState.role]) {
                  multiplayerService.send({ type: 'READY', payload: { role: mpState.role } as ReadyPacket });
              }
          } else if (data.type === 'REMATCH') {
              handleLocalRematchReset();
          } else if (data.type === 'COUNTDOWN') {
              setCountdown(3);
          } else if (data.type === 'START_GAME') {
              // Client receives explicit start signal from Host
              startGame(2);
          }
      };

      const handleError = (err: string) => console.error("MP App Error:", err);
      const handleClose = () => {
          console.log("MP Connection Closed");
          setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
          setView('MENU');
      };

      multiplayerService.on('data', handleData);
      multiplayerService.on('error', handleError);
      multiplayerService.on('close', handleClose);

      return () => {
          multiplayerService.off('data', handleData);
          multiplayerService.off('error', handleError);
          multiplayerService.off('close', handleClose);
      };
  }, [mpState.active, mpState.role, readyStatus]); 

  // HEARTBEAT & SYNC
  useEffect(() => {
      if (!mpState.active || view === 'GAME' || mpState.role === 'none') return;

      const interval = setInterval(() => {
          const role = mpState.role;
          if (role !== 'none' && readyStatus[role]) {
               multiplayerService.send({ type: 'READY', payload: { role } as ReadyPacket });
          }
          const peerRole = role === 'host' ? 'client' : 'host';
          if (!readyStatus[peerRole]) {
               multiplayerService.send({ type: 'PING', payload: {} });
          }
      }, 500);

      return () => clearInterval(interval);
  }, [mpState.active, mpState.role, view, readyStatus]);


  // Called by GameCanvas when images are loaded
  const handleAssetsLoaded = useCallback(() => {
      if (!mpState.active) return;
      if (mpState.role === 'none') return;

      // Update local status immediately
      setReadyStatus(prev => ({ ...prev, [mpState.role]: true }));
      
      const role = mpState.role;
      const sendReady = () => multiplayerService.send({ type: 'READY', payload: { role } as ReadyPacket });
      
      sendReady();
      setTimeout(sendReady, 100);
      setTimeout(sendReady, 200);
      setTimeout(sendReady, 400);

  }, [mpState]);

  // RE-READY LOGIC: Check if we are back in lobby with loaded assets (Rematch scenario)
  useEffect(() => {
      if (view === 'LOBBY' && mpState.active && mpState.role !== 'none' && !readyStatus[mpState.role]) {
          if (backgroundUrl || settings.retroMode) {
              handleAssetsLoaded();
          }
      }
  }, [view, mpState, readyStatus, backgroundUrl, settings.retroMode, handleAssetsLoaded]);

  const handleGameOver = useCallback((
      s1: number, 
      s2: number, 
      msg: string, 
      context: { score: number, cause: string }, 
      chiguirosEaten: number,
      winner: 'p1' | 'p2' | 'tie' | null
    ) => {
      setScores({ p1: s1, p2: s2 });
      setWinnerText(msg);
      setView('GAME_OVER');
      setCommentary({ text: '', visible: false });

      if (winner) {
          setDuelStats(prev => {
              if (winner === 'tie') {
                  return { ...prev, ties: prev.ties + 1 };
              }
              return {
                  ...prev,
                  [winner]: prev[winner] + 1
              };
          });
      }

      if (settings.musicEnabled) {
          playGameOverJingle();
      }

      const newStats = updateStats(s1, chiguirosEaten);
      setStats(newStats);

      setIsLoadingCommentary(true);
      setNarratorMessage("");
      generateNarratorCommentary('game_over', context).then(text => {
          setNarratorMessage(text);
          setIsLoadingCommentary(false);
          if (settings.narratorAudioEnabled) {
              speakLlaneroText(text);
          }
      }).catch(() => setIsLoadingCommentary(false));

  }, [settings.narratorAudioEnabled, settings.musicEnabled]);

  const handleScoreUpdate = useCallback((s1: number, s2: number) => {
      setScores({ p1: s1, p2: s2 });
  }, []);
  
  const handleSessionItemsUpdate = useCallback((items: string[]) => {
      setSessionItems(items);
  }, []);

  const handleShowCommentary = useCallback((text: string) => {
      if (settings.narratorTextEnabled) {
          setCommentary({ text, visible: true });
          setTimeout(() => {
              setCommentary(prev => (prev.text === text ? { ...prev, visible: false } : prev));
          }, 4000);
      }
      if (settings.narratorAudioEnabled) {
          speakLlaneroText(text);
      }
  }, [settings.narratorAudioEnabled, settings.narratorTextEnabled]);

  const updateSetting = (key: keyof GameSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const cancelMultiplayer = () => {
      multiplayerService.close();
      setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
      setReadyStatus({ host: false, client: false });
      setCountdown(null);
      setView('MENU');
  };

  return (
    <div className={`min-h-screen font-roboto flex flex-col items-center justify-start pt-4 sm:justify-center sm:pt-0 p-2 sm:p-4 overflow-hidden transition-colors duration-500 ${settings.retroMode ? 'bg-[#333] font-mono' : 'bg-[#2c3e50] text-white'}`}>
      
      <h1 className={`font-rye text-2xl sm:text-4xl mb-4 text-center drop-shadow-md flex items-center gap-2 z-10 ${settings.retroMode ? 'text-[#99A906]' : 'text-[#f1c40f] shadow-orange-700'}`}>
        Llaneros Snake: The Chigüiro Chase 🇨🇴
      </h1>

      <div className={`relative border-8 rounded-md shadow-2xl flex flex-col w-full max-w-[900px] ${settings.retroMode ? 'border-[#555] bg-[#879d71]' : 'border-[#8d6e63] bg-gradient-to-b from-[#4CA1AF] to-[#C4E0E5]'}`}>
        
        {/* UI Layer: Scores */}
        <div className="absolute top-2 left-0 w-full flex justify-between px-5 z-10 font-bold text-xl pointer-events-none drop-shadow-md">
            <div className={`${settings.retroMode ? 'text-black bg-transparent' : 'text-orchid-500 bg-black/30'} px-2 rounded`} style={{ color: settings.retroMode ? 'black' : (gameMode === 1 ? '#DA70D6' : '#FFD700') }}>
                {gameMode === 2 ? 'P1: ' : 'P1: '}{scores.p1}
            </div>
            {gameMode === 2 && (
                <div className={`${settings.retroMode ? 'text-black bg-transparent' : 'text-[#DA70D6] bg-black/30'} px-2 rounded`}>P2: {scores.p2}</div>
            )}
        </div>

        {/* Narrator Bubble */}
        {commentary.visible && view === 'GAME' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[90%] animate-[bounce_1s_infinite]">
                 <div className="bg-white border-4 border-black p-3 rounded-2xl shadow-xl relative animate-in fade-in zoom-in duration-300">
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45 transform"></div>
                     <p className="text-black font-bold font-sans text-center text-sm sm:text-base leading-tight">
                         "{commentary.text}"
                     </p>
                     <p className="text-[10px] text-gray-600 text-right mt-1 font-bold italic">- Don Chepe 🤠</p>
                 </div>
            </div>
        )}

        {/* Game Canvas - Always mounted to preserve context, hidden/paused via props if needed */}
        <GameCanvas 
            settings={settings}
            gameMode={gameMode}
            isPlaying={view === 'GAME'}
            backgroundUrl={settings.retroMode ? null : backgroundUrl}
            virgenUrl={settings.retroMode ? null : virgenUrl}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            onShowCommentary={handleShowCommentary}
            onSessionItemsUpdate={handleSessionItemsUpdate}
            mpState={mpState}
            onMpInitData={handleMpInitData}
            onAssetsLoaded={handleAssetsLoaded}
        />

        {/* View Overlays */}
        {view !== 'GAME' && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center overflow-hidden ${settings.retroMode ? 'bg-[#879d71]/95 text-black' : 'bg-black/85 text-white'}`}>
                {view === 'LOBBY' && (
                    <MultiplayerLobby 
                        settings={settings} 
                        onConnected={handleMultiplayerConnected}
                        onStartCountdown={handleStartCountdown}
                        onCancel={cancelMultiplayer}
                        readyStatus={readyStatus}
                        countdown={countdown}
                        mpState={mpState}
                    />
                )}
                {view === 'GAME_OVER' && (
                    <GameOverMenu 
                        winnerText={winnerText}
                        narratorMessage={narratorMessage}
                        isLoadingCommentary={isLoadingCommentary}
                        duelStats={duelStats}
                        settings={settings}
                        startGame={startGame}
                        updateSetting={updateSetting}
                        setShowStats={setShowStats}
                        setShowSettings={setShowSettings}
                        isGeneratingAssets={isGeneratingAssets}
                        finalScore={scores.p1}
                        onOpenGastronomy={() => setShowGastronomy(true)}
                        mpState={mpState}
                        onCancelMultiplayer={cancelMultiplayer}
                        onRematch={handleRematchAction}
                    />
                )}
                {view === 'MENU' && (
                    <MainMenu 
                        startGame={startGame}
                        startMultiplayerSetup={() => setView('LOBBY')}
                        settings={settings}
                        updateSetting={updateSetting}
                        setShowStats={setShowStats}
                        setShowSettings={setShowSettings}
                        isGeneratingAssets={isGeneratingAssets}
                    />
                )}
            </div>
        )}

        {/* Modals */}
        {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
        
        {showSettings && (
            <SettingsModal 
                settings={settings} 
                updateSetting={updateSetting} 
                onClose={() => setShowSettings(false)} 
            />
        )}

        {showGastronomy && (
            <GastronomyModal 
                items={sessionItems}
                onClose={() => setShowGastronomy(false)}
            />
        )}

      </div>
    </div>
  );
};

export default App;