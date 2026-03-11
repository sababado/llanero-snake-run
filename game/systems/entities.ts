
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

    // Mythical Bosses Logic
    if (settings.mythicalBossesEnabled) {
        const boss = state.boss;
        if (!boss.active && boss.warningTimer <= 0) {
            // Chance to spawn a boss (e.g., 0.001 per tick)
            if (Math.random() < 0.001) {
                boss.type = Math.random() > 0.5 ? 'silbon' : 'llorona';
                boss.warningTimer = 60; // 60 ticks of warning
                boss.x = Math.floor(tx / 2);
                boss.y = Math.floor(ty / 2);
            }
        } else if (boss.warningTimer > 0) {
            boss.warningTimer--;
            if (boss.warningTimer <= 0) {
                boss.active = true;
                boss.timer = 400; // 400 ticks active
                boss.moveTimer = 0;
                boss.dx = Math.random() > 0.5 ? 1 : -1;
                boss.dy = Math.random() > 0.5 ? 1 : -1;
            }
        } else if (boss.active) {
            boss.timer--;
            if (boss.timer <= 0) {
                boss.active = false;
                boss.type = 'none';
            } else {
                boss.moveTimer++;
                // Move boss every few ticks
                if (boss.moveTimer > 3) {
                    boss.moveTimer = 0;
                    boss.x += boss.dx;
                    boss.y += boss.dy;
                    
                    // Bounce off walls
                    if (boss.x <= 0 || boss.x >= tx - 1) boss.dx *= -1;
                    if (boss.y <= 3 || boss.y >= ty - 1) boss.dy *= -1;
                }
                
                // Collision with snake (only for Silbon, Llorona just causes rain/effects)
                if (boss.type === 'silbon') {
                    const checkBossHit = (s: Snake) => {
                        const h = s.body[0];
                        // Silbon is tall and skinny, hits a 3x6 area (x-1 to x+2, y-4 to y+1)
                        if (h && h.x >= boss.x - 1 && h.x <= boss.x + 2 && h.y >= boss.y - 4 && h.y <= boss.y + 1 && s.immunityTimer === 0) {
                            s.dead = true;
                        }
                    };
                    checkBossHit(state.snake1);
                    if (state.gameMode === 2) checkBossHit(state.snake2);
                }
            }
        }
    } else {
        state.boss.active = false;
        state.boss.warningTimer = 0;
    }
};
