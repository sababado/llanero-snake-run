
import { useEffect } from 'react';
import { MultiplayerState, NetworkPacket, UpdatePacket, InputPacket, Direction } from '../types';
import { multiplayerService } from '../services/multiplayerService';

export const useMultiplayerSync = (
    mpState: MultiplayerState,
    onUpdateReceived: (update: UpdatePacket) => void,
    onGameOverReceived: (payload: any) => void,
    onRemoteInputReceived: (dir: Direction) => void
) => {
    useEffect(() => {
        if (!mpState.active) return;
  
        const handleData = (data: NetworkPacket) => {
            if (mpState.role === 'client') {
               if (data.type === 'UPDATE') {
                    onUpdateReceived(data.payload as UpdatePacket);
                } else if (data.type === 'GAME_OVER') {
                    onGameOverReceived(data.payload);
                }
            } else if (mpState.role === 'host') {
                if (data.type === 'INPUT') {
                    const payload = data.payload as InputPacket;
                    onRemoteInputReceived(payload.dir);
                }
            }
        };
  
        const handleError = (err: string) => console.error("MP Sync Error:", err);
  
        multiplayerService.on('data', handleData);
        multiplayerService.on('error', handleError);
  
        return () => {
            multiplayerService.off('data', handleData);
            multiplayerService.off('error', handleError);
        };
    }, [mpState, onUpdateReceived, onGameOverReceived, onRemoteInputReceived]);
};
