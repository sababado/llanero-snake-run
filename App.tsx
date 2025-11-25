
import React, { useState, useCallback, useEffect } from 'react';
import { GameSettings, GameStats, AppView } from './types';
import { TRANSLATIONS, INITIAL_SETTINGS, APP_VERSION } from './constants';
import GameCanvas from './components/GameCanvas';
import { generateNarratorCommentary, speakLlaneroText } from './services/ai/narrator';
import { initAudio, startMusic, stopMusic, playGameOverJingle } from './services/audioService';
import { getStats, updateStats } from './services/storageService';
import { useGameAssets } from './hooks/useGameAssets';
import { useMultiplayerManager } from './hooks/useMultiplayerManager';

// Components
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
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGastronomy, setShowGastronomy] = useState(false);
  
  // Game State (UI specific)
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [duelStats, setDuelStats] = useState({ p1: 0, p2: 0, ties: 0 });
  const [winnerText, setWinnerText] = useState("");
  const [narratorMessage, setNarratorMessage] = useState("");
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalGames: 0, totalChiguiros: 0, totalScore: 0, leaderboard: [] });
  const [sessionItems, setSessionItems] = useState<string[]>([]);
  const [commentary, setCommentary] = useState<{text: string, visible: boolean}>({text: '', visible: false});

  // Assets
  const { backgroundUrl, setBackgroundUrl, virgenUrl, setVirgenUrl, isGeneratingAssets } = useGameAssets();

  useEffect(() => {
    setStats(getStats());
  }, []);

  // Music Control
  useEffect(() => {
      if (view === 'GAME' && settings.musicEnabled) {
          startMusic(settings.musicStyle);
      } else {
          stopMusic();
      }
  }, [view, settings.musicEnabled, settings.musicStyle]);

  // --- Handlers ---

  const startGame = useCallback((mode: 1 | 2) => {
    initAudio();
    setGameMode(mode);
    setScores({ p1: 0, p2: 0 });
    setSessionItems([]);
    setView('GAME');
    setNarratorMessage("");
    setIsLoadingCommentary(false);
    setCommentary({ text: '', visible: false });
  }, []);

  const handleMpInitData = useCallback((newSettings: GameSettings, bg: string | null, virgen: string | null) => {
      if (bg !== backgroundUrl) setBackgroundUrl(bg);
      if (virgen !== virgenUrl) setVirgenUrl(virgen);
      setSettings(newSettings);
  }, [backgroundUrl, setBackgroundUrl, virgenUrl, setVirgenUrl]);

  // --- Multiplayer Manager Hook ---
  const {
      mpState,
      readyStatus,
      countdown,
      setConnected,
      resetMultiplayer,
      signalReady,
      startHostCountdown,
      initiateRematch,
      resetForRematch
  } = useMultiplayerManager({
      settings,
      backgroundUrl,
      virgenUrl,
      onInitDataReceived: handleMpInitData,
      onStartGameCommand: () => startGame(2)
  });

  // --- MP Logic Integration ---

  const handleMultiplayerConnected = (role: 'host' | 'client', roomId: string) => {
      initAudio();
      setConnected(role, roomId);
      setView('LOBBY');
  };

  // Check if we need to signal ready (when in Lobby with assets loaded)
  useEffect(() => {
      if (view === 'LOBBY' && mpState.active && mpState.role !== 'none' && !readyStatus[mpState.role]) {
          if (backgroundUrl || settings.retroMode) {
              signalReady();
          }
      }
  }, [view, mpState, readyStatus, backgroundUrl, settings.retroMode, signalReady]);

  const handleRematchAction = () => {
      initiateRematch();
      resetForRematch();
      setWinnerText("");
      setView('LOBBY');
  };

  const cancelMultiplayer = () => {
      resetMultiplayer();
      setView('MENU');
  };

  // --- Game Event Handlers ---

  const handleGameOver = useCallback((
      s1: number, s2: number, msg: string, context: { score: number, cause: string }, 
      chiguirosEaten: number, winner: 'p1' | 'p2' | 'tie' | null
    ) => {
      setScores({ p1: s1, p2: s2 });
      setWinnerText(msg);
      setView('GAME_OVER');
      setCommentary({ text: '', visible: false });

      if (winner) {
          setDuelStats(prev => {
              if (winner === 'tie') return { ...prev, ties: prev.ties + 1 };
              return { ...prev, [winner]: prev[winner] + 1 };
          });
      }

      if (settings.musicEnabled) playGameOverJingle();

      const newStats = updateStats(s1, chiguirosEaten);
      setStats(newStats);

      setIsLoadingCommentary(true);
      setNarratorMessage("");
      generateNarratorCommentary('game_over', context).then(text => {
          setNarratorMessage(text);
          setIsLoadingCommentary(false);
          if (settings.narratorAudioEnabled) speakLlaneroText(text);
      }).catch(() => setIsLoadingCommentary(false));

  }, [settings.narratorAudioEnabled, settings.musicEnabled]);

  const handleScoreUpdate = useCallback((s1: number, s2: number) => {
      setScores({ p1: s1, p2: s2 });
  }, []);
  
  const handleShowCommentary = useCallback((text: string) => {
      if (settings.narratorTextEnabled) {
          setCommentary({ text, visible: true });
          setTimeout(() => setCommentary(prev => (prev.text === text ? { ...prev, visible: false } : prev)), 4000);
      }
      if (settings.narratorAudioEnabled) speakLlaneroText(text);
  }, [settings.narratorAudioEnabled, settings.narratorTextEnabled]);

  const updateSetting = (key: keyof GameSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`min-h-screen font-roboto flex flex-col items-center justify-start pt-4 sm:justify-center sm:pt-0 p-2 sm:p-4 overflow-hidden transition-colors duration-500 ${settings.retroMode ? 'bg-[#333] font-mono' : 'bg-[#2c3e50] text-white'}`}>
      
      <h1 className={`font-rye text-2xl sm:text-4xl mb-4 text-center drop-shadow-md flex items-center gap-2 z-10 ${settings.retroMode ? 'text-[#99A906]' : 'text-[#f1c40f] shadow-orange-700'}`}>
        Llaneros Snake: The Chigüiro Chase 🇨🇴
      </h1>

      <div className={`relative border-8 rounded-md shadow-2xl flex flex-col w-full max-w-[900px] ${settings.retroMode ? 'border-[#555] bg-[#879d71]' : 'border-[#8d6e63] bg-gradient-to-b from-[#4CA1AF] to-[#C4E0E5]'}`}>
        
        {/* Scores */}
        <div className="absolute top-2 left-0 w-full flex justify-between px-5 z-10 font-bold text-xl pointer-events-none drop-shadow-md">
            <div className={`${settings.retroMode ? 'text-black bg-transparent' : 'text-orchid-500 bg-black/30'} px-2 rounded`} style={{ color: settings.retroMode ? 'black' : (gameMode === 1 ? '#DA70D6' : '#FFD700') }}>
                P1: {scores.p1}
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
                     <p className="text-black font-bold font-sans text-center text-sm sm:text-base leading-tight">"{commentary.text}"</p>
                     <p className="text-[10px] text-gray-600 text-right mt-1 font-bold italic">- Don Chepe 🤠</p>
                 </div>
            </div>
        )}

        {/* Game Canvas */}
        <GameCanvas 
            settings={settings}
            gameMode={gameMode}
            isPlaying={view === 'GAME'}
            backgroundUrl={settings.retroMode ? null : backgroundUrl}
            virgenUrl={settings.retroMode ? null : virgenUrl}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            onShowCommentary={handleShowCommentary}
            onSessionItemsUpdate={setSessionItems}
            mpState={mpState}
            onMpInitData={handleMpInitData}
            onAssetsLoaded={signalReady}
        />

        {/* Overlays */}
        {view !== 'GAME' && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center overflow-hidden ${settings.retroMode ? 'bg-[#879d71]/95 text-black' : 'bg-black/85 text-white'}`}>
                {view === 'LOBBY' && (
                    <MultiplayerLobby 
                        settings={settings} 
                        onConnected={handleMultiplayerConnected}
                        onStartCountdown={startHostCountdown}
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
        {showSettings && <SettingsModal settings={settings} updateSetting={updateSetting} onClose={() => setShowSettings(false)} />}
        {showGastronomy && <GastronomyModal items={sessionItems} onClose={() => setShowGastronomy(false)} />}

      </div>
    </div>
  );
};

export default App;
