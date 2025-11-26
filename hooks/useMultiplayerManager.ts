
import { useState, useEffect, useCallback, useRef } from 'react';
import { MultiplayerState, GameSettings, NetworkPacket, InitPacket, ReadyPacket, AppView } from '../types';
import { multiplayerService } from '../services/multiplayerService';

interface MultiplayerManagerProps {
    settings: GameSettings;
    backgroundUrl: string | null;
    virgenUrl: string | null;
    onInitDataReceived: (settings: GameSettings, bg: string | null, virgen: string | null) => void;
    onStartGameCommand: () => void;
    onRematchCommand: () => void;
}

export const useMultiplayerManager = ({
    settings,
    backgroundUrl,
    virgenUrl,
    onInitDataReceived,
    onStartGameCommand,
    onRematchCommand
}: MultiplayerManagerProps) => {
    const [mpState, setMpState] = useState<MultiplayerState>({
        active: false,
        role: 'none',
        roomId: null,
        status: 'disconnected'
    });

    const [readyStatus, setReadyStatus] = useState({ host: false, client: false });
    const [countdown, setCountdown] = useState<number | null>(null);
    const [mpError, setMpError] = useState<string | null>(null);

    // --- Actions ---

    const connectAsHost = useCallback(() => {
        // Logic handled in Lobby UI mostly, but state update here
    }, []);

    const resetMultiplayer = useCallback(() => {
        multiplayerService.close();
        setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
        setReadyStatus({ host: false, client: false });
        setCountdown(null);
        setMpError(null);
    }, []);

    const setConnected = useCallback((role: 'host' | 'client', roomId: string) => {
        setMpState({ active: true, role, roomId, status: 'connected' });
        setReadyStatus({ host: false, client: false });
        setMpError(null);

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

    // Host Driven Countdown: Sends ticks 3, 2, 1, Start to ensure Client is perfectly synced
    const runHostCountdown = useCallback(() => {
        if (mpState.role !== 'host') return;

        let count = 3;
        
        const sendTick = () => {
            if (count > 0) {
                setCountdown(count);
                // Send packet with redundancy to prevent loss
                const packet = { type: 'COUNTDOWN', payload: { value: count } } as NetworkPacket;
                multiplayerService.send(packet);
                // Redundant send 50ms later
                setTimeout(() => multiplayerService.send(packet), 50);
                
                count--;
                setTimeout(sendTick, 1000);
            } else {
                setCountdown(null);
                onStartGameCommand();
                // Send START with redundancy
                const startPacket = { type: 'START_GAME', payload: {} } as NetworkPacket;
                multiplayerService.send(startPacket);
                setTimeout(() => multiplayerService.send(startPacket), 50);
                setTimeout(() => multiplayerService.send(startPacket), 100);
            }
        };
        
        sendTick();
    }, [mpState.role, onStartGameCommand]);

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
            // console.log("MP Packet:", data.type); // Debug log
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
                    onRematchCommand();
                    break;
                case 'COUNTDOWN':
                    // Client: Just update display based on host's tick
                    setCountdown(data.payload.value);
                    break;
                case 'START_GAME':
                    setCountdown(null);
                    onStartGameCommand();
                    break;
            }
        };
  
        const handleError = (err: string) => {
             console.error("MP Manager Error:", err);
             setMpError(err);
        };

        const handleClose = () => {
            console.log("MP Connection Closed");
            // Only show error if we thought we were connected
            if (mpState.status === 'connected') {
                setMpError("Connection to opponent lost.");
            }
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
    }, [mpState.active, mpState.role, mpState.status, readyStatus, onInitDataReceived, onStartGameCommand, resetForRematch, onRematchCommand]);

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

    return {
        mpState,
        readyStatus,
        countdown,
        mpError,
        setConnected,
        resetMultiplayer,
        signalReady,
        runHostCountdown,
        initiateRematch,
        resetForRematch
    };
};
