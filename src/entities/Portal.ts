import Phaser from 'phaser';

export class Portal extends Phaser.Physics.Arcade.Sprite {
  private glowTween?: Phaser.Tweens.Tween;
  private gemsRequired: number;
  private gemsDeposited = 0;
  private needText!: Phaser.GameObjects.Text;
  private readonly baseScaleX: number;
  private readonly baseScaleY: number;
  public activated = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gemsRequired: number) {
    super(scene, x, y, 'portal');
    this.gemsRequired = gemsRequired;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.setDisplaySize(64, 80);
    this.baseScaleX = this.scaleX;
    this.baseScaleY = this.scaleY;

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(60, 80);

    // Start grayed out
    this.setTint(0x666666);
    this.setAlpha(0.6);

    // "N more" text above portal
    this.needText = scene.add.text(x, y - 55, `${gemsRequired} more`, {
      fontSize: '14px',
      color: '#A29BFE',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtle pulse when inactive
    this.glowTween = scene.tweens.add({
      targets: this,
      alpha: { from: 0.4, to: 0.7 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onGemDeposited(): void {
    this.gemsDeposited++;
    const remaining = this.gemsRequired - this.gemsDeposited;
    this.needText.setText(remaining > 0 ? `${remaining} more` : '');

    // Pulse on deposit
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScaleX * 1.1,
      scaleY: this.baseScaleY * 1.1,
      duration: 100,
      yoyo: true,
    });

    // Gradually brighten as gems are deposited
    const progress = this.gemsDeposited / this.gemsRequired;
    const tintValue = Math.floor(0x66 + (0xFF - 0x66) * progress);
    this.setTint(Phaser.Display.Color.GetColor(tintValue, tintValue, tintValue));
    this.setAlpha(0.6 + 0.4 * progress);
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;

    // Stop gray pulse
    this.glowTween?.stop();

    // Full color
    this.clearTint();
    this.setAlpha(1);

    // Destroy the "N more" text
    this.needText.destroy();

    // Energetic scale breathing
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: this.baseScaleX, to: this.baseScaleX * 1.15 },
      scaleY: { from: this.baseScaleY, to: this.baseScaleY * 1.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // "Portal Charged!" text
    const text = this.scene.add.text(this.x, this.y - 60, 'Portal Charged!', {
      fontSize: '16px',
      color: '#8BE8CB',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy(),
    });
  }

  get isFullyCharged(): boolean {
    return this.gemsDeposited >= this.gemsRequired;
  }

  get gemsStillNeeded(): number {
    return Math.max(0, this.gemsRequired - this.gemsDeposited);
  }
}
