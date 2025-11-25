
import Peer, { DataConnection } from 'peerjs';
import { NetworkPacket } from '../types';

const APP_PREFIX = 'llanero-snake-v1-';

type EventHandler = (data: any) => void;

export class MultiplayerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private listeners: { [key: string]: Set<EventHandler> } = {
        'connect': new Set(),
        'data': new Set(),
        'error': new Set(),
        'close': new Set()
    };

    constructor() {}

    public on(event: 'connect' | 'data' | 'error' | 'close', handler: EventHandler) {
        if (this.listeners[event]) {
            this.listeners[event].add(handler);
        }
    }

    public off(event: 'connect' | 'data' | 'error' | 'close', handler: EventHandler) {
        if (this.listeners[event]) {
            this.listeners[event].delete(handler);
        }
    }

    private emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(handler => handler(data));
        }
    }

    private generateShortCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    public hostGame(onCodeGenerated: (code: string) => void) {
        this.createPeerWithRetry(onCodeGenerated);
    }

    private createPeerWithRetry(onSuccess: (code: string) => void, attempts = 0) {
        if (attempts > 5) {
            this.emit('error', "Could not generate a unique room code. Try again.");
            return;
        }

        const shortCode = this.generateShortCode();
        const fullId = `${APP_PREFIX}${shortCode}`;

        const tempPeer = new Peer(fullId);

        tempPeer.on('open', (id) => {
            this.peer = tempPeer;
            this.setupPeerListeners();
            onSuccess(shortCode);
        });

        tempPeer.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
                tempPeer.destroy();
                this.createPeerWithRetry(onSuccess, attempts + 1);
            } else {
                this.emit('error', err.message || 'Peer Error');
            }
        });
    }

    public joinGame(shortCode: string) {
        const cleanCode = shortCode.trim().toUpperCase();
        
        // Clean up previous peer if exists
        if (this.peer) this.peer.destroy();

        this.peer = new Peer();
        
        this.peer.on('open', () => {
             if (!this.peer) return;
             const targetId = `${APP_PREFIX}${cleanCode}`;
             const conn = this.peer.connect(targetId);
             this.handleConnection(conn);
        });

        this.peer.on('error', (err: any) => {
            this.emit('error', err.message || 'Connection Error');
        });
    }

    private setupPeerListeners() {
        if (!this.peer) return;

        this.peer.on('connection', (conn) => {
            if (this.conn && this.conn.open) {
                conn.close();
                return;
            }
            this.handleConnection(conn);
        });

        this.peer.on('error', (err: any) => {
             if (err.type !== 'unavailable-id') {
                 this.emit('error', err.message);
             }
        });
    }

    private handleConnection(conn: DataConnection) {
        this.conn = conn;

        this.conn.on('open', () => {
            this.emit('connect');
        });

        this.conn.on('data', (data) => {
            this.emit('data', data);
        });

        this.conn.on('close', () => {
            this.emit('close');
        });
        
        this.conn.on('error', (err) => {
             this.emit('error', err.message);
        });
    }

    public send(data: NetworkPacket) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        }
    }

    public close() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        // Emit close so UI updates
        this.emit('close');
    }
    
    // Deprecated wrapper to prevent crash if old code calls it before update propagates
    public setCallbacks() { 
        console.warn("setCallbacks is deprecated in MultiplayerService. Use .on()"); 
    }
}

export const multiplayerService = new MultiplayerService();
