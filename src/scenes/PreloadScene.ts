import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    // Show loading text
    const text = this.add.text(400, 240, 'Loading...', {
      fontSize: '24px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Load sprite atlases
    this.load.atlas('rabbibot', 'assets/sprites/rabbibot.png', 'assets/sprites/rabbibot.json');
    this.load.atlas('rabbibot2', 'assets/sprites/rabbibot2.png', 'assets/sprites/rabbibot2.json');

    // Processed rabbibot sheets with transparent backgrounds
    this.load.spritesheet('rabbit_idle_run', 'assets/sprites/rabbit_idle_run.png', {
      frameWidth: 480,
      frameHeight: 480,
    });
    this.load.spritesheet('rabbit_jump', 'assets/sprites/rabbit_jump.png', {
      frameWidth: 512,
      frameHeight: 512,
    });
    this.load.spritesheet('rabbit_reactions', 'assets/sprites/rabbit_reactions.png', {
      frameWidth: 512,
      frameHeight: 512,
    });
    this.load.spritesheet('rabbit_actions', 'assets/sprites/rabbit_actions.png', {
      frameWidth: 512,
      frameHeight: 512,
    });

    // Processed world/item art
    this.load.image('menu_bg', 'assets/graphics/menu_bg.jpg');
    this.load.image('carrot', 'assets/graphics/carrot.png');
    this.load.spritesheet('gem_sheet', 'assets/graphics/gem_sheet.png', {
      frameWidth: 480,
      frameHeight: 480,
    });
    this.load.image('bomb', 'assets/graphics/bomb.png');
    this.load.image('portal', 'assets/graphics/portal.png');
  }

  create(): void {
    this.generateTiles();
    this.generateCarrot();
    this.generateGem();
    this.generatePortal();
    this.generateRobot();
    this.generateBomb();
    this.generateBackgrounds();
    this.scene.start('MenuScene');
  }

  private generateTiles(): void {
    const T = TILE_SIZE;

    // Ground surface tile (1)
    const gSurface = this.add.graphics();
    gSurface.fillStyle(COLORS.GROUND_SURFACE);
    gSurface.fillRect(0, 0, T, T);
    // Circuit trace lines on top
    gSurface.lineStyle(2, COLORS.CIRCUIT_GOLD, 0.6);
    gSurface.lineBetween(0, 4, T, 4);
    gSurface.lineBetween(T/4, 0, T/4, T/3);
    gSurface.lineBetween(T*3/4, 0, T*3/4, T/3);
    // Small dots
    gSurface.fillStyle(COLORS.CIRCUIT_GOLD, 0.5);
    gSurface.fillCircle(T/4, T/3, 3);
    gSurface.fillCircle(T*3/4, T/3, 3);
    gSurface.generateTexture('tile_ground_surface', T, T);
    gSurface.destroy();

    // Ground fill tile (2)
    const gFill = this.add.graphics();
    gFill.fillStyle(COLORS.GROUND_FILL);
    gFill.fillRect(0, 0, T, T);
    gFill.lineStyle(1, COLORS.CIRCUIT_GOLD, 0.2);
    gFill.lineBetween(0, T/2, T, T/2);
    gFill.lineBetween(T/2, 0, T/2, T);
    gFill.generateTexture('tile_ground_fill', T, T);
    gFill.destroy();

    // Floating platform tile (3)
    const gPlat = this.add.graphics();
    gPlat.fillStyle(COLORS.PLATFORM);
    gPlat.fillRoundedRect(2, 8, T-4, T-12, 6);
    gPlat.lineStyle(2, COLORS.CIRCUIT_INDIGO, 0.7);
    gPlat.lineBetween(8, 16, T-8, 16);
    gPlat.lineBetween(T/2, 12, T/2, T-8);
    // Node dots
    gPlat.fillStyle(COLORS.CIRCUIT_GOLD, 0.8);
    gPlat.fillCircle(8, 16, 3);
    gPlat.fillCircle(T-8, 16, 3);
    gPlat.fillCircle(T/2, T-8, 3);
    gPlat.generateTexture('tile_platform', T, T);
    gPlat.destroy();

    // Small platform tile (4)
    const gSmall = this.add.graphics();
    gSmall.fillStyle(COLORS.PLATFORM, 0.9);
    gSmall.fillRoundedRect(4, 12, T-8, T-16, 4);
    gSmall.lineStyle(1, COLORS.CIRCUIT_INDIGO, 0.6);
    gSmall.lineBetween(12, 20, T-12, 20);
    gSmall.fillStyle(COLORS.CIRCUIT_GOLD, 0.7);
    gSmall.fillCircle(12, 20, 2);
    gSmall.fillCircle(T-12, 20, 2);
    gSmall.generateTexture('tile_small_platform', T, T);
    gSmall.destroy();

    // Circuit decoration tile (5)
    const gDeco = this.add.graphics();
    gDeco.lineStyle(1, COLORS.CIRCUIT_GOLD, 0.3);
    gDeco.lineBetween(0, T/2, T, T/2);
    gDeco.lineBetween(T/2, 0, T/2, T);
    gDeco.fillStyle(COLORS.CIRCUIT_INDIGO, 0.15);
    gDeco.fillCircle(T/2, T/2, 4);
    gDeco.generateTexture('tile_decoration', T, T);
    gDeco.destroy();
  }

  private generateCarrot(): void {
    if (this.textures.exists('carrot')) {
      return;
    }

    const g = this.add.graphics();
    const w = 28, h = 36;

    // Carrot body - orange rounded triangle
    g.fillStyle(COLORS.CARROT);
    g.beginPath();
    g.moveTo(14, 36);   // bottom point
    g.lineTo(4, 10);
    g.lineTo(24, 10);
    g.closePath();
    g.fillPath();

    // Rounded top
    g.fillCircle(14, 12, 10);

    // Circuit traces on carrot
    g.lineStyle(1.5, COLORS.CIRCUIT_GOLD, 0.7);
    g.lineBetween(14, 8, 14, 30);
    g.lineBetween(10, 16, 18, 16);

    // Green leaf top
    g.fillStyle(0x00b894);
    g.fillEllipse(10, 6, 8, 10);
    g.fillEllipse(18, 6, 8, 10);

    // Gold node dots
    g.fillStyle(COLORS.CIRCUIT_GOLD, 0.8);
    g.fillCircle(14, 16, 2);
    g.fillCircle(14, 24, 2);

    g.generateTexture('carrot', w, h);
    g.destroy();
  }

  private generateGem(): void {
    if (this.textures.exists('gem')) {
      return;
    }

    const g = this.add.graphics();
    const s = 24;

    // Hexagonal gem
    g.fillStyle(COLORS.GEM);
    g.beginPath();
    g.moveTo(12, 0);
    g.lineTo(24, 6);
    g.lineTo(24, 18);
    g.lineTo(12, 24);
    g.lineTo(0, 18);
    g.lineTo(0, 6);
    g.closePath();
    g.fillPath();

    // Inner circuit pattern
    g.lineStyle(1.5, COLORS.CIRCUIT_GOLD, 0.6);
    g.lineBetween(12, 4, 12, 20);
    g.lineBetween(4, 12, 20, 12);
    // Diamond shape inside
    g.lineStyle(1, 0xffffff, 0.3);
    g.lineBetween(12, 6, 18, 12);
    g.lineBetween(18, 12, 12, 18);
    g.lineBetween(12, 18, 6, 12);
    g.lineBetween(6, 12, 12, 6);

    // Center glow
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(12, 12, 3);

    g.generateTexture('gem', s, s);
    g.destroy();
  }

  private generatePortal(): void {
    if (this.textures.exists('portal')) {
      return;
    }

    const g = this.add.graphics();
    const w = 64, h = 80;

    // Outer frame - oval with circuit border
    g.lineStyle(4, COLORS.PORTAL, 1);
    g.strokeEllipse(w/2, h/2, w-8, h-8);

    // Inner energy swirl
    g.fillStyle(COLORS.PORTAL, 0.3);
    g.fillEllipse(w/2, h/2, w-20, h-20);

    // Circuit traces on border
    g.lineStyle(2, COLORS.CIRCUIT_GOLD, 0.6);
    g.beginPath();
    g.arc(w/2, h/2, w/2 - 6, -0.5, 1.0);
    g.strokePath();
    g.beginPath();
    g.arc(w/2, h/2, w/2 - 6, 2.0, 3.5);
    g.strokePath();

    // Node dots at cardinal points
    g.fillStyle(COLORS.CIRCUIT_GOLD, 0.8);
    g.fillCircle(w/2, 6, 4);
    g.fillCircle(w/2, h-6, 4);
    g.fillCircle(6, h/2, 4);
    g.fillCircle(w-6, h/2, 4);

    // Inner glow
    g.fillStyle(0xffffff, 0.15);
    g.fillEllipse(w/2, h/2, w/3, h/3);

    g.generateTexture('portal', w, h);
    g.destroy();
  }

  private generateRobot(): void {
    const g = this.add.graphics();
    const w = 32, h = 40;

    // Dark chassis body
    g.fillStyle(0x2d3436);
    g.fillRoundedRect(2, 10, w - 4, h - 12, 4);

    // Head
    g.fillStyle(0x636e72);
    g.fillRoundedRect(4, 2, w - 8, 14, 3);

    // Angry red eyes
    g.fillStyle(0xff4444);
    g.fillCircle(10, 8, 3);
    g.fillCircle(22, 8, 3);

    // Eye glow
    g.fillStyle(0xff0000, 0.5);
    g.fillCircle(10, 8, 1.5);
    g.fillCircle(22, 8, 1.5);

    // Gold circuit traces on chassis
    g.lineStyle(1.5, COLORS.CIRCUIT_GOLD, 0.7);
    g.lineBetween(w / 2, 14, w / 2, 34);
    g.lineBetween(8, 22, w - 8, 22);
    g.lineBetween(8, 30, w - 8, 30);

    // Circuit nodes
    g.fillStyle(COLORS.CIRCUIT_GOLD, 0.8);
    g.fillCircle(w / 2, 22, 2);
    g.fillCircle(8, 30, 1.5);
    g.fillCircle(w - 8, 30, 1.5);

    // Antenna
    g.lineStyle(2, 0x636e72);
    g.lineBetween(w / 2, 2, w / 2, -4);
    g.fillStyle(0xff4444);
    g.fillCircle(w / 2, -4, 2.5);

    // Legs/treads
    g.fillStyle(0x2d3436);
    g.fillRect(4, h - 4, 8, 4);
    g.fillRect(w - 12, h - 4, 8, 4);

    g.generateTexture('robot', w, h + 4);
    g.destroy();
  }

  private generateBomb(): void {
    if (this.textures.exists('bomb')) {
      return;
    }

    const g = this.add.graphics();
    const s = 24;

    // Bomb body — dark sphere
    g.fillStyle(0x2d3436);
    g.fillCircle(12, 14, 10);

    // Circuit traces on body
    g.lineStyle(1.5, COLORS.CIRCUIT_GOLD, 0.7);
    g.lineBetween(12, 6, 12, 22);
    g.lineBetween(4, 14, 20, 14);

    // Circuit nodes
    g.fillStyle(COLORS.CIRCUIT_GOLD, 0.8);
    g.fillCircle(12, 10, 2);
    g.fillCircle(12, 18, 2);
    g.fillCircle(8, 14, 1.5);
    g.fillCircle(16, 14, 1.5);

    // Fuse/antenna
    g.lineStyle(2, 0x636e72);
    g.lineBetween(12, 4, 12, 0);
    // Fuse spark
    g.fillStyle(0xff4444);
    g.fillCircle(12, 0, 2.5);

    // Highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(9, 11, 3);

    g.generateTexture('bomb', s, s);
    g.destroy();
  }

  private generateBackgrounds(): void {
    if (!this.textures.exists('bg_sky')) {
      // Background layer 1: Gradient sky fallback (800x480)
      const sky = this.add.graphics();
      const skyTop = Phaser.Display.Color.IntegerToColor(0xC8B8E0);
      const skyBot = Phaser.Display.Color.IntegerToColor(COLORS.SKY);
      for (let i = 0; i < 480; i++) {
        const t = i / 480;
        const r = Phaser.Math.Linear(skyTop.red, skyBot.red, t);
        const g2 = Phaser.Math.Linear(skyTop.green, skyBot.green, t);
        const b = Phaser.Math.Linear(skyTop.blue, skyBot.blue, t);
        sky.fillStyle(Phaser.Display.Color.GetColor(r, g2, b));
        sky.fillRect(0, i, 800, 1);
      }
      sky.generateTexture('bg_sky', 800, 480);
      sky.destroy();
    }

    if (!this.textures.exists('bg_city')) {
      // Background layer 2: Distant circuit cityscape silhouettes fallback
      const city = this.add.graphics();
      city.fillStyle(0xB0A0C8, 0.4);
      // Buildings as rectangles with varying heights
      const buildings = [
        { x: 0, w: 60, h: 120 }, { x: 70, w: 40, h: 80 }, { x: 120, w: 70, h: 150 },
        { x: 200, w: 50, h: 100 }, { x: 260, w: 80, h: 130 }, { x: 360, w: 45, h: 90 },
        { x: 420, w: 65, h: 160 }, { x: 500, w: 55, h: 110 }, { x: 570, w: 75, h: 140 },
        { x: 660, w: 50, h: 95 }, { x: 720, w: 80, h: 125 },
      ];
      buildings.forEach(b => {
        city.fillRect(b.x, 480 - b.h, b.w, b.h);
      });
      // Circuit traces on buildings
      city.lineStyle(1, COLORS.CIRCUIT_GOLD, 0.15);
      buildings.forEach(b => {
        const bTop = 480 - b.h;
        for (let row = bTop + 20; row < 480; row += 25) {
          city.lineBetween(b.x + 5, row, b.x + b.w - 5, row);
        }
      });
      city.generateTexture('bg_city', 800, 480);
      city.destroy();
    }

    if (!this.textures.exists('bg_flora')) {
      // Background layer 3: Foreground circuit flora fallback
      const flora = this.add.graphics();
      // Abstract circuit-plant shapes
      flora.fillStyle(COLORS.GROUND_SURFACE, 0.3);
      const plants = [50, 200, 380, 550, 700];
      plants.forEach(px => {
        // Stem
        flora.fillRect(px, 380, 4, 100);
        // Leaves as circles
        flora.fillCircle(px - 8, 400, 12);
        flora.fillCircle(px + 12, 390, 10);
        flora.fillCircle(px, 375, 14);
      });
      // Circuit traces
      flora.lineStyle(1, COLORS.CIRCUIT_GOLD, 0.2);
      plants.forEach(px => {
        flora.lineBetween(px + 2, 375, px + 2, 480);
      });
      flora.generateTexture('bg_flora', 800, 480);
      flora.destroy();
    }
  }
}
