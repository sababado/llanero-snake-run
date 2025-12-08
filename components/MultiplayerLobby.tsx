import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { GameSettings, MultiplayerState, Difficulty, MusicStyle } from '../types';
import { multiplayerService } from '../services/multiplayerService';
import { Loader2, Copy, Wifi, Users, ArrowRight, Play, Gamepad2, CheckCircle2, XCircle, Smartphone, Lock, Lightbulb } from 'lucide-react';

interface MultiplayerLobbyProps {
    settings: GameSettings;
    updateSetting: (key: keyof GameSettings, value: any) => void;
    onConnected: (role: 'host' | 'client', roomId: string) => void;
    onStartCountdown: () => void;
    onCancel: () => void;
    readyStatus?: { host: boolean, client: boolean };
    countdown: number | null;
    mpState?: MultiplayerState;
    waitingForAck?: boolean;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ 
    settings, 
    updateSetting,
    onConnected, 
    onStartCountdown, 
    onCancel, 
    readyStatus,
    countdown,
    mpState,
    waitingForAck
}) => {
    const t = TRANSLATIONS[settings.language];
    
    // Determine initial view based on connection status.
    const [view, setView] = useState<'menu' | 'host' | 'join' | 'waiting'>(
        (mpState?.status === 'connected') ? 'waiting' : 'menu'
    );
    
    const [roomId, setRoomId] = useState<string>(mpState?.roomId || '');
    const [joinCode, setJoinCode] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    const [myRole, setMyRole] = useState<'host' | 'client' | null>(
        (mpState?.role === 'host' || mpState?.role === 'client') ? mpState.role : null
    );

    const [triviaIndex, setTriviaIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTriviaIndex(prev => (prev + 1) % t.trivia.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [t.trivia.length]);

    // Setup listener for Connection
    useEffect(() => {
        const onConnect = () => {
            if (view === 'host' || view === 'join') {
                const role = view === 'host' ? 'host' : 'client';
                const code = view === 'host' ? roomId : joinCode;
                setStatus('connected');
                setMyRole(role);
                setView('waiting');
                onConnected(role, code);
            }
        };

        const onError = (err: string) => {
            // Ignore closed error if we are just waiting
            if (err === 'Connection closed') return;
            if(view !== 'waiting') {
                setError(err);
                setStatus('');
            }
        };

        multiplayerService.on('connect', onConnect);
        multiplayerService.on('error', onError);

        return () => {
            multiplayerService.off('connect', onConnect);
            multiplayerService.off('error', onError);
        };
    }, [view, roomId, joinCode, onConnected]);

    const handleHost = () => {
        setView('host');
        setStatus('generating');
        setError(null);
        
        multiplayerService.hostGame((code) => {
            setRoomId(code);
            setStatus('waiting_for_client');
        });
    };

    const handleJoin = () => {
        setView('join');
        setError(null);
    };

    const submitJoin = () => {
        if (!joinCode || joinCode.length < 4) return;
        setStatus('connecting');
        multiplayerService.joinGame(joinCode.trim());
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomId);
    };

    // Countdown Overlay
    if (countdown !== null && countdown > 0) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-in zoom-in duration-300 bg-black/60 backdrop-blur-sm">
                <div className="text-yellow-400 font-rye text-[120px] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] animate-pulse">
                    {countdown}
                </div>
                <div className="text-white text-2xl font-bold mt-4">
                    {t.menuTitle}...
                </div>
            </div>
        );
    }

    const areBothReady = readyStatus?.host && readyStatus?.client;
    const isClient = myRole === 'client';

    return (
        <div className="flex flex-col items-center w-full h-full animate-in fade-in zoom-in duration-300 relative z-20">
            {/* Fixed Header */}
            <div className="w-full text-center pb-4 flex-none">
                <h2 className="font-rye text-3xl text-orange-400">{t.lobbyTitle}</h2>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-6 pb-20">
                
                {view === 'menu' && (
                    <div className="flex flex-col gap-4 w-full max-w-md">
                        <p className="text-gray-300 text-center mb-4">{t.mpDesc}</p>
                        <button 
                            onClick={handleHost}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg border-b-4 border-orange-800 flex items-center justify-center gap-3"
                        >
                            <Wifi /> {t.hostBtn}
                        </button>
                        <button 
                            onClick={handleJoin}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-6 rounded-lg border-b-4 border-cyan-800 flex items-center justify-center gap-3"
                        >
                            <Users /> {t.joinBtn}
                        </button>
                        <button onClick={onCancel} className="mt-4 text-gray-400 hover:text-white underline">{t.cancelBtn}</button>
                    </div>
                )}

                {view === 'host' && (
                    <div className="bg-white/10 p-6 rounded-lg w-full max-w-md flex flex-col items-center gap-4">
                        {status === 'generating' && <Loader2 className="animate-spin text-yellow-400" size={32} />}
                        
                        {roomId && (
                            <>
                                <div className="text-sm text-gray-400 uppercase tracking-widest">{t.roomCode}</div>
                                <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-white/20">
                                    <span className="font-mono text-3xl font-bold text-yellow-400 tracking-widest">{roomId}</span>
                                    <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded"><Copy size={20} /></button>
                                </div>
                                <div className="flex items-center gap-2 text-green-400 animate-pulse mt-4">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>{t.waiting}</span>
                                </div>
                            </>
                        )}
                        
                        {error && <div className="text-red-400 bg-red-900/50 p-2 rounded text-sm text-center">{error}</div>}
                        
                        <button onClick={onCancel} className="mt-4 text-gray-400 hover:text-white underline">{t.cancelBtn}</button>
                    </div>
                )}

                {view === 'join' && (
                    <div className="bg-white/10 p-6 rounded-lg w-full max-w-md flex flex-col gap-4">
                        <label className="text-sm text-gray-400 uppercase tracking-widest">{t.enterCode}</label>
                        <input 
                            type="text" 
                            value={joinCode}
                            maxLength={4}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="bg-black/50 border border-white/20 rounded p-4 text-3xl font-mono text-center text-white focus:outline-none focus:border-cyan-400 tracking-widest"
                            placeholder="ABCD"
                        />
                        
                        {status === 'connecting' ? (
                             <div className="flex items-center justify-center gap-2 text-cyan-400">
                                <Loader2 className="animate-spin" size={20} /> Connecting...
                             </div>
                        ) : (
                            <button 
                                onClick={submitJoin}
                                disabled={joinCode.length < 4}
                                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                {t.connectBtn} <ArrowRight size={18} />
                            </button>
                        )}

                        {error && <div className="text-red-400 bg-red-900/50 p-2 rounded text-sm text-center">{error}</div>}
                        
                        <button onClick={onCancel} className="mt-2 text-center text-gray-400 hover:text-white underline">{t.cancelBtn}</button>
                    </div>
                )}

                {view === 'waiting' && (
                    <div className="w-full max-w-md flex flex-col gap-4">
                        
                        {/* Players Panel */}
                        <div className="bg-white/10 p-6 rounded-lg w-full flex flex-col items-center gap-6">
                            <div className="flex items-center justify-center gap-6 w-full">
                                {/* P1 STATUS */}
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg mb-2 ${readyStatus?.host ? 'bg-green-600 border-green-400' : 'bg-yellow-500 border-yellow-700'}`}>
                                        {readyStatus?.host ? <CheckCircle2 size={32} className="text-white"/> : <Gamepad2 size={32} className="text-black"/>}
                                    </div>
                                    <span className="font-bold text-yellow-400">{t.p1Label}</span>
                                    <span className="text-xs text-gray-400">{t.lobbyHost}</span>
                                    {readyStatus?.host ? 
                                        <span className="text-xs text-green-400 font-bold mt-1">{t.lobbyReady}</span> :
                                        <span className="text-xs text-yellow-400 mt-1 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> {t.lobbyLoading}</span>
                                    }
                                </div>
                                
                                <div className="text-2xl font-bold text-white/30">VS</div>
                                
                                {/* P2 STATUS */}
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg mb-2 ${readyStatus?.client ? 'bg-green-600 border-green-400' : 'bg-orchid-500 border-purple-900'}`}>
                                        {readyStatus?.client ? <CheckCircle2 size={32} className="text-white"/> : <Gamepad2 size={32} className="text-white"/>}
                                    </div>
                                    <span className="font-bold text-[#DA70D6]">{t.p2Label}</span>
                                    <span className="text-xs text-gray-400">{t.lobbyGuest}</span>
                                    {readyStatus?.client ? 
                                        <span className="text-xs text-green-400 font-bold mt-1">{t.lobbyReady}</span> :
                                        <span className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> {t.lobbySyncing}</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Trivia Section */}
                        <div className="bg-orange-900/30 p-4 rounded-lg w-full border border-orange-500/30">
                            <div className="flex items-center gap-2 text-orange-300 font-bold text-xs uppercase mb-2">
                                <Lightbulb size={14} /> {t.triviaLabel}
                            </div>
                            <p key={triviaIndex} className="text-white text-sm italic font-serif text-center animate-in fade-in duration-500">
                                "{t.trivia[triviaIndex]}"
                            </p>
                        </div>

                        {/* Game Options (Synced) */}
                        <div className="bg-white/10 p-4 rounded-lg w-full relative">
                            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                                {t.settingsBtn} {isClient && <Lock size={12} className="text-gray-400"/>}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {/* Difficulty */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-xs">{t.diffLabel}</label>
                                    <select 
                                        value={settings.difficulty}
                                        disabled={isClient}
                                        onChange={(e) => updateSetting('difficulty', e.target.value as Difficulty)}
                                        className="bg-black/30 border border-white/20 rounded p-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="easy">{t.optEasy}</option>
                                        <option value="medium">{t.optMedium}</option>
                                        <option value="hard">{t.optHard}</option>
                                    </select>
                                </div>

                                {/* Music Style */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-400 text-xs">{t.musicStyleLabel}</label>
                                    <select 
                                        value={settings.musicStyle}
                                        disabled={isClient}
                                        onChange={(e) => updateSetting('musicStyle', e.target.value as MusicStyle)}
                                        className="bg-black/30 border border-white/20 rounded p-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="joropo">{t.musicJoropo}</option>
                                        <option value="country">{t.musicCountry}</option>
                                        <option value="mix">{t.musicMix}</option>
                                        <option value="retro">{t.musicRetro}</option>
                                    </select>
                                </div>

                                {/* Bombs */}
                                <div className="flex items-center gap-2 col-span-2 bg-black/20 p-2 rounded border border-white/10">
                                    <input 
                                        type="checkbox" 
                                        id="lobbyBomb"
                                        checked={settings.bombsEnabled}
                                        disabled={isClient}
                                        onChange={(e) => updateSetting('bombsEnabled', e.target.checked)}
                                        className="accent-orange-500"
                                    />
                                    <label htmlFor="lobbyBomb" className={`text-xs flex-1 ${isClient ? 'text-gray-400' : 'cursor-pointer'}`}>
                                        {t.bombLabel}
                                    </label>
                                </div>

                                {/* Retro Mode */}
                                <div className="flex items-center gap-2 col-span-2 bg-black/20 p-2 rounded border border-white/10">
                                    <input 
                                        type="checkbox" 
                                        id="lobbyRetro"
                                        checked={settings.retroMode}
                                        disabled={isClient}
                                        onChange={(e) => updateSetting('retroMode', e.target.checked)}
                                        className="accent-green-500"
                                    />
                                    <label htmlFor="lobbyRetro" className={`text-xs flex-1 flex items-center gap-1 ${isClient ? 'text-gray-400' : 'cursor-pointer text-green-300'}`}>
                                        <Smartphone size={12} /> {t.retroLabel}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Actions */}
            {view === 'waiting' && (
                <div className="w-full max-w-md bg-black/80 backdrop-blur-md p-4 absolute bottom-0 left-1/2 -translate-x-1/2 border-t border-white/20">
                    {myRole === 'host' ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                            <p className="text-gray-300 text-xs">{areBothReady ? t.lobbyAllReady : t.lobbyWaitAssets}</p>
                            <button 
                                onClick={onStartCountdown}
                                disabled={!areBothReady || waitingForAck}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-green-800 disabled:border-gray-700 text-lg flex items-center justify-center gap-2 transition-all"
                            >
                                {waitingForAck ? (
                                    <><Loader2 className="animate-spin" /> {t.lobbyVerifying}</>
                                ) : (
                                    <><Play fill="currentColor" /> {t.lobbyStart}</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 w-full p-4 bg-black/30 rounded border border-white/10">
                            {readyStatus?.client ? (
                                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                                    <CheckCircle2 size={20} /> {t.lobbyYouReady}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                                    <Loader2 className="animate-spin" size={20} /> {t.lobbyLoadingAssets}
                                </div>
                            )}
                            <p className="text-gray-400 text-xs text-center">{t.lobbyWaitHost}</p>
                        </div>
                    )}

                    <button 
                        onClick={onCancel} 
                        className="mt-3 w-full bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-200 font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <XCircle size={16} /> {t.exitRoomBtn}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MultiplayerLobby;