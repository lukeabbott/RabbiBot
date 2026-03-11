import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { SoundManager } from '../systems/SoundManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu_bg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 100, 'RabbiBot', {
      fontSize: '56px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 160, 'Circuit Adventure', {
      fontSize: '24px',
      color: '#A29BFE',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // RabbiBot character display
    const rabbit = this.add.sprite(
      GAME_WIDTH / 2,
      280,
      this.textures.exists('rabbit_reactions') ? 'rabbit_reactions' : 'rabbibot',
      this.textures.exists('rabbit_reactions') ? 2 : 'wave1',
    );
    rabbit.setScale(0.2);

    // Wave animation on title screen
    const titleWaveKey = 'menu-rabbit-wave';
    if (!this.anims.exists(titleWaveKey)) {
      this.anims.create({
        key: titleWaveKey,
        frames: [
          this.textures.exists('rabbit_reactions')
            ? { key: 'rabbit_reactions', frame: 2 }
            : { key: 'rabbibot', frame: 'wave1' },
          this.textures.exists('rabbit_reactions')
            ? { key: 'rabbit_reactions', frame: 3 }
            : { key: 'rabbibot2', frame: 'wave2' },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }
    rabbit.play(titleWaveKey);

    // Start prompt
    const startText = this.add.text(GAME_WIDTH / 2, 400, 'Press SPACE to Start!', {
      fontSize: '22px',
      color: '#FFD93D',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 445, 'Arrow Keys / WASD to move  |  W/Up to jump  |  Hold Space to aim, release to throw  |  Shift/E to interact', {
      fontSize: '12px',
      color: '#B0A0C8',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Input handler
    const sfx = new SoundManager();
    this.input.keyboard!.once('keydown-SPACE', () => {
      sfx.menuSelect();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: 0 });
      });
    });
  }
}
