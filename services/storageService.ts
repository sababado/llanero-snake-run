
import { GameStats, LeaderboardEntry } from '../types';

const STATS_KEY = 'llanero_snake_stats';

const DEFAULT_STATS: GameStats = {
  highScore: 0,
  totalGames: 0,
  totalChiguiros: 0,
  totalScore: 0,
  leaderboard: []
};

export const getStats = (): GameStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
};

export const saveStats = (stats: GameStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const updateStats = (score: number, chiguiros: number): GameStats => {
  const current = getStats();
  const newStats = {
    ...current,
    highScore: Math.max(current.highScore, score),
    totalGames: current.totalGames + 1,
    totalChiguiros: current.totalChiguiros + chiguiros,
    totalScore: current.totalScore + score
  };
  saveStats(newStats);
  return newStats;
};

export const saveScoreToLeaderboard = (name: string, score: number) => {
    const current = getStats();
    const newEntry: LeaderboardEntry = {
        name: name.toUpperCase().substring(0, 3),
        score,
        date: new Date().toLocaleDateString()
    };
    
    // Add, Sort, Top 5
    const updatedLeaderboard = [...(current.leaderboard || []), newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const newStats = {
        ...current,
        leaderboard: updatedLeaderboard
    };
    saveStats(newStats);
    return newStats;
};
