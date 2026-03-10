import Phaser from 'phaser';
import { ROBOT_SPEED } from '../constants';

export class Robot extends Phaser.Physics.Arcade.Sprite {
  private patrolLeftX: number;
  private patrolRightX: number;
  private direction = 1; // 1 = right, -1 = left
  stunned = false;
  private stunTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolLeftX: number, patrolRightX: number) {
    super(scene, x, y, 'robot');
    this.patrolLeftX = patrolLeftX;
    this.patrolRightX = patrolRightX;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 36);
    body.setOffset(2, 2);
    body.setCollideWorldBounds(true);
  }

  stun(duration: number): void {
    this.stunned = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.setTint(0x4488ff);

    if (this.stunTimer) {
      this.stunTimer.destroy();
    }
    this.stunTimer = this.scene.time.delayedCall(duration, () => {
      this.stunned = false;
      this.clearTint();
    });
  }

  update(): void {
    if (this.stunned) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Move in current direction
    body.setVelocityX(ROBOT_SPEED * this.direction);

    // Reverse at patrol boundaries
    if (this.x >= this.patrolRightX) {
      this.direction = -1;
    } else if (this.x <= this.patrolLeftX) {
      this.direction = 1;
    }

    // Flip sprite to face movement direction
    this.setFlipX(this.direction < 0);
  }
}
