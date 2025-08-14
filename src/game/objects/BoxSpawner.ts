
import Phaser from "phaser";
import { ItemManager } from "./mergeCore";
import { pickRandomTier1, getTier1Partners, SPAWNABLE_TIER1, isTier1, getMergeResult } from "../config/mergeDataFull";

export class BoxSpawner {
  private scene: Phaser.Scene;
  private itemManager: ItemManager;
  private box?: Phaser.GameObjects.Sprite;
  private hasLanded: boolean = false;
  private hasOpened: boolean = false;
  private tier1CheckTimer?: Phaser.Time.TimerEvent;
  private noTier1Timer?: Phaser.Time.TimerEvent;
  private lastTier1Count: number = 0;
  private isFirstBoxEver: boolean = true; // Track if this is the very first box opened in the game
  private noMergeableTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, itemManager: ItemManager) {
    this.scene = scene;
    this.itemManager = itemManager;
    
    // Check if tutorial has been completed by looking at saved game state
    this.checkTutorialCompletionStatus();
    
    // Don't start monitoring immediately - wait for items to load first
    // Start monitoring tier 1 items with a delay to allow saved items to load
    this.scene.time.delayedCall(3000, () => {
      this.startTier1Monitoring();
    });
    
    // Load the parts sound for box opening
    this.scene.load.audio('parts', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/parts-vTMwDFvFmSZztYF5MGD6n7GB7Z9K3S.mp3');
    
    // Start loading if not already in progress
    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  private checkTutorialCompletionStatus() {
    try {
      const savedState = localStorage.getItem('toilet_merge_game_state');
      if (savedState) {
        const gameState = JSON.parse(savedState);
        // If tutorial is completed in saved game, mark first box as already opened
        if (gameState.tutorialCompleted) {
          this.isFirstBoxEver = false;
        }
      }
    } catch (error) {

      // Default to tutorial not completed if we can't read the save
    }
  }

  private startTier1Monitoring() {
    // Check tier 1 item count every 2 seconds
    this.tier1CheckTimer = this.scene.time.addEvent({
      delay: 2000, // Check every 2 seconds
      callback: () => this.checkTier1Items(),
      loop: true
    });
    
    // Do an initial check after a short delay to ensure items are loaded
    this.scene.time.delayedCall(1000, () => {
      const currentItems = this.getCurrentItems();
      const tier1Count = this.getTier1ItemCount();
      

      
      // If field is completely empty and no box exists, spawn one immediately
      if (currentItems.length === 0 && tier1Count === 0 && !this.box) {

        this.spawnBox();
      }
    });
  }

  private checkTier1Items() {
    const currentTier1Count = this.getTier1ItemCount()
    const currentItems = this.getCurrentItems()
    
    // Check if there are any mergeable combinations available
    const hasMergeableItems = this.hasMergeableCombinations()
    

    
    // If we went from having tier 1 items to having none
    if (this.lastTier1Count > 0 && currentTier1Count === 0) {

      this.startNoTier1Timer()
    }
    // If we went from having none to having some, cancel the timer
    else if (this.lastTier1Count === 0 && currentTier1Count > 0) {

      this.cancelNoTier1Timer()
    }
    // If we have no items at all, start the no-tier-1 timer (most urgent)
    else if (currentTier1Count === 0 && currentItems.length === 0) {

      this.startNoTier1Timer()
    }
    // If we have items but no mergeable combinations, start timer
    else if (currentTier1Count > 0 && !hasMergeableItems) {

      this.startNoMergeableTimer()
    }
    // If we now have mergeable combinations, cancel the no-mergeable timer
    else if (hasMergeableItems) {

      this.cancelNoMergeableTimer()
    }
    
    this.lastTier1Count = currentTier1Count
  }

  private getTier1ItemCount(): number {
    let count = 0;
    
    // Get all items from the scene that have itemName property
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName) {
        const itemName = (child as any).itemName;
        if (isTier1(itemName)) {
          count++;
        }
      }
    });
    

    return count;
  }

  private getCurrentItems(): string[] {
    const items: string[] = []
    
    // Get all items from the scene that have itemName property
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName) {
        const itemName = (child as any).itemName
        // Exclude enemies and hazards from mergeable check
        if (!itemName.startsWith("Enemy:") && !itemName.startsWith("Hazard:")) {
          items.push(itemName)
        }
      }
    })
    
    // Found items
    return items
  }

  private startNoTier1Timer() {
    // Don't start a new timer if one is already running
    if (this.noTier1Timer) {
      return;
    }
    

    
    // Start 10-second timer
    this.noTier1Timer = this.scene.time.delayedCall(10000, () => {
      // Only spawn if no box exists and we still have no tier 1 items
      const currentTier1Count = this.getTier1ItemCount();

      
      if (!this.box && currentTier1Count === 0) {

        this.spawnBox();
      } else {

      }
      
      // Clear the timer reference after it completes
      this.noTier1Timer = undefined;
    });
  }

  private cancelNoTier1Timer() {
    if (this.noTier1Timer) {

      this.noTier1Timer.destroy();
      this.noTier1Timer = undefined;
    }
  }

  private startNoMergeableTimer() {
    // Don't start a new timer if one is already running
    if (this.noMergeableTimer) {
      return;
    }
    

    
    // Start 5-second timer (shorter than no-tier-1 timer since player has items but can't merge)
    this.noMergeableTimer = this.scene.time.delayedCall(5000, () => {
      // Only spawn if no box exists and we still have no mergeable combinations
      const hasMergeableItems = this.hasMergeableCombinations();

      
      if (!this.box && !hasMergeableItems) {

        this.spawnBox();
      } else {

      }
      
      // Clear the timer reference after it completes
      this.noMergeableTimer = undefined;
    });
  }

  private cancelNoMergeableTimer() {
    if (this.noMergeableTimer) {

      this.noMergeableTimer.destroy();
      this.noMergeableTimer = undefined;
    }
  }

  public spawnBox() {
    if (this.box) {

      return; // Don't spawn if box already exists
    }



    // Cancel both timers since we're spawning a box
    this.cancelNoTier1Timer();
    this.cancelNoMergeableTimer();

    // Reset flags for new box
    this.hasLanded = false;
    this.hasOpened = false;

    // Spawn offscreen to the left of the window
    const spawnX = -120; // Adjusted for larger box size (was -60, now -120)
    const spawnY = this.scene.scale.height * 0.25; // 25% down from top

    // Create the box sprite - twice as big
    this.box = this.scene.add.sprite(spawnX, spawnY, 'box_closed');
    this.box.setDisplaySize(120, 120); // Doubled from 60x60 to 120x120
    this.box.setDepth(100);

    // Box created at position

    // No physics - just use tweens for movement

    // Start spinning animation
    this.scene.tweens.add({
      targets: this.box,
      angle: 720, // Two full rotations
      duration: 2000,
      ease: 'Power2.easeOut'
    });

    // Calculate trajectory to hit center of box_4, then land on box_5
    this.createTrajectory();
  }

  private createTrajectory() {
    if (!this.box) return;

    // Box_4 coordinates from collision data: x: 2, y: 403, width: 158, height: 32
    const box4CenterX = 2 + 158 / 2; // 81
    const box4CenterY = 403 + 32 / 2; // 419

    // Box_5 coordinates: x: 29, y: 473, width: 1096, height: 83
    const box5CenterX = 29 + 1096 / 2; // 577
    const originalBox5Y = 473 - 60; // Original position: top of platform minus larger box height
    const bottomOfWindow = this.scene.scale.height; // Bottom of the window
    const box5CenterY = (originalBox5Y + bottomOfWindow) / 2; // Midway between original position and bottom

    const startX = this.box.x;
    const startY = this.box.y;

    // Calculate halfway point between box_4 and final destination - much lower bounce height
    const halfwayX = (box4CenterX + box5CenterX) / 2;
    const halfwayY = box4CenterY - 50; // Only bounce 50 pixels above the first hit point

    // Phase 1: Arc to box_4 center
    this.scene.tweens.add({
      targets: this.box,
      x: box4CenterX,
      y: box4CenterY,
      duration: 800,
      ease: 'Power2.easeIn',
      onComplete: () => {
        // Play bounce sound when box hits the first surface
        const bounceSound = this.scene.sound.add('boxbounce', { volume: 0.7 });
        bounceSound.play();
        
        // Phase 2: Bounce up to halfway point with arc
        this.scene.tweens.add({
          targets: this.box,
          x: halfwayX,
          y: halfwayY,
          duration: 600,
          ease: 'Power2.easeOut', // Ease out for upward motion
          onComplete: () => {
            // Phase 3: Arc down to final landing spot
            this.scene.tweens.add({
              targets: this.box,
              x: box5CenterX,
              y: box5CenterY,
              duration: 700,
              ease: 'Power2.easeIn', // Ease in for downward motion
              onComplete: () => {
                // Play crash sound when box finally lands in place
                const crashSound = this.scene.sound.add('boxcrash', { volume: 0.8 });
                crashSound.play();
                
                this.landBox();
              }
            });
          }
        });
      }
    });
  }

  private landBox() {
    if (!this.box) return;

    this.hasLanded = true;

    // Store original scale and position after landing
    const originalScale = this.box.scaleX; // Should be 1.0 after landing
    const originalX = this.box.x;
    const originalY = this.box.y;

    // Check if this is the first spawn and add special effects
    const isFirstSpawn = this.getTier1ItemCount() === 0 && !this.hasAnyItemsOnField();
    if (isFirstSpawn) {
      this.addFirstBoxEffects();
    }

    // Make box interactive
    this.box.setInteractive();
    this.box.on('pointerdown', () => this.openBox());

    // Add subtle hover effect
    this.box.on('pointerover', () => {
      // Only show hover effect if box hasn't been opened yet
      if (!this.hasOpened) {
        this.scene.tweens.add({
          targets: this.box,
          scaleX: originalScale * 1.1,
          scaleY: originalScale * 1.1,
          duration: 200
        });
      }
    });

    this.box.on('pointerout', () => {
      // Only reset scale and position if the box hasn't been opened yet
      if (!this.hasOpened) {
        this.scene.tweens.add({
          targets: this.box,
          scaleX: originalScale,
          scaleY: originalScale,
          x: originalX,
          y: originalY,
          duration: 200
        });
      }
    });
  }

  private openBox() {
    // Prevent opening if box doesn't exist or has already been opened
    if (!this.box || this.hasOpened) return;

    this.hasOpened = true;

    // Remove interactivity to prevent multiple clicks
    this.box.disableInteractive();

    // Change to open box texture
    this.box.setTexture('box_open');

    // Play parts sound when box opens
    const partsSound = this.scene.sound.add('parts', { volume: 0.7 });
    partsSound.play();

    // Play first box sounds if this is the very first box opened
    if (this.isFirstBoxEver) {
      // Delay the tutorial sounds to play after the parts sound
      this.scene.time.delayedCall(500, () => {
        this.playFirstBoxSounds();
      });
      this.isFirstBoxEver = false; // Mark that first box has been opened
    }

    // Always spawn 8 tier 1 items regardless of any conditions
    this.spawnItems();

    // Fade out the box over 3 seconds
    this.scene.tweens.add({
      targets: this.box,
      alpha: 0,
      duration: 3000,
      onComplete: () => {
        this.box?.destroy();
        this.box = undefined;
        // Reset flags for next box spawn
        this.hasLanded = false;
        this.hasOpened = false;
      }
    });
  }

  private playFirstBoxSounds() {
    // Only emit tutorial event if tutorial is not completed
    if (!this.isTutorialCompleted()) {
      // Emit event for hint controller to handle tutorial sounds
      this.scene.events.emit('tutorial:firstBoxOpened')
    }
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

  private addFirstBoxEffects() {
    if (!this.box) return;

    // Store the current scale values when effects are added (after box is created and positioned)
    const currentScaleX = this.box.scaleX;
    const currentScaleY = this.box.scaleY;

    // Add pulsing animation to the box itself - scale from current size to 1.25x current size
    this.scene.tweens.add({
      targets: this.box,
      scaleX: currentScaleX * 1.25, // Apply multiplier to current scale
      scaleY: currentScaleY * 1.25, // Apply multiplier to current scale
      duration: 625, // 4x faster (was 2500ms, now 625ms)
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Clean up when box is opened - simplified since no glow to clean up
    const originalOpenBox = this.openBox.bind(this);
    this.openBox = () => {
      // Stop pulsing animations
      this.scene.tweens.killTweensOf(this.box);
      
      // Call original openBox method
      originalOpenBox();
    };
  }

  private spawnItems() {
    if (!this.box) return;

    // Always get exactly 8 items (4 combinable pairs) of mergeable tier 1 items
    const items = this.getRandomMergeableItems();
    
    const boxX = this.box.x;
    const boxY = this.box.y;
    const floorY = 473 - 18; // Floor level

    // Check if this is the first spawn to apply special effects to guaranteed items
    const isFirstSpawn = this.getTier1ItemCount() === 0 && !this.hasAnyItemsOnField();

    items.forEach((itemName, index) => {
      // Stagger the spawning
      this.scene.time.delayedCall(index * 100, () => {
        // Spawn item at box location
        const item = this.itemManager.spawn(itemName, boxX, boxY);

        // Apply pulse effect to guaranteed items in first box
        if (!this.isTutorialCompleted() && isFirstSpawn && (itemName === "Battery" || itemName === "Loose Wires")) {
          this.addItemPulseEffect(item);
        }

        // Step 1: Pick a random landing spot up to 300px horizontally from the box
        const maxHorizontalDistance = 300;
        const horizontalDistance = Phaser.Math.Between(-maxHorizontalDistance, maxHorizontalDistance);
        const finalX = boxX + horizontalDistance;
        const finalY = floorY;

        // Step 2: Calculate the trajectory to reach that landing spot
        // We want a nice arc, so we'll use physics-based trajectory calculation
        const deltaX = finalX - boxX;
        const deltaY = finalY - boxY;
        
        // Physics: for a projectile, we need initial velocity components
        // Using a fixed flight time and calculating required velocities
        const flightTime = 0.7; // 700ms flight time in seconds
        const gravity = 300; // Match the game's gravity setting
        
        // Calculate required initial velocities
        const initialVelocityX = deltaX / flightTime;
        const initialVelocityY = (deltaY - 0.5 * gravity * flightTime * flightTime) / flightTime;
        
        // Convert to angle and speed for the pop-out effect
        const initialSpeed = Math.sqrt(initialVelocityX * initialVelocityX + initialVelocityY * initialVelocityY);
        const launchAngle = Math.atan2(initialVelocityY, initialVelocityX);
        
        // Step 3: Pop the item out at the calculated angle
        const popDistance = 60; // How far to pop out initially
        const popX = boxX + Math.cos(launchAngle) * popDistance;
        const popY = boxY + Math.sin(launchAngle) * popDistance;
        
        // Create the trajectory using the calculated physics
        // Phase 1: Pop out in the correct direction
        this.scene.tweens.add({
          targets: item,
          x: popX,
          y: popY,
          duration: 150, // Quick pop out
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Phase 2: Continue the arc to the final landing spot
            this.scene.tweens.add({
              targets: item,
              x: finalX,
              y: finalY,
              duration: 550, // Rest of the flight time (700ms total - 150ms pop = 550ms)
              ease: 'Power2.easeIn' // Gravity effect
            });
          }
        });

        // Add rotation during the entire flight
        const rotationAmount = Phaser.Math.Between(180, 360);
        const rotationDirection = Phaser.Math.RND.pick([-1, 1]);
        
        this.scene.tweens.add({
          targets: item,
          angle: rotationAmount * rotationDirection,
          duration: 700, // Total flight time
          ease: 'Power1.easeOut'
        });
      });
    });
  }

  private addItemPulseEffect(item: any) {
    // If tutorial has been completed, do not pulse items anymore
    if (this.isTutorialCompleted()) {
      return;
    }

    // Store the current scale values when effects are added
    const currentScaleX = item.scaleX;
    const currentScaleY = item.scaleY;

    // Add pulsing animation to the item - same as box pulse effect
    const pulseTween = this.scene.tweens.add({
      targets: item,
      scaleX: currentScaleX * 1.25, // Same multiplier as box
      scaleY: currentScaleY * 1.25, // Same multiplier as box
      duration: 625, // Same duration as box
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Stop pulsing when item is picked up (dragged)
    item.on('dragstart', () => {
      // Stop the pulse effect when item is picked up
      this.scene.tweens.killTweensOf(item);
    });

    // Also stop pulsing after 30 seconds to prevent indefinite pulsing
    this.scene.time.delayedCall(30000, () => {
      if (item.active) {
        this.scene.tweens.killTweensOf(item);
      }
    });
  }

  private startToiletPulsing() {
    // Emit event to Game scene to start toilet pulsing
    this.scene.events.emit('toilet:startPulsing');
  }

  private getRandomMergeableItems(): string[] {
    // Check if this is the very first box spawn by checking if any items exist on the field
    const isFirstSpawn = this.getTier1ItemCount() === 0 && !this.hasAnyItemsOnField();
    
    if (isFirstSpawn) {
      // For the first box, always include Loose Wires and Battery, then fill with 6 more items
      const guaranteedItems = ["Loose Wires", "Battery"];
      
      // Get all possible mergeable pairs excluding the guaranteed items
      const mergeablePairs: string[][] = [];
      
      for (const itemA of SPAWNABLE_TIER1) {
        if (guaranteedItems.includes(itemA)) continue; // Skip guaranteed items
        
        const partners = getTier1Partners(itemA);
        for (const itemB of partners) {
          if (itemA < itemB && !guaranteedItems.includes(itemB)) { // Avoid duplicates and guaranteed items
            mergeablePairs.push([itemA, itemB]);
          }
        }
      }
      
      // Ensure we have enough pairs
      while (mergeablePairs.length < 3) {
        const randomPair = mergeablePairs[Math.floor(Math.random() * mergeablePairs.length)];
        mergeablePairs.push([...randomPair]);
      }
      
      // Pick 3 random pairs to get 6 items, then add our guaranteed items
      const selectedPairs = Phaser.Utils.Array.Shuffle(mergeablePairs).slice(0, 3);
      const additionalItems = selectedPairs.flat();
      
      // Combine guaranteed items with additional items
      const allItems = [...guaranteedItems, ...additionalItems];
      
      // Don't add effects here - they'll be added in landBox()
      
      // Shuffle the final array so guaranteed items aren't always first
      return Phaser.Utils.Array.Shuffle(allItems);
    }
    
    // For subsequent boxes, use the original logic
    // Always return exactly 8 items - get pairs of tier 1 items that can merge with each other
    const mergeablePairs: string[][] = [];
    
    for (const itemA of SPAWNABLE_TIER1) {
      const partners = getTier1Partners(itemA);
      for (const itemB of partners) {
        if (itemA < itemB) { // Avoid duplicates by ensuring alphabetical order
          mergeablePairs.push([itemA, itemB]);
        }
      }
    }
    
    // Ensure we have enough pairs - if not, duplicate some pairs
    while (mergeablePairs.length < 4) {
      const randomPair = mergeablePairs[Math.floor(Math.random() * mergeablePairs.length)];
      mergeablePairs.push([...randomPair]);
    }
    
    // Shuffle and pick exactly 4 random pairs to get 8 items (4 pairs)
    const selectedPairs = Phaser.Utils.Array.Shuffle(mergeablePairs).slice(0, 4);
    
    // Flatten the pairs into a single array of 8 items
    const items = selectedPairs.flat();
    
    // Shuffle the final array so pairs aren't grouped together
    const shuffledItems = Phaser.Utils.Array.Shuffle(items);
    
    return shuffledItems;
  }

  private hasAnyItemsOnField(): boolean {
    // Check if there are any items with itemName property in the scene
    let hasItems = false;
    
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName) {
        hasItems = true;
      }
    });
    
    return hasItems;
  }

  private hasMergeableCombinations(): boolean {
    const currentItems = this.getCurrentItems()
    
    // If there are no items, there are no mergeable combinations
    if (currentItems.length === 0) {
      return false
    }
    
    // Check all pairs of items for valid merges
    for (let i = 0; i < currentItems.length; i++) {
      for (let j = i + 1; j < currentItems.length; j++) {
        const result = getMergeResult(currentItems[i], currentItems[j])
        if (result) {
          return true // Found at least one valid combination
        }
      }
    }
    
    return false // No valid combinations found
  }

  public destroy() {
    // Clean up timers
    if (this.tier1CheckTimer) {
      this.tier1CheckTimer.destroy();
      this.tier1CheckTimer = undefined;
    }
    
    this.cancelNoTier1Timer();
    this.cancelNoMergeableTimer();

    if (this.box) {
      this.box.destroy();
      this.box = undefined;
    }
    // Reset flags when destroying
    this.hasLanded = false;
    this.hasOpened = false;
  }
}
