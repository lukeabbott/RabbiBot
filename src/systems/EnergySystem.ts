import Phaser from 'phaser';
import {
  ENERGY_MAX,
  ENERGY_DRAIN_MOVING,
  ENERGY_DRAIN_IDLE,
  ENERGY_RESTORE,
  ENERGY_AUTO_EAT_THRESHOLD,
  ENERGY_AUTO_EAT_INTERVAL,
} from '../constants';

export class EnergySystem {
  private scene: Phaser.Scene;
  energy: number = ENERGY_MAX;
  private autoEatTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, isMoving: boolean, isOnGround: boolean, carrotCount: number): { consumed: boolean; gameOver: boolean } {
    const dt = delta / 1000;
    let consumed = false;

    // Drain energy
    if (isMoving) {
      this.energy -= ENERGY_DRAIN_MOVING * dt;
    } else {
      this.energy -= ENERGY_DRAIN_IDLE * dt;
    }
    this.energy = Math.max(0, this.energy);

    // Auto-eat carrots when idle, grounded, and energy below threshold
    if (!isMoving && isOnGround && this.energy < ENERGY_AUTO_EAT_THRESHOLD && carrotCount > 0) {
      this.autoEatTimer += delta;
      if (this.autoEatTimer >= ENERGY_AUTO_EAT_INTERVAL) {
        this.autoEatTimer = 0;
        this.energy = Math.min(ENERGY_MAX, this.energy + ENERGY_RESTORE);
        consumed = true;
        this.scene.events.emit('energy-changed', this.energy);
      }
    } else {
      this.autoEatTimer = 0;
    }

    // Emit energy update
    this.scene.events.emit('energy-changed', this.energy);

    // Game over check
    const gameOver = this.energy <= 0 && carrotCount <= 0;

    return { consumed, gameOver };
  }

  damage(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);
    this.scene.events.emit('energy-changed', this.energy);
  }

  get percent(): number {
    return this.energy / ENERGY_MAX;
  }

  reset(): void {
    this.energy = ENERGY_MAX;
    this.autoEatTimer = 0;
  }
}
