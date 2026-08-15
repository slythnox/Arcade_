/**
 * Konami Code sequence listener:
 * ↑ ↑ ↓ ↓ ← → ← → B A
 */
export const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

export function listenForKonamiCode(onTrigger: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let index = 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === KONAMI_CODE[index]) {
      index++;
      if (index === KONAMI_CODE.length) {
        index = 0;
        onTrigger();
      }
    } else {
      index = 0;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
