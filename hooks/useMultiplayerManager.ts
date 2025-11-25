
import { useState, useEffect, useCallback, useRef } from 'react';
import { MultiplayerState, GameSettings, NetworkPacket, InitPacket, ReadyPacket, AppView } from '../types';
import { multiplayerService } from '../services/multiplayerService';

interface MultiplayerManagerProps {
    settings: GameSettings;
    backgroundUrl: string | null;
    virgenUrl: string | null;
    onInitDataReceived: (settings: GameSettings, bg: string | null, virgen: string | null) => void;
    onStartGameCommand: () => void;
}

export const useMultiplayerManager = ({
    settings,
    backgroundUrl,
    virgenUrl,
    onInitDataReceived,
    onStartGameCommand
}: MultiplayerManagerProps) => {
    const [mpState, setMpState] = useState<MultiplayerState>({
        active: false,
        role: 'none',
        roomId: null,
        status: 'disconnected'
    });

    const [readyStatus, setReadyStatus] = useState({ host: false, client: false });
    const [countdown, setCountdown] = useState<number | null>(null);

    // --- Actions ---

    const connectAsHost = useCallback(() => {
        // Logic handled in Lobby UI mostly, but state update here
    }, []);

    const resetMultiplayer = useCallback(() => {
        multiplayerService.close();
        setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
        setReadyStatus({ host: false, client: false });
        setCountdown(null);
    }, []);

    const setConnected = useCallback((role: 'host' | 'client', roomId: string) => {
        setMpState({ active: true, role, roomId, status: 'connected' });
        setReadyStatus({ host: false, client: false });

        // If Host, send INIT packet immediately
        if (role === 'host') {
            setTimeout(() => {
                const initPacket: NetworkPacket = {
                    type: 'INIT',
                    payload: { settings, backgroundUrl, virgenUrl } as InitPacket
                };
                multiplayerService.send(initPacket);
            }, 500);
        }
    }, [settings, backgroundUrl, virgenUrl]);

    const signalReady = useCallback(() => {
        if (!mpState.active || mpState.role === 'none') return;
        
        // Optimistic local update
        setReadyStatus(prev => ({ ...prev, [mpState.role]: true }));
        
        // Spam ready packet a few times to ensure delivery
        const role = mpState.role;
        const send = () => multiplayerService.send({ type: 'READY', payload: { role } as ReadyPacket });
        send();
        setTimeout(send, 100);
        setTimeout(send, 200);
        setTimeout(send, 400);
    }, [mpState]);

    const startHostCountdown = useCallback(() => {
        if (mpState.role === 'host') {
            multiplayerService.send({ type: 'COUNTDOWN', payload: {} });
            setTimeout(() => {
                setCountdown(3);
            }, 500); 
        }
    }, [mpState.role]);

    const initiateRematch = useCallback(() => {
        if (mpState.role === 'host') {
            multiplayerService.send({ type: 'REMATCH', payload: {} });
        }
    }, [mpState.role]);

    // --- Reset Logic (Used by App for Rematch UI reset) ---
    const resetForRematch = useCallback(() => {
        setCountdown(null);
        setReadyStatus({ host: false, client: false });
    }, []);

    // --- Event Listeners ---

    useEffect(() => {
        if (!mpState.active) return;
  
        const handleData = (data: NetworkPacket) => {
            switch (data.type) {
                case 'INIT':
                    const initPayload = data.payload as InitPacket;
                    onInitDataReceived(initPayload.settings, initPayload.backgroundUrl, initPayload.virgenUrl);
                    break;
                case 'READY':
                    const readyPayload = data.payload as ReadyPacket;
                    if (readyPayload.role) {
                         setReadyStatus(prev => ({ ...prev, [readyPayload.role]: true }));
                    }
                    break;
                case 'PING':
                    if (mpState.role !== 'none' && readyStatus[mpState.role]) {
                        multiplayerService.send({ type: 'READY', payload: { role: mpState.role } as ReadyPacket });
                    }
                    break;
                case 'REMATCH':
                    resetForRematch();
                    break;
                case 'COUNTDOWN':
                    setCountdown(3);
                    break;
                case 'START_GAME':
                    onStartGameCommand();
                    break;
            }
        };
  
        const handleError = (err: string) => console.error("MP Manager Error:", err);
        const handleClose = () => {
            console.log("MP Connection Closed");
            setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
        };
  
        multiplayerService.on('data', handleData);
        multiplayerService.on('error', handleError);
        multiplayerService.on('close', handleClose);
  
        return () => {
            multiplayerService.off('data', handleData);
            multiplayerService.off('error', handleError);
            multiplayerService.off('close', handleClose);
        };
    }, [mpState.active, mpState.role, readyStatus, onInitDataReceived, onStartGameCommand, resetForRematch]);

    // --- Heartbeat ---
    useEffect(() => {
        if (!mpState.active || mpState.role === 'none') return;
  
        const interval = setInterval(() => {
            const role = mpState.role;
            if (role !== 'none' && readyStatus[role]) {
                 multiplayerService.send({ type: 'READY', payload: { role } as ReadyPacket });
            }
            const peerRole = role === 'host' ? 'client' : 'host';
            if (!readyStatus[peerRole]) {
                 multiplayerService.send({ type: 'PING', payload: {} });
            }
        }, 500);
  
        return () => clearInterval(interval);
    }, [mpState.active, mpState.role, readyStatus]);

    // --- Countdown Logic ---
    useEffect(() => {
        if (countdown === null) return;
  
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setCountdown(null);
            // Host Authority: Start Game
            if (mpState.role === 'host') {
                onStartGameCommand();
                multiplayerService.send({ type: 'START_GAME', payload: {} });
            }
        }
    }, [countdown, mpState.role, onStartGameCommand]);

    return {
        mpState,
        readyStatus,
        countdown,
        setConnected,
        resetMultiplayer,
        signalReady,
        startHostCountdown,
        initiateRematch,
        resetForRematch
    };
};
