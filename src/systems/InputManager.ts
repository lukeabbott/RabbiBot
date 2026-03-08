import Phaser from 'phaser';

export class InputManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceJustPressed = false;
  private prevSpaceDown = false;
  private interactJustPressed = false;
  private prevInteractDown = false;

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
  }

  update(): void {
    const spaceDown = this.cursors.space.isDown;
    this.spaceJustPressed = spaceDown && !this.prevSpaceDown;
    this.prevSpaceDown = spaceDown;

    const interactDown = this.shiftKey.isDown || this.interactKey.isDown;
    this.interactJustPressed = interactDown && !this.prevInteractDown;
    this.prevInteractDown = interactDown;
  }

  get left(): boolean {
    return this.cursors.left.isDown || this.wasd.A.isDown;
  }

  get right(): boolean {
    return this.cursors.right.isDown || this.wasd.D.isDown;
  }

  get jump(): boolean {
    return this.spaceJustPressed || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W);
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

  get isMoving(): boolean {
    return this.left || this.right;
  }
}
