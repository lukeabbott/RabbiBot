import Phaser from 'phaser';
import { InputManager } from '../systems/InputManager';
import { PLAYER_SPEED, PLAYER_JUMP, PLAYER_SCALE, COYOTE_TIME } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private inputMgr: InputManager;
  private coyoteTimer = 0;
  private hasJumped = false;
  private hasProcessedJumpFrames: boolean;
  public onJump?: () => void;
  public isCrouching = false;

  constructor(scene: Phaser.Scene, x: number, y: number, inputMgr: InputManager) {
    const baseTexture = scene.textures.exists('rabbit_idle_run') ? 'rabbit_idle_run' : 'rabbibot';
    const startFrame = baseTexture === 'rabbit_idle_run' ? 0 : 'stand1';
    super(scene, x, y, baseTexture, startFrame);
    this.inputMgr = inputMgr;
    this.hasProcessedJumpFrames = scene.textures.exists('rabbit_jump');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.setCollideWorldBounds(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (baseTexture === 'rabbit_idle_run') {
      body.setSize(346, 423);
      body.setOffset(67, 38);
    } else {
      body.setSize(300, 550);
      body.setOffset(58, 50);
    }
    body.setMaxVelocityX(PLAYER_SPEED);

    this.createAnimations(scene);
  }

  private createAnimations(scene: Phaser.Scene): void {
    const hasIdleRun = scene.textures.exists('rabbit_idle_run');
    const hasJump = scene.textures.exists('rabbit_jump');
    const hasReactions = scene.textures.exists('rabbit_reactions');

    const define = (key: string, frames: Phaser.Types.Animations.AnimationFrame[], frameRate: number, repeat = -1): void => {
      if (scene.anims.exists(key)) {
        scene.anims.remove(key);
      }
      scene.anims.create({
        key,
        frames,
        frameRate,
        repeat,
      });
    };

    const idleFrames = hasIdleRun
      ? scene.anims.generateFrameNumbers('rabbit_idle_run', { frames: [0, 1] })
      : [{ key: 'rabbibot', frame: 'stand1' }, { key: 'rabbibot2', frame: 'stand2' }];
    const runFrames = hasIdleRun
      ? scene.anims.generateFrameNumbers('rabbit_idle_run', { frames: [2, 3] })
      : [{ key: 'rabbibot', frame: 'run1' }, { key: 'rabbibot2', frame: 'run2' }];
    const jumpUpFrames = hasJump
      ? scene.anims.generateFrameNumbers('rabbit_jump', { frames: [1] })
      : [{ key: 'rabbibot2', frame: 'wave2' }];
    const jumpPeakFrames = hasJump
      ? scene.anims.generateFrameNumbers('rabbit_jump', { frames: [2] })
      : [{ key: 'rabbibot2', frame: 'wave2' }];
    const fallFrames = hasJump
      ? scene.anims.generateFrameNumbers('rabbit_jump', { frames: [3] })
      : [{ key: 'rabbibot2', frame: 'wave2' }];
    const waveFrames = hasReactions
      ? scene.anims.generateFrameNumbers('rabbit_reactions', { frames: [2] })
      : [{ key: 'rabbibot', frame: 'wave1' }, { key: 'rabbibot2', frame: 'wave2' }];
    const eatFrames = hasJump
      ? scene.anims.generateFrameNumbers('rabbit_jump', { frames: [0] })
      : [{ key: 'rabbibot2', frame: 'slide' }];

    define('idle', idleFrames, 2, -1);
    define('run', runFrames, 6, -1);
    define('jump-up', jumpUpFrames, 1, 0);
    define('jump-peak', jumpPeakFrames, 1, 0);
    define('fall', fallFrames, 1, 0);
    define('wave', waveFrames, 3, -1);
    define('eat', eatFrames, 1, 0);
  }

  update(delta: number): void {
    this.inputMgr.update(delta);
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
      if (this.hasProcessedJumpFrames) {
        if (body.velocity.y < -80) {
          this.anims.play('jump-up', true);
        } else if (body.velocity.y > 80) {
          this.anims.play('fall', true);
        } else {
          this.anims.play('jump-peak', true);
        }
      } else {
        this.anims.play('jump-up', true);
      }
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
