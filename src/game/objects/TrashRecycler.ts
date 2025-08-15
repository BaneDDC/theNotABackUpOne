
import { Scene } from 'phaser';
import { ItemManager } from './mergeCore';

type LabeledRect = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  itemName?: string;
  __originalScaleX?: number;
  __originalScaleY?: number;
};

export class TrashRecycler {
  private zone: Phaser.GameObjects.Zone;
  private viz: Phaser.GameObjects.Rectangle;
  private waiting: LabeledRect[] = [];
  private recyclerSprite: Phaser.GameObjects.Sprite;
  private recyclingTimer?: Phaser.Time.TimerEvent; // Timer for recycling animation
  private isAnimating: boolean = false; // Track if we're currently animating
  private audioContext: AudioContext | null = null; // For generating beep sounds

  constructor(
    private scene: Scene,
    private items: ItemManager,
    recyclerSprite: Phaser.GameObjects.Sprite
  ) {
    this.recyclerSprite = recyclerSprite;
    
    // Create drop zone on the right side middle of the recycler
    const zoneX = recyclerSprite.x + 60; // Offset to right side
    const zoneY = recyclerSprite.y; // Same Y as recycler center
    const zoneWidth = 80;
    const zoneHeight = 80;
    
    this.zone = this.scene.add.zone(zoneX, zoneY, zoneWidth, zoneHeight);
    this.scene.physics.add.existing(this.zone, true);

    // Create invisible visualization (for debugging, set alpha to 0.1 to see it)
    this.viz = this.scene.add
      .rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0xff6b6b, 0) // Red color, invisible
      .setStrokeStyle(0, 0xff6b6b); // No border

