// src/game/scenes/Splash.ts

import { Scene } from "phaser";

export class Splash extends Scene {
  constructor() {
    super("Splash");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create black background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000);

    // Add flytoxic image centered
    const flytoxicImage = this.add.image(centerX, centerY, 'flytoxic');
    flytoxicImage.setDisplaySize(300, 300); // Keep square aspect ratio for 1024x1024 image

    // Add spinning animation (1 full rotation)
    this.tweens.add({
      targets: flytoxicImage,
      angle: 360,
      duration: 1000, // Complete rotation in 1 second
      ease: 'Linear'
    });

    // Add waffle image in bottom right corner
    const waffleImage = this.add.image(this.scale.width - 100, this.scale.height - 70, 'waffle');
    waffleImage.setDisplaySize(40, 40); // Scale down from 1024x1024 to 40x40 for very small corner placement
    waffleImage.setDepth(1000); // Ensure it's above the background
    
    // Add very subtle heartbeat animation to waffle image
    this.tweens.add({
      targets: waffleImage,
      displayWidth: 42,
      displayHeight: 42,
      duration: 1000,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });
    
    // Make waffle image interactive and clickable
    waffleImage.setInteractive();
    waffleImage.on('pointerdown', () => {
      window.open('https://waffle.ai/', '_blank');
    });
    
    // Add text below the waffle image
    const waffleText = this.add.text(this.scale.width - 100, this.scale.height - 20, 'Created With Waffle.ai\nClick to start Creating', {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center'
    });
    waffleText.setOrigin(0.5);
    waffleText.setDepth(1000);

    // Make the entire scene clickable to skip
    this.input.on('pointerdown', () => {
      this.scene.start('AuthScene');
    });
    
    // Wait 7 seconds then transition to auth scene (unless clicked)
    this.time.delayedCall(7000, () => {
      this.scene.start('AuthScene');
    });
  }
}
