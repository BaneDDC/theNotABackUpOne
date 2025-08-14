
// src/game/scenes/PlungeMiniGame.ts

import { Scene } from "phaser";

export class PlungeMiniGame extends Scene {
  private toiletX: number = 0;
  private toiletY: number = 0;
  private targetCircle!: Phaser.GameObjects.Graphics;
  private needle!: Phaser.GameObjects.Graphics;
  private needleAngle: number = 0;
  private rotationSpeed: number = 2; // degrees per frame
  private rotationDirection: number = 1; // 1 for clockwise, -1 for counter-clockwise
  private isActive: boolean = true;
  
  // Zone configuration - randomized each game
  private greenStart: number = 0;
  private greenEnd: number = 0;
  private leftRedStart: number = 0;
  private leftRedEnd: number = 0;
  private rightRedStart: number = 0;
  private rightRedEnd: number = 0;

  // Recycling minigame properties
  private isRecyclingMode: boolean = false;
  private recyclerX: number = 0;
  private recyclerY: number = 0;
  private recyclingItems: Phaser.GameObjects.GameObject[] = [];
  private recyclingTargets: Phaser.GameObjects.GameObject[] = [];
  private recyclingScore: number = 0;
  private recyclingTime: number = 0;
  private recyclingTimer!: Phaser.Time.TimerEvent;
  private recyclingInstructions!: Phaser.GameObjects.Text;

  constructor() {
    super("PlungeMiniGame");
  }

  init(data: { toiletX: number; toiletY: number; isRecycling?: boolean; recyclerX?: number; recyclerY?: number }) {
    // Check if this is recycling mode
    this.isRecyclingMode = data.isRecycling || false;
    
    if (this.isRecyclingMode) {
      // Recycling minigame mode
      this.recyclerX = data.recyclerX || 0;
      this.recyclerY = data.recyclerY || 0;
      this.recyclingScore = 0;
      this.recyclingTime = 0;
    } else {
      // Plunger minigame mode
      this.toiletX = data.toiletX || 0;
      this.toiletY = data.toiletY || 0;
      
      // Reset state for new mini-game
      this.needleAngle = 0;
      this.isActive = true;
      
      // Randomize rotation speed: base 2 degrees ± 0.5 degrees (1.5 to 2.5)
      this.rotationSpeed = 2 + (Math.random() - 0.5); // Random between 1.5 and 2.5
      
      // Randomly choose rotation direction
      this.rotationDirection = Math.random() < 0.5 ? 1 : -1; // 50% chance for each direction
      
      // Randomize zone configuration
      this.randomizeZones();
    }
  }

  private randomizeZones() {
    // Randomize green zone size: 8% to 12% of circle (base 10% ± 2%)
    const minGreenSize = 28.8; // 8% of 360 degrees
    const maxGreenSize = 43.2; // 12% of 360 degrees
    const greenSize = Phaser.Math.Between(minGreenSize, maxGreenSize);
    
    // Randomize green zone position: anywhere around the circle
    const greenCenter = Phaser.Math.Between(0, 359);
    
    // Calculate green zone boundaries
    this.greenStart = greenCenter - (greenSize / 2);
    this.greenEnd = greenCenter + (greenSize / 2);
    
    // Normalize angles to 0-360 range
    if (this.greenStart < 0) this.greenStart += 360;
    if (this.greenEnd >= 360) this.greenEnd -= 360;
    
    // Red zones: 20% each = 72 degrees each
    // Position them on either side of the green zone
    if (this.greenStart < this.greenEnd) {
      // Normal case: green zone doesn't wrap around
      this.leftRedStart = this.greenStart - 72;
      this.leftRedEnd = this.greenStart;
      this.rightRedStart = this.greenEnd;
      this.rightRedEnd = this.greenEnd + 72;
      
      // Normalize red zone angles
      if (this.leftRedStart < 0) this.leftRedStart += 360;
      if (this.rightRedEnd >= 360) this.rightRedEnd -= 360;
    } else {
      // Green zone wraps around 0 degrees
      this.leftRedStart = this.greenStart - 72;
      this.leftRedEnd = this.greenStart;
      this.rightRedStart = this.greenEnd;
      this.rightRedEnd = this.greenEnd + 72;
      
      // Handle wrapping for red zones
      if (this.leftRedStart < 0) this.leftRedStart += 360;
      if (this.rightRedEnd >= 360) this.rightRedEnd -= 360;
    }
    
    // Ensure this scene is rendered on top
    this.scene.bringToTop();
  }

