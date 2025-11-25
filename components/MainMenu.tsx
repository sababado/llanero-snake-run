
import React from 'react';
import { GameSettings, Language, Difficulty } from '../types';
import { TRANSLATIONS, APP_VERSION } from '../constants';
import { Settings, Repeat, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles, BarChart3, Globe } from 'lucide-react';

interface MainMenuProps {
    startGame: (mode: 1 | 2) => void;
    startMultiplayerSetup: () => void;
    settings: GameSettings;
    updateSetting: (key: keyof GameSettings, value: any) => void;
    setShowStats: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    isGeneratingAssets: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
    startGame,
    startMultiplayerSetup,
    settings, 
    updateSetting, 
    setShowStats, 
    setShowSettings,
    isGeneratingAssets 
}) => {
    const t = TRANSLATIONS[settings.language];

    return (
        <>
            <h2 className="font-rye text-[#f1c40f] text-5xl mb-2">{t.menuTitle}</h2>
            <p className="text-gray-300 mb-8">{t.menuSubtitle}</p>
            <div className="text-[10px] text-gray-500 font-mono mb-6">v{APP_VERSION}</div>
            {isGeneratingAssets && (
                 <div className="text-xs text-yellow-300 mb-4 flex items-center gap-2 animate-pulse">
                    <Sparkles size={12} /> {t.loadingAi}
                 </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button 
                    onClick={() => startGame(1)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-rye py-4 px-6 rounded border-2 border-orange-800 transform hover:scale-105 transition-all"
                >
                    <span dangerouslySetInnerHTML={{__html: t.btn1p}} />
                    <div className="text-xs font-sans opacity-80 mt-1">{t.btn1pSub}</div>
                </button>
                <div className="flex gap-4">
                    <button 
                        onClick={() => startGame(2)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-rye py-4 px-6 rounded border-2 border-orange-800 transform hover:scale-105 transition-all"
                    >
                        <span dangerouslySetInnerHTML={{__html: t.btn2p}} />
                        <div className="text-xs font-sans opacity-80 mt-1">{t.btn2pSub}</div>
                    </button>
                    
                     <button 
                        onClick={startMultiplayerSetup}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-rye py-4 px-6 rounded border-2 border-cyan-800 transform hover:scale-105 transition-all"
                    >
                        <div className="flex items-center justify-center gap-2">
                             <Globe size={18} />
                             <span>{t.btnOnline}</span>
                        </div>
                        <div className="text-xs font-sans opacity-80 mt-1">{t.btnOnlineSub}</div>
                    </button>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                 <button 
                    onClick={() => updateSetting('controlsSwapped', !settings.controlsSwapped)}
                    className="hidden sm:flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded border-2 border-gray-400 text-sm"
                 >
                    <Repeat size={16} /> {t.swapBtn}
                 </button>
                 <button 
                    onClick={() => setShowStats(true)}
                    className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-600 px-4 py-2 rounded border-2 border-cyan-400 text-sm"
                 >
                    <BarChart3 size={16} /> Stats
                 </button>
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded border-2 border-gray-400 text-sm"
                 >
                    <Settings size={16} /> {t.settingsBtn}
                 </button>
            </div>

            <div className="text-gray-400 text-sm italic mt-4">
                {settings.useJoystick ? t.mobileJoy : (window.innerWidth < 768 ? t.mobileSwipe : t.controlsInfo)}
            </div>
            
            {/* Controls Legend (Desktop) */}
            <div className="hidden sm:flex gap-10 mt-8">
                <div className="bg-white/10 p-4 rounded-lg">
                    <div className={`font-bold mb-2 ${settings.controlsSwapped ? 'text-[#DA70D6]' : 'text-[#FFD700]'}`}>
                        {settings.controlsSwapped ? t.p2Label : t.p1Label}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="bg-gray-200 text-black px-2 py-1 rounded font-bold"><ArrowUp size={16}/></div>
                        <div className="flex gap-1">
                            <div className="bg-gray-200 text-black px-2 py-1 rounded font-bold"><ArrowLeft size={16}/></div>
                            <div className="bg-gray-200 text-black px-2 py-1 rounded font-bold"><ArrowDown size={16}/></div>
                            <div className="bg-gray-200 text-black px-2 py-1 rounded font-bold"><ArrowRight size={16}/></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                    <div className={`font-bold mb-2 ${settings.controlsSwapped ? 'text-[#FFD700]' : 'text-[#DA70D6]'}`}>
                        {settings.controlsSwapped ? t.p1Label : t.p2Label}
                    </div>
                     <div className="flex flex-col items-center gap-1 font-bold text-black">
                        <div className="bg-gray-200 px-3 py-1 rounded">W</div>
                        <div className="flex gap-1">
                            <div className="bg-gray-200 px-3 py-1 rounded">A</div>
                            <div className="bg-gray-200 px-3 py-1 rounded">S</div>
                            <div className="bg-gray-200 px-3 py-1 rounded">D</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MainMenu;
