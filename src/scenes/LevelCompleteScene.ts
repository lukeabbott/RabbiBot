import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { SoundManager } from '../systems/SoundManager';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create(data: { level: number; gems: number; carrots: number; nextLevel: number }): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const sfx = new SoundManager();
    sfx.levelComplete();

    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky');

    // Happy rabbit
    const rabbit = this.add.sprite(GAME_WIDTH / 2, 150, 'rabbibot', 'wave1');
    rabbit.setScale(0.2);

    const isGameComplete = data.nextLevel === -1;

    // Title
    this.add.text(GAME_WIDTH / 2, 260, isGameComplete ? 'You Did It!' : 'Level Complete!', {
      fontSize: '36px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    this.add.text(GAME_WIDTH / 2, 310, `Total Gems Collected: ${data.gems}`, {
      fontSize: '18px',
      color: '#A29BFE',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 340, `Carrots Remaining: ${data.carrots}`, {
      fontSize: '18px',
      color: '#FF9F43',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 2,
    }).setOrigin(0.5);

    if (isGameComplete) {
      this.add.text(GAME_WIDTH / 2, 390, 'RabbiBot saved the circuit world!', {
        fontSize: '20px',
        color: '#FFD93D',
        fontFamily: 'Arial',
        stroke: '#1a1a2e',
        strokeThickness: 3,
      }).setOrigin(0.5);
    }

    // Continue/replay prompt
    const promptMsg = isGameComplete ? 'Press SPACE to Play Again!' : 'Press SPACE for Next Level!';
    const promptText = this.add.text(GAME_WIDTH / 2, 430, promptMsg, {
      fontSize: '22px',
      color: '#FFD93D',
      fontFamily: 'Arial',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: promptText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (isGameComplete) {
          this.scene.start('MenuScene');
        } else {
          this.scene.start('GameScene', { level: data.nextLevel });
        }
      });
    });
  }
}
