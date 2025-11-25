import { GameState } from '../types';
import { TILE_SIZE } from '../constants';
import { drawSnake, drawHUD } from './renderUtils';

export const drawRetroGame = (ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number, time: number) => {
    // Nokia 1100 Palette: #99A906 (Background), #000000 (Pixels)
    ctx.fillStyle = "#879d71"; 
    ctx.fillRect(0, 0, w, h);

    // Retro Grid
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for(let x=0; x<w; x+=TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
    }
    for(let y=0; y<h; y+=TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    // Helper for consistency
    const drawPixelRect = (x: number, y: number, filled: boolean = true) => {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#000000";
        if (filled) ctx.fillRect(px+1, py+1, TILE_SIZE-2, TILE_SIZE-2);
        else ctx.strokeRect(px+2, py+2, TILE_SIZE-4, TILE_SIZE-4);
    };

    // Items
    drawPixelRect(state.chiguiro.x, state.chiguiro.y, true); // Food is a solid block

    if (state.aguacate.active) {
        // Hollow block with dot
        drawPixelRect(state.aguacate.x, state.aguacate.y, false);
        const px = state.aguacate.x * TILE_SIZE;
        const py = state.aguacate.y * TILE_SIZE;
        ctx.fillStyle = "black";
        ctx.fillRect(px + 7, py + 7, 6, 6);
    }

    if (state.cafe.active) {
        // Hollow block with 'C'
        drawPixelRect(state.cafe.x, state.cafe.y, false);
        const px = state.cafe.x * TILE_SIZE;
        const py = state.cafe.y * TILE_SIZE;
        ctx.fillStyle = "black";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("C", px + 10, py + 10);
    }

    if (state.virgen.active) {
        // Cross
        const px = state.virgen.x * TILE_SIZE;
        const py = state.virgen.y * TILE_SIZE;
        ctx.fillStyle = "black";
        ctx.fillRect(px + 8, py + 2, 4, 16);
        ctx.fillRect(px + 2, py + 6, 16, 4);
    }
    
    if (state.bomb.active) {
        const px = state.bomb.x * TILE_SIZE;
        const py = state.bomb.y * TILE_SIZE;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(px+10, py+10, 8, 0, Math.PI*2); ctx.stroke();
        
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("X", px+10, py+10);
    }

    if (state.bola.active) {
        // Filled Diamond for Bola
        const px = state.bola.x * TILE_SIZE;
        const py = state.bola.y * TILE_SIZE;
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 2);
        ctx.lineTo(px + 18, py + 10);
        ctx.lineTo(px + 10, py + 18);
        ctx.lineTo(px + 2, py + 10);
        ctx.fill();
    }

    // Snakes
    drawSnake(ctx, state.snake1, time, true);
    if (state.gameMode === 2) drawSnake(ctx, state.snake2, time, true);

    drawHUD(ctx, state, w, h, true);
};