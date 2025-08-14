
// src/game/objects/HintButton.ts

import { Scene } from "phaser";
import { getMergeResult, getTier1Partners, pickRandomTier1, SPAWNABLE_TIER1, isTier1 } from "../config/mergeDataFull";

export class HintButton {
  private scene: Scene;
  private button!: Phaser.GameObjects.Container;
  private buttonBg!: Phaser.GameObjects.Graphics;
  private buttonText!: Phaser.GameObjects.Text;
  private chargeIndicators: Phaser.GameObjects.Graphics[] = [];
  private charges: number = 3;
  private maxCharges: number = 3;
  private rechargeTimer!: Phaser.Time.TimerEvent;
  private hintPopup?: Phaser.GameObjects.Container;
  private isShowingHint: boolean = false;
  private hintSounds: Phaser.Sound.BaseSound[] = [];
  private currentHintSoundIndex: number = 0;
  private tutorialSounds: { [key: string]: Phaser.Sound.BaseSound } = {};
  private currentTutorialSound?: Phaser.Sound.BaseSound;

  constructor(scene: Scene) {
    this.scene = scene;
    this.loadHintAsset();
    this.createButton();
    this.startRechargeTimer();
    this.initializeHintSounds();
    this.initializeTutorialSounds();
    this.setupTutorialEventListeners();
  }

  private loadHintAsset() {
    // Load the MR. HINT asset
    if (!this.scene.textures.exists('mr_hint_asset')) {
      this.scene.load.image('mr_hint_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20rick%20and%20morty%20style%20%22MR-pBpl6TprHz9Z4lklHW9MurWgPYZnPR.%20HINT%22%20a%20button%20for%20giving%20hints%2C%20no%20shadows%20no%20background-2');
      
      // Start loading if not already in progress
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    }
  }

  private createButton() {
    // Create container for the hint button
    this.button = this.scene.add.container(100, 100);
    this.button.setDepth(1500); // High depth to stay visible

    // Create button background
    this.buttonBg = this.scene.add.graphics();
    this.updateButtonAppearance();
    this.button.add(this.buttonBg);

    // Create button sprite instead of text
    if (this.scene.textures.exists('mr_hint_asset')) {
      this.buttonText = this.scene.add.sprite(0, -5, 'mr_hint_asset') as any;
      (this.buttonText as any).setScale(0.08); // Increased from 0.05 to 0.08 since filtering will make it clearer
    } else {
      // Fallback to emoji if asset isn't loaded yet
      this.buttonText = this.scene.add.text(0, -5, "💡", {
        fontSize: "24px",
        color: "#ffffff"
      });
      this.buttonText.setOrigin(0.5);
      
      // Try to replace with sprite once asset loads
      this.scene.load.once('complete', () => {
        if (this.scene.textures.exists('mr_hint_asset')) {
          this.buttonText.destroy();
          this.buttonText = this.scene.add.sprite(0, -5, 'mr_hint_asset') as any;
          (this.buttonText as any).setScale(0.08); // Also increased here
          this.button.add(this.buttonText);
        }
      });
    }
    
    this.button.add(this.buttonText);

    // Create charge indicators (3 small circles below the button)
    for (let i = 0; i < this.maxCharges; i++) {
      const indicator = this.scene.add.graphics();
      indicator.setPosition(-20 + (i * 20), 49); // Moved from 65 to 49 to be closer to smaller button
      this.chargeIndicators.push(indicator);
      this.button.add(indicator);
    }

    this.updateChargeIndicators();

    // Make button interactive
    this.buttonBg.setInteractive(new Phaser.Geom.Circle(0, 0, 34), Phaser.Geom.Circle.Contains); // Reduced from 45 to 34
    this.buttonBg.on('pointerdown', () => this.onButtonClick());
    this.buttonBg.on('pointerover', () => this.onButtonHover());
    this.buttonBg.on('pointerout', () => this.onButtonOut());
  }

