
import { GameState, Snake } from '../types';
import { TILE_SIZE, MAX_IMMUNITY } from '../constants';

export const drawGame = (
    ctx: CanvasRenderingContext2D,
    state: GameState,
    assets: { bgImage: HTMLImageElement | null, virgenImage: HTMLImageElement | null },
    time: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    // Background
    if (assets.bgImage) {
        ctx.drawImage(assets.bgImage, 0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        grad.addColorStop(0, "#4CA1AF");
        grad.addColorStop(1, "#C4E0E5");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
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

    // Floor (optional tint if no image)
    if(!assets.bgImage) {
      ctx.fillStyle = "#66BB6A";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw Items
    drawChiguiro(ctx, state.chiguiro.x, state.chiguiro.y, state.chiguiro.name);
    if (state.aguacate.active) drawAguacate(ctx, state.aguacate.x, state.aguacate.y);
    if (state.virgen.active) drawVirgen(ctx, state.virgen.x, state.virgen.y, assets.virgenImage, time);
    if (state.cafe.active) drawCafe(ctx, state.cafe.x, state.cafe.y, time);
    if (state.bola.active) drawBolaDeFuego(ctx, state.bola.x, state.bola.y);

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
    drawSnake(ctx, state.snake1, time);
    if (state.gameMode === 2) drawSnake(ctx, state.snake2, time);

    // Draw HUD (Powerup Indicators)
    drawHUD(ctx, state, canvasWidth, canvasHeight);
};

const drawHUD = (ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) => {
    // P1 Indicator (Left)
    if (state.snake1.immunityTimer > 0) {
        drawPowerUpBar(ctx, 30, 60, state.snake1.immunityTimer, "P1 Energía");
    }

    // P2 Indicator (Right) - Only if active
    if (state.gameMode === 2 && state.snake2.immunityTimer > 0) {
        drawPowerUpBar(ctx, width - 130, 60, state.snake2.immunityTimer, "P2 Energía");
    }
}

const drawPowerUpBar = (ctx: CanvasRenderingContext2D, x: number, y: number, value: number, label: string) => {
    const maxWidth = 100;
    const currentWidth = (value / MAX_IMMUNITY) * maxWidth;
    
    // Label
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Roboto";
    ctx.textAlign = "left";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText(label, x, y - 5);
    ctx.shadowBlur = 0;

    // Background Bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, maxWidth, 10);

    // Fill Bar
    ctx.fillStyle = "#FFD700"; // Gold color for energy
    // Flash effect when low
    if (value < 50 && Math.floor(value / 5) % 2 === 0) {
        ctx.fillStyle = "#FFF";
    }
    ctx.fillRect(x, y, Math.max(0, currentWidth), 10);
    
    // Border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, maxWidth, 10);
    
    // Icon (Coffee Cup)
    ctx.fillStyle = "#3E2723";
    ctx.beginPath();
    ctx.arc(x - 12, y + 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("☕", x - 12, y + 9);
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

const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake, time: number) => {
    // Breathing effect: Slight expansion and contraction
    const breath = Math.sin(time / 200) * 1.5; 
    
    snake.body.forEach((part, index) => {
        const px = part.x * TILE_SIZE;
        const py = part.y * TILE_SIZE;
        
        // Immunity Visual: Glow
        if (snake.immunityTimer > 0) {
            ctx.shadowColor = "white";
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }

        if (snake.colorType === 'colombia') {
            let pattern = index % 4;
            if (pattern <= 1) ctx.fillStyle = "#FFD700"; 
            else if (pattern === 2) ctx.fillStyle = "#0033A0"; 
            else ctx.fillStyle = "#CE1126"; 
        } else {
            let pattern = index % 3;
            if (pattern === 0) ctx.fillStyle = "#DA70D6"; 
            else if (pattern === 1) ctx.fillStyle = "#9932CC"; 
            else ctx.fillStyle = "#E6E6FA"; 
        }

        // Apply breathing scale offset
        const offset = index === 0 ? 0 : -breath/2; // Head doesn't breathe as much
        const size = index === 0 ? TILE_SIZE : TILE_SIZE + breath;

        ctx.fillRect(px + offset, py + offset, size, size);
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.strokeRect(px + offset, py + offset, size, size);

        if (index === 0) {
            // Head detail
            ctx.fillStyle = "#D7CCC8"; 
            ctx.beginPath();
            ctx.ellipse(px + 10, py + 10, 8, 8, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.fillStyle = "#3E2723"; 
            ctx.beginPath();
            ctx.arc(px + 10, py + 10, 4, 0, Math.PI * 2); 
            ctx.fill();
        }
    });
    ctx.shadowBlur = 0; // Reset
};
