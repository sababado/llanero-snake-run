
import { useState, useEffect } from 'react';
import { generateLlaneroBackground, generateVirgenAsset } from '../services/ai/visuals';

export const useGameAssets = () => {
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
    const [virgenUrl, setVirgenUrl] = useState<string | null>(null);
    const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadAssets = async () => {
            setIsGeneratingAssets(true);
            
            // Parallel loading
            const [bg, virgen] = await Promise.all([
                generateLlaneroBackground(),
                generateVirgenAsset()
            ]);

            if (mounted) {
                if (bg) setBackgroundUrl(bg);
                if (virgen) setVirgenUrl(virgen);
                setIsGeneratingAssets(false);
            }
        };

        loadAssets();

        return () => { mounted = false; };
    }, []);

    return { 
        backgroundUrl, 
        setBackgroundUrl, 
        virgenUrl, 
        setVirgenUrl, 
        isGeneratingAssets 
    };
};
