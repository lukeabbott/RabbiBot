import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Carrot } from '../entities/Carrot';
import { Gem } from '../entities/Gem';
import { Portal } from '../entities/Portal';
import { InputManager } from '../systems/InputManager';
import { EnergySystem } from '../systems/EnergySystem';
import { InventorySystem } from '../systems/InventorySystem';
import { LevelData } from '../levels/LevelData';
import { level1 } from '../levels/level1';
import { level2 } from '../levels/level2';
import {
  TILE_SIZE,
  GEM_DEPOSIT_RATE,
  GAME_WIDTH,
  GAME_HEIGHT,
  INVINCIBILITY_DURATION,
  ROBOT_ZAP_DAMAGE,
  FALL_RESPAWN_DAMAGE,
  FALL_RESPAWN_BUFFER,
  BOMB_EMP_DURATION,
  MAX_BOMBS,
  BOMB_THROW_VELOCITY_X,
  BOMB_THROW_VELOCITY_Y,
} from '../constants';
import { SoundManager } from '../systems/SoundManager';
import { Robot } from '../entities/Robot';
import { Bomb } from '../entities/Bomb';
import { ThrownBomb } from '../entities/ThrownBomb';

const LEVELS: LevelData[] = [level1, level2];

const TILE_TEXTURES: Record<number, string> = {
  1: 'tile_ground_surface',
  2: 'tile_ground_fill',
  3: 'tile_platform',
  4: 'tile_small_platform',
  5: 'tile_decoration',
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private energySystem!: EnergySystem;
  private inventory!: InventorySystem;
  private carrotSprites: Carrot[] = [];
  private gemSprites: Gem[] = [];
  private portal!: Portal;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private currentLevel = 0;
  private transitioning = false;
  private soundMgr = new SoundManager();
  private lastLowEnergyWarning = 0;
  private depositAccumulator = 0;
  private invincibleTimer = 0;
  private robots: Robot[] = [];
  private bombSprites: Bomb[] = [];
  private thrownBombs: ThrownBomb[] = [];
  private portalNearby = false;
  private portalPrompt = '';
  private respawning = false;
  private spawnPoint = new Phaser.Math.Vector2();
  private throwPreview!: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number }): void {
    this.currentLevel = data.level ?? 0;
    this.transitioning = false;
    this.carrotSprites = [];
    this.gemSprites = [];
    this.depositAccumulator = 0;
    this.invincibleTimer = 0;
    this.robots = [];
    this.bombSprites = [];
    this.thrownBombs = [];
    this.portalNearby = false;
    this.portalPrompt = '';
    this.respawning = false;
    this.lastLowEnergyWarning = 0;
  }

  create(): void {
    const levelData = this.getLevelData();
    const worldWidth = levelData.width * TILE_SIZE;
    const worldHeight = levelData.height * TILE_SIZE;

    this.setupWorld(levelData, worldWidth, worldHeight);
    this.createPlayerAndSystems(levelData);
    this.setupCollisions(levelData);
    this.setupCamera(worldWidth, worldHeight);
    this.launchUI(levelData);
    this.showLevelName(levelData.name);
    this.throwPreview = this.add.graphics().setDepth(20);
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) {
      return;
    }

    this.player.update(delta);
    this.updateInvincibility(delta);
    this.updateEnergy(delta);
    if (this.transitioning) {
      return;
    }

    this.updatePortalInteraction(delta);
    if (this.transitioning) {
      return;
    }

    this.updateRobots();
    this.updateBombPreview();
    this.updateBombThrow();
    this.checkFallRecovery();
  }

  private getLevelData(): LevelData {
    const levelData = LEVELS[this.currentLevel] ?? LEVELS[0];
    if (!LEVELS[this.currentLevel]) {
      this.currentLevel = 0;
    }
    return levelData;
  }

  private setupWorld(levelData: LevelData, worldWidth: number, worldHeight: number): void {
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.createBackgrounds(worldWidth, worldHeight);

    this.platforms = this.physics.add.staticGroup();
    this.buildTilemap(levelData);
    this.spawnCollectibles(levelData);

    const portalX = levelData.portal.col * TILE_SIZE + TILE_SIZE / 2;
    const portalY = levelData.portal.row * TILE_SIZE;
    this.portal = new Portal(this, portalX, portalY, levelData.gemsRequired);
  }

  private createPlayerAndSystems(levelData: LevelData): void {
    this.inputManager = new InputManager(this);

    const spawnX = levelData.playerSpawn.col * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = levelData.playerSpawn.row * TILE_SIZE;
    this.spawnPoint.set(spawnX, spawnY);

    this.player = new Player(this, spawnX, spawnY, this.inputManager);
    this.player.onJump = () => this.soundMgr.jump();

    this.energySystem = new EnergySystem(this);
    this.inventory = new InventorySystem(this);
  }

  private setupCollisions(levelData: LevelData): void {
    this.physics.add.collider(this.player, this.platforms);
    this.setupCollectibleOverlaps();
    this.spawnRobots(levelData);
  }

  private setupCollectibleOverlaps(): void {
    this.physics.add.overlap(this.player, this.carrotSprites, (_player, obj) => {
      const carrot = obj as Carrot;
      if (!carrot.active || !this.player.isCrouching) {
        return;
      }

      carrot.collect();
      this.inventory.addCarrot();
      this.soundMgr.collectCarrot();
    });

    this.physics.add.overlap(this.player, this.gemSprites, (_player, obj) => {
      const gem = obj as Gem;
      if (!gem.active) {
        return;
      }

      gem.collect();
      this.inventory.addGem();
      this.soundMgr.collectGem();
    });

    this.physics.add.overlap(this.player, this.bombSprites, (_player, obj) => {
      const bomb = obj as Bomb;
      if (!bomb.active || this.inventory.bombs >= MAX_BOMBS) {
        return;
      }

      bomb.collect();
      this.inventory.addBomb();
      this.soundMgr.collectGem(); // reuse chime for pickup
    });
  }

  private spawnRobots(levelData: LevelData): void {
    if (!levelData.robots?.length) {
      return;
    }

    levelData.robots.forEach(robotSpawn => {
      const x = robotSpawn.col * TILE_SIZE + TILE_SIZE / 2;
      const y = robotSpawn.row * TILE_SIZE;
      const robot = new Robot(
        this,
        x,
        y,
        robotSpawn.patrolLeft * TILE_SIZE,
        robotSpawn.patrolRight * TILE_SIZE + TILE_SIZE,
      );
      this.robots.push(robot);
    });

    this.physics.add.collider(this.robots, this.platforms);
    this.physics.add.overlap(this.player, this.robots, (_player, obj) => {
      this.onRobotHit(obj as Robot);
    });
  }

  private setupCamera(worldWidth: number, worldHeight: number): void {
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  private launchUI(levelData: LevelData): void {
    this.scene.launch('UIScene', {
      energy: this.energySystem.energy,
      carrots: 0,
      gems: 0,
      levelName: levelData.name,
      gemsRequired: levelData.gemsRequired,
    });
    this.emitPortalPrompt('');
  }

  private showLevelName(levelName: string): void {
    const nameText = this.add.text(this.spawnPoint.x, this.spawnPoint.y - 60, levelName, {
      fontSize: '20px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(1);

    this.tweens.add({
      targets: nameText,
      alpha: 0,
      y: nameText.y - 30,
      delay: 2000,
      duration: 1000,
      onComplete: () => nameText.destroy(),
    });
  }

  private updateInvincibility(delta: number): void {
    if (this.invincibleTimer <= 0) {
      return;
    }

    this.invincibleTimer -= delta;
    this.player.setAlpha(Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3);
    if (this.invincibleTimer <= 0) {
      this.player.setAlpha(1);
    }
  }

  private updateEnergy(delta: number): void {
    const result = this.energySystem.update(
      delta,
      this.player.isMoving,
      this.player.isOnGround,
      this.inventory.carrots,
    );

    if (result.consumed) {
      this.inventory.consumeCarrot();
      this.soundMgr.autoEat();
    }

    if (result.gameOver) {
      this.triggerGameOver();
      return;
    }

    if (this.energySystem.percent < 0.25 && this.energySystem.percent > 0) {
      this.lastLowEnergyWarning += delta;
      if (this.lastLowEnergyWarning > 3000) {
        this.soundMgr.lowEnergy();
        this.lastLowEnergyWarning = 0;
      }
    } else {
      this.lastLowEnergyWarning = 0;
    }
  }

  private updatePortalInteraction(delta: number): void {
    this.portalNearby = this.physics.overlap(this.player, this.portal);

    if (!this.portalNearby) {
      this.depositAccumulator = 0;
      this.emitPortalPrompt('');
      return;
    }

    if (this.portal.isFullyCharged && !this.portal.activated) {
      this.portal.activate();
      this.soundMgr.portalActivate();
    }

    const prompt = this.getPortalPrompt();
    this.emitPortalPrompt(prompt);

    if (this.portal.activated) {
      this.enterPortal();
      return;
    }

    const wantsToDeposit = this.inputManager.interact && this.inventory.gems > 0 && !this.portal.isFullyCharged;
    if (!wantsToDeposit) {
      this.depositAccumulator = 0;
      return;
    }

    this.depositAccumulator += delta;
    const interval = 1000 / GEM_DEPOSIT_RATE;

    while (this.depositAccumulator >= interval && this.inventory.gems > 0 && !this.portal.isFullyCharged) {
      this.depositAccumulator -= interval;
      this.inventory.depositGem();
      this.soundMgr.depositGem();
      this.animateGemDeposit();
    }

  }

  private getPortalPrompt(): string {
    if (this.portal.activated) {
      return 'Press Shift or E to enter the portal';
    }

    if (this.inventory.gems > 0) {
      return `Hold Shift or E to deposit gems (${this.inventory.gems} held)`;
    }

    const missing = this.portal.gemsStillNeeded;
    return `Collect ${missing} more gem${missing === 1 ? '' : 's'} to charge the portal`;
  }

  private emitPortalPrompt(message: string): void {
    if (this.portalPrompt === message) {
      return;
    }

    this.portalPrompt = message;
    this.events.emit('portal-prompt-changed', message);
  }

  private animateGemDeposit(): void {
    const gemImage = this.add.image(this.player.x, this.player.y - 10, 'gem');
    this.tweens.add({
      targets: gemImage,
      x: this.portal.x,
      y: this.portal.y - 20,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.5,
      duration: 300,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.portal.onGemDeposited();
        gemImage.destroy();
      },
    });
  }

  private updateRobots(): void {
    this.robots.forEach(robot => robot.update());
  }

  private updateBombThrow(): void {
    if (this.inputManager.throwPressed && this.inventory.bombs > 0) {
      this.inventory.useBomb();
      this.throwPreview.clear();
      const velocity = this.getBombVelocity();
      const bomb = new ThrownBomb(this, this.player.x, this.player.y - 10, velocity.x, velocity.y);
      this.thrownBombs.push(bomb);
      this.soundMgr.throwBomb();

      // Collide with platforms — fizzle on hit
      this.physics.add.collider(bomb, this.platforms, () => {
        this.removeThrownBomb(bomb);
        bomb.fizzle();
      });

      // Overlap with robots — stun on hit
      this.physics.add.overlap(bomb, this.robots, (_b, obj) => {
        const robot = obj as Robot;
        if (robot.stunned) {
          return;
        }
        robot.stun(BOMB_EMP_DURATION);
        this.soundMgr.bombEmp();
        this.removeThrownBomb(bomb);
        bomb.fizzle();
      });

      this.time.delayedCall(2500, () => {
        if (!bomb.active) {
          return;
        }
        this.removeThrownBomb(bomb);
        bomb.fizzle();
      });
    }
  }

  private updateBombPreview(): void {
    this.throwPreview.clear();
    if (!this.inputManager.throwCharging || this.inventory.bombs <= 0 || this.transitioning) {
      return;
    }

    const startX = this.player.x;
    const startY = this.player.y - 10;
    const velocity = this.getBombVelocity();
    const gravityY = this.physics.world.gravity.y;
    const previewDuration = 0.25;
    const steps = 8;

    this.throwPreview.lineStyle(3, 0xffffff, 0.35);
    this.throwPreview.beginPath();

    for (let i = 0; i <= steps; i++) {
      const t = (previewDuration * i) / steps;
      const x = startX + velocity.x * t;
      const y = startY + velocity.y * t + 0.5 * gravityY * t * t;
      if (i === 0) {
        this.throwPreview.moveTo(x, y);
      } else {
        this.throwPreview.lineTo(x, y);
      }
    }

    this.throwPreview.strokePath();
  }

  private getBombVelocity(): Phaser.Math.Vector2 {
    const horizontal = this.player.flipX ? -BOMB_THROW_VELOCITY_X : BOMB_THROW_VELOCITY_X;
    const lift = Phaser.Math.Linear(BOMB_THROW_VELOCITY_Y * 0.55, BOMB_THROW_VELOCITY_Y * 1.45, this.inputManager.throwAimRatio);
    return new Phaser.Math.Vector2(horizontal, lift);
  }

  private removeThrownBomb(bomb: ThrownBomb): void {
    const idx = this.thrownBombs.indexOf(bomb);
    if (idx !== -1) {
      this.thrownBombs.splice(idx, 1);
    }
  }

  private checkFallRecovery(): void {
    const levelData = this.getLevelData();
    const worldHeight = levelData.height * TILE_SIZE;
    if (this.respawning || this.player.y <= worldHeight + FALL_RESPAWN_BUFFER) {
      return;
    }

    this.respawnPlayerFromFall();
  }

  private respawnPlayerFromFall(): void {
    this.respawning = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.stop();
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.setAlpha(1);
    this.depositAccumulator = 0;
    this.emitPortalPrompt('');
    this.invincibleTimer = INVINCIBILITY_DURATION;
    this.energySystem.damage(FALL_RESPAWN_DAMAGE);
    this.soundMgr.zap();
    this.cameras.main.flash(250, 255, 255, 255);

    if (this.energySystem.energy <= 0 && this.inventory.carrots <= 0) {
      this.triggerGameOver();
      return;
    }

    this.time.delayedCall(200, () => {
      this.respawning = false;
    });
  }

  private triggerGameOver(): void {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.throwPreview.clear();
    this.soundMgr.gameOver();
    this.emitPortalPrompt('');
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene', { level: this.currentLevel });
  }

  private createBackgrounds(worldWidth: number, worldHeight: number): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky')
      .setScrollFactor(0)
      .setDepth(-30);

    const cityTiles = Math.ceil(worldWidth / 800) + 1;
    for (let i = 0; i < cityTiles; i++) {
      this.add.image(i * 800 + 400, worldHeight - 240, 'bg_city')
        .setScrollFactor(0.2)
        .setDepth(-20);
    }

    const floraTiles = Math.ceil(worldWidth / 800) + 1;
    for (let i = 0; i < floraTiles; i++) {
      this.add.image(i * 800 + 400, worldHeight - 240, 'bg_flora')
        .setScrollFactor(0.5)
        .setDepth(-10);
    }
  }

  private buildTilemap(level: LevelData): void {
    for (let row = 0; row < level.height; row++) {
      for (let col = 0; col < level.width; col++) {
        const tileType = level.tiles[row][col];
        if (tileType === 0 || tileType === 5) {
          if (tileType === 5) {
            this.add.image(
              col * TILE_SIZE + TILE_SIZE / 2,
              row * TILE_SIZE + TILE_SIZE / 2,
              'tile_decoration',
            ).setDepth(-5);
          }
          continue;
        }

        const textureKey = TILE_TEXTURES[tileType];
        if (!textureKey) {
          continue;
        }

        const tile = this.platforms.create(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          textureKey,
        ) as Phaser.Physics.Arcade.Sprite;
        tile.setImmovable(true);
        tile.refreshBody();
      }
    }
  }

  private spawnCollectibles(level: LevelData): void {
    level.carrots.forEach(spawn => {
      const x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
      const y = (spawn.row + 1) * TILE_SIZE - 6;
      const carrot = new Carrot(this, x, y);
      this.carrotSprites.push(carrot);
    });

    level.gems.forEach(spawn => {
      const x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
      const y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
      const gem = new Gem(this, x, y);
      this.gemSprites.push(gem);
    });

    level.bombs?.forEach(spawn => {
      const x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
      const y = (spawn.row + 1) * TILE_SIZE - 6;
      const bomb = new Bomb(this, x, y);
      this.bombSprites.push(bomb);
    });
  }

  private onRobotHit(robot: Robot): void {
    if (this.invincibleTimer > 0 || robot.stunned) {
      return;
    }

    this.invincibleTimer = INVINCIBILITY_DURATION;
    this.energySystem.damage(ROBOT_ZAP_DAMAGE);
    this.soundMgr.zap();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const direction = this.player.x < robot.x ? -1 : 1;
    body.setVelocityX(direction * 250);
    body.setVelocityY(-200);
  }

  private enterPortal(): void {
    if (!this.portal.activated || this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.throwPreview.clear();
    this.soundMgr.portalEnter();
    this.emitPortalPrompt('');

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      const nextLevel = this.currentLevel + 1;
      this.scene.start('LevelCompleteScene', {
        level: this.currentLevel,
        gems: this.inventory.depositedGems + this.inventory.gems,
        carrots: this.inventory.carrots,
        nextLevel: nextLevel < LEVELS.length ? nextLevel : -1,
      });
    });
  }
}
