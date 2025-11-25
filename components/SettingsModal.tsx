


import React from 'react';
import { GameSettings, Language, Difficulty, MusicStyle } from '../types';
import { TRANSLATIONS, APP_VERSION } from '../constants';
import { Music, Mic, Smartphone, MessageSquare } from 'lucide-react';

interface SettingsModalProps {
    settings: GameSettings;
    updateSetting: (key: keyof GameSettings, value: any) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, updateSetting, onClose }) => {
    const t = TRANSLATIONS[settings.language];

    return (
        <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-6">
            <h2 className="font-rye text-[#f1c40f] text-3xl mb-6">{t.settingsTitle}</h2>

            <div className="flex flex-col gap-4 w-full max-w-xs h-[80vh] overflow-y-auto pb-10">
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-300">{t.langLabel}</label>
                    <select 
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value as Language)}
                        className="bg-gray-700 border border-gray-500 rounded p-2 text-white"
                    >
                        <option value="es">Llaneros (Español)</option>
                        <option value="en">Gringos (English)</option>
                    </select>
                </div>

                {/* Music Settings */}
                <div className="flex flex-col gap-2 bg-gray-800/50 p-3 rounded">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="music"
                            checked={settings.musicEnabled}
                            onChange={(e) => updateSetting('musicEnabled', e.target.checked)}
                            className="w-5 h-5 accent-orange-500"
                        />
                        <label htmlFor="music" className="cursor-pointer select-none flex items-center gap-2 font-bold">
                            <Music size={16} /> {t.musicLabel}
                        </label>
                    </div>
                    {settings.musicEnabled && (
                        <select 
                            value={settings.musicStyle}
                            onChange={(e) => updateSetting('musicStyle', e.target.value as MusicStyle)}
                            className="bg-gray-700 border border-gray-500 rounded p-1 text-sm text-white mt-1"
                        >
                            <option value="joropo">{t.musicJoropo}</option>
                            <option value="country">{t.musicCountry}</option>
                            <option value="mix">{t.musicMix}</option>
                            <option value="retro">{t.musicRetro}</option>
                        </select>
                    )}
                </div>

                <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded">
                        <input 
                        type="checkbox" 
                        id="narratorAudio"
                        checked={settings.narratorAudioEnabled}
                        onChange={(e) => updateSetting('narratorAudioEnabled', e.target.checked)}
                        className="w-5 h-5 accent-orange-500"
                    />
                    <label htmlFor="narratorAudio" className="cursor-pointer select-none flex items-center gap-2">
                        <Mic size={16} /> {t.narratorAudioLabel}
                    </label>
                </div>

                <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded">
                    <input 
                        type="checkbox" 
                        id="narratorText"
                        checked={settings.narratorTextEnabled}
                        onChange={(e) => updateSetting('narratorTextEnabled', e.target.checked)}
                        className="w-5 h-5 accent-orange-500"
                    />
                    <label htmlFor="narratorText" className="cursor-pointer select-none flex items-center gap-2">
                        <MessageSquare size={16} /> {t.narratorTextLabel}
                    </label>
                </div>

                <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded border border-green-800">
                        <input 
                        type="checkbox" 
                        id="retro"
                        checked={settings.retroMode}
                        onChange={(e) => updateSetting('retroMode', e.target.checked)}
                        className="w-5 h-5 accent-green-500"
                    />
                    <label htmlFor="retro" className="cursor-pointer select-none flex items-center gap-2 text-green-300">
                        <Smartphone size={16} /> {t.retroLabel}
                    </label>
                </div>

                <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded">
                        <input 
                        type="checkbox" 
                        id="joy"
                        checked={settings.useJoystick}
                        onChange={(e) => updateSetting('useJoystick', e.target.checked)}
                        className="w-5 h-5 accent-orange-500"
                    />
                    <label htmlFor="joy" className="cursor-pointer select-none">{t.joyLabel}</label>
                </div>

                    <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded">
                        <input 
                        type="checkbox" 
                        id="bomb"
                        checked={settings.bombsEnabled}
                        onChange={(e) => updateSetting('bombsEnabled', e.target.checked)}
                        className="w-5 h-5 accent-orange-500"
                    />
                    <label htmlFor="bomb" className="cursor-pointer select-none text-red-300">{t.bombLabel}</label>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-300">{t.diffLabel}</label>
                    <select 
                        value={settings.difficulty}
                        onChange={(e) => updateSetting('difficulty', e.target.value as Difficulty)}
                        className="bg-gray-700 border border-gray-500 rounded p-2 text-white"
                    >
                        <option value="easy">{t.optEasy}</option>
                        <option value="medium">{t.optMedium}</option>
                        <option value="hard">{t.optHard}</option>
                    </select>
                </div>

                <p className="text-xs text-gray-500 text-center mt-2">{t.mobSetHint}</p>
                <div className="text-[10px] text-gray-600 text-center mt-2 font-mono opacity-60">v{APP_VERSION}</div>

                <button 
                    onClick={onClose}
                    className="mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded border-2 border-gray-400"
                >
                    {t.closeBtn}
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;