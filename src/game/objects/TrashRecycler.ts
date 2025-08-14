
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
      'SORT THE ITEMS INTO MATCHING COLORED BINS!\nDrag and drop items into the correct bins.',
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
    
    // Create items (2 of each type) with randomized positions
    const itemTypes = ['plastic', 'metal', 'paper'];
    const itemColors = [0x3498db, 0xe67e22, 0xf1c40f]; // Blue, Orange, Yellow
    const items: any[] = [];
    
    // Create all items first
    const allItems: any[] = [];
    itemTypes.forEach((type, index) => {
      for (let i = 0; i < 2; i++) {
        const item = this.scene.add.rectangle(0, 0, 30, 30, itemColors[index]);
        item.setStrokeStyle(2, 0x2c3e50);
        
        // Store item data
        (item as any).itemType = type;
        (item as any).itemColor = itemColors[index];
        
        // Make interactive for drag and drop
        item.setInteractive();
        
        // Enable drag and drop
        this.scene.input.setDraggable(item);
        
        allItems.push(item);
      }
    });
    
    // Shuffle the items randomly
    this.shuffleArray(allItems);
    
    // Position shuffled items in the grid layout
    allItems.forEach((item, index) => {
      // Calculate grid position (2 rows, 3 columns)
      const row = Math.floor(index / 3);
      const col = index % 3;
      const gridX = recyclerX - 120 + (col * 80);
      const gridY = recyclerY - 60 + (row * 40);
      
      item.setPosition(gridX, gridY);
      
      items.push(item);
      overlayContainer.add(item);
    });
    
    // Create bins
    const bins: any[] = [];
    const binTypes = ['plastic', 'metal', 'paper'];
    const binColors = [0x3498db, 0xe67e22, 0xf1c40f];
    const binPositions = [
      { x: recyclerX - 100, y: recyclerY + 80 },
      { x: recyclerX, y: recyclerY + 80 },
      { x: recyclerX + 100, y: recyclerY + 80 }
    ];
    
    binTypes.forEach((type, index) => {
      const bin = this.scene.add.rectangle(0, 0, 60, 40, binColors[index], 0.3);
      bin.setStrokeStyle(3, binColors[index]);
      bin.setPosition(binPositions[index].x, binPositions[index].y);
      
      // Add label
      const label = this.scene.add.text(0, 0, type.toUpperCase(), {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      label.setOrigin(0.5);
      bin.setPosition(binPositions[index].x, binPositions[index].y);
      
      (bin as any).binType = type;
      bins.push(bin);
      
      overlayContainer.add(bin);
      overlayContainer.add(label);
    });
    
    // Create score and timer
    let score = 0;
    let timeLeft = 10; // Reduced from 30 to 10 seconds for more challenge
    
    const scoreText = this.scene.add.text(
      recyclerX, 
      recyclerY - 120, 
      `Score: ${score}/6`,
      {
        fontSize: '20px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    scoreText.setOrigin(0.5);
    overlayContainer.add(scoreText);
    
    const timerText = this.scene.add.text(
      recyclerX, 
      recyclerY - 150, 
      `Time: ${timeLeft}s`,
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    timerText.setOrigin(0.5);
    overlayContainer.add(timerText);
    
    // Start timer
    const timer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        timerText.setText(`Time: ${timeLeft}s`);
        
        if (timeLeft <= 0) {
          this.endRecyclingMinigame(overlayContainer, false);
        }
      },
      loop: true
    });
    
    // Set up drag and drop events
    this.setupDragAndDrop(overlayContainer, items, bins, scoreText);
    
    // Store references for cleanup
    (this as any).recyclingOverlay = overlayContainer;
    (this as any).recyclingTimer = timer;
    (this as any).recyclingItems = items;
    (this as any).recyclingBins = bins;
  }
  
  // Drag and drop functionality replaced the click handler
  
  private setupDragAndDrop(overlayContainer: any, items: any[], bins: any[], scoreText: any): void {
    // Handle drag start
    this.scene.input.on('dragstart', (pointer: Phaser.Input.Pointer, dragObj: any) => {
      if (items.includes(dragObj)) {
        // Store original position for return if drop fails
        (dragObj as any).originalX = dragObj.x;
        (dragObj as any).originalY = dragObj.y;
        
        // Scale up slightly while dragging
        dragObj.setScale(1.2);
        dragObj.setDepth(10002); // Bring to very top while dragging
      }
    });
    
    // Handle drag
    this.scene.input.on('drag', (pointer: Phaser.Input.Pointer, dragObj: any, dragX: number, dragY: number) => {
      if (items.includes(dragObj)) {
        dragObj.x = dragX;
        dragObj.y = dragY;
      }
    });
    
    // Handle drag end
    this.scene.input.on('dragend', (pointer: Phaser.Input.Pointer, dragObj: any) => {
      if (items.includes(dragObj)) {
        // Reset scale and depth
        dragObj.setScale(1.0);
        dragObj.setDepth(9999);
        
        // Check if dropped on a bin
        const droppedOnBin = this.checkBinDrop(dragObj, bins);
        
        if (droppedOnBin) {
          // Check if it's the correct bin
          if ((droppedOnBin as any).binType === (dragObj as any).itemType) {
            // Correct bin - animate item into bin
            this.animateItemToBin(dragObj, droppedOnBin, items, scoreText, overlayContainer);
          } else {
            // Wrong bin - return to original position with shake effect
            this.returnItemToOriginalPosition(dragObj);
          }
        } else {
          // Not dropped on a bin - return to original position
          this.returnItemToOriginalPosition(dragObj);
        }
      }
    });
  }
  
  private checkBinDrop(item: any, bins: any[]): any | null {
    // Check if item is over any bin
    for (const bin of bins) {
      const binBounds = {
        left: bin.x - 30,   // Half bin width
        right: bin.x + 30,
        top: bin.y - 20,    // Half bin height
        bottom: bin.y + 20
      };
      
      if (item.x >= binBounds.left && item.x <= binBounds.right &&
          item.y >= binBounds.top && item.y <= binBounds.bottom) {
        return bin;
      }
    }
    return null;
  }
  
  private animateItemToBin(item: any, bin: any, items: any[], scoreText: any, overlayContainer: any): void {
    // Disable interaction during animation
    item.disableInteractive();
    this.scene.input.setDraggable(item, false);
    
    // Animate item into bin
    this.scene.tweens.add({
      targets: item,
      x: bin.x,
      y: bin.y,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.7,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Remove item
        item.destroy();
        items.splice(items.indexOf(item), 1);
        
        // Update score
        const currentScore = parseInt(scoreText.text.split('/')[0].split(': ')[1]) + 1;
        scoreText.setText(`Score: ${currentScore}/6`);
        
        // Add success effect to bin
        this.scene.tweens.add({
          targets: bin,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          ease: 'Power2.easeOut'
        });
        
        // Check if complete
        if (currentScore >= 6) {
          this.endRecyclingMinigame(overlayContainer, true);
        }
      }
    });
  }
  
  private returnItemToOriginalPosition(item: any): void {
    // Return item to its original position with a bounce effect
    this.scene.tweens.add({
      targets: item,
      x: (item as any).originalX,
      y: (item as any).originalY,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Re-enable interaction
        item.setInteractive();
        this.scene.input.setDraggable(item, true);
      }
    });
    
    // Add shake effect for wrong bin
    this.scene.tweens.add({
      targets: item,
      x: item.x + 10,
      duration: 100,
      yoyo: true,
      repeat: 2,
      ease: 'Power2.easeInOut'
    });
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

    // Start squeeze animation with audio, which will spawn the goo jar
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
