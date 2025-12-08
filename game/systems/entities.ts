
import { GameState, GameSettings, Snake } from '../../types';
import { GAME_BALANCE } from '../balance';
import { getRandomSafePosition, isOccupied } from '../logic';

export const updateEntities = (state: GameState, settings: GameSettings, tx: number, ty: number) => {
    const { ITEMS } = GAME_BALANCE;

    // Bola de Fuego Logic
    if (settings.bombsEnabled) {
        if (!state.bola.active) {
            if (Math.random() < ITEMS.BOLA.SPAWN_CHANCE) {
                state.bola.active = true;
                const pos = getRandomSafePosition(tx, ty);
                state.bola.x = pos.x;
                state.bola.y = pos.y;
            }
        } else {
            state.bola.moveTimer++;
            if (state.bola.moveTimer > ITEMS.BOLA.MOVE_SPEED_THRESHOLD) {
                state.bola.moveTimer = 0;
                const target = state.snake1.body[0];
                if (target) {
                    if (state.bola.x < target.x) state.bola.x++;
                    else if (state.bola.x > target.x) state.bola.x--;
                    
                    if (state.bola.y < target.y) state.bola.y++;
                    else if (state.bola.y > target.y) state.bola.y--;
                }
                
                const b = state.bola;
                const checkBolaHit = (s: Snake) => {
                    const h = s.body[0];
                    if (h && h.x === b.x && h.y === b.y && s.immunityTimer === 0) s.dead = true;
                };
                checkBolaHit(state.snake1);
                if (state.gameMode === 2) checkBolaHit(state.snake2);
            }
        }
    } else {
        state.bola.active = false;
    }

    // Items Timers & Spawning
    const updateItem = (item: any, chance: number, duration: number) => {
        if (item.active) {
            item.timer--;
            if (item.timer <= 0) item.active = false;
        } else if (Math.random() < chance) {
            let attempts = 0;
            while (attempts < 20) {
                const pos = getRandomSafePosition(tx, ty);
                if(!isOccupied(pos.x, pos.y, state.snake1, state.snake2)) {
                    item.active = true;
                    item.x = pos.x;
                    item.y = pos.y;
                    item.timer = duration;
                    break;
                }
                attempts++;
            }
        }
    };

    updateItem(state.aguacate, ITEMS.AGUACATE.CHANCE, ITEMS.AGUACATE.DURATION);
    updateItem(state.virgen, ITEMS.VIRGEN.CHANCE, ITEMS.VIRGEN.DURATION);
    updateItem(state.cafe, ITEMS.CAFE.CHANCE, ITEMS.CAFE.DURATION);
};
