import Phaser from 'phaser';
import { ENERGY_MAX, COLORS, GAME_WIDTH, MAX_CARROT_ICONS } from '../constants';

export class UIScene extends Phaser.Scene {
  private energyBar!: Phaser.GameObjects.Graphics;
  private carrotIcons: Phaser.GameObjects.Image[] = [];
  private carrotOverflowText?: Phaser.GameObjects.Text;
  private gemText!: Phaser.GameObjects.Text;
  private portalText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private currentEnergy = ENERGY_MAX;
  private gemsRequired = 12;

  constructor() {
    super('UIScene');
  }

  create(data: { energy: number; carrots: number; gems: number; levelName: string; gemsRequired?: number }): void {
    this.currentEnergy = data.energy;
    this.gemsRequired = data.gemsRequired ?? 12;
    this.carrotIcons = [];

    // Energy bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.5);
    barBg.fillRoundedRect(10, 10, 204, 24, 6);

    // Energy bar
    this.energyBar = this.add.graphics();
    this.drawEnergyBar(data.energy);

    // Energy label
    this.add.text(12, 12, 'E', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });

    // Carrot icons area (right side)
    this.updateCarrotIcons(data.carrots);

    // Gem counter (held gems)
    this.gemText = this.add.text(GAME_WIDTH - 180, 12, `Gems: ${data.gems}`, {
      fontSize: '16px',
      color: '#A29BFE',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 2,
    });

    // Portal deposit progress
    this.portalText = this.add.text(GAME_WIDTH - 180, 34, `Portal: 0 / ${this.gemsRequired}`, {
      fontSize: '14px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 2,
    });

    // Level name
    this.levelText = this.add.text(GAME_WIDTH / 2, 12, data.levelName, {
      fontSize: '14px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.promptText = this.add.text(GAME_WIDTH / 2, 452, '', {
      fontSize: '14px',
      color: '#FFD93D',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1);

    // Listen to game scene events
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('energy-changed', this.updateEnergy, this);
    gameScene.events.on('carrot-changed', this.updateCarrots, this);
    gameScene.events.on('gem-changed', this.updateGems, this);
    gameScene.events.on('deposited-gems-changed', this.updateDeposited, this);
    gameScene.events.on('portal-prompt-changed', this.updatePrompt, this);

    // Cleanup on shutdown
    this.events.on('shutdown', () => {
      gameScene.events.off('energy-changed', this.updateEnergy, this);
      gameScene.events.off('carrot-changed', this.updateCarrots, this);
      gameScene.events.off('gem-changed', this.updateGems, this);
      gameScene.events.off('deposited-gems-changed', this.updateDeposited, this);
      gameScene.events.off('portal-prompt-changed', this.updatePrompt, this);
    });
  }

  private updateEnergy(energy: number): void {
    this.currentEnergy = energy;
    this.drawEnergyBar(energy);
  }

  private updateCarrots(count: number): void {
    this.updateCarrotIcons(count);
  }

  private updateGems(count: number): void {
    this.gemText.setText(`Gems: ${count}`);
  }

  private updateDeposited(deposited: number): void {
    this.portalText.setText(`Portal: ${deposited} / ${this.gemsRequired}`);
  }

  private updatePrompt(message: string): void {
    this.promptText.setText(message);
  }

  private updateCarrotIcons(count: number): void {
    // Remove existing icons
    this.carrotIcons.forEach(icon => icon.destroy());
    this.carrotIcons = [];
    if (this.carrotOverflowText) {
      this.carrotOverflowText.destroy();
      this.carrotOverflowText = undefined;
    }

    const visible = Math.min(count, MAX_CARROT_ICONS);
    const startX = GAME_WIDTH - 26;
    const y = 58;

    for (let i = 0; i < visible; i++) {
      const icon = this.add.image(startX - i * 18, y, 'carrot').setScale(0.5);
      this.carrotIcons.push(icon);
    }

    if (count > MAX_CARROT_ICONS) {
      this.carrotOverflowText = this.add.text(startX - visible * 18 - 4, y - 6, `+${count - MAX_CARROT_ICONS}`, {
        fontSize: '12px',
        color: '#FF9F43',
        fontFamily: 'Arial',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(1, 0);
    }
  }

  private drawEnergyBar(energy: number): void {
    this.energyBar.clear();
    const pct = energy / ENERGY_MAX;
    const barWidth = 180 * pct;

    let color: number;
    if (pct > 0.5) {
      color = COLORS.ENERGY_GREEN;
    } else if (pct > 0.25) {
      color = COLORS.ENERGY_ORANGE;
    } else {
      color = COLORS.ENERGY_RED;
    }

    this.energyBar.fillStyle(color, 0.9);
    this.energyBar.fillRoundedRect(22, 14, Math.max(0, barWidth), 16, 4);
  }
}
