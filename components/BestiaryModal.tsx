import React, { useState } from 'react';
import { X, BookOpen, Lock } from 'lucide-react';
import { BESTIARY_ENTRIES, BestiaryEntry } from '../lore';

interface BestiaryModalProps {
    totalChiguiros: number;
    onClose: () => void;
}

const BestiaryModal: React.FC<BestiaryModalProps> = React.memo(({ totalChiguiros, onClose }) => {
    const [selectedEntry, setSelectedEntry] = useState<BestiaryEntry | null>(null);

    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-[#f4ecd8] p-6 rounded-lg border-4 border-[#8b5a2b] w-full max-w-2xl relative shadow-2xl max-h-[90vh] flex flex-col">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-[#8b5a2b] hover:text-red-600"
                >
                    <X size={24} />
                </button>

                <h2 className="font-rye text-[#5c3a21] text-3xl mb-2 text-center flex items-center justify-center gap-3">
                    <BookOpen size={28} /> El Álbum Llanero
                </h2>
                <p className="text-center text-[#8b5a2b] text-sm mb-6 italic font-serif">
                    Descubre la fauna, flora y mitos del Llano. (Chigüiros atrapados: {totalChiguiros})
                </p>

                <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
                    {/* List of Entries */}
                    <div className="w-full md:w-1/2 overflow-y-auto border-r-2 border-[#d2b48c] pr-4 space-y-2">
                        {BESTIARY_ENTRIES.map(entry => {
                            const isUnlocked = totalChiguiros >= entry.unlockRequirement;
                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => isUnlocked && setSelectedEntry(entry)}
                                    disabled={!isUnlocked}
                                    className={`w-full text-left p-3 rounded border-2 transition-all flex items-center gap-3
                                        ${!isUnlocked ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed opacity-70' : 
                                          selectedEntry?.id === entry.id ? 'bg-[#8b5a2b] text-[#f4ecd8] border-[#5c3a21]' : 
                                          'bg-white text-[#5c3a21] border-[#d2b48c] hover:bg-[#e8d5b5]'}`}
                                >
                                    <div className="text-2xl w-8 text-center">
                                        {isUnlocked ? entry.icon : <Lock size={20} className="mx-auto" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold">{isUnlocked ? entry.name : '???'}</div>
                                        {!isUnlocked && (
                                            <div className="text-xs">Desbloquea a los {entry.unlockRequirement} chigüiros</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Entry Details */}
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 bg-white border-2 border-[#d2b48c] rounded-lg shadow-inner">
                        {selectedEntry ? (
                            <div className="text-center animate-in zoom-in duration-300">
                                <div className="text-6xl mb-4">{selectedEntry.icon}</div>
                                <h3 className="text-2xl font-rye text-[#5c3a21] mb-2">{selectedEntry.name}</h3>
                                <span className="inline-block px-3 py-1 bg-[#d2b48c] text-[#5c3a21] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                                    {selectedEntry.type}
                                </span>
                                <p className="text-[#8b5a2b] font-serif leading-relaxed text-lg">
                                    {selectedEntry.description}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center text-[#d2b48c] flex flex-col items-center gap-4">
                                <BookOpen size={48} className="opacity-50" />
                                <p className="font-serif italic">Selecciona una entrada desbloqueada para leer sobre ella.</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
});

export default BestiaryModal;
