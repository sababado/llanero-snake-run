
import React, { useState } from 'react';
import { X, Utensils } from 'lucide-react';
import { FOOD_FACTS } from '../lore';

interface GastronomyModalProps {
    items: string[];
    onClose: () => void;
}

const GastronomyModal: React.FC<GastronomyModalProps> = React.memo(({ items, onClose }) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [fact, setFact] = useState<string>("");

    const handleItemClick = (item: string) => {
        setSelectedItem(item);
        const generatedFact = FOOD_FACTS[item] || `${item} es un plato típico delicioso del Llano.`;
        setFact(generatedFact);
    };

    // Filter unique items
    const uniqueItems: string[] = Array.from(new Set(items));

    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-orange-50 p-6 rounded-lg border-4 border-orange-800 w-full max-w-md relative shadow-2xl max-h-[90vh] flex flex-col">
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-orange-900 hover:text-red-500"
                >
                    <X size={24} />
                </button>

                <h2 className="font-rye text-orange-900 text-2xl mb-2 text-center flex items-center justify-center gap-2">
                    <Utensils /> Menú del Llano
                </h2>
                <p className="text-center text-orange-800 text-sm mb-4 italic">Lo que te comiste hoy:</p>

                {uniqueItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        ¡No comiste nada, pariente! <br/> 
                        <span className="text-xs">(Come chigüiros con nombres de comida)</span>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {uniqueItems.map(item => (
                                <button
                                    key={item}
                                    onClick={() => handleItemClick(item)}
                                    className={`p-2 rounded border-2 text-sm font-bold transition-all ${selectedItem === item ? 'bg-orange-500 text-white border-orange-700' : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-100'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        {selectedItem && (
                            <div className="bg-white border-2 border-orange-300 p-4 rounded-lg shadow-inner min-h-[80px] flex items-center justify-center">
                                <p className="text-orange-900 text-center font-serif leading-tight">
                                    "{fact}"
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>
        </div>
    );
});

export default GastronomyModal;
