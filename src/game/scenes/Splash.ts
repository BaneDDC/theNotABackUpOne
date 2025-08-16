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

    // Wait 5 seconds then transition to main menu
    this.time.delayedCall(5000, () => {
      this.scene.start('MainMenu');
    });
  }
}
