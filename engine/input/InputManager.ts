import { GameAction } from "../../core/types/game";

export type InputActionListener = (action: GameAction, isPressed: boolean) => void;

/**
 * Universal Input Manager mapping Keyboard, Touch D-pad/Action buttons, Pointer, and Gamepad.
 */
export class InputManager {
  private keyBindings: Map<string, GameAction> = new Map();
  private activeActions: Set<GameAction> = new Set();
  private listeners: Set<InputActionListener> = new Set();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private isEnabled: boolean = true;

  constructor() {
    this.setupDefaultBindings();

    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.boundKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);
  }

  private setupDefaultBindings(): void {
    // Arrow keys
    this.keyBindings.set("ArrowLeft", "MOVE_LEFT");
    this.keyBindings.set("ArrowRight", "MOVE_RIGHT");
    this.keyBindings.set("ArrowUp", "MOVE_UP");
    this.keyBindings.set("ArrowDown", "MOVE_DOWN");

    // WASD
    this.keyBindings.set("KeyA", "MOVE_LEFT");
    this.keyBindings.set("KeyD", "MOVE_RIGHT");
    this.keyBindings.set("KeyW", "MOVE_UP");
    this.keyBindings.set("KeyS", "MOVE_DOWN");

    // Actions
    this.keyBindings.set("Space", "ACTION_PRIMARY");
    this.keyBindings.set("KeyZ", "ROTATE");
    this.keyBindings.set("KeyX", "ACTION_PRIMARY");
    this.keyBindings.set("KeyC", "ACTION_SECONDARY");
    this.keyBindings.set("ShiftLeft", "ACTION_SECONDARY");
    this.keyBindings.set("ShiftRight", "ACTION_SECONDARY");

    // System keys
    this.keyBindings.set("KeyP", "PAUSE");
    this.keyBindings.set("KeyR", "RESTART");
    this.keyBindings.set("Escape", "BACK");
    this.keyBindings.set("Enter", "CONFIRM");
  }

  public attach(): void {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  public detach(): void {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.activeActions.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.activeActions.clear();
    }
  }

  public addListener(listener: InputActionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public isActionActive(action: GameAction): boolean {
    return this.activeActions.has(action);
  }

  public triggerAction(action: GameAction, isPressed: boolean): void {
    if (!this.isEnabled) return;

    if (isPressed) {
      this.activeActions.add(action);
    } else {
      this.activeActions.delete(action);
    }

    for (const listener of this.listeners) {
      listener(action, isPressed);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Prevent page scroll on game control keys
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code) &&
      e.target === document.body
    ) {
      e.preventDefault();
    }

    const action = this.keyBindings.get(e.code);
    if (action) {
      this.triggerAction(action, true);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.isEnabled) return;
    const action = this.keyBindings.get(e.code);
    if (action) {
      this.triggerAction(action, false);
    }
  }

  public rebindKey(code: string, action: GameAction): void {
    this.keyBindings.set(code, action);
  }
}
