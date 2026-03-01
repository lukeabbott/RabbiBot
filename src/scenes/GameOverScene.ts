import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: { level: number }): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky');

    // Sad rabbit
    const rabbit = this.add.sprite(GAME_WIDTH / 2, 200, 'rabbibot2', 'slide');
    rabbit.setScale(0.18);

    // Message
    this.add.text(GAME_WIDTH / 2, 300, 'Oh no! RabbiBot ran out of energy!', {
      fontSize: '22px',
      color: '#e17055',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 340, 'Collect carrots to keep your energy up!', {
      fontSize: '16px',
      color: '#FFD93D',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Retry
    const retryText = this.add.text(GAME_WIDTH / 2, 410, 'Press SPACE to Try Again!', {
      fontSize: '22px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: data.level });
      });
    });
  }
}
