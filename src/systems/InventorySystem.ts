import Phaser from 'phaser';

export class InventorySystem {
  private scene: Phaser.Scene;
  carrots: number = 0;
  gems: number = 0;
  depositedGems: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addCarrot(): void {
    this.carrots++;
    this.scene.events.emit('carrot-changed', this.carrots);
  }

  consumeCarrot(): boolean {
    if (this.carrots > 0) {
      this.carrots--;
      this.scene.events.emit('carrot-changed', this.carrots);
      return true;
    }
    return false;
  }

  addGem(): void {
    this.gems++;
    this.scene.events.emit('gem-changed', this.gems);
  }

  depositGem(): boolean {
    if (this.gems > 0) {
      this.gems--;
      this.depositedGems++;
      this.scene.events.emit('gem-changed', this.gems);
      this.scene.events.emit('deposited-gems-changed', this.depositedGems);
      return true;
    }
    return false;
  }

  gemsStillNeeded(required: number): number {
    return Math.max(0, required - this.depositedGems);
  }

  reset(): void {
    this.carrots = 0;
    this.gems = 0;
    this.depositedGems = 0;
  }
}
