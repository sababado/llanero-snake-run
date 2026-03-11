
import { GameState } from '../types';
import { TILE_SIZE } from '../constants';
import { drawRetroGame } from './retroRenderer';
import { drawSnake, drawHUD } from './renderUtils';

export const drawGame = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    assets: { bgImage: HTMLImageElement | null, virgenImage: HTMLImageElement | null, offscreenBg?: HTMLCanvasElement | null },
    time: number,
    isRetroMode: boolean
) => {
    const width = state.gridSize.width;
    const height = state.gridSize.height;
    
    if (isRetroMode) {
        drawRetroGame(ctx, state, width, height, time);
        return;
    }

    drawModernGame(ctx, state, assets, width, height, time);
};

const drawModernGame = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    assets: { bgImage: HTMLImageElement | null, virgenImage: HTMLImageElement | null, offscreenBg?: HTMLCanvasElement | null },
    width: number,
    height: number,
    time: number
) => {
    // Background & Weather
    if (assets.offscreenBg) {
        ctx.drawImage(assets.offscreenBg, 0, 0);
    } else {
        drawBackground(ctx, state, assets.bgImage, width, height);
    }

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
    if (state.boss.active || state.boss.warningTimer > 0) drawMythicalBoss(ctx, state.boss, time, width, height);

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
        
        // CONTRAST OVERLAY: Darken the background image so items pop
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; 
        ctx.fillRect(0, 0, w, h);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#4CA1AF");
        grad.addColorStop(1, "#C4E0E5");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // Season Overlays
    if (state.season === 'verano') {
        ctx.fillStyle = "rgba(255, 200, 0, 0.1)"; // Slight yellow/dry tint
        ctx.fillRect(0, 0, w, h);
    } else if (state.season === 'invierno') {
        ctx.fillStyle = "rgba(0, 100, 200, 0.1)"; // Slight blue/wet tint
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

    // VISIBILITY GLOW: White halo to separate from background
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 12;

    ctx.fillStyle = "#795548"; 
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 5, 16, 10, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 14, py + 8, 5, 0, Math.PI*2);
    ctx.fill();
    
    // Reset shadow for details so they stay sharp
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.arc(px + 14, py + 4, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(px + 15, py + 7, 1, 0, Math.PI*2);
    ctx.fill();
    
    if (name) {
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        // Text Stroke for readability on any background
        ctx.lineWidth = 3;
        ctx.strokeStyle = "black";
        ctx.strokeText(name, px + TILE_SIZE/2, py - 5);
        
        ctx.fillStyle = "white";
        ctx.fillText(name, px + TILE_SIZE/2, py - 5);
    }
};

const drawAguacate = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    
    // Slight Glow
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 8;

    ctx.fillStyle = "#2E7D32";
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 12, 7, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(px + 10, py + 8, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;

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
    
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 8;

    // Cup Body
    ctx.fillStyle = "#3E2723"; // Dark Brown
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + 16, py + 6);
    ctx.quadraticCurveTo(px + 16, py + 18, px + 10, py + 18);
    ctx.quadraticCurveTo(px + 4, py + 18, px + 4, py + 6);
    ctx.fill();
    
    ctx.shadowBlur = 0;

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
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
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

const drawMythicalBoss = (ctx: CanvasRenderingContext2D, boss: any, time: number, width: number, height: number) => {
    if (boss.warningTimer > 0) {
        // Warning phase
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(Math.sin(time / 100)) * 0.3})`;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = "red";
        ctx.font = "bold 24px 'Rye', cursive";
        ctx.textAlign = "center";
        ctx.fillText(
            boss.type === 'silbon' ? "¡EL SILBÓN SE ACERCA!" : "¡LA LLORONA LLORA!", 
            width / 2, 
            height / 2
        );
        return;
    }

    if (!boss.active) return;

    const px = boss.x * TILE_SIZE;
    const py = boss.y * TILE_SIZE;

    if (boss.type === 'silbon') {
        // El Silbon: Tall, skinny figure with a hat
        const t = TILE_SIZE;
        
        // Body (Skinny and tall)
        ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
        ctx.fillRect(px + t * 0.2, py - t * 4, t * 0.6, t * 5); // Torso and legs

        // Arms (lanky, hanging down)
        ctx.strokeStyle = "rgba(20, 20, 20, 0.9)";
        ctx.lineWidth = t * 0.2;
        ctx.beginPath();
        ctx.moveTo(px + t * 0.5, py - t * 3); // shoulder
        ctx.lineTo(px - t * 0.5, py - t * 1); // left arm
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + t * 0.5, py - t * 3); // shoulder
        ctx.lineTo(px + t * 1.5, py - t * 1); // right arm holding sack
        ctx.stroke();

        // Sack of bones
        ctx.fillStyle = "#5C4033"; // Dark brown
        ctx.beginPath();
        ctx.ellipse(px + t * 1.8, py, t * 0.8, t * 1.2, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Sack tie
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + t * 1.5, py - t * 1);
        ctx.lineTo(px + t * 1.8, py - t * 0.8);
        ctx.stroke();

        // Hat (Sombrero Llanero)
        ctx.fillStyle = "#1a1a1a";
        // Brim
        ctx.beginPath();
        ctx.ellipse(px + t * 0.5, py - t * 4.2, t * 1.8, t * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Crown
        ctx.beginPath();
        ctx.ellipse(px + t * 0.5, py - t * 4.4, t * 0.8, t * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes (under the brim)
        ctx.fillStyle = "#ff0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px + t * 0.3, py - t * 3.8, 3, 0, Math.PI * 2);
        ctx.arc(px + t * 0.7, py - t * 3.8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
    } else if (boss.type === 'llorona') {
        // La Llorona: Creepy weeping woman in a tattered white dress
        const t = TILE_SIZE;
        const floatY = Math.sin(time / 150) * 8; // Floating up and down
        const alpha = 0.6 + Math.sin(time / 200) * 0.2;

        ctx.save();
        ctx.translate(px, py + floatY);

        // Ghostly Aura
        ctx.shadowColor = "rgba(200, 220, 255, 0.8)";
        ctx.shadowBlur = 20;

        // Flowing, tattered white dress and veil
        ctx.fillStyle = `rgba(220, 230, 240, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(t * 0.5, -t * 3); // Top of head
        ctx.quadraticCurveTo(t * 2, -t * 1, t * 1.5, t * 2); // Right side
        // Tattered bottom edge
        ctx.lineTo(t * 1.2, t * 1.5);
        ctx.lineTo(t * 0.8, t * 2.2);
        ctx.lineTo(t * 0.5, t * 1.6);
        ctx.lineTo(t * 0.2, t * 2.2);
        ctx.lineTo(-t * 0.2, t * 1.5);
        ctx.lineTo(-t * 0.5, t * 2); // Left side
        ctx.quadraticCurveTo(-t * 1, -t * 1, t * 0.5, -t * 3);
        ctx.fill();

        ctx.shadowBlur = 0; // Turn off glow for details

        // Long, stringy black hair
        ctx.fillStyle = `rgba(10, 10, 10, ${alpha + 0.2})`;
        ctx.beginPath();
        ctx.moveTo(t * 0.5, -t * 3);
        ctx.quadraticCurveTo(t * 1.5, -t * 2.5, t * 1.2, 0); // Right hair
        ctx.lineTo(t * 0.8, -t * 1.5); // Face cutout right
        ctx.lineTo(t * 0.2, -t * 1.5); // Face cutout left
        ctx.lineTo(-t * 0.2, 0); // Left hair
        ctx.quadraticCurveTo(-t * 0.5, -t * 2.5, t * 0.5, -t * 3);
        ctx.fill();

        // Pale, sunken face
        ctx.fillStyle = `rgba(200, 210, 220, ${alpha + 0.3})`;
        ctx.beginPath();
        ctx.ellipse(t * 0.5, -t * 2, t * 0.45, t * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hollow, dark eyes
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.ellipse(t * 0.3, -t * 2.1, t * 0.15, t * 0.2, 0, 0, Math.PI * 2);
        ctx.ellipse(t * 0.7, -t * 2.1, t * 0.15, t * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing white pupils (tiny)
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(t * 0.3, -t * 2.1, 1.5, 0, Math.PI * 2);
        ctx.arc(t * 0.7, -t * 2.1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark/Bloody tears streaming down
        ctx.fillStyle = "rgba(50, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.moveTo(t * 0.3, -t * 1.9);
        ctx.lineTo(t * 0.25, -t * 1.2);
        ctx.lineTo(t * 0.35, -t * 1.2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(t * 0.7, -t * 1.9);
        ctx.lineTo(t * 0.65, -t * 1.2);
        ctx.lineTo(t * 0.75, -t * 1.2);
        ctx.fill();

        // Creepy wailing mouth
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(t * 0.5, -t * 1.6, t * 0.15, t * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};