  private updateButtonAppearance() {
    this.buttonBg.clear();
    
    if (this.charges > 0) {
      // Active button - bright blue
      this.buttonBg.fillStyle(0x3498db, 0.9);
      this.buttonBg.lineStyle(3, 0x2980b9);
    } else {
      // Disabled button - gray
      this.buttonBg.fillStyle(0x7f8c8d, 0.6);
      this.buttonBg.lineStyle(2, 0x95a5a6);
    }
    
    this.buttonBg.fillCircle(0, 0, 34); // Reduced from 45 to 34 (25% smaller: 45 * 0.75 = 33.75, rounded to 34)
    this.buttonBg.strokeCircle(0, 0, 34); // Reduced from 45 to 34
  }

  private updateChargeIndicators() {
    this.chargeIndicators.forEach((indicator, index) => {
      indicator.clear();
      
      if (index < this.charges) {
        // Filled charge - bright green
        indicator.fillStyle(0x27ae60);
        indicator.fillCircle(0, 0, 6);
      } else {
        // Empty charge - dark gray outline
        indicator.lineStyle(2, 0x34495e);
        indicator.strokeCircle(0, 0, 6);
      }
    });
  }

  private onButtonClick() {
    if (this.charges <= 0) {
      this.showNoChargesMessage();
      return;
    }

    // Use a charge and show hint
    this.charges--;
    this.updateButtonAppearance();
    this.updateChargeIndicators();
    
    // Play hint sound
    this.playHintSound();
    
    this.showHint();
  }

  private onButtonHover() {
    if (this.charges > 0) {
      this.buttonBg.clear();
      this.buttonBg.fillStyle(0x5dade2, 1.0); // Lighter blue on hover
      this.buttonBg.lineStyle(3, 0x3742fa);
      this.buttonBg.fillCircle(0, 0, 34); // Reduced from 45 to 34
      this.buttonBg.strokeCircle(0, 0, 34); // Reduced from 45 to 34
    }
  }

  private onButtonOut() {
    this.updateButtonAppearance();
  }

