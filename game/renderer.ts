import { GameState } from '../types';
import { TILE_SIZE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../constants';
import { drawRetroGame } from './retroRenderer';
import { drawSnake, drawHUD } from './renderUtils';

export const drawGame = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    assets: { bgImage: HTMLImageElement | null, virgenImage: HTMLImageElement | null },
    time: number,
    isRetroMode: boolean
) => {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;
    
    if (isRetroMode) {
        drawRetroGame(ctx, state, width, height, time);
        return;
    }

    drawModernGame(ctx, state, assets, width, height, time);
};

const drawModernGame = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    assets: { bgImage: HTMLImageElement | null, virgenImage: HTMLImageElement | null },
    width: number,
    height: number,
    time: number
) => {
    // Background & Weather
    drawBackground(ctx, state, assets.bgImage, width, height);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    state.clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.arc(c.x + c.size*0.8, c.y - c.size*0.2, c.size*1.1, 0, Math.PI * 2);
        ctx.arc(c.x + c.size*1.6, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Items
    drawChiguiro(ctx, state.chiguiro.x, state.chiguiro.y, state.chiguiro.name);
    if (state.aguacate.active) drawAguacate(ctx, state.aguacate.x, state.aguacate.y);
    if (state.virgen.active) drawVirgen(ctx, state.virgen.x, state.virgen.y, assets.virgenImage, time);
    if (state.cafe.active) drawCafe(ctx, state.cafe.x, state.cafe.y, time);
    if (state.bola.active) drawBolaDeFuego(ctx, state.bola.x, state.bola.y);
    if (state.bomb.active) drawBomb(ctx, state.bomb.x, state.bomb.y);

    // Draw Particles
    state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Snakes with breathing animation
    drawSnake(ctx, state.snake1, time, false);
    if (state.gameMode === 2) drawSnake(ctx, state.snake2, time, false);

    // Rain Overlay
    if (state.rainIntensity > 0) {
        drawRain(ctx, width, height, time, state.rainIntensity);
    }

    // Draw HUD (Powerup Indicators)
    drawHUD(ctx, state, width, height, false);
};

const drawBackground = (
    ctx: CanvasRenderingContext2D, 
    state: GameState, 
    bgImage: HTMLImageElement | null, 
    w: number, 
    h: number
) => {
    // Base Background
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, w, h);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#4CA1AF");
        grad.addColorStop(1, "#C4E0E5");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // Weather Overlays
    if (state.weather === 'sunset') {
        ctx.fillStyle = "rgba(255, 87, 34, 0.3)"; // Orange tint
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
    } else if (state.weather === 'night') {
        ctx.fillStyle = "rgba(10, 10, 50, 0.6)"; // Dark Blue
        ctx.fillRect(0, 0, w, h);
        
        // Fireflies
        if (Math.random() > 0.5) {
            ctx.fillStyle = "#C6FF00";
            for(let i=0; i<3; i++) {
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        }
    }
}

const drawRain = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number) => {
    ctx.strokeStyle = `rgba(179, 229, 252, ${0.4 + intensity * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const dropCount = 50 + (intensity * 100);
    for (let i=0; i < dropCount; i++) {
        // Pseudo-random rain drops based on time so they "fall"
        const x = (Math.sin(i * 123.45) * w + w + time * 0.5) % w;
        const y = (Math.cos(i * 67.89) * h + h + time * 1.5) % h;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 10);
    }
    ctx.stroke();
}

const drawChiguiro = (ctx: CanvasRenderingContext2D, x: number, y: number, name?: string) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    ctx.fillStyle = "#795548"; 
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 5, 16, 10, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 14, py + 8, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.arc(px + 14, py + 4, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(px + 15, py + 7, 1, 0, Math.PI*2);
    ctx.fill();
    
    if (name) {
        ctx.fillStyle = "#333";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(name, px + TILE_SIZE/2, py - 4);
    }
};

const drawAguacate = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    ctx.fillStyle = "#2E7D32";
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 12, 7, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(px + 10, py + 8, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#AED581";
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 12, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.arc(px + 10, py + 13, 3, 0, Math.PI * 2);
    ctx.fill();
};

const drawCafe = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    
    // Cup Body
    ctx.fillStyle = "#3E2723"; // Dark Brown
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + 16, py + 6);
    ctx.quadraticCurveTo(px + 16, py + 18, px + 10, py + 18);
    ctx.quadraticCurveTo(px + 4, py + 18, px + 4, py + 6);
    ctx.fill();
    
    // Handle
    ctx.strokeStyle = "#3E2723";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 10, 3, 1.5 * Math.PI, 0.5 * Math.PI);
    ctx.stroke();

    // Coffee Liquid
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 6, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Steam
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    const steamOffset = Math.sin(time * 0.01) * 2;
    
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 4);
    ctx.quadraticCurveTo(px + 6 + steamOffset, py, px + 8, py - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px + 12, py + 4);
    ctx.quadraticCurveTo(px + 10 + steamOffset, py, px + 12, py - 4);
    ctx.stroke();
};

const drawVirgen = (ctx: CanvasRenderingContext2D, x: number, y: number, virgenImage: HTMLImageElement | null, time: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const center = { x: px + TILE_SIZE/2, y: py + TILE_SIZE/2 };
    
    // Rotate rays
    const rotTime = time * 0.002;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotTime);
    
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    for(let i=0; i<8; i++) {
        ctx.rotate(Math.PI/4);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
    }
    ctx.restore();

    // Pulse glow
    const glowSize = 20 + Math.sin(rotTime * 3) * 5;
    const gradient = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, glowSize);
    gradient.addColorStop(0, "rgba(255, 223, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(px - 20, py - 20, TILE_SIZE + 40, TILE_SIZE + 40);

    if (virgenImage) {
        const size = TILE_SIZE * 2.5;
        const offset = (size - TILE_SIZE) / 2;
        
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(center.x, center.y, size/2.2, 0, Math.PI*2);
        ctx.fill();

        ctx.drawImage(virgenImage, px - offset, py - offset, size, size);
    } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "gold";
        ctx.fillStyle = "#FFD700"; 
        ctx.beginPath();
        ctx.arc(px + 10, py + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1976D2";
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 20);
        ctx.quadraticCurveTo(px + 10, py - 5, px + 18, py + 20);
        ctx.fill();
        ctx.fillStyle = "#FFE0B2";
        ctx.beginPath();
        ctx.arc(px + 10, py + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(px + 12, py + 14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
};

const drawBomb = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    ctx.beginPath(); ctx.arc(px+10, py+10, 8, 0, Math.PI*2); ctx.stroke();
    ctx.fillText("X", px+6, py+14);
}

const drawBolaDeFuego = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    
    const gradient = ctx.createRadialGradient(px + 10, py + 10, 2, px + 10, py + 10, 12);
    gradient.addColorStop(0, "#FFFF00");
    gradient.addColorStop(0.5, "#FF5722");
    gradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px + 10, py + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(px + 10, py + 10, 4, 0, Math.PI * 2);
    ctx.fill();
};