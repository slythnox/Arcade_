import { GameDefinition } from '../types';
export const gardenDefenseDefinition: GameDefinition = {
  id: 'gardenDefense', slug: 'garden-defense', name: 'Garden Defense',
  platform: 'arcade', genre: 'strategy', era: '2000s', year: 2009,
  tags: ['strategy', 'defense'], tagline: 'Defend your garden!',
  description: 'Plants vs Zombies lane defense.',
  difficulty: 'medium', players: 'single', category: 'arcade', subcategory: 'strategy',
  estimatedPlayTime: '10-20 min', thumbnail: { src: '/thumb.png', alt: 'Garden' },
  controls: { keyboard: [{ key: 'Space', description: 'Plant' }] },
  seo: { title: 'Garden Defense', description: 'Play Garden Defense' },
  math: { title: 'Math', summary: 'Grid math', concepts: [] },
  createGame: async () => {
    const { GardenDefenseGame } = await import('../gardenDefense/GardenDefenseGame');
    return new GardenDefenseGame();
  }
};
