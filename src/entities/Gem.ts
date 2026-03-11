import Phaser from 'phaser';
import { GEM_SPIN_DURATION } from '../constants';

export class Gem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, scene.textures.exists('gem_sheet') ? 'gem_sheet' : 'gem', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDisplaySize(24, 24);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(this.displayWidth, this.displayHeight, true);
    body.updateFromGameObject();

    if (scene.textures.exists('gem_sheet')) {
      if (!scene.anims.exists('gem-cycle')) {
        scene.anims.create({
          key: 'gem-cycle',
          frames: scene.anims.generateFrameNumbers('gem_sheet', { frames: [0, 1, 3, 2] }),
          frameRate: 5,
          repeat: -1,
        });
      }
      this.play('gem-cycle');
    } else {
      const baseScaleX = this.scaleX;
      scene.tweens.add({
        targets: this,
        scaleX: { from: baseScaleX, to: -baseScaleX },
        duration: GEM_SPIN_DURATION / 2,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
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