  private showNoChargesMessage() {
    // Show temporary message that no charges are available
    const message = this.scene.add.text(this.button.x, this.button.y - 60, "No hints available!\nWait for recharge...", {
      fontSize: "14px",
      color: "#e74c3c",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
      align: "center"
    });
    message.setOrigin(0.5);
    message.setDepth(2000);

    // Remove message after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      message.destroy();
    });
  }

  private showHint() {
    if (this.isShowingHint) return;

    this.isShowingHint = true;
    const hint = this.generateHint();

    // Create hint popup container
    this.hintPopup = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
    this.hintPopup.setDepth(2500);

    // Create popup background
    const popupBg = this.scene.add.graphics();
    popupBg.fillStyle(0x2c3e50, 0.95);
    popupBg.lineStyle(3, 0x3498db);
    popupBg.fillRoundedRect(-200, -80, 400, 160, 10);
    popupBg.strokeRoundedRect(-200, -80, 400, 160, 10);
    this.hintPopup.add(popupBg);

    // Create hint title
    const title = this.scene.add.text(0, -50, "💡 HINT", {
      fontSize: "20px",
      color: "#f1c40f",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    this.hintPopup.add(title);

    // Create hint text
    const hintText = this.scene.add.text(0, -10, hint, {
      fontSize: "14px",
      color: "#ecf0f1",
      wordWrap: { width: 360 },
      align: "center"
    });
    hintText.setOrigin(0.5);
    this.hintPopup.add(hintText);

    // Create close button
    const closeButton = this.scene.add.text(0, 40, "Click anywhere to close", {
      fontSize: "12px",
      color: "#95a5a6",
      fontStyle: "italic"
    });
    closeButton.setOrigin(0.5);
    this.hintPopup.add(closeButton);

    // Make popup clickable to close - fix the interactive area
    popupBg.setInteractive(new Phaser.Geom.Rectangle(-200, -80, 400, 160), Phaser.Geom.Rectangle.Contains);
    popupBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation(); // Prevent event bubbling
      this.closeHint();
    });

    // Also add a global click handler to close when clicking outside
    const globalClickHandler = (pointer: Phaser.Input.Pointer) => {
      // Check if click is outside the popup area
      const popupBounds = new Phaser.Geom.Rectangle(
        this.hintPopup!.x - 200,
        this.hintPopup!.y - 80,
        400,
        160
      );
      
      if (!Phaser.Geom.Rectangle.Contains(popupBounds, pointer.x, pointer.y)) {
        this.closeHint();
      }
    };

    // Add the global handler with a slight delay to prevent immediate closure
    this.scene.time.delayedCall(100, () => {
      this.scene.input.on('pointerdown', globalClickHandler);
      
      // Store reference to remove later
      (this.hintPopup as any).globalClickHandler = globalClickHandler;
    });

    // Auto-close after 8 seconds
    this.scene.time.delayedCall(8000, () => {
      if (this.hintPopup) {
        this.closeHint();
      }
    });

    // Add entrance animation
    this.hintPopup.setScale(0);
    this.scene.tweens.add({
      targets: this.hintPopup,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private closeHint() {
    if (!this.hintPopup) return;

    // Remove global click handler if it exists
    if ((this.hintPopup as any).globalClickHandler) {
      this.scene.input.off('pointerdown', (this.hintPopup as any).globalClickHandler);
    }

    // Exit animation
    this.scene.tweens.add({
      targets: this.hintPopup,
      scaleX: 0,
      scaleY: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (this.hintPopup) {
          this.hintPopup.destroy();
          this.hintPopup = undefined;
        }
        this.isShowingHint = false;
      }
    });
  }

  private generateHint(): string {
    // Get all current items on the field
    const currentItems = this.getCurrentItems();
    
    if (currentItems.length === 0) {
      return "The field is empty! Wait for items to spawn from the portal, or click the towel to get a tier 1 item.";
    }

    // Check for possible merges
    const possibleMerges = this.findPossibleMerges(currentItems);
    
    if (possibleMerges.length > 0) {
      const merge = possibleMerges[0];
      return `Try merging "${merge.itemA}" + "${merge.itemB}" to create "${merge.result}"!`;
    }

    // Check if toilet is clogged
    const gameScene = this.scene as any;
    if (gameScene.FlushCount && gameScene.FlushCount >= 4) {
      return "The toilet is clogged! Click the plunger near the toilet to unclog it and get more items.";
    }

    // Check for tier 1 items and suggest compatible partners
    const tier1Items = currentItems.filter(item => isTier1(item));
    if (tier1Items.length > 0) {
      const item = tier1Items[0];
      const partners = getTier1Partners(item);
      if (partners.length > 0) {
        const partner = partners[0];
        return `You have "${item}". Try to get "${partner}" to merge with it! Click the towel if you need more tier 1 items.`;
      }
    }

    // Check if there are too many items without merges
    if (currentItems.length >= 6) {
      return "You have many items but no valid merges. Try dropping some items in the toilet to clear space, then get new items from the towel.";
    }

    // Default helpful tips
    const tips = [
      "Drop items into the toilet to merge them, or click the towel to get tier 1 items when the toilet is clean.",
      "Items from the same tier can often be merged together. Look for patterns!",
      "If you're stuck, try clearing some items by dropping them in the toilet, then get fresh items.",
      "The portal spawns new items regularly. Wait a moment for new opportunities!",
      "Check the recipe book (Ctrl+Shift+I) to see all possible merges."
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  private getCurrentItems(): string[] {
    const items: string[] = [];
    
    // Get all items from the scene that have itemName property
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName) {
        items.push((child as any).itemName);
      }
    });
    
    return items;
  }

  private findPossibleMerges(items: string[]): Array<{itemA: string, itemB: string, result: string}> {
    const merges: Array<{itemA: string, itemB: string, result: string}> = [];
    
    // Check all pairs of items
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const result = getMergeResult(items[i], items[j]);
        if (result) {
          merges.push({
            itemA: items[i],
            itemB: items[j],
            result: result
          });
        }
      }
    }
    
    return merges;
  }

  private startRechargeTimer() {
    // Create timer that adds 1 charge every minute (60000ms)
    this.rechargeTimer = this.scene.time.addEvent({
      delay: 60000, // 1 minute
      callback: () => this.rechargeHint(),
      loop: true
    });
  }

  private rechargeHint() {
    if (this.charges < this.maxCharges) {
      this.charges++;
      this.updateButtonAppearance();
      this.updateChargeIndicators();
      
      // Show brief recharge notification
      const notification = this.scene.add.text(this.button.x, this.button.y - 50, "+1 Hint!", {
        fontSize: "12px",
        color: "#27ae60",
        backgroundColor: "#000000",
        padding: { x: 6, y: 3 }
      });
      notification.setOrigin(0.5);
      notification.setDepth(2000);

      // Animate and remove notification
      this.scene.tweens.add({
        targets: notification,
        y: notification.y - 20,
        alpha: 0,
        duration: 1500,
        ease: 'Power2.easeOut',
        onComplete: () => notification.destroy()
      });
    }
  }

  private initializeHintSounds() {
    // Initialize the hint sounds array with all available hint sounds
    const hintSoundKeys = ['yikes', 'terrible', 'sureabout', 'embarass', 'seriously']
    
    hintSoundKeys.forEach(soundKey => {
      const sound = this.scene.sound.add(soundKey, { volume: 0.7 })
      this.hintSounds.push(sound)
    })

    // Also listen for tutorial sounds and shake when they play
    this.setupTutorialSoundListeners();
  }

  private initializeTutorialSounds() {
    // Initialize all tutorial sounds including return sound
    const tutorialSoundKeys = ['howdy', 'batery', 'flush', 'down', 'here', 'return']
    
    tutorialSoundKeys.forEach(soundKey => {
      try {
        const sound = this.scene.sound.add(soundKey, { volume: 0.8 })
        this.tutorialSounds[soundKey] = sound
      } catch (error) {

      }
    })
  }

  private setupTutorialEventListeners() {
    // Listen for first box opening event
    this.scene.events.on('tutorial:firstBoxOpened', () => {
      // Only play tutorial sounds if tutorial is not completed
      if (!this.isTutorialCompleted()) {
        this.playTutorialSound('howdy')
        
        // Play "batery" sound after 3 seconds
        this.scene.time.delayedCall(3000, () => {
          this.playTutorialSound('batery')
        })
      }
    })

    // Listen for tutorial merge completion (when toilet is flushed with tutorial items)
    this.scene.events.on('tutorial:mergeFlush', () => {
      // Only play tutorial sounds if tutorial is not completed
      if (!this.isTutorialCompleted()) {
        this.playTutorialSound('flush')
      }
    })

    // Listen for tutorial merge result (when items are actually merged)
    this.scene.events.on('tutorial:mergeComplete', () => {
      // Only play tutorial sounds if tutorial is not completed
      if (!this.isTutorialCompleted()) {
        this.playTutorialSound('down')
        
        // Play "here" sound 2 seconds after the down sound starts
        this.scene.time.delayedCall(2000, () => {
          this.playTutorialSound('here')
        })
      }
    })

    // Listen for saved game return event
    this.scene.events.on('game:savedGameLoaded', () => {
      // Play return sound when returning to a saved game
      this.playTutorialSound('return')
    })
  }

  private isTutorialCompleted(): boolean {
    try {
      const savedState = localStorage.getItem('toilet_merge_game_state');
      if (!savedState) {
        return false; // No save data means tutorial not completed
      }

      const gameState = JSON.parse(savedState);
      return gameState.tutorialCompleted === true;
    } catch (error) {

      return false; // Default to tutorial not completed if we can't read the save
    }
  }

  private playTutorialSound(soundKey: string) {
    // Stop any currently playing tutorial sound
    if (this.currentTutorialSound && this.currentTutorialSound.isPlaying) {
      this.currentTutorialSound.stop()
    }

    // Play the new tutorial sound
    const sound = this.tutorialSounds[soundKey]
    if (sound) {
      sound.play()
      this.currentTutorialSound = sound
      
      // Start shaking animation for the duration of the sound
      this.startHintShakeAnimation(sound)
    } else {

    }
  }

  private setupTutorialSoundListeners() {
    // Listen for tutorial sounds being played and trigger shake animation
    const tutorialSounds = ['howdy', 'flush', 'batery', 'here', 'down'];
    
    // Set up listeners for when these sounds are played - use a more direct approach
    tutorialSounds.forEach(soundKey => {
      // Listen for when these specific sounds are played anywhere in the scene
      this.scene.events.on(`sound:${soundKey}`, () => {
        // Create the actual sound to get its real duration
        const actualSound = this.scene.sound.add(soundKey, { volume: 0 }); // Volume 0 so we don't hear it
        this.startHintShakeAnimation(actualSound);
        
        // Clean up the temporary sound after getting duration
        this.scene.time.delayedCall(100, () => {
          actualSound.destroy();
        });
      });
    });

    // Also try the original method as backup
    this.scene.sound.on('play', (sound: Phaser.Sound.BaseSound) => {
      if (tutorialSounds.includes(sound.key)) {
        this.startHintShakeAnimation(sound);
      }
    });
  }

  private playHintSound() {
    if (this.hintSounds.length === 0) return;
    
    // Get the current sound to play
    const currentSound = this.hintSounds[this.currentHintSoundIndex];
    
    // Play the current hint sound
    currentSound.play();
    
    // Start shaking animation for the duration of the sound
    this.startHintShakeAnimation(currentSound);
    
    // Move to next sound for variety (cycle through all sounds)
    this.currentHintSoundIndex = (this.currentHintSoundIndex + 1) % this.hintSounds.length;
  }

  private startHintShakeAnimation(sound: Phaser.Sound.BaseSound) {
    // Only shake if we have the Mr. Hint sprite (not the emoji fallback)
    if (!this.buttonText || !(this.buttonText as any).setScale) return;
    
    // Get the duration of the sound in milliseconds
    const soundDuration = sound.totalDuration * 1000;
    
    // Store original position
    const originalX = this.buttonText.x;
    const originalY = this.buttonText.y;
    
    // Shake parameters
    const shakeIntensity = 2; // Small shake (2 pixels)
    const shakeInterval = 50; // Update every 50ms for smooth shake
    const totalShakes = Math.floor(soundDuration / shakeInterval);
    
    let shakeCount = 0;
    
    // Create shake timer
    const shakeTimer = this.scene.time.addEvent({
      delay: shakeInterval,
      callback: () => {
        if (shakeCount >= totalShakes) {
          // Stop shaking and reset position
          shakeTimer.destroy();
          this.buttonText.setPosition(originalX, originalY);
          return;
        }
        
        // Apply random shake offset
        const shakeX = originalX + Phaser.Math.Between(-shakeIntensity, shakeIntensity);
        const shakeY = originalY + Phaser.Math.Between(-shakeIntensity, shakeIntensity);
        this.buttonText.setPosition(shakeX, shakeY);
        
        shakeCount++;
      },
      repeat: totalShakes - 1
    });
    
    // Fallback: ensure we reset position after sound duration + small buffer
    this.scene.time.delayedCall(soundDuration + 100, () => {
      if (shakeTimer && !shakeTimer.hasDispatched) {
        shakeTimer.destroy();
      }
      this.buttonText.setPosition(originalX, originalY);
    });
  }

  public setPosition(x: number, y: number) {
    this.button.setPosition(x, y);
  }

  public destroy() {
    if (this.rechargeTimer) {
      this.rechargeTimer.destroy()
    }
    if (this.hintPopup) {
      this.hintPopup.destroy()
    }
    if (this.button) {
      this.button.destroy()
    }
    
    // Clean up hint sounds
    this.hintSounds.forEach(sound => {
      if (sound) {
        sound.destroy()
      }
    })
    this.hintSounds = []

    // Clean up tutorial sounds
    Object.values(this.tutorialSounds).forEach(sound => {
      if (sound) {
        sound.destroy()
      }
    })
    this.tutorialSounds = {}
    this.currentTutorialSound = undefined
  }
}
