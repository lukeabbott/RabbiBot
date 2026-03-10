import Phaser from 'phaser';

export class InputManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactJustPressed = false;
  private prevInteractDown = false;
  private throwKey!: Phaser.Input.Keyboard.Key;
  private throwReleased = false;
  private prevThrowDown = false;
  private throwHoldMs = 0;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.throwKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(delta: number): void {
    const interactDown = this.shiftKey.isDown || this.interactKey.isDown;
    this.interactJustPressed = interactDown && !this.prevInteractDown;
    this.prevInteractDown = interactDown;

    const throwDown = this.throwKey.isDown;
    this.throwReleased = !throwDown && this.prevThrowDown;
    if (throwDown) {
      this.throwHoldMs += delta;
    } else {
      this.throwHoldMs = 0;
    }
    this.prevThrowDown = throwDown;
  }

  get left(): boolean {
    return this.cursors.left.isDown || this.wasd.A.isDown;
  }

  get right(): boolean {
    return this.cursors.right.isDown || this.wasd.D.isDown;
  }

  get jump(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W);
  }

  get shift(): boolean {
    return this.shiftKey.isDown;
  }

  get interact(): boolean {
    return this.shiftKey.isDown || this.interactKey.isDown;
  }

  get interactPressed(): boolean {
    return this.interactJustPressed;
  }

  get down(): boolean {
    return this.cursors.down.isDown || this.wasd.S.isDown;
  }

  get throwPressed(): boolean {
    return this.throwReleased;
  }

  get throwCharging(): boolean {
    return this.throwKey.isDown;
  }

  get throwAimRatio(): number {
    return (Math.sin(this.throwHoldMs * 0.004) + 1) * 0.5;
  }

  get isMoving(): boolean {
    return this.left || this.right;
  }
}
