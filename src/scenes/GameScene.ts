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
import { TILE_SIZE, GEM_DEPOSIT_RATE, GAME_WIDTH, GAME_HEIGHT, INVINCIBILITY_DURATION, ROBOT_ZAP_DAMAGE } from '../constants';
import { SoundManager } from '../systems/SoundManager';
import { Robot } from '../entities/Robot';

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
  private sound_mgr = new SoundManager();
  private lastLowEnergyWarning = 0;
  private depositAccumulator = 0;
  private depositingGems = false;
  private invincibleTimer = 0;
  private robots: Robot[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number }): void {
    this.currentLevel = data.level ?? 0;
    this.transitioning = false;
    this.carrotSprites = [];
    this.gemSprites = [];
    this.depositAccumulator = 0;
    this.depositingGems = false;
    this.invincibleTimer = 0;
    this.robots = [];
  }

  create(): void {
    const levelData = LEVELS[this.currentLevel];
    const worldWidth = levelData.width * TILE_SIZE;
    const worldHeight = levelData.height * TILE_SIZE;

    // Set world bounds
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Fade in from the menu/transition
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Create parallax backgrounds
    this.createBackgrounds(worldWidth, worldHeight);

    // Create tile platforms
    this.platforms = this.physics.add.staticGroup();
    this.buildTilemap(levelData);

    // Spawn collectibles
    this.spawnCollectibles(levelData);

    // Spawn portal
    const portalX = levelData.portal.col * TILE_SIZE + TILE_SIZE / 2;
    const portalY = levelData.portal.row * TILE_SIZE;
    this.portal = new Portal(this, portalX, portalY, levelData.gemsRequired);

    // Create player
    this.inputManager = new InputManager(this);
    const spawnX = levelData.playerSpawn.col * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = levelData.playerSpawn.row * TILE_SIZE;
    this.player = new Player(this, spawnX, spawnY, this.inputManager);
    this.player.onJump = () => this.sound_mgr.jump();

    // Systems
    this.energySystem = new EnergySystem(this);
    this.inventory = new InventorySystem(this);

    // Collisions
    this.physics.add.collider(this.player, this.platforms);

    // Overlaps — use inline callbacks to avoid type issues
    this.physics.add.overlap(this.player, this.carrotSprites, (_p, obj) => {
      const carrot = obj as Carrot;
      if (carrot.active && this.player.isCrouching) {
        carrot.collect();
        this.inventory.addCarrot();
        this.sound_mgr.collectCarrot();
      }
    });

    this.physics.add.overlap(this.player, this.gemSprites, (_p, obj) => {
      const gem = obj as Gem;
      if (gem.active) {
        gem.collect();
        this.inventory.addGem();
        this.sound_mgr.collectGem();
      }
    });

    this.physics.add.overlap(this.player, this.portal, () => {
      if (this.portal.activated) {
        this.enterPortal();
      } else {
        this.depositingGems = true;
      }
    });

    // Camera
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Spawn robots
    if (levelData.robots) {
      levelData.robots.forEach(rs => {
        const rx = rs.col * TILE_SIZE + TILE_SIZE / 2;
        const ry = rs.row * TILE_SIZE;
        const robot = new Robot(this, rx, ry, rs.patrolLeft * TILE_SIZE, rs.patrolRight * TILE_SIZE + TILE_SIZE);
        this.robots.push(robot);
      });
      this.physics.add.collider(this.robots, this.platforms);
      this.physics.add.overlap(this.player, this.robots, (_p, obj) => {
        this.onRobotHit(obj as Robot);
      });
    }

    // Launch UI overlay
    this.scene.launch('UIScene', {
      energy: this.energySystem.energy,
      carrots: 0,
      gems: 0,
      levelName: levelData.name,
      gemsRequired: levelData.gemsRequired,
    });

    // Level name display
    const nameText = this.add.text(spawnX, spawnY - 60, levelData.name, {
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

  update(_time: number, delta: number): void {
    this.player.update(delta);

    // Invincibility timer
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      // Flicker effect
      this.player.setAlpha(Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3);
      if (this.invincibleTimer <= 0) {
        this.player.setAlpha(1);
      }
    }

    // Update energy system
    const result = this.energySystem.update(
      delta,
      this.player.isMoving,
      this.player.isOnGround,
      this.inventory.carrots,
    );

    if (result.consumed) {
      this.inventory.consumeCarrot();
      this.sound_mgr.autoEat();
    }

    if (result.gameOver) {
      this.sound_mgr.gameOver();
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { level: this.currentLevel });
    }

    // Low energy warning
    if (this.energySystem.percent < 0.25 && this.energySystem.percent > 0) {
      this.lastLowEnergyWarning += delta;
      if (this.lastLowEnergyWarning > 3000) {
        this.sound_mgr.lowEnergy();
        this.lastLowEnergyWarning = 0;
      }
    } else {
      this.lastLowEnergyWarning = 0;
    }

    // Gem deposit flow
    if (this.depositingGems && this.inventory.gems > 0 && !this.portal.isFullyCharged) {
      this.depositAccumulator += delta;
      const interval = 1000 / GEM_DEPOSIT_RATE;
      while (this.depositAccumulator >= interval && this.inventory.gems > 0 && !this.portal.isFullyCharged) {
        this.depositAccumulator -= interval;
        this.inventory.depositGem();
        this.sound_mgr.depositGem();

        // Create gem image that flies to portal
        const gemImg = this.add.image(this.player.x, this.player.y - 10, 'gem');
        this.tweens.add({
          targets: gemImg,
          x: this.portal.x,
          y: this.portal.y - 20,
          scaleX: 0.5,
          scaleY: 0.5,
          alpha: 0.5,
          duration: 300,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.portal.onGemDeposited();
            gemImg.destroy();
          },
        });
      }

    } else {
      this.depositAccumulator = 0;
    }
    // Reset deposit flag after processing — overlap callback will set it again next physics step
    this.depositingGems = false;

    // Check if portal should activate (outside deposit block — tweens complete async)
    if (this.portal.isFullyCharged && !this.portal.activated) {
      this.portal.activate();
      this.sound_mgr.portalActivate();
    }

    // Update robots
    this.robots.forEach(robot => robot.update());
  }

  private createBackgrounds(worldWidth: number, worldHeight: number): void {
    // Layer 1: Sky (fixed, no scroll)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky')
      .setScrollFactor(0)
      .setDepth(-30);

    // Layer 2: Cityscape (slow parallax)
    const cityTiles = Math.ceil(worldWidth / 800) + 1;
    for (let i = 0; i < cityTiles; i++) {
      this.add.image(i * 800 + 400, worldHeight - 240, 'bg_city')
        .setScrollFactor(0.2)
        .setDepth(-20);
    }

    // Layer 3: Flora (medium parallax)
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
        const texKey = TILE_TEXTURES[tileType];
        if (!texKey) continue;

        const tile = this.platforms.create(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          texKey,
        ) as Phaser.Physics.Arcade.Sprite;
        tile.setImmovable(true);
        tile.refreshBody();
      }
    }
  }

  private spawnCollectibles(level: LevelData): void {
    level.carrots.forEach(spawn => {
      const x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
      // Place carrots embedded in the ground — bottom half buried, top poking out
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
  }

  private onRobotHit(_robot: Robot): void {
    if (this.invincibleTimer > 0) return;
    this.invincibleTimer = INVINCIBILITY_DURATION;
    this.energySystem.damage(ROBOT_ZAP_DAMAGE);
    this.sound_mgr.zap();

    // Knockback — push player away from robot
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dir = this.player.x < _robot.x ? -1 : 1;
    body.setVelocityX(dir * 250);
    body.setVelocityY(-200);
  }

  private enterPortal(): void {
    if (!this.portal.activated || this.transitioning) return;
    this.transitioning = true;
    this.sound_mgr.portalEnter();

    // Transition effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      const nextLevel = this.currentLevel + 1;
      if (nextLevel < LEVELS.length) {
        this.scene.start('LevelCompleteScene', {
          level: this.currentLevel,
          gems: this.inventory.depositedGems,
          carrots: this.inventory.carrots,
          nextLevel,
        });
      } else {
        this.scene.start('LevelCompleteScene', {
          level: this.currentLevel,
          gems: this.inventory.depositedGems,
          carrots: this.inventory.carrots,
          nextLevel: -1,
        });
      }
    });
  }
}