  create() {
    // Set transparent background so we only see the mini-game elements
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    
    // Set the scene to be on top of everything
    this.input.setTopOnly(true);
    
    if (this.isRecyclingMode) {
      // Create recycling minigame
      this.createRecyclingMinigame();
    } else {
      // Create plunger minigame
      this.createTargetCircle();
      this.createNeedle();
      this.startNeedleRotation();
    }
    
    // Setup input handlers
    this.setupInputHandlers();
  }

  private createTargetCircle() {
    this.targetCircle = this.add.graphics();
    this.targetCircle.setDepth(3000); // High depth to appear above game elements
    
    // Draw the main target circle with colored zones
    const circleRadius = 80;
    const centerX = this.toiletX;
    const centerY = this.toiletY;
    
    // Convert to radians for drawing
    const toRad = (deg: number) => Phaser.Math.DegToRad(deg);
    
    // Draw yellow background (full circle first)
    this.targetCircle.fillStyle(0xf1c40f, 0.25); // Yellow with 25% opacity
    this.targetCircle.fillCircle(centerX, centerY, circleRadius);
    
    // Draw red zones
    this.targetCircle.fillStyle(0xe74c3c, 0.25); // Red with 25% opacity
    
    // Helper function to draw arc segment
    const drawArcSegment = (startAngle: number, endAngle: number) => {
      this.targetCircle.beginPath();
      this.targetCircle.moveTo(centerX, centerY);
      
      if (startAngle <= endAngle) {
        // Normal case: no wrapping
        this.targetCircle.arc(centerX, centerY, circleRadius, toRad(startAngle), toRad(endAngle));
      } else {
        // Wrapping case: draw two arcs
        this.targetCircle.arc(centerX, centerY, circleRadius, toRad(startAngle), toRad(360));
        this.targetCircle.arc(centerX, centerY, circleRadius, toRad(0), toRad(endAngle));
      }
      
      this.targetCircle.closePath();
      this.targetCircle.fillPath();
    };
    
    // Draw left red zone
    if (this.leftRedStart !== this.leftRedEnd) {
      drawArcSegment(this.leftRedStart, this.leftRedEnd);
    }
    
    // Draw right red zone  
    if (this.rightRedStart !== this.rightRedEnd) {
      drawArcSegment(this.rightRedStart, this.rightRedEnd);
    }
    
    // Draw green zone (success zone)
    this.targetCircle.fillStyle(0x2ecc71, 0.25); // Green with 25% opacity
    drawArcSegment(this.greenStart, this.greenEnd);
    
    // Draw outer ring (dark border)
    this.targetCircle.lineStyle(4, 0x2c3e50, 0.8);
    this.targetCircle.strokeCircle(centerX, centerY, circleRadius);
    
    // Center dot
    this.targetCircle.fillStyle(0x34495e, 0.9);
    this.targetCircle.fillCircle(centerX, centerY, 6);
    
    // Add zone divider lines for clarity
    this.targetCircle.lineStyle(2, 0x2c3e50, 0.6);
    
    // Draw lines at zone boundaries
    const drawRadiusLine = (angle: number) => {
      const rad = toRad(angle);
      const endX = centerX + Math.cos(rad) * circleRadius;
      const endY = centerY + Math.sin(rad) * circleRadius;
      this.targetCircle.lineBetween(centerX, centerY, endX, endY);
    };
    
    // Draw boundary lines
    drawRadiusLine(this.greenStart);  // Left edge of green zone
    drawRadiusLine(this.greenEnd);    // Right edge of green zone
    drawRadiusLine(this.leftRedStart); // Left edge of left red zone
    drawRadiusLine(this.rightRedEnd);  // Right edge of right red zone
  }

  private createNeedle() {
    this.needle = this.add.graphics();
    this.needle.setDepth(3001); // Above the target circle
    
    this.updateNeedlePosition();
  }

  private createRecyclingMinigame() {

    
    // Create a full-screen overlay to ensure the minigame is on top
    const overlay = this.add.rectangle(0, 0, 1200, 800, 0x000000, 0.3);
    overlay.setOrigin(0, 0);
    overlay.setDepth(9995); // Just below the minigame elements
    overlay.setInteractive();
    
    // Make overlay handle all input to ensure it's on top
    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if we clicked on an item
      const clickedItem = this.recyclingItems.find(item => {
        const itemX = (item as any).x;
        const itemY = (item as any).y;
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, itemX, itemY);
        return distance <= 15; // 15 pixel radius for item click
      });
      