    // Accept drops that end inside the zone
    this.scene.input.on('dragend', (_: any, obj: any) => {
      if (!obj?.itemName) return;
      const b = this.viz.getBounds();
      if (Phaser.Geom.Rectangle.Contains(b, obj.x, obj.y)) {
        this.accept(obj);
      } else {
        // Check if item was previously in recycler and is now being dragged out
        this.checkItemRemoval(obj);
      }
    });
  }

  private accept(obj: LabeledRect) {
    // Don't accept items if recycler hasn't been purchased (not visible)
    if (!this.recyclerSprite.visible) {
      return;
    }
    
    if (this.waiting.includes(obj)) return;
    
    // Check if recycler is already at capacity (2 items max)
    if (this.waiting.length >= 2) {
      // Recycler is full - make item fall to ground
      this.makeItemFallToGround(obj);
      return;
    }
    
    // Position item further to the left from zone center
    const snapX = this.zone.x - 15; // 15 pixels left of zone center
    const snapY = this.zone.y; // Use zone center directly
    
    // IMPORTANT: Disable physics body to prevent falling
    const body = obj.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(false); // Disable physics so item doesn't fall
    }
    
    // Animate item to snap position
    this.scene.tweens.add({
      targets: obj,
      x: snapX,
      y: snapY,
      duration: 200,
      ease: 'Power2.easeOut'
    });

    // Store original scale values before making smaller
    (obj as any).__originalScaleX = obj.scaleX;
    (obj as any).__originalScaleY = obj.scaleY;
    
    // Make item smaller when placed in recycler
    this.scene.tweens.add({
      targets: obj,
      scaleX: obj.scaleX * 0.6,
      scaleY: obj.scaleY * 0.6,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    this.waiting.push(obj);
    
    // Add recycler feedback animation
    this.scene.tweens.add({
      targets: this.recyclerSprite,
      scaleX: this.recyclerSprite.scaleX * 1.05,
      scaleY: this.recyclerSprite.scaleY * 1.05,
      duration: 150,
      yoyo: true,
      ease: 'Power2.easeOut'
    });

    // Check if we should start recycling animation
    this.checkRecyclingAnimation();
  }

  private checkItemRemoval(obj: LabeledRect) {
    // Check if this item was in the waiting list (meaning it was in the recycler)
    const index = this.waiting.indexOf(obj);
    if (index !== -1) {
      // Remove item from waiting list
      this.waiting.splice(index, 1);
      
      // Re-enable physics body when item is removed
      const body = obj.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setEnable(true); // Re-enable physics so item can move normally
      }
      
      // Restore original size if we stored it
      if ((obj as any).__originalScaleX && (obj as any).__originalScaleY) {
        this.scene.tweens.add({
          targets: obj,
          scaleX: (obj as any).__originalScaleX,
          scaleY: (obj as any).__originalScaleY,
          duration: 300,
          ease: 'Power2.easeOut'
        });
        
        // Clean up stored values
        delete (obj as any).__originalScaleX;
        delete (obj as any).__originalScaleY;
      }

      // Check if we should stop recycling animation
      this.checkRecyclingAnimation();
    }
  }

  private checkRecyclingAnimation() {
    // Don't start recycling animation if recycler hasn't been purchased
    if (!this.recyclerSprite.visible) {
      return;
    }
    
    if (this.waiting.length === 2 && !this.isAnimating) {
      // Start recycling animation when we have exactly 2 items
      this.startRecyclingAnimation();
    } else if (this.waiting.length < 2 && this.isAnimating) {
      // Stop animation when we have less than 2 items
      this.stopRecyclingAnimation();
    }
  }

  private startRecyclingAnimation() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    let useRecycler3 = false; // Start with default texture
    
    // Create timer that alternates textures every second
    this.recyclingTimer = this.scene.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        if (this.waiting.length >= 2) {
          // Alternate between textures
          useRecycler3 = !useRecycler3;
          const textureKey = useRecycler3 ? 'recycler3' : 'trash_recycler';
          this.recyclerSprite.setTexture(textureKey);
        } else {
          // Stop animation if we no longer have 2 items
          this.stopRecyclingAnimation();
        }
      },
      loop: true
    });
  }

  private startSqueezeAnimation() {
    // Stop any existing squeeze animation
    this.stopSqueezeAnimation();
    
    // Store original scale
    const originalScaleX = this.recyclerSprite.scaleX;
    const originalScaleY = this.recyclerSprite.scaleY;
    
    // Store references for stopping
    (this as any).isSqueezeAnimating = true;
    (this as any).originalScaleX = originalScaleX;
    (this as any).originalScaleY = originalScaleY;
    
    // Create a simple alternating squeeze animation using individual tweens
    let isSqueezing = true;
    
    const performSqueeze = () => {
      if (!(this as any).isSqueezeAnimating) return;
      
      if (isSqueezing) {
        // Squeeze phase
        this.scene.tweens.add({
          targets: this.recyclerSprite,
          scaleX: originalScaleX * 0.85,
          scaleY: originalScaleY * 1.15,
          duration: 200,
          ease: 'Power2.easeInOut',
          onComplete: () => {
            if ((this as any).isSqueezeAnimating) {
              isSqueezing = false;
              performSqueeze();
            }
          }
        });
      } else {
        // Stretch phase
        this.scene.tweens.add({
          targets: this.recyclerSprite,
          scaleX: originalScaleX * 1.1,
          scaleY: originalScaleY * 0.9,
          duration: 200,
          ease: 'Power2.easeInOut',
          onComplete: () => {
            if ((this as any).isSqueezeAnimating) {
              isSqueezing = true;
              performSqueeze();
            }
          }
        });
      }
    };
    
    // Start the squeeze animation
    performSqueeze();
  }

  private stopSqueezeAnimation() {
    if ((this as any).isSqueezeAnimating) {
      (this as any).isSqueezeAnimating = false;
      
      // Reset to original scale values
      const originalScaleX = (this as any).originalScaleX || 1;
      const originalScaleY = (this as any).originalScaleY || 1;
      
      // Stop any ongoing tweens on the recycler sprite
      this.scene.tweens.killTweensOf(this.recyclerSprite);
      
      // Reset to original scale with smooth transition
      this.scene.tweens.add({
        targets: this.recyclerSprite,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        duration: 150,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Spawn goo jar AFTER squeeze animation completes
          this.spawnGooJar();
        }
      });
      
      // Clean up stored values
      delete (this as any).originalScaleX;
      delete (this as any).originalScaleY;
    }
  }

  private stopRecyclingAnimation() {
    if (!this.isAnimating) return;
    
    this.isAnimating = false;
    
    // Stop the timer
    if (this.recyclingTimer) {
      this.recyclingTimer.destroy();
      this.recyclingTimer = undefined;
    }
    
    // Reset to default texture
    this.recyclerSprite.setTexture('trash_recycler');
  }

  private makeItemFallToGround(item: LabeledRect) {
    // Calculate floor position (same as Game scene logic)
    const floorY = 473 - 18; // Floor platform top minus half item height
    
    // Don't apply physics if item is already near the floor
    if (Math.abs(item.y - floorY) < 20) {
      return;
    }
    
    // Create falling animation similar to Game scene
    const fallDuration = Math.max(300, Math.abs(item.y - floorY) * 2); // Minimum 300ms, scale with distance
    
    // Add slight horizontal drift during fall
    const horizontalDrift = Phaser.Math.Between(-20, 20);
    const targetX = Math.max(100, Math.min(1000, item.x + horizontalDrift)); // Keep within bounds
    
    // Animate fall with physics-like easing
    this.scene.tweens.add({
      targets: item,
      x: targetX,
      y: floorY,
      duration: fallDuration,
      ease: 'Power2.easeIn', // Gravity-like acceleration
      onComplete: () => {
        // Add small bounce effect when hitting floor
        this.scene.tweens.add({
          targets: item,
          y: floorY - 10, // Small bounce up
          duration: 150,
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Settle back to floor
            this.scene.tweens.add({
              targets: item,
              y: floorY,
              duration: 100,
              ease: 'Power2.easeIn'
            });
          }
        });
      }
    });
    
    // Add rotation during fall for more natural physics
    const rotationAmount = Phaser.Math.Between(90, 270);
    const rotationDirection = Phaser.Math.RND.pick([-1, 1]);
    
    this.scene.tweens.add({
      targets: item,
      angle: item.angle + (rotationAmount * rotationDirection),
      duration: fallDuration + 250, // Slightly longer than fall for natural effect
      ease: 'Power1.easeOut'
    });
  }

  public hasItems(): boolean {
    return this.waiting.length > 0;
  }

  public getItemCount(): number {
    return this.waiting.length;
  }

  public getItems(): LabeledRect[] {
    return [...this.waiting]; // Return copy to prevent external modification
  }

  public clearItems(): LabeledRect[] {
    const items = [...this.waiting];
    
    // Stop recycling animation since we're clearing items
    this.stopRecyclingAnimation();
    
    // Animate items being recycled (fade out and shrink)
    items.forEach((item, index) => {
      this.scene.tweens.add({
        targets: item,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        angle: item.angle + 180, // Spin while shrinking
        duration: 400,
        delay: index * 50, // Stagger the animations
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.items.destroy(item);
        }
      });
    });

    // Clear the waiting list
    this.waiting.length = 0;
    
    return items;
  }

  public recycleItems(): void {
    if (this.waiting.length === 0) return;

    // Launch recycling minigame instead of immediately recycling
    this.launchRecyclingMinigame();
  }

  private launchRecyclingMinigame(): void {
    // Instead of launching a separate scene, create the minigame directly in the main scene
    // This ensures it's always on top of everything
    this.createRecyclingMinigameInMainScene();
  }
  
  private createRecyclingMinigameInMainScene(): void {
    // Create a full-screen overlay container
    const overlayContainer = this.scene.add.container(0, 0);
    overlayContainer.setDepth(10000); // Very high depth to be on top
    
    // Create semi-transparent background
    const background = this.scene.add.rectangle(0, 0, 1200, 800, 0x000000, 0.7);
    background.setOrigin(0, 0);
    overlayContainer.add(background);
    
    // Create minigame elements
    const recyclerX = this.recyclerSprite.x;
    const recyclerY = this.recyclerSprite.y;
    
    // Create instructions
    const instructions = this.scene.add.text(
      recyclerX, 
      recyclerY - 220, 
      'SIMON SAYS!\nWatch the pattern and click the boxes in the same order.',
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: { x: 12, y: 8 },
        align: 'center',
        fontStyle: 'bold'
      }
    );
    instructions.setOrigin(0.5);
    overlayContainer.add(instructions);
    
    // Create Simon boxes (red, blue, green)
    const boxColors = [0xff0000, 0x0000ff, 0x00ff00]; // Red, Blue, Green
    const boxPositions = [
      { x: recyclerX - 80, y: recyclerY - 20 },
      { x: recyclerX, y: recyclerY - 20 },
      { x: recyclerX + 80, y: recyclerY - 20 }
    ];
    
    const simonBoxes: any[] = [];
    boxColors.forEach((color, index) => {
      const box = this.scene.add.rectangle(0, 0, 60, 60, color, 0.7);
      box.setStrokeStyle(3, 0xffffff);
      box.setPosition(boxPositions[index].x, boxPositions[index].y);
      
      // Store box data
      (box as any).boxIndex = index;
      (box as any).boxColor = color;
      
      // Make interactive for clicking
      box.setInteractive();
      
      simonBoxes.push(box);
      overlayContainer.add(box);
    });
    
    // Create status text
    const statusText = this.scene.add.text(
      recyclerX, 
      recyclerY + 80, 
      'Watch the pattern...',
      {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    statusText.setOrigin(0.5);
    overlayContainer.add(statusText);
    
    // Create progress text
    const progressText = this.scene.add.text(
      recyclerX, 
      recyclerY + 120, 
      'Pattern: 0/5',
      {
        fontSize: '16px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    progressText.setOrigin(0.5);
    overlayContainer.add(progressText);
    
    // Start Simon game
    this.startSimonGame(overlayContainer, simonBoxes, statusText, progressText);
    
    // Store references for cleanup
    (this as any).recyclingOverlay = overlayContainer;
    (this as any).simonBoxes = simonBoxes;
  }
  
  // Simon game functionality
  
  private startSimonGame(overlayContainer: any, simonBoxes: any[], statusText: any, progressText: any): void {
    // Initialize audio context for beep sounds
    this.initAudioContext();
    
    // Multi-stage game state
    let currentLevel = 1;
    let accumulatedRewards = 0;
    let isShowingPattern = true;
    let isPlayerTurn = false;
    
    // Store game state
    (this as any).simonCurrentLevel = currentLevel;
    (this as any).simonAccumulatedRewards = accumulatedRewards;
    (this as any).simonIsShowingPattern = isShowingPattern;
    (this as any).simonIsPlayerTurn = isPlayerTurn;
    (this as any).simonStatusText = statusText;
    (this as any).simonProgressText = progressText;
    (this as any).simonOverlayContainer = overlayContainer;
    (this as any).simonBoxes = simonBoxes;
    
    // Start with Level 1
    this.startSimonLevel(currentLevel);
    
    // Set up click handlers for the boxes
    simonBoxes.forEach((box, index) => {
      box.on('pointerdown', () => {
        if ((this as any).simonIsPlayerTurn) {
          this.handleSimonBoxClick(box, index, (this as any).simonBoxes, (this as any).simonOverlayContainer);
        }
      });
    });
  }
  
  private showSimonPattern(simonBoxes: any[], pattern: number[], currentIndex: number): void {
    if (currentIndex >= pattern.length) {
      // Pattern complete, start player turn
      (this as any).simonIsShowingPattern = false;
      (this as any).simonIsPlayerTurn = true;
      (this as any).simonPlayerStep = 0;
      (this as any).simonStatusText.setText('Your turn! Click the boxes in the same order.');
      return;
    }
    
    const boxIndex = pattern[currentIndex];
    const box = simonBoxes[boxIndex];
    
    // Light up the box
    box.setFillStyle(0xffffff, 1); // Bright white
    box.setStrokeStyle(3, 0xffff00); // Yellow border
    
    // Play the corresponding beep sound
    this.playSimonBeep(boxIndex);
    
    // After 800ms, turn off the light
    this.scene.time.delayedCall(800, () => {
      box.setFillStyle((box as any).boxColor, 0.7); // Back to original color
      box.setStrokeStyle(3, 0xffffff); // White border
      
      // Show next box in pattern after a short delay
    this.scene.time.delayedCall(200, () => {
        this.showSimonPattern(simonBoxes, pattern, currentIndex + 1);
      });
    });
  }
  
  private handleSimonBoxClick(box: any, boxIndex: number, simonBoxes: any[], overlayContainer: any): void {
    const pattern = (this as any).simonCurrentPattern;
    const playerStep = (this as any).simonPlayerStep;
    
    // Check if this is the correct box
    if (boxIndex === pattern[playerStep]) {
      // Correct! Light up the box briefly
      box.setFillStyle(0xffffff, 1);
      box.setStrokeStyle(3, 0x00ff00); // Green border for correct
      
      // Play the corresponding beep sound
      this.playSimonBeep(boxIndex);
      
      // Update progress
      (this as any).simonPlayerStep = playerStep + 1;
      const currentLevel = (this as any).simonCurrentLevel;
      (this as any).simonProgressText.setText(`Pattern: ${playerStep + 1}/${currentLevel}`);
      
      // Turn off the light after 300ms
      this.scene.time.delayedCall(300, () => {
        box.setFillStyle((box as any).boxColor, 0.7);
        box.setStrokeStyle(3, 0xffffff);
      
      // Check if pattern is complete
        if (playerStep + 1 >= pattern.length) {
          // Level success!
          this.onSimonLevelSuccess();
      }
      });
    } else {
      // Wrong box! Show error
      box.setFillStyle(0xff0000, 1); // Red for error
      box.setStrokeStyle(3, 0xff0000);
      
      // Play error beep (lower frequency for wrong clicks)
      this.playBeep(200, 300); // 200 Hz, 300ms for error
      
      // Turn off the light after 500ms
      this.scene.time.delayedCall(500, () => {
        box.setFillStyle((box as any).boxColor, 0.7);
        box.setStrokeStyle(3, 0xffffff);
        
        // Level failure
        this.onSimonLevelFailure();
      });
    }
  }
  
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  private playBeep(frequency: number, duration: number = 200): void {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended (needed for browser autoplay policies)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Create oscillator for the beep
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Connect oscillator to gain node, then to output
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Set up the sound
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine'; // Clean sine wave
    
    // Set volume envelope (fade in/out to avoid clicks)
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    // Start and stop the oscillator
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }
  
  private playSimonBeep(boxIndex: number): void {
    let frequency: number;
    switch (boxIndex) {
      case 0: // Red box - high beep
        frequency = 800; // 800 Hz
        break;
      case 1: // Blue box - mid beep
        frequency = 600; // 600 Hz
        break;
      case 2: // Green box - low beep
        frequency = 400; // 400 Hz
        break;
      default:
        return;
    }
    
    this.playBeep(frequency, 200); // 200ms duration
  }
  
  private startSimonLevel(level: number): void {
    // Generate pattern for current level (1-5 beeps)
    const pattern: number[] = [];
    for (let i = 0; i < level; i++) {
      pattern.push(Phaser.Math.Between(0, 2)); // 0, 1, or 2 for the three boxes
    }
    
    // Update UI
    (this as any).simonStatusText.setText(`Level ${level} - Watch the pattern...`);
    (this as any).simonProgressText.setText(`Rewards: ${(this as any).simonAccumulatedRewards} goo jars`);
    
    // Store current level pattern
    (this as any).simonCurrentPattern = pattern;
    (this as any).simonPlayerStep = 0;
    (this as any).simonIsShowingPattern = true;
    (this as any).simonIsPlayerTurn = false;
    
    // Start showing the pattern
    this.showSimonPattern((this as any).simonBoxes, pattern, 0);
  }
  
  private onSimonLevelSuccess(): void {
    const currentLevel = (this as any).simonCurrentLevel;
    (this as any).simonAccumulatedRewards += 1;
    
    // Show success message
    (this as any).simonStatusText.setText(`Level ${currentLevel} Complete! +1 goo jar`);
    
    // Check if we've completed all 5 levels
    if (currentLevel >= 5) {
      // All levels complete!
      this.scene.time.delayedCall(1500, () => {
        (this as any).simonStatusText.setText(`ALL LEVELS COMPLETE! ${(this as any).simonAccumulatedRewards} goo jars earned!`);
        this.scene.time.delayedCall(2000, () => {
          this.endRecyclingMinigame((this as any).simonOverlayContainer, true);
        });
      });
    } else {
      // Advance to next level
      this.scene.time.delayedCall(1500, () => {
        (this as any).simonCurrentLevel = currentLevel + 1;
        this.startSimonLevel(currentLevel + 1);
      });
    }
  }
  
  private onSimonLevelFailure(): void {
    const currentLevel = (this as any).simonCurrentLevel;
    const accumulatedRewards = (this as any).simonAccumulatedRewards;
    
    if (currentLevel === 1) {
      // Level 1 failure = 0 rewards
      (this as any).simonStatusText.setText('Level 1 Failed! No goo jars earned.');
      this.scene.time.delayedCall(2000, () => {
        this.endRecyclingMinigame((this as any).simonOverlayContainer, false);
      });
    } else {
      // Higher level failure = keep accumulated rewards
      (this as any).simonStatusText.setText(`Level ${currentLevel} Failed! ${accumulatedRewards} goo jars earned.`);
      this.scene.time.delayedCall(2000, () => {
        this.endRecyclingMinigame((this as any).simonOverlayContainer, true);
      });
    }
  }
  
  private endRecyclingMinigame(overlayContainer: any, success: boolean): void {
    // Stop timer
    if ((this as any).recyclingTimer) {
      (this as any).recyclingTimer.destroy();
    }
    
    // Show result message
    const message = this.scene.add.text(
      overlayContainer.x + 600, 
      overlayContainer.y + 400, 
      success ? 'RECYCLING COMPLETE!' : 'TIME\'S UP!',
      {
        fontSize: '24px',
        color: success ? '#27ae60' : '#e74c3c',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: { x: 12, y: 8 },
        fontStyle: 'bold'
      }
    );
    message.setOrigin(0.5);
    message.setDepth(10001);
    
    // Wait then close
    this.scene.time.delayedCall(2000, () => {
      overlayContainer.destroy();
      message.destroy();
      
      if (success) {
        this.proceedWithRecycling();
      } else {
        this.returnItemsToRecycler();
      }
    });
  }

  private proceedWithRecycling(): void {
    // Clear all items with animation
    this.clearItems();

    // Get the number of goo jars earned from the Simon game
    const gooJarsEarned = (this as any).simonAccumulatedRewards || 1;
    
    // Store the number of goo jars to spawn
    (this as any).gooJarsToSpawn = gooJarsEarned;

    // Start squeeze animation with audio, which will spawn the goo jars
    this.startSqueezeAnimationWithAudio();
  }
  
  private startSqueezeAnimationWithAudio(): void {
    // Play the recycler sound
    const recSound = this.scene.sound.add('recsound', { volume: 0.2 });
    recSound.play();
    
    // Start the squeeze animation
    this.startSqueezeAnimation();
    
    // Calculate when to stop animation (0.5 seconds before sound completes)
    const soundDuration = recSound.totalDuration * 1000; // Convert to milliseconds
    const stopAnimationDelay = Math.max(100, soundDuration - 500); // Stop 0.5 seconds early, minimum 100ms
    
    // Stop squeeze animation before sound completes
    this.scene.time.delayedCall(stopAnimationDelay, () => {
      this.stopSqueezeAnimation();
    });
  }

  private returnItemsToRecycler(): void {
    // Items are already in the recycler, just make sure they're visible
    this.waiting.forEach(item => {
      if (item.visible === false) {
        item.setVisible(true);
      }
    });
    
    // Show message that items are still available
    this.showMessage('Items returned to recycler. Try the minigame again!');
  }
  
  private shuffleArray<T>(array: T[]): void {
    // Fisher-Yates shuffle algorithm for randomizing item positions
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private showMessage(text: string): void {
    const message = this.scene.add.text(
      this.recyclerSprite.x,
      this.recyclerSprite.y - 60,
      text,
      {
        fontSize: '16px',
        color: '#f39c12',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    message.setOrigin(0.5);
    message.setDepth(2000);

    this.scene.tweens.add({
      targets: message,
      y: message.y - 20,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => message.destroy()
    });
  }

  private spawnGooJar() {
    // Get the number of goo jars to spawn
    const gooJarsToSpawn = (this as any).gooJarsToSpawn || 1;
    
    // Spawn multiple goo jars with slight delays
    for (let i = 0; i < gooJarsToSpawn; i++) {
      this.scene.time.delayedCall(i * 200, () => { // 200ms delay between each jar
        this.spawnSingleGooJar();
      });
    }
  }
  
  private spawnSingleGooJar() {
    // Calculate spawn position - left side middle of the recycler
    const spawnX = this.recyclerSprite.x - 90; // 90 pixels to the left of recycler center
    const spawnY = this.recyclerSprite.y; // Same Y as recycler center
    
    // Get the merge system to spawn the jar
    const merge = (this.scene as any).getMergeSystem ? (this.scene as any).getMergeSystem() : null;
    if (!merge) {
      return;
    }
    
    // Spawn the goo jar using the provided asset
    const gooJar = merge.items.spawn('Jar of Goo', spawnX, spawnY);
    
    // Store the original scale values
    const originalScaleX = gooJar.scaleX;
    const originalScaleY = gooJar.scaleY;
    
    // Start the jar at 60% of its normal size (same as recycler items)
    gooJar.setScale(originalScaleX * 0.6, originalScaleY * 0.6);
    
    // Calculate floor position for landing
    const floorY = 473 - 18; // Floor platform top minus half item height
    
    // Create bouncing trajectory to the floor
    const fallDuration = Math.max(300, Math.abs(spawnY - floorY) * 2);
    
    // Add slight horizontal drift during fall
    const horizontalDrift = Phaser.Math.Between(-30, 30);
    const targetX = Math.max(100, Math.min(1000, spawnX + horizontalDrift));
    
    // Animate fall with physics-like easing
    this.scene.tweens.add({
      targets: gooJar,
      x: targetX,
      y: floorY,
      duration: fallDuration,
      ease: 'Power2.easeIn', // Gravity-like acceleration
      onComplete: () => {
        // Add small bounce effect when hitting floor
        this.scene.tweens.add({
          targets: gooJar,
          y: floorY - 10, // Small bounce up
          duration: 150,
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Settle back to floor
            this.scene.tweens.add({
              targets: gooJar,
              y: floorY,
              duration: 100,
              ease: 'Power2.easeIn',
              onComplete: () => {
                // Make jar clickable after it settles
                this.makeGooJarClickable(gooJar);
              }
            });
          }
        });
      }
    });
    
    // Animate scale growth during the fall - jar grows to normal size as it falls
    this.scene.tweens.add({
      targets: gooJar,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      duration: fallDuration,
      ease: 'Power2.easeOut' // Smooth growth during fall
    });
    
    // Add rotation during fall for more natural physics
    const rotationAmount = Phaser.Math.Between(90, 270);
    const rotationDirection = Phaser.Math.RND.pick([-1, 1]);
    
    this.scene.tweens.add({
      targets: gooJar,
      angle: gooJar.angle + (rotationAmount * rotationDirection),
      duration: fallDuration + 250, // Slightly longer than fall for natural effect
      ease: 'Power1.easeOut'
    });
  }

  private makeGooJarClickable(gooJar: any) {
    // Make the goo jar interactive
    gooJar.setInteractive();
    
    // Store original scale values for proper restoration
    const originalScaleX = gooJar.scaleX;
    const originalScaleY = gooJar.scaleY;
    
    // Add click handler
    gooJar.on('pointerdown', () => {
      this.collectGooJar(gooJar);
    });
    
    // Add hover effect
    gooJar.on('pointerover', () => {
      this.scene.tweens.add({
        targets: gooJar,
        scaleX: originalScaleX * 1.1,
        scaleY: originalScaleY * 1.1,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    gooJar.on('pointerout', () => {
      this.scene.tweens.add({
        targets: gooJar,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
  }

  private collectGooJar(gooJar: any) {
    // Remove interactivity to prevent multiple clicks
    gooJar.disableInteractive();
    
    // Get goo counter position (top-left corner: x: 20, y: 20, with counter at center)
    const gooCounterX = 20 + 75; // Counter center X (20 + half width of 150)
    const gooCounterY = 20 + 20; // Counter center Y (20 + half height of 40)
    
    // Store current jar properties
    const startX = gooJar.x;
    const startY = gooJar.y;
    const startScaleX = gooJar.scaleX;
    const startScaleY = gooJar.scaleY;
    
    // Calculate movement duration based on distance
    const distance = Phaser.Math.Distance.Between(startX, startY, gooCounterX, gooCounterY);
    const moveDuration = Math.max(500, distance * 1.5); // Minimum 500ms, scale with distance
    
    // Animate jar moving to goo counter while shrinking
    this.scene.tweens.add({
      targets: gooJar,
      x: gooCounterX,
      y: gooCounterY,
      scaleX: 0, // Shrink to nothing
      scaleY: 0, // Shrink to nothing
      duration: moveDuration,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // Add 1 goo to the counter
        const gooCollectionSystem = require('./GooCounter').GooCollectionSystem;
        gooCollectionSystem.getInstance().collectGooFromSplatter();
        
        // Destroy the jar
        if (gooJar.active) {
          gooJar.destroy();
        }
      }
    });
    
    // Add slight rotation during movement for visual appeal
    this.scene.tweens.add({
      targets: gooJar,
      angle: gooJar.angle + 180, // Half rotation
      duration: moveDuration,
      ease: 'Power1.easeOut'
    });
    
    // Create trail effect during movement
    this.createGooJarTrail(gooJar, moveDuration);
  }

  private createGooJarTrail(gooJar: any, duration: number) {
    // Create a few trail particles that follow the jar
    const trailCount = 3;
    const trailDelay = duration / (trailCount + 1);
    
    for (let i = 0; i < trailCount; i++) {
      this.scene.time.delayedCall(i * trailDelay, () => {
        if (!gooJar.active) return;
        
        // Create small green circle as trail particle
        const trail = this.scene.add.circle(gooJar.x, gooJar.y, 3, 0x27ae60);
        trail.setDepth(gooJar.depth - 1);
        
        // Fade out trail particle
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 300,
          ease: 'Power2.easeOut',
          onComplete: () => {
            trail.destroy();
          }
        });
      });
    }
  }

  // Public UI helper to show cooldown message near the recycler
  public showCooldownMessage(remainingSeconds: number) {
    const message = this.scene.add.text(
      this.recyclerSprite.x,
      this.recyclerSprite.y - 60,
      `Cooldown: ${remainingSeconds}s`,
      {
        fontSize: '16px',
        color: '#e74c3e',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    message.setOrigin(0.5);
    message.setDepth(2000);

    this.scene.tweens.add({
      targets: message,
      y: message.y - 20,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => message.destroy()
    });
  }

  // Public UI helper to show success message near the recycler
  public showSuccessMessage() {
    const message = this.scene.add.text(
      this.recyclerSprite.x,
      this.recyclerSprite.y - 60,
      'Recycled! 1 minute cooldown',
      {
        fontSize: '16px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    message.setOrigin(0.5);
    message.setDepth(2000);

    this.scene.tweens.add({
      targets: message,
      y: message.y - 20,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => message.destroy()
    });
  }

  destroy() {
    // Stop recycling animation
    this.stopRecyclingAnimation();
    
    this.viz.destroy();
    this.zone.destroy();
    this.waiting.length = 0;
  }
}
