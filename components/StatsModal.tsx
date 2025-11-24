
import React from 'react';
import { GameStats } from '../types';
import { X } from 'lucide-react';

interface StatsModalProps {
    stats: GameStats;
    onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-[#5D4037] p-6 rounded-lg border-4 border-[#8d6e63] w-full max-w-sm relative shadow-2xl">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-white hover:text-red-400"
                >
                    <X size={24} />
                </button>
                
                <h2 className="font-rye text-[#f1c40f] text-2xl mb-6 text-center border-b-2 border-[#8d6e63] pb-2">
                    Estadísticas del Hato
                </h2>

                <div className="space-y-4 font-mono text-lg">
                    <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                        <span className="text-yellow-200">🏆 Puntaje Máximo:</span>
                        <span className="font-bold">{stats.highScore}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                        <span className="text-green-200">🐹 Chigüiros Comidos:</span>
                        <span className="font-bold">{stats.totalChiguiros}</span>
                    </div>
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                        <span className="text-orange-200">🎮 Juegos Jugados:</span>
                        <span className="font-bold">{stats.totalGames}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                        <span className="text-blue-200">📊 Promedio:</span>
                        <span className="font-bold">
                            {stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0}
                        </span>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400 italic">
                    "El que tiene ganado, que lo cuide..."
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