      if (clickedItem) {
        // Item clicked via overlay
        this.onRecyclingItemClick(clickedItem);
      }
    });
    
    // Store overlay for cleanup
    (this as any).overlay = overlay;
    
    // Create recycling-themed minigame
    this.createRecyclingInstructions();
    this.createRecyclingItems();
    this.createRecyclingTargets();
    this.startRecyclingTimer();
    
    // Add a visual indicator that the minigame is active
    const indicator = this.add.text(
      this.recyclerX, 
      this.recyclerY - 150, 
      '🎮 RECYCLING MINIGAME ACTIVE 🎮',
      {
        fontSize: '20px',
        color: '#00ff00',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: { x: 10, y: 6 },
        fontStyle: 'bold'
      }
    );
    indicator.setOrigin(0.5);
    indicator.setDepth(10000); // Highest depth for the main indicator
    
    // Store for cleanup
    (this as any).gameIndicator = indicator;
    

  }

  private createRecyclingInstructions() {
    this.recyclingInstructions = this.add.text(
      this.recyclerX, 
      this.recyclerY - 120, 
      "Sort the items into the correct bins!\nClick items to move them to matching colored bins.\nComplete before time runs out!",
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 10, y: 8 },
        align: 'center',
        wordWrap: { width: 300 }
      }
    );
    this.recyclingInstructions.setOrigin(0.5);
    this.recyclingInstructions.setDepth(9997); // High depth for instructions
  }

  private createRecyclingItems() {
    // Create 6 random items to sort (2 of each type)
    const itemTypes = ['plastic', 'metal', 'paper'];
    const itemColors = [0x3498db, 0xe67e22, 0xf1c40f]; // Blue, Orange, Yellow
    
    // Clear any existing items
    this.recyclingItems = [];
    
    itemTypes.forEach((type, index) => {
      for (let i = 0; i < 2; i++) {
        // Create a simple rectangle instead of circle for better interaction
        const item = this.add.rectangle(0, 0, 30, 30, itemColors[index]);
        item.setStrokeStyle(2, 0x2c3e50);
        
        // Position items in a grid pattern for easier testing
        const gridX = this.recyclerX - 120 + (index * 80);
        const gridY = this.recyclerY - 60 + (i * 40);
        
        item.setPosition(gridX, gridY);
        item.setDepth(9999); // Much higher depth to ensure it's above everything
        
        // Items are now handled by the overlay for better input handling
        
        // Store item type for matching
        (item as any).itemType = type;
        (item as any).itemColor = itemColors[index];
        
        // Items are now handled by the overlay for better input handling
        
        // Add hover effects for better UX (these will still work)
        item.on('pointerover', () => {
          item.setScale(1.2);
        });
        
        item.on('pointerout', () => {
          item.setScale(1.0);
        });
        
        this.recyclingItems.push(item);
        
        // Debug: log item creation

      }
    });
  }

  private createRecyclingTargets() {
    // Create 3 target bins (plastic, metal, paper)
    const binTypes = ['plastic', 'metal', 'paper'];
    const binColors = [0x3498db, 0xe67e22, 0xf1c40f]; // Blue, Orange, Yellow
    const binPositions = [
      { x: this.recyclerX - 100, y: this.recyclerY + 80 },
      { x: this.recyclerX, y: this.recyclerY + 80 },
      { x: this.recyclerX + 100, y: this.recyclerY + 80 }
    ];
    
    binTypes.forEach((type, index) => {
      const bin = this.add.graphics();
      bin.fillStyle(binColors[index], 0.3);
      bin.fillRect(-30, -20, 60, 40);
      bin.lineStyle(3, binColors[index], 1);
      bin.strokeRect(-30, -20, 60, 40);
      
      // Add bin label
      const label = this.add.text(0, 0, type.toUpperCase(), {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      label.setOrigin(0.5);
      
      bin.setPosition(binPositions[index].x, binPositions[index].y);
      bin.setDepth(9998); // High depth for bins
      
      // Store bin type for matching
      (bin as any).binType = type;
      (bin as any).binColor = binColors[index];
      (bin as any).label = label;
      
      // Debug: log bin creation

      
      this.recyclingTargets.push(bin);
    });
  }

  private startRecyclingTimer() {
    // 30 second timer for recycling minigame
    this.recyclingTime = 30;
    
    // Create timer display
    const timerText = this.add.text(
      this.recyclerX, 
      this.recyclerY - 80, 
      `Time: ${this.recyclingTime}s`,
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    timerText.setOrigin(0.5);
    timerText.setDepth(9996); // High depth for timer
    
    // Create score display
    const scoreText = this.add.text(
      this.recyclerX, 
      this.recyclerY - 50, 
      `Score: ${this.recyclingScore}/6`,
      {
        fontSize: '20px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }
    );
    scoreText.setOrigin(0.5);
    scoreText.setDepth(9996); // High depth for score
    
    // Start countdown timer
    this.recyclingTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.recyclingTime--;
        timerText.setText(`Time: ${this.recyclingTime}s`);
        
        if (this.recyclingTime <= 0) {
          this.endRecyclingMinigame();
        }
      },
      loop: true
    });
    
    // Store references for cleanup
    (this as any).timerText = timerText;
    (this as any).scoreText = scoreText;
  }

  private onRecyclingItemClick(item: Phaser.GameObjects.GameObject) {
          // Processing item click
    
    // Find the matching bin
    const matchingBin = this.recyclingTargets.find(bin => 
      (bin as any).binType === (item as any).itemType
    );
    
    // Matching bin found
    
    if (matchingBin) {
      // Moving item to bin
      
      // Disable interaction during animation
      item.disableInteractive();
      
      // Animate item to bin
      this.tweens.add({
        targets: item,
        x: (matchingBin as any).x,
        y: (matchingBin as any).y,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0.7,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Remove item from game
          (item as any).destroy();
          this.recyclingItems = this.recyclingItems.filter(i => i !== item);
          
          // Update score
          this.recyclingScore++;
          if ((this as any).scoreText) {
            (this as any).scoreText.setText(`Score: ${this.recyclingScore}/6`);
          }
          

          
          // Check if all items are sorted
          if (this.recyclingScore >= 6) {
            this.completeRecyclingMinigame();
          }
        }
      });
      
      // Add success effect to bin
      this.tweens.add({
        targets: matchingBin,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    } else {

      // Wrong bin - shake the item
      this.tweens.add({
        targets: item,
        x: (item as any).x + 10,
        duration: 100,
        yoyo: true,
        repeat: 2,
        ease: 'Power2.easeInOut'
      });
    }
  }

  private completeRecyclingMinigame() {
    // Stop the timer
    if (this.recyclingTimer) {
      this.recyclingTimer.destroy();
    }
    
    // Show success message
    const successText = this.add.text(
      this.recyclerX, 
      this.recyclerY, 
      'RECYCLING COMPLETE!\nGreat job sorting everything!',
      {
        fontSize: '24px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: { x: 12, y: 8 },
        align: 'center',
        fontStyle: 'bold'
      }
    );
    successText.setOrigin(0.5);
    successText.setDepth(10001); // Highest depth for success message
    
    // Wait 2 seconds then close
    this.time.delayedCall(2000, () => {
      this.closeRecyclingMinigame(true);
    });
  }

  private endRecyclingMinigame() {
    // Stop the timer
    if (this.recyclingTimer) {
      this.recyclingTimer.destroy();
    }
    
    // Show failure message
    const failText = this.add.text(
      this.recyclerX, 
      this.recyclerY, 
      `TIME'S UP!\nYou sorted ${this.recyclingScore}/6 items.\nTry again to recycle!`,
      {
        fontSize: '20px',
        color: '#e74c3c',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: { x: 12, y: 8 },
        align: 'center'
      }
    );
    failText.setOrigin(0.5);
    failText.setDepth(10001); // Highest depth for failure message
    
    // Wait 3 seconds then close
    this.time.delayedCall(3000, () => {
      this.closeRecyclingMinigame(false);
    });
  }

  private closeRecyclingMinigame(success: boolean) {
    // Send result back to the main game scene via events
    this.scene.get('Game').events.emit('recycler:result', success);
    
    // Resume the main game scene
    this.scene.resume('Game');
    
    // Stop this mini-game scene
    this.scene.stop();
  }

  private updateNeedlePosition() {
    if (!this.needle) return;
    
    this.needle.clear();
    
    // Calculate needle end position based on current angle
    const needleLength = 75; // Slightly shorter than circle radius
    const angleInRadians = Phaser.Math.DegToRad(this.needleAngle);
    
    const endX = this.toiletX + Math.cos(angleInRadians) * needleLength;
    const endY = this.toiletY + Math.sin(angleInRadians) * needleLength;
    
    // Draw the needle as a line from center to edge
    this.needle.lineStyle(3, 0xf39c12, 1.0);
    this.needle.lineBetween(this.toiletX, this.toiletY, endX, endY);
    
    // Add a small circle at the needle tip
    this.needle.fillStyle(0xf39c12, 1.0);
    this.needle.fillCircle(endX, endY, 4);
  }

  private startNeedleRotation() {
    // Use a timer event to rotate the needle continuously
    this.time.addEvent({
      delay: 16, // ~60 FPS
      callback: () => {
        if (this.isActive) {
          // Apply rotation speed and direction
          this.needleAngle += this.rotationSpeed * this.rotationDirection;
          
          // Normalize angle to 0-360 range
          if (this.needleAngle >= 360) {
            this.needleAngle -= 360;
          } else if (this.needleAngle < 0) {
            this.needleAngle += 360;
          }
          
          this.updateNeedlePosition();
        }
      },
      loop: true
    });
  }

  private setupInputHandlers() {
    if (this.isRecyclingMode) {
      // Recycling minigame input handlers
      this.input.keyboard!.on('keydown-ESC', () => {
        this.closeRecyclingMinigame(false);
      });
      
      // Add test keys for debugging
      this.input.keyboard!.on('keydown-SPACE', () => {

        this.completeRecyclingMinigame();
      });
    } else {
      // Plunger minigame input handlers
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.stopMiniGame();
        }
      });
      
      this.input.keyboard!.on('keydown-ESC', () => {
        this.stopMiniGame();
      });
    }
  }

  private stopMiniGame() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Determine the result based on current needle zone
    const currentZone = this.getCurrentZone();
    
    // Add a brief visual feedback before closing
    this.tweens.add({
      targets: [this.targetCircle, this.needle],
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.closeMiniGame(currentZone);
      }
    });
  }

  private closeMiniGame(result?: 'green' | 'red' | 'yellow') {
    // Send result back to the main game scene via events
    if (result) {
      this.scene.get('Game').events.emit('plunger:result', result);
    }
    
    // Resume the main game scene
    this.scene.resume('Game');
    
    // Stop this mini-game scene
    this.scene.stop();
  }

  // Method to get current needle angle (for future success/fail logic)
  public getCurrentNeedleAngle(): number {
    return this.needleAngle;
  }

  // Method to determine which zone the needle is currently in
  public getCurrentZone(): 'green' | 'red' | 'yellow' {
    // Normalize angle to 0-360 range
    let normalizedAngle = this.needleAngle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    
    // Helper function to check if angle is within a zone (handles wrapping)
    const isInZone = (angle: number, start: number, end: number): boolean => {
      if (start <= end) {
        // Normal case: no wrapping
        return angle >= start && angle <= end;
      } else {
        // Wrapping case: angle is either >= start OR <= end
        return angle >= start || angle <= end;
      }
    };
    
    // Check green zone
    if (isInZone(normalizedAngle, this.greenStart, this.greenEnd)) {
      return 'green';
    }
    
    // Check red zones
    if (isInZone(normalizedAngle, this.leftRedStart, this.leftRedEnd) ||
        isInZone(normalizedAngle, this.rightRedStart, this.rightRedEnd)) {
      return 'red';
    }
    
    // Everything else is yellow
    return 'yellow';
  }

  // Method to set rotation speed (for difficulty adjustment)
  public setRotationSpeed(speed: number) {
    this.rotationSpeed = speed;
  }

  destroy() {
    // Clean up graphics objects
    if (this.targetCircle) {
      this.targetCircle.destroy();
    }
    if (this.needle) {
      this.needle.destroy();
    }
    
    // Clean up recycling minigame objects
    if (this.isRecyclingMode) {
      this.recyclingItems.forEach(item => item.destroy());
      this.recyclingTargets.forEach(bin => {
        if ((bin as any).label) {
          (bin as any).label.destroy();
        }
        bin.destroy();
      });
      if (this.recyclingInstructions) {
        this.recyclingInstructions.destroy();
      }
      if (this.recyclingTimer) {
        this.recyclingTimer.destroy();
      }
      if ((this as any).timerText) {
        (this as any).timerText.destroy();
      }
      if ((this as any).scoreText) {
        (this as any).scoreText.destroy();
      }
      if ((this as any).gameIndicator) {
        (this as any).gameIndicator.destroy();
      }
      if ((this as any).overlay) {
        (this as any).overlay.destroy();
      }
    }
    
    // Clean up input handlers
    this.input.removeAllListeners();
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }
  }
}
