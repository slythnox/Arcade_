# ADR-004: Registry Architecture

## Status
Accepted

## Context
With 60 distinct games in the library, we needed a robust mechanism to map routes (e.g. `/games/pong`) to the corresponding `GameDefinition` and `GameInstance`. Options included filesystem-based conventions (like Next.js app router), dynamic dynamic `import()` calls, or a central static registry.

## Decision
We implemented a central, static registry (`games/registry.ts`) that explicitly imports and exports every `GameDefinition`.

## Consequences
- **Compile-Time Type Safety:** If a game definition doesn't conform to the `GameDefinition` interface, the build fails immediately.
- **Tree Shaking:** Modern bundlers can statically analyze the registry and eliminate unused code efficiently.
- **Co-Location of Metadata:** SEO data, control schemes, and math explanations are bundled tightly with the game factory without needing slow, async filesystem `fs.readFile` calls at runtime.
