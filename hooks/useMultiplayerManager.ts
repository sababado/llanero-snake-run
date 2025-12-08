import { useState, useEffect, useCallback, useRef } from 'react';
import { MultiplayerState, GameSettings, NetworkPacket, InitPacket, ReadyPacket, StartGamePacket, AppView } from '../types';
import { multiplayerService } from '../services/multiplayerService';
import { TILE_SIZE } from '../constants';

interface MultiplayerManagerProps {
    settings: GameSettings;
    backgroundUrl: string | null;
    virgenUrl: string | null;
    localDimensions: { width: number; height: number };
    onInitDataReceived: (settings: GameSettings, bg: string | null, virgen: string | null) => void;
    onStartGameCommand: (gridSize: { width: number; height: number }) => void;
    onRematchCommand: () => void;
    onSettingsUpdated?: (newSettings: GameSettings) => void;
}

export const useMultiplayerManager = ({
    settings,
    backgroundUrl,
    virgenUrl,
    localDimensions,
    onInitDataReceived,
    onStartGameCommand,
    onRematchCommand,
    onSettingsUpdated
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
    const [waitingForAck, setWaitingForAck] = useState(false);
    
    // Store peer dimensions for negotiation
    const peerDimensionsRef = useRef<{ width: number; height: number } | null>(null);
    // Ref for handshake interval
    const handshakeIntervalRef = useRef<any>(null);

    // --- Actions ---

    const resetMultiplayer = useCallback(() => {
        multiplayerService.close();
        setMpState({ active: false, role: 'none', roomId: null, status: 'disconnected' });
        setReadyStatus({ host: false, client: false });
        setCountdown(null);
        setMpError(null);
        setWaitingForAck(false);
        peerDimensionsRef.current = null;
        if (handshakeIntervalRef.current) clearInterval(handshakeIntervalRef.current);
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

    const broadcastSettings = useCallback((newSettings: GameSettings) => {
        if (mpState.active && mpState.role === 'host') {
            multiplayerService.send({ type: 'SETTINGS_UPDATE', payload: newSettings });
        }
    }, [mpState]);

    const signalReady = useCallback(() => {
        if (!mpState.active || mpState.role === 'none') return;
        
        // Optimistic local update
        setReadyStatus(prev => ({ ...prev, [mpState.role]: true }));
        
        // Send dimensions with ready packet
        const role = mpState.role;
        const send = () => multiplayerService.send({ 
            type: 'READY', 
            payload: { role, dimensions: localDimensions } as ReadyPacket 
        });
        send();
        setTimeout(send, 100);
        setTimeout(send, 200);
        setTimeout(send, 400);
    }, [mpState, localDimensions]);

    const negotiateGridSize = useCallback(() => {
        if (!peerDimensionsRef.current) return localDimensions;
        
        // Determine shared grid dimensions: intersection of both screens
        // Snap to TILE_SIZE to ensure grid alignment
        const minWidth = Math.min(localDimensions.width, peerDimensionsRef.current.width);
        const minHeight = Math.min(localDimensions.height, peerDimensionsRef.current.height);
        
        return {
            width: Math.floor(minWidth / TILE_SIZE) * TILE_SIZE,
            height: Math.floor(minHeight / TILE_SIZE) * TILE_SIZE
        };
    }, [localDimensions]);

    // Internal function to execute the actual countdown sequence
    const executeCountdownSequence = useCallback(() => {
        let count = 3;
        const sendTick = () => {
            if (count > 0) {
                setCountdown(count);
                const packet = { type: 'COUNTDOWN', payload: { value: count } } as NetworkPacket;
                multiplayerService.send(packet);
                setTimeout(() => multiplayerService.send(packet), 50); // Redundancy
                
                count--;
                setTimeout(sendTick, 1000);
            } else {
                setCountdown(null);
                
                // Negotiate Size and Start
                const gridSize = negotiateGridSize();
                onStartGameCommand(gridSize);
                
                // Send START with negotiated grid size
                const startPacket = { 
                    type: 'START_GAME', 
                    payload: { gridSize } as StartGamePacket 
                } as NetworkPacket;
                
                multiplayerService.send(startPacket);
                setTimeout(() => multiplayerService.send(startPacket), 50);
                setTimeout(() => multiplayerService.send(startPacket), 100);
            }
        };
        
        sendTick();
    }, [negotiateGridSize, onStartGameCommand]);

    // Host Driven Countdown with Handshake
    const runHostCountdown = useCallback(() => {
        if (mpState.role !== 'host') return;
        
        setWaitingForAck(true);
        
        // Retry Logic: Send check periodically until ACK is received
        let attempts = 0;
        const sendCheck = () => {
            if (attempts >= 5) {
                if (handshakeIntervalRef.current) clearInterval(handshakeIntervalRef.current);
                setWaitingForAck(false);
                setMpError("Client unresponsive during start check.");
                return;
            }
            multiplayerService.send({ type: 'PRE_START_CHECK', payload: {} });
            attempts++;
        };

        sendCheck();
        if (handshakeIntervalRef.current) clearInterval(handshakeIntervalRef.current);
        handshakeIntervalRef.current = setInterval(sendCheck, 1000);

    }, [mpState.role]);

    const initiateRematch = useCallback(() => {
        if (mpState.role === 'host') {
            multiplayerService.send({ type: 'REMATCH', payload: {} });
        }
    }, [mpState.role]);

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
                case 'SETTINGS_UPDATE':
                    if (onSettingsUpdated) onSettingsUpdated(data.payload as GameSettings);
                    break;
                case 'READY':
                    const readyPayload = data.payload as ReadyPacket;
                    if (readyPayload.role) {
                         setReadyStatus(prev => ({ ...prev, [readyPayload.role]: true }));
                    }
                    if (readyPayload.dimensions) {
                        peerDimensionsRef.current = readyPayload.dimensions;
                    }
                    break;
                case 'PING':
                    if (mpState.role !== 'none' && readyStatus[mpState.role]) {
                        multiplayerService.send({ 
                            type: 'READY', 
                            payload: { role: mpState.role, dimensions: localDimensions } as ReadyPacket 
                        });
                    }
                    break;
                case 'PRE_START_CHECK':
                    // Client received check, respond with ACK immediately
                    if (mpState.role === 'client') {
                        multiplayerService.send({ type: 'PRE_START_ACK', payload: {} });
                    }
                    break;
                case 'PRE_START_ACK':
                    // Host received ACK, stop retrying and start actual countdown
                    if (mpState.role === 'host') {
                        if (handshakeIntervalRef.current) clearInterval(handshakeIntervalRef.current);
                        setWaitingForAck(false);
                        executeCountdownSequence();
                    }
                    break;
                case 'REMATCH':
                    resetForRematch();
                    onRematchCommand();
                    break;
                case 'COUNTDOWN':
                    setCountdown(data.payload.value);
                    break;
                case 'START_GAME':
                    setCountdown(null);
                    const startPayload = data.payload as StartGamePacket;
                    onStartGameCommand(startPayload.gridSize);
                    break;
            }
        };
  
        const handleError = (err: string) => {
             console.error("MP Manager Error:", err);
             setMpError(err);
        };

        const handleClose = () => {
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
            if (handshakeIntervalRef.current) clearInterval(handshakeIntervalRef.current);
        };
    }, [mpState.active, mpState.role, mpState.status, readyStatus, localDimensions, onInitDataReceived, onStartGameCommand, resetForRematch, onRematchCommand, onSettingsUpdated, executeCountdownSequence]);

    // --- Heartbeat ---
    useEffect(() => {
        if (!mpState.active || mpState.role === 'none') return;
  
        const interval = setInterval(() => {
            const role = mpState.role;
            if (role !== 'none' && readyStatus[role]) {
                 multiplayerService.send({ 
                     type: 'READY', 
                     payload: { role, dimensions: localDimensions } as ReadyPacket 
                 });
            }
            const peerRole = role === 'host' ? 'client' : 'host';
            if (!readyStatus[peerRole]) {
                 multiplayerService.send({ type: 'PING', payload: {} });
            }
        }, 500);
  
        return () => clearInterval(interval);
    }, [mpState.active, mpState.role, readyStatus, localDimensions]);

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
        resetForRematch,
        broadcastSettings,
        waitingForAck
    };
};