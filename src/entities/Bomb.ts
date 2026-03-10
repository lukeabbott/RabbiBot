import Phaser from 'phaser';

export class Bomb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  collect(): void {
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
