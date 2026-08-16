# Accessibility (a11y) & Usability Standards

This document describes the accessibility architecture, keyboard navigation, focus management, color contrast standards, and Canvas 2D accessibility boundaries in **ARCADE_**.

---

## 1. Web Shell Accessibility

The outer React application complies with WCAG 2.1 AA guidelines:

### Keyboard Navigation & Shortcuts
- **Global Search Focus (`/` key):** Pressing `/` instantly focuses the cartridge search input on the homepage.
- **Escape (`ESC` key):** Closes modal dialogs, settings overlays, and exits fullscreen mode.
- **Focus Rings:** Interactive elements feature high-visibility outline rings (`border-color: var(--arcade-cyan); box-shadow: 0 0 16px var(--arcade-cyan-glow)`).

### Color Contrast
All text tokens (`--color-text`, `--color-text-dim`) meet or exceed the 4.5:1 contrast ratio against the deep navy backdrop (`#060e1c`).

### Reduced Motion (`prefers-reduced-motion`)
The application respects the OS-level `prefers-reduced-motion` media query, disabling camera shakes, particle bursts, and blinking title animations.

---

## 2. Canvas 2D Accessibility Reality & Limitations

### The Canvas Black-Box Boundary
HTML5 `<canvas>` elements render raw pixels to a framebuffer. Assistive technologies (screen readers like NVDA, VoiceOver, JAWS) **cannot inspect or read individual pixels** inside the canvas.

### Mitigation Strategies Implemented:
1. **Fallback Text & ARIA Labels:** The `<canvas>` element contains `role="application"` and descriptive `aria-label` tags detailing the active game title.
2. **Text Equivalents:** All game instructions, controls, rules, and mathematical breakdowns are rendered in semantic HTML on the cartridge page below the canvas.
3. **Audio Feedback:** In-game events produce distinct audio cues with unique harmonic frequencies (e.g. rising pitch for success, falling pitch for errors).
