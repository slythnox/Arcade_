import type { GameDefinition } from '../types';
export const coasterLabDefinition: GameDefinition = {
  id: 'coasterLab', slug: 'coaster-lab', name: 'Coaster Lab',
  platform: 'arcade', genre: 'simulation', era: '2000s', year: 1999,
  tags: ['sandbox', 'physics'], tagline: 'Build coasters!',
  description: 'Roller coaster physics builder.',
  difficulty: 'easy', players: 'single', category: 'arcade', subcategory: 'simulation',
  estimatedPlayTime: 'Infinite', thumbnail: { src: '/thumb.png', alt: 'Coaster' },
  controls: { keyboard: [{ key: 'Space', description: 'Place Node' }] },
  seo: { title: 'Coaster Lab', description: 'Play Coaster Lab' },
  math: { title: 'Math', summary: 'Physics', concepts: [] },
  createGame: async () => {
    const { CoasterLabGame } = await import('../coasterLab/CoasterLabGame');
    return new CoasterLabGame();
  }
};
