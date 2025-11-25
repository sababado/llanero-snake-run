

import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { GameSettings, MultiplayerState } from '../types';
import { Loader2, Settings, BarChart3, Repeat, Save, LogOut, RotateCcw } from 'lucide-react';
import { saveScoreToLeaderboard } from '../services/storageService';

interface GameOverMenuProps {
    winnerText: string;
    narratorMessage: string;
    isLoadingCommentary: boolean;
    duelStats: { p1: number, p2: number, ties: number };
    settings: GameSettings;
    startGame: (mode: 1 | 2) => void;
    updateSetting: (key: keyof GameSettings, value: any) => void;
    setShowStats: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    isGeneratingAssets: boolean;
    finalScore: number;
    onOpenGastronomy: () => void;
    mpState?: MultiplayerState;
    onCancelMultiplayer?: () => void;
    onRematch?: () => void;
}

const GameOverMenu: React.FC<GameOverMenuProps> = ({
    winnerText,
    narratorMessage,
    isLoadingCommentary,
    duelStats,
    settings,
    startGame,
    updateSetting,
    setShowStats,
    setShowSettings,
    finalScore,
    onOpenGastronomy,
    mpState,
    onCancelMultiplayer,
    onRematch
}) => {
    const t = TRANSLATIONS[settings.language];
    const [initials, setInitials] = useState("");
    const [scoreSaved, setScoreSaved] = useState(false);

    const handleSaveScore = () => {
        if (!initials) return;
        saveScoreToLeaderboard(initials, finalScore);
        setScoreSaved(true);
        setShowStats(true);
    };

    const isMpActive = mpState && mpState.active;
    const isHost = mpState && mpState.role === 'host';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 max-h-[100vh] overflow-y-auto pt-10">
            
            <h2 className="font-rye text-5xl text-red-500 mb-2 drop-shadow-lg tracking-wider animate-pulse">{t.gameOver}</h2>
            <p className="text-green-300 text-2xl font-bold mb-4 drop-shadow-md">{winnerText}</p>
            
            {/* Leaderboard Input */}
            {!scoreSaved && finalScore > 0 && !isMpActive && (
                <div className="flex gap-2 items-center bg-white/10 p-2 rounded mb-4">
                    <span className="text-sm font-bold text-[#FFD700]">{t.enterInitials}</span>
                    <input 
                        type="text" 
                        maxLength={3}
                        value={initials}
                        onChange={(e) => setInitials(e.target.value.toUpperCase())}
                        className="w-16 bg-black/50 border border-white/30 text-white text-center font-mono uppercase rounded p-1"
                        placeholder="AAA"
                    />
                    <button 
                        onClick={handleSaveScore}
                        disabled={initials.length < 1}
                        className="bg-green-600 hover:bg-green-500 text-white p-1 rounded disabled:opacity-50"
                    >
                        <Save size={18} />
                    </button>
                </div>
            )}

            {/* Duel Stats Display */}
            {(duelStats.p1 > 0 || duelStats.p2 > 0 || duelStats.ties > 0) && (
                <div className="mb-4 bg-black/40 p-3 rounded-xl border border-[#f1c40f]/30 w-full max-w-sm backdrop-blur-sm">
                    <div className="flex justify-between items-center px-4">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-400 mb-1">{t.p1Label}</div>
                            <div className="text-xl font-bold text-[#FFD700]">{duelStats.p1}</div>
                        </div>
                        <div className="text-center px-2 border-x border-white/10">
                            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t.ties}</div>
                            <div className="text-lg font-bold text-gray-300">{duelStats.ties}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-gray-400 mb-1">{t.p2Label}</div>
                            <div className="text-xl font-bold text-[#DA70D6]">{duelStats.p2}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Narrator Section */}
            {settings.narratorTextEnabled && (
                <div className="bg-[#3E2723] border-2 border-[#f1c40f] p-3 rounded-lg relative mt-2 w-full max-w-md min-h-[70px] flex items-center justify-center shadow-lg">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f1c40f] text-black px-2 font-bold text-xs rounded shadow-sm whitespace-nowrap">
                        {t.narratorLabel}
                    </div>
                    {isLoadingCommentary ? (
                        <div className="flex gap-2 text-yellow-100 items-center">
                            <Loader2 className="animate-spin" size={16}/> 
                            <span className="italic text-xs">...</span>
                        </div>
                    ) : (
                        <p className="italic text-yellow-100 text-base text-center leading-tight px-2">"{narratorMessage}"</p>
                    )}
                </div>
            )}
            
            <button 
                onClick={onOpenGastronomy}
                className="mt-4 text-orange-300 hover:text-orange-100 text-sm font-bold underline decoration-dotted underline-offset-4"
            >
                {t.gastronomyBtn}
            </button>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6 w-full max-w-md justify-center items-center">
                
                {isMpActive ? (
                    <>
                        {isHost ? (
                             <button 
                                onClick={onRematch}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-rye py-3 px-6 rounded-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <RotateCcw /> {t.rematchBtn}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-400 animate-pulse bg-white/10 px-4 py-2 rounded">
                                <Loader2 className="animate-spin" /> {t.waitHostRestart}
                            </div>
                        )}
                        
                        <button 
                            onClick={onCancelMultiplayer}
                            className="text-gray-400 hover:text-red-400 flex items-center gap-2 text-sm mt-2"
                        >
                            <LogOut size={16} /> {t.exitRoomBtn}
                        </button>
                    </>
                ) : (
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => startGame(1)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-rye py-3 px-2 rounded-lg border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                        >
                            <span className="text-lg" dangerouslySetInnerHTML={{__html: t.btn1p}} />
                        </button>
                        <button 
                            onClick={() => startGame(2)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-rye py-3 px-2 rounded-lg border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                        >
                            <span className="text-lg" dangerouslySetInnerHTML={{__html: t.btn2p}} />
                        </button>
                    </div>
                )}
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3 mt-4 mb-4">
                 <button 
                    onClick={() => updateSetting('controlsSwapped', !settings.controlsSwapped)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 border border-gray-500"
                    title={t.swapBtn}
                 >
                    <Repeat size={18} />
                 </button>
                 <button 
                    onClick={() => setShowStats(true)}
                    className="p-2 bg-cyan-800 hover:bg-cyan-700 rounded-full text-cyan-100 border border-cyan-500"
                    title="Stats"
                 >
                    <BarChart3 size={18} />
                 </button>
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 border border-gray-500"
                    title={t.settingsBtn}
                 >
                    <Settings size={18} />
                 </button>
            </div>

        </div>
    );
};

export default GameOverMenu;