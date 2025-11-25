
// This file is now a facade for the modularized services
// This ensures that if any component imports from here, it still works,
// but the logic is now cleanly separated in services/ai/

export * from './ai/client';
export * from './ai/visuals';
export * from './ai/narrator';
