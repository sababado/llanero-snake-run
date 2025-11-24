
import React, { useState, useCallback, useEffect } from 'react';
import { GameSettings, GameStats } from './types';
import { TRANSLATIONS, INITIAL_SETTINGS, APP_VERSION } from './constants';
import GameCanvas from './components/GameCanvas';
import { generateLlaneroBackground, generateNarratorCommentary, speakLlaneroText, generateVirgenAsset } from './services/aiService';
import { initAudio, startMusic, stopMusic, playGameOverJingle } from './services/audioService';
import { getStats, updateStats } from './services/storageService';

// Import newly extracted components
import MainMenu from './components/MainMenu';
import GameOverMenu from './components/GameOverMenu';
import StatsModal from './components/StatsModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [gameMode, setGameMode] = useState<1 | 2>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  
  // Assets
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [virgenUrl, setVirgenUrl] = useState<string | null>(null);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  
  // Scores & Stats
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [duelStats, setDuelStats] = useState({ p1: 0, p2: 0, ties: 0 });
  const [winnerText, setWinnerText] = useState("");
  const [narratorMessage, setNarratorMessage] = useState("");
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalGames: 0, totalChiguiros: 0, totalScore: 0 });

  // In-Game Commentary Bubble
  const [commentary, setCommentary] = useState<{text: string, visible: boolean}>({text: '', visible: false});

  // Trigger AI Asset generation on mount
  useEffect(() => {
    const loadAssets = async () => {
        setIsGeneratingAssets(true);
        
        // Parallel loading for speed
        const [bg, virgen] = await Promise.all([
            generateLlaneroBackground(),
            generateVirgenAsset()
        ]);

        if (bg) setBackgroundUrl(bg);
        if (virgen) setVirgenUrl(virgen);
        
        setIsGeneratingAssets(false);
    };
    loadAssets();
    
    // Load Stats
    setStats(getStats());
  }, []);

  // Handle Music State
  useEffect(() => {
      if (isPlaying && settings.musicEnabled) {
          startMusic();
      } else {
          stopMusic();
      }
  }, [isPlaying, settings.musicEnabled]);

  const startGame = (mode: 1 | 2) => {
    // AudioContext needs user gesture to resume. This button click provides it.
    initAudio();
    
    setGameMode(mode);
    setScores({ p1: 0, p2: 0 });
    setShowMenu(false);
    setShowGameOver(false);
    setIsPlaying(true);
    setNarratorMessage("");
    setIsLoadingCommentary(false);
    setCommentary({ text: '', visible: false });
  };

  const handleGameOver = useCallback((
      s1: number, 
      s2: number, 
      msg: string, 
      context: { score: number, cause: string }, 
      chiguirosEaten: number,
      winner: 'p1' | 'p2' | 'tie' | null
    ) => {
      setIsPlaying(false);
      setScores({ p1: s1, p2: s2 });
      setWinnerText(msg);
      setShowGameOver(true);
      setShowMenu(true); 
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

      // Update and Save Stats
      const newStats = updateStats(s1, chiguirosEaten);
      setStats(newStats);

      // Trigger Narrator Fetch
      setIsLoadingCommentary(true);
      setNarratorMessage("");
      generateNarratorCommentary('game_over', context).then(text => {
          setNarratorMessage(text);
          setIsLoadingCommentary(false);
          // Play Audio if enabled
          if (settings.narratorAudioEnabled) {
              speakLlaneroText(text);
          }
      }).catch(() => setIsLoadingCommentary(false));

  }, [settings.narratorAudioEnabled, settings.musicEnabled]);

  const handleScoreUpdate = useCallback((s1: number, s2: number) => {
      setScores({ p1: s1, p2: s2 });
  }, []);

  const handleShowCommentary = useCallback((text: string) => {
      setCommentary({ text, visible: true });
      
      if (settings.narratorAudioEnabled) {
          speakLlaneroText(text);
      }

      // Hide after 4 seconds
      setTimeout(() => {
          setCommentary(prev => (prev.text === text ? { ...prev, visible: false } : prev));
      }, 4000);
  }, [settings.narratorAudioEnabled]);

  const updateSetting = (key: keyof GameSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#2c3e50] text-white font-roboto flex flex-col items-center justify-start pt-4 sm:justify-center sm:pt-0 p-2 sm:p-4 overflow-hidden">
      
      <h1 className="font-rye text-[#f1c40f] text-2xl sm:text-4xl mb-4 text-center shadow-orange-700 drop-shadow-md flex items-center gap-2 z-10">
        Llaneros Snake: The Chigüiro Chase 🇨🇴
      </h1>

      <div className="relative border-8 border-[#8d6e63] rounded-md bg-gradient-to-b from-[#4CA1AF] to-[#C4E0E5] shadow-2xl flex flex-col w-full max-w-[900px]">
        
        {/* UI Layer: Scores */}
        <div className="absolute top-2 left-0 w-full flex justify-between px-5 z-10 font-bold text-xl pointer-events-none drop-shadow-md">
            <div className="text-orchid-500 bg-black/30 px-2 rounded" style={{ color: gameMode === 1 ? '#DA70D6' : '#FFD700' }}>
                {gameMode === 2 ? 'P1: ' : 'P1: '}{scores.p1}
            </div>
            {gameMode === 2 && (
                <div className="text-[#DA70D6] bg-black/30 px-2 rounded">P2: {scores.p2}</div>
            )}
        </div>

        {/* Narrator Bubble */}
        {commentary.visible && !showMenu && (
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

        {/* Game Canvas */}
        <GameCanvas 
            settings={settings}
            gameMode={gameMode}
            isPlaying={isPlaying}
            backgroundUrl={backgroundUrl}
            virgenUrl={virgenUrl}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            onShowCommentary={handleShowCommentary}
        />

        {/* Menu Overlay */}
        {showMenu && (
            <div className="absolute inset-0 bg-black/85 z-30 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {showGameOver ? (
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
                    />
                ) : (
                    <MainMenu 
                        startGame={startGame}
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

      </div>
    </div>
  );
};

export default App;
