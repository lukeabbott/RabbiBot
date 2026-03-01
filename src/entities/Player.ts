import Phaser from 'phaser';
import { InputManager } from '../systems/InputManager';
import { PLAYER_SPEED, PLAYER_JUMP, PLAYER_SCALE, COYOTE_TIME } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private inputMgr: InputManager;
  private coyoteTimer = 0;
  private hasJumped = false;
  public onJump?: () => void;
  public isCrouching = false;

  constructor(scene: Phaser.Scene, x: number, y: number, inputMgr: InputManager) {
    super(scene, x, y, 'rabbibot', 'stand1');
    this.inputMgr = inputMgr;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.setCollideWorldBounds(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(300, 550);
    body.setOffset(58, 50);
    body.setMaxVelocityX(PLAYER_SPEED);

    this.createAnimations(scene);
  }

  private createAnimations(scene: Phaser.Scene): void {
    if (!scene.anims.exists('idle')) {
      scene.anims.create({
        key: 'idle',
        frames: [
          { key: 'rabbibot', frame: 'stand1' },
          { key: 'rabbibot2', frame: 'stand2' },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('run')) {
      scene.anims.create({
        key: 'run',
        frames: [
          { key: 'rabbibot', frame: 'run1' },
          { key: 'rabbibot2', frame: 'run2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('jump')) {
      scene.anims.create({
        key: 'jump',
        frames: [{ key: 'rabbibot2', frame: 'wave2' }],
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!scene.anims.exists('wave')) {
      scene.anims.create({
        key: 'wave',
        frames: [
          { key: 'rabbibot', frame: 'wave1' },
          { key: 'rabbibot2', frame: 'wave2' },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('eat')) {
      scene.anims.create({
        key: 'eat',
        frames: [{ key: 'rabbibot2', frame: 'slide' }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }

  update(delta: number): void {
    this.inputMgr.update();
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // Coyote time
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
      this.hasJumped = false;
    } else {
      this.coyoteTimer -= delta;
    }

    // Crouch check — must be grounded and pressing down
    if (this.inputMgr.down && onGround) {
      this.isCrouching = true;
      body.setVelocityX(0);
      this.anims.play('eat', true);
      return;
    }
    this.isCrouching = false;

    // Horizontal movement
    if (this.inputMgr.left) {
      body.setVelocityX(-PLAYER_SPEED);
      this.setFlipX(true);
    } else if (this.inputMgr.right) {
      body.setVelocityX(PLAYER_SPEED);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Jump
    if (this.inputMgr.jump && this.coyoteTimer > 0 && !this.hasJumped) {
      body.setVelocityY(PLAYER_JUMP);
      this.hasJumped = true;
      this.coyoteTimer = 0;
      this.onJump?.();
    }

    // Animations
    if (!onGround) {
      this.anims.play('jump', true);
    } else if (this.inputMgr.isMoving) {
      this.anims.play('run', true);
    } else {
      this.anims.play('idle', true);
    }
  }

  get isMoving(): boolean {
    return this.inputMgr.isMoving;
  }

  get isOnGround(): boolean {
    return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
  }
}
