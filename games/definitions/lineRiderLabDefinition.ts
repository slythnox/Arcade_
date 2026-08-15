import { GameDefinition } from '../types';
export const lineRiderLabDefinition: GameDefinition = {
  id: 'lineRiderLab', slug: 'line-rider-lab', name: 'Line Rider Lab',
  platform: 'arcade', genre: 'simulation', era: '2000s', year: 2006,
  tags: ['sandbox', 'physics'], tagline: 'Draw and ride!',
  description: 'Interactive physics sandbox.',
  difficulty: 'easy', players: 'single', category: 'arcade', subcategory: 'simulation',
  estimatedPlayTime: 'Infinite', thumbnail: { src: '/thumb.png', alt: 'Line Rider' },
  controls: { keyboard: [{ key: 'Space', description: 'Draw' }] },
  seo: { title: 'Line Rider Lab', description: 'Play Line Rider Lab' },
  math: { title: 'Math', summary: 'Physics', concepts: [] },
  createGame: async () => {
    const { LineRiderLabGame } = await import('../lineRiderLab/LineRiderLabGame');
    return new LineRiderLabGame();
  }
};
