import Phaser from 'phaser';

export class ThrownBomb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, velocityX: number, velocityY: number) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(24, 24);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.displayWidth, this.displayHeight, true);
    body.updateFromGameObject();
    body.setAllowGravity(true);
    body.setVelocity(velocityX, velocityY);

    // Spin while flying
    scene.tweens.add({
      targets: this,
      angle: velocityX < 0 ? -360 : 360,
      duration: 600,
      repeat: -1,
    });
  }

  fizzle(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    const baseScaleX = this.scaleX;
    const baseScaleY = this.scaleY;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: baseScaleX * 0.3,
      scaleY: baseScaleY * 0.3,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
