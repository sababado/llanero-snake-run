
import React from 'react';
import { GameStats } from '../types';
import { X, Trophy } from 'lucide-react';

interface StatsModalProps {
    stats: GameStats;
    onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-[#5D4037] p-6 rounded-lg border-4 border-[#8d6e63] w-full max-w-sm relative shadow-2xl max-h-[90vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-white hover:text-red-400"
                >
                    <X size={24} />
                </button>
                
                <h2 className="font-rye text-[#f1c40f] text-2xl mb-4 text-center border-b-2 border-[#8d6e63] pb-2">
                    Estadísticas del Hato
                </h2>

                <div className="space-y-4 font-mono text-lg mb-6">
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
                </div>

                <h3 className="font-rye text-white text-lg mb-2 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" /> Leaderboard (Top 5)
                </h3>
                
                <div className="bg-black/30 rounded p-2">
                    {(!stats.leaderboard || stats.leaderboard.length === 0) ? (
                        <div className="text-center text-gray-400 text-sm py-4">Sin registros aún.</div>
                    ) : (
                        <table className="w-full text-sm font-mono text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="pb-1">#</th>
                                    <th className="pb-1">Name</th>
                                    <th className="pb-1 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.leaderboard.map((entry, idx) => (
                                    <tr key={idx} className="border-b border-white/5 last:border-0">
                                        <td className="py-2 text-yellow-500 font-bold">{idx + 1}</td>
                                        <td className="py-2">{entry.name}</td>
                                        <td className="py-2 text-right">{entry.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-gray-400 italic">
                    "El que tiene ganado, que lo cuide..."
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
