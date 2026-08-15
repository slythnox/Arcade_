import { GameDefinition } from '../types';
export const marbleRushDefinition: GameDefinition = {
  id: 'marbleRush', slug: 'marble-rush', name: 'Marble Rush',
  platform: 'arcade', genre: 'puzzle', era: '2000s', year: 2003,
  tags: ['casual', 'puzzle', 'marble'], tagline: 'Pop the chain!',
  description: 'Zuma/Luxor inspired match-3 marble shooter.',
  difficulty: 'medium', players: 'single', category: 'arcade', subcategory: 'casual',
  estimatedPlayTime: '5-10 min',
  thumbnail: { src: '/thumb.png', alt: 'Marble' },
  controls: { keyboard: [{ key: 'Space', description: 'Shoot' }] },
  seo: { title: 'Marble Rush', description: 'Play Marble Rush' },
  math: { title: 'Math', summary: 'Interpolation', concepts: [] },
  createGame: async () => {
    const { MarbleRushGame } = await import('../marbleRush/MarbleRushGame');
    return new MarbleRushGame();
  }
};
