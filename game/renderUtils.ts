import { Snake, GameState } from '../types';
import { TILE_SIZE, MAX_IMMUNITY } from '../constants';

// Shared HUD Drawing
export const drawHUD = (ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, isRetro: boolean) => {
    // P1 Indicator (Left)
    if (state.snake1.immunityTimer > 0) {
        drawPowerUpBar(ctx, 30, 60, state.snake1.immunityTimer, "P1 Energía", isRetro);
    }

    // P2 Indicator (Right) - Only if active
    if (state.gameMode === 2 && state.snake2.immunityTimer > 0) {
        drawPowerUpBar(ctx, width - 130, 60, state.snake2.immunityTimer, "P2 Energía", isRetro);
    }
}

const drawPowerUpBar = (ctx: CanvasRenderingContext2D, x: number, y: number, value: number, label: string, isRetro: boolean) => {
    const maxWidth = 100;
    const currentWidth = (value / MAX_IMMUNITY) * maxWidth;
    
    // Label
    ctx.fillStyle = isRetro ? "black" : "white";
    ctx.font = isRetro ? "12px monospace" : "bold 12px Roboto";
    ctx.textAlign = "left";
    if (!isRetro) {
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
    }
    ctx.fillText(label, x, y - 5);
    ctx.shadowBlur = 0;

    // Background Bar
    ctx.fillStyle = isRetro ? "transparent" : "rgba(0,0,0,0.5)";
    if (isRetro) ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, maxWidth, 10);

    // Fill Bar
    ctx.fillStyle = isRetro ? "black" : "#FFD700"; 
    // Flash effect when low
    if (value < 50 && Math.floor(value / 5) % 2 === 0) {
        ctx.fillStyle = isRetro ? "transparent" : "#FFF";
    }
    ctx.fillRect(x, y, Math.max(0, currentWidth), 10);
}

// Shared Snake Drawing
export const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake, time: number, isRetro: boolean) => {
    // Breathing effect: Slight expansion and contraction
    const breath = Math.sin(time / 200) * 1.5; 
    
    snake.body.forEach((part, index) => {
        const px = part.x * TILE_SIZE;
        const py = part.y * TILE_SIZE;
        
        // Immunity Visual: Glow
        if (snake.immunityTimer > 0 && !isRetro) {
            ctx.shadowColor = "white";
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }

        if (isRetro) {
            ctx.fillStyle = "black";
            // Checkered pattern for different snakes if possible? Just solid for now.
            if (snake.colorType === 'orchid' && index % 2 === 0) {
                ctx.strokeRect(px+2, py+2, TILE_SIZE-4, TILE_SIZE-4); // Hollow effect for P2
                return;
            }
        } else {
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
        }

        // Apply breathing scale offset
        const offset = index === 0 ? 0 : -breath/2; // Head doesn't breathe as much
        const size = index === 0 ? TILE_SIZE : TILE_SIZE + breath;

        if (!isRetro || (snake.colorType !== 'orchid')) {
            ctx.fillRect(px + offset, py + offset, size, size);
        }
        
        if (!isRetro) {
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.strokeRect(px + offset, py + offset, size, size);
        }

        if (index === 0) {
            // Head detail
            ctx.fillStyle = isRetro ? "white" : "#D7CCC8"; 
            ctx.beginPath();
            ctx.ellipse(px + 10, py + 10, 8, 8, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.fillStyle = isRetro ? "black" : "#3E2723"; 
            ctx.beginPath();
            ctx.arc(px + 10, py + 10, 4, 0, Math.PI * 2); 
            ctx.fill();
        }
    });
    ctx.shadowBlur = 0; // Reset
};