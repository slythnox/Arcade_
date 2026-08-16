# Contributing to ARCADE_

Thanks for your interest in contributing to ARCADE_! We welcome contributions to our custom game engine, game cartridges, algorithms, performance improvements, and bug fixes.

---

## 🛠️ Development Workflow

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/slythnox/Arcade_.git
   cd Arcade_
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run tests & typecheck**:
   ```bash
   npm test
   npm run typecheck
   ```

---

## 🎮 Adding a New Game Cartridge

To add a new game:

1. **Implement the Game Instance** in `games/<game-name>/<GameName>Game.ts`:
   - Must implement the `GameInstance` interface (`init`, `update`, `render`, `handleInput`, `pause`, `resume`, `destroy`, `getScore`, `getLevel`).
   - Keep game logic deterministic and decoupled from React.

2. **Define Game Metadata** in `games/definitions/<game-name>.ts`:
   - Provide `id`, `slug`, `name`, `platform`, `genre`, `year`, `controls`, `tagline`, `description`, `math` breakdown, and `createGame` factory.

3. **Register the Game** in `games/registry.ts`:
   - Add the definition to the `gameRegistry` array. The homepage, routing, search index, and sitemap will automatically derive everything from it.

4. **Add Unit Tests** in `tests/games/`:
   - Ensure the mechanics and state transitions pass tests.

---

## 📜 Architectural Rules

- **Strict Layer Separation**: `app -> components -> lib -> games / engine -> core`. Lower layers must never import higher layers.
- **Deterministic 60Hz Loop**: Physics simulation updates use `FIXED_DT = 1/60s`. Do not bind simulation steps to raw `requestAnimationFrame` delta times.
- **Zero ROMs**: All games must be original TypeScript implementations using HTML5 Canvas and procedural Web Audio synthesis. No proprietary ROMs or assets.

---

## 🧪 Submitting a Pull Request

1. Ensure all tests pass (`npm test`).
2. Ensure TypeScript compiles without errors (`npm run typecheck`).
3. Ensure the production build succeeds (`npm run build`).
4. Submit a clear PR describing your changes.
