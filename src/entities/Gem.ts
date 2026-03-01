import Phaser from 'phaser';
import { GEM_SPIN_DURATION } from '../constants';

export class Gem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gem');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Spin tween via scale flip
    scene.tweens.add({
      targets: this,
      scaleX: { from: 1, to: -1 },
      duration: GEM_SPIN_DURATION / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 20,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
