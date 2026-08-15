import type { GameDefinition } from '../types';
export const velocityRushDefinition: GameDefinition = {
  id: 'velocityRush', slug: 'velocity-rush', name: 'Velocity Rush',
  platform: 'nes', genre: 'platformer', era: '1990s', year: 1991,
  tags: ['platformer', 'speed'], tagline: 'Gotta go fast!',
  description: 'Sonic-inspired momentum platformer.',
  difficulty: 'medium', players: 'single', category: 'arcade', subcategory: 'platformer',
  estimatedPlayTime: '5-10 min', thumbnail: { src: '/thumb.png', alt: 'Velocity Rush' },
  controls: { keyboard: [{ key: 'Space', description: 'Jump' }] },
  seo: { title: 'Velocity Rush', description: 'Play Velocity Rush' },
  math: { title: 'Math', summary: 'Physics', concepts: [] },
  createGame: async () => {
    const { VelocityRushGame } = await import('../velocityRush/VelocityRushGame');
    return new VelocityRushGame();
  }
};
