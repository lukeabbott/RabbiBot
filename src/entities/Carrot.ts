import Phaser from 'phaser';

export class Carrot extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'carrot');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDisplaySize(28, 36);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(this.displayWidth, this.displayHeight, true);
    body.updateFromGameObject();
  }

  collect(): void {
    // Disable body immediately to prevent double-collect
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    const baseScaleX = this.scaleX;
    const baseScaleY = this.scaleY;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: baseScaleX * 1.5,
      scaleY: baseScaleY * 1.5,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
