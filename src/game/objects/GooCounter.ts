
// src/game/objects/GooCounter.ts

import { Scene } from 'phaser';

export class GooCounter {
  private scene: Scene;
  private gooCount: number = 0;
  private counterContainer!: Phaser.GameObjects.Container;
  private counterText!: Phaser.GameObjects.Text;
  private jarIcon!: Phaser.GameObjects.Sprite;
  private buyNowButton!: Phaser.GameObjects.Sprite; // Add buy now button property
  private currentStoreSound?: Phaser.Sound.BaseSound; // Track current store sound

  constructor(scene: Scene) {
    this.scene = scene;
    this.loadGooCount();
    this.createCounter();
    this.createBuyNowButton(); // Create the buy now button
  }

  private loadGooCount() {
    // Load goo count from localStorage
    const saved = localStorage.getItem('goo_count');
    if (saved) {
      try {
        this.gooCount = parseInt(saved, 10) || 0;
      } catch (e) {
        this.gooCount = 0;
      }
    }
  }

  private saveGooCount() {
    try {
      localStorage.setItem('goo_count', this.gooCount.toString());
    } catch (e) {

    }
  }

  private createCounter() {
    // Create container for the counter in top-left corner
    this.counterContainer = this.scene.add.container(20, 20);
    this.counterContainer.setDepth(2000); // High depth to stay above most elements

    // Create background for the counter
    const background = this.scene.add.graphics();
    background.fillStyle(0x2c3e50, 0.9);
    background.lineStyle(2, 0x3498db, 1);
    background.fillRoundedRect(0, 0, 150, 40, 8);
    background.strokeRoundedRect(0, 0, 150, 40, 8);
    this.counterContainer.add(background);

    // Create "GOO:" text
    const gooLabel = this.scene.add.text(10, 20, 'GOO:', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    gooLabel.setOrigin(0, 0.5);
    this.counterContainer.add(gooLabel);

    // Create counter text
    this.counterText = this.scene.add.text(50, 20, this.gooCount.toString(), {
      fontSize: '16px',
      color: '#27ae60',
      fontStyle: 'bold'
    });
    this.counterText.setOrigin(0, 0.5);
    this.counterContainer.add(this.counterText);

    // Create jar icon
    this.jarIcon = this.scene.add.sprite(120, 20, 'jar_of_goo');
    this.jarIcon.setDisplaySize(24, 24);
    this.jarIcon.setOrigin(0.5);
    this.counterContainer.add(this.jarIcon);

    // Store the creation display size for animations
    const creationWidth = 24;
    const creationHeight = 24;

    // Add subtle hover animation to the jar using creation size
    this.scene.tweens.add({
      targets: this.jarIcon,
      displayWidth: creationWidth * 1.25,
      displayHeight: creationHeight * 1.25,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createBuyNowButton() {
    // Position the buy now button to the right of the goo counter box
    // Counter is at (20, 20) with width 150, so button goes at x: 20 + 150 + 10 = 180
    const buttonX = 180;
    const buttonY = 40; // Same center Y as the counter (20 + 40/2 = 40)

    // Create the buy now button sprite
    this.buyNowButton = this.scene.add.sprite(buttonX, buttonY, 'buy_now');
    this.buyNowButton.setDisplaySize(50, 50); // Scale down from 1024x1024 to 50x50
    this.buyNowButton.setOrigin(0.5);
    this.buyNowButton.setDepth(2000); // Same depth as counter to stay above most elements

    // Make the button interactive
    this.buyNowButton.setInteractive();

    // Store the current display size for hover effects
    const normalWidth = 50;
    const normalHeight = 50;
    const hoverWidth = normalWidth * 1.1; // Only 10% larger
    const hoverHeight = normalHeight * 1.1; // Only 10% larger

    // Add hover effects - scale based on display size, not original texture size
    this.buyNowButton.on('pointerover', () => {
      this.scene.tweens.add({
        targets: this.buyNowButton,
        displayWidth: hoverWidth,
        displayHeight: hoverHeight,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    this.buyNowButton.on('pointerout', () => {
      this.scene.tweens.add({
        targets: this.buyNowButton,
        displayWidth: normalWidth,
        displayHeight: normalHeight,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    // Add click handler
    this.buyNowButton.on('pointerdown', () => {
      this.handleBuyNowClick();
    });

    // Add subtle pulsing animation
    this.scene.tweens.add({
      targets: this.buyNowButton,
      alpha: 0.8,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private handleBuyNowClick() {

    
    // Pause radio if it's playing
    const gameScene = this.scene as any;
    if (gameScene.radioManager) {
      const radioManager = gameScene.radioManager;
      if (radioManager.isPowered() && radioManager.getCurrentMusic && radioManager.getCurrentMusic()) {
        const currentMusic = radioManager.getCurrentMusic();
        if (currentMusic && currentMusic.isPlaying) {
          currentMusic.pause();
          // Store reference that radio was paused by store opening
          (this as any).radioPausedByStore = true;
        }
      }
    }
    
    // Stop any currently playing store sound before creating a new one
    if (this.currentStoreSound && this.currentStoreSound.isPlaying) {
      this.currentStoreSound.stop();
    }
    
    // Play store sound when buy now button is clicked
    try {
      this.currentStoreSound = this.scene.sound.add('store', { volume: 0.7 });
      this.currentStoreSound.play();

    } catch (error) {

    }
    
    // Add visual feedback for the click
    this.scene.tweens.add({
      targets: this.buyNowButton,
      scaleX: 0.95, // Changed from 0.9 to 0.95 (only slightly smaller)
      scaleY: 0.95, // Changed from 0.9 to 0.95 (only slightly smaller)
      duration: 100,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        // Open the store instead of showing a message
        this.openStore();
      }
    })
  }

  private openStore() {
    // Get the Game scene and open the store through its StoreManager
    const gameScene = this.scene as any;
    if (gameScene.storeManager) {
      gameScene.storeManager.openStore();
    } else {

    }
  }

  public collectGoo(amount: number = 1) {
    this.gooCount += amount;
    this.updateDisplay();
    this.saveGooCount();
    this.playCollectionEffect();
  }

  private updateDisplay() {
    if (this.counterText) {
      this.counterText.setText(this.gooCount.toString());
    }
  }

  private playCollectionEffect() {
    // Flash the counter green when goo is collected
    this.scene.tweens.add({
      targets: this.counterContainer,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        // Add a subtle glow effect
        this.scene.tweens.add({
          targets: this.jarIcon,
          tint: 0x44ff44, // Green tint
          duration: 200,
          yoyo: true,
          onComplete: () => {
            this.jarIcon.setTint(0xffffff); // Reset to normal
          }
        });
      }
    });
  }

  public getGooCount(): number {
    return this.gooCount;
  }

  public setGooCount(count: number) {
    this.gooCount = Math.max(0, count);
    this.updateDisplay();
    this.saveGooCount();
  }

  public destroy() {
    if (this.counterContainer) {
      this.counterContainer.destroy();
    }
    if (this.buyNowButton) {
      this.buyNowButton.destroy();
    }
  }

  // Add method to get current store sound for external access
  public getCurrentStoreSound(): Phaser.Sound.BaseSound | undefined {
    return this.currentStoreSound;
  }

  // Add method to stop store sound
  public stopStoreSound() {
    if (this.currentStoreSound && this.currentStoreSound.isPlaying) {
      this.currentStoreSound.stop();
    }
  }

  // Add method to check if radio was paused by store
  public wasRadioPausedByStore(): boolean {
    return !!(this as any).radioPausedByStore;
  }

  // Add method to clear the radio pause flag
  public clearRadioPauseFlag() {
    (this as any).radioPausedByStore = false;
  }
}

// Global goo collection system
class GooCollectionSystem {
  private static instance: GooCollectionSystem;
  private gooCounter?: GooCounter;

  private constructor() {}

  public static getInstance(): GooCollectionSystem {
    if (!GooCollectionSystem.instance) {
      GooCollectionSystem.instance = new GooCollectionSystem();
    }
    return GooCollectionSystem.instance;
  }

  public setGooCounter(counter: GooCounter) {
    this.gooCounter = counter;
  }

  public collectGooFromSplatter() {
    if (this.gooCounter) {
      this.gooCounter.collectGoo(1);
      // Goo collected
    }
  }

  public getGooCount(): number {
    return this.gooCounter ? this.gooCounter.getGooCount() : 0;
  }
}

// Export the function to be called when cleaning splatters
export function collectGooFromCleaning() {
  GooCollectionSystem.getInstance().collectGooFromSplatter();
}

// Export the system for initialization
export { GooCollectionSystem };
