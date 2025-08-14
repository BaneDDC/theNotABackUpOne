
// src/game/scenes/Bestiary.ts

import { Scene } from "phaser";
import { RECIPES, getTier } from "../config/mergeDataFull";
import { AssetManager } from "../objects/AssetManager";

interface DiscoveredMerge {
  recipe: string;
  result: string;
  tier: number;
  timestamp: number;
}

export class Bestiary extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private bookClosed!: Phaser.GameObjects.Sprite;
  private bookOpen!: Phaser.GameObjects.Sprite;
  private isBookOpen: boolean = false;
  private discoveredMerges: DiscoveredMerge[] = [];
  private currentPage: number = 0;
  private maxEntriesPerPage: number = 6; // Reduced to accommodate sprites
  private pageContainer!: Phaser.GameObjects.Container;
  private leftPageContainer!: Phaser.GameObjects.Container;
  private rightPageContainer!: Phaser.GameObjects.Container;
  private pageNumberText!: Phaser.GameObjects.Text;
  private prevPageButton!: Phaser.GameObjects.Graphics;
  private nextPageButton!: Phaser.GameObjects.Graphics;
  private closeButton!: Phaser.GameObjects.Graphics;
  private assetManager!: AssetManager;

  constructor() {
    super("Bestiary");
  }

  create() {
    // Ensure custom cursor works in this scene by hiding default cursor
    this.input.setDefaultCursor('none')
    
    // Create cursor in THIS scene immediately to ensure it's above all elements
    this.createCustomCursorInThisScene();
    
    // Initialize asset manager for loading item sprites
    this.assetManager = new AssetManager(this);
    
    // Load discovered merges from localStorage or initialize empty
    this.loadDiscoveredMerges();

    // Create closed book sprite (small, in upper right corner) - always visible
    const bookSize = 80; // Small size for corner placement
    const cornerPadding = 20;
    this.bookClosed = this.add.sprite(
      this.scale.width - cornerPadding - (bookSize / 2), 
      cornerPadding + (bookSize / 2), 
      'book_closed'
    );
    this.bookClosed.setDisplaySize(bookSize, bookSize);
    this.bookClosed.setDepth(500); // Much lower depth to stay well below cursor
    this.bookClosed.setInteractive();
    this.bookClosed.on('pointerdown', () => this.openBook());

    // Add subtle hovering animation to the book
    this.tweens.add({
      targets: this.bookClosed,
      y: this.bookClosed.y - 5, // Move up 5 pixels
      duration: 2000, // 2 seconds
      ease: 'Sine.easeInOut',
      yoyo: true, // Return to original position
      repeat: -1 // Loop forever
    });

    // Create semi-transparent background (initially hidden)
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.9);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.setInteractive();
    this.background.setDepth(1000);
    this.background.setVisible(false); // Hidden until book is opened

    // Create open book sprite (full screen, initially hidden)
    // Check if the texture exists, if not use a placeholder
    let bookTexture = 'book_open';
    if (!this.textures.exists('book_open')) {
      bookTexture = '__WHITE';
    }
    
    this.bookOpen = this.add.sprite(this.scale.width / 2, this.scale.height / 2, bookTexture);
    
    // If using placeholder, tint it brown to look like a book
    if (bookTexture === '__WHITE') {
      this.bookOpen.setTint(0x8B4513); // Brown color for book
    }
    
    this.bookOpen.setDisplaySize(this.scale.width, this.scale.height);
    this.bookOpen.setDepth(1001);
    this.bookOpen.setVisible(false);

    // Create page containers for content
    this.createPageContainers();

    // Create navigation buttons
    this.createNavigationButtons();

    // Create close button
    this.createCloseButton();

    // Setup input handlers
    this.setupInputHandlers();

    // Load assets for sprite display
    this.assetManager.loadAllAssets();

    // Ensure cursor from Game scene stays on top by setting lower depths for this scene's elements
    // All elements in this scene should have depth < 50000 to stay below the cursor
    const maxDepthForThisScene = 10000;
    this.children.list.forEach(child => {
      if (child.depth >= 50000) {
        child.setDepth(Math.min(child.depth, maxDepthForThisScene));
      }
    });
  }

  private loadDiscoveredMerges() {
    const saved = localStorage.getItem('bestiary_discoveries');
    if (saved) {
      try {
        this.discoveredMerges = JSON.parse(saved);
      } catch (e) {
        this.discoveredMerges = [];
      }
    }
  }

  private openBook() {
    if (this.isBookOpen) return;

    this.isBookOpen = true;

    // Pause the game scene when opening the book
    this.scene.pause('Game');

    // Create cursor in THIS scene instead of trying to recreate in Game scene
    this.createCustomCursorInThisScene();

    // Show the background overlay
    this.background.setVisible(true);

    // Hide closed book immediately
    this.bookClosed.setVisible(false);
    
    // Show open book immediately without any animation
    this.bookOpen.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.bookOpen.setDisplaySize(this.scale.width, this.scale.height);
    this.bookOpen.setAlpha(1);
    this.bookOpen.setVisible(true);
    
    // Show page content and UI elements immediately
    this.pageContainer.setVisible(true);
    this.closeButton.setVisible(true);
    this.updatePageContent();
  }

  private closeBook() {
    if (!this.isBookOpen) return;

    this.isBookOpen = false;

    // Destroy cursor in this scene
    if ((this as any).customCursor) {
      (this as any).customCursor.destroy();
      (this as any).customCursor = null;
    }

    // Hide page content and UI elements first
    this.pageContainer.setVisible(false);
    this.closeButton.setVisible(false);

    // Hide open book immediately
    this.bookOpen.setVisible(false);

    // Calculate original corner position
    const bookSize = 80;
    const cornerPadding = 20;
    const originalX = this.scale.width - cornerPadding - (bookSize / 2);
    const originalY = cornerPadding + (bookSize / 2);

    // Show closed book back in corner immediately
    this.bookClosed.setPosition(originalX, originalY);
    this.bookClosed.setDisplaySize(bookSize, bookSize);
    this.bookClosed.setAlpha(1);
    this.bookClosed.setVisible(true);
    
    // Hide background and resume game scene
    this.background.setVisible(false);
    this.scene.resume('Game');
    
    // Recreate cursor in Game scene
    const gameScene = this.scene.get('Game') as any;
    if (gameScene && gameScene.recreateCustomCursor) {
      gameScene.recreateCustomCursor();
    }
  }

  private createPageContainers() {
    // Main container for all page content
    this.pageContainer = this.add.container(0, 0);
    this.pageContainer.setDepth(1002);
    this.pageContainer.setVisible(false);

    // Left page container
    this.leftPageContainer = this.add.container(this.scale.width * 0.25, this.scale.height * 0.3);
    this.pageContainer.add(this.leftPageContainer);

    // Right page container  
    this.rightPageContainer = this.add.container(this.scale.width * 0.75, this.scale.height * 0.3);
    this.pageContainer.add(this.rightPageContainer);

    // Page number text
    this.pageNumberText = this.add.text(this.scale.width / 2, this.scale.height * 0.9, '', {
      fontSize: '18px',
      color: '#8B4513',
      fontStyle: 'bold'
    });
    this.pageNumberText.setOrigin(0.5);
    this.pageContainer.add(this.pageNumberText);
  }

  private createNavigationButtons() {
    const buttonY = this.scale.height * 0.85
    const buttonSize = 50

    // Previous page button
    this.prevPageButton = this.add.graphics()
    this.prevPageButton.fillStyle(0x8B4513, 0.8)
    this.prevPageButton.fillCircle(this.scale.width * 0.2, buttonY, buttonSize / 2)
    this.prevPageButton.setDepth(1003)
    this.prevPageButton.setInteractive(new Phaser.Geom.Circle(this.scale.width * 0.2, buttonY, buttonSize / 2), Phaser.Geom.Circle.Contains)
    this.prevPageButton.setVisible(false)

    // Add arrow text for previous
    const prevArrow = this.add.text(this.scale.width * 0.2, buttonY, '◀', {
      fontSize: '24px',
      color: '#ffffff'
    })
    prevArrow.setOrigin(0.5)
    prevArrow.setDepth(1004)
    this.pageContainer.add(prevArrow)

    // Next page button
    this.nextPageButton = this.add.graphics()
    this.nextPageButton.fillStyle(0x8B4513, 0.8)
    this.nextPageButton.fillCircle(this.scale.width * 0.8, buttonY, buttonSize / 2)
    this.nextPageButton.setDepth(1003)
    this.nextPageButton.setInteractive(new Phaser.Geom.Circle(this.scale.width * 0.8, buttonY, buttonSize / 2), Phaser.Geom.Circle.Contains)
    this.nextPageButton.setVisible(false)

    // Add arrow text for next
    const nextArrow = this.add.text(this.scale.width * 0.8, buttonY, '▶', {
      fontSize: '24px',
      color: '#ffffff'
    })
    nextArrow.setOrigin(0.5)
    nextArrow.setDepth(1004)
    this.pageContainer.add(nextArrow)

    // Button click handlers
    this.prevPageButton.on('pointerdown', () => this.previousPage())
    this.nextPageButton.on('pointerdown', () => this.nextPage())

    // Add to page container so they hide/show with the book
    this.pageContainer.add([this.prevPageButton, this.nextPageButton])
  }

  private createCloseButton() {
    this.closeButton = this.add.graphics()
    this.closeButton.fillStyle(0xaa0000, 0.8)
    this.closeButton.fillCircle(this.scale.width - 50, 50, 25)
    this.closeButton.setDepth(1003)
    this.closeButton.setInteractive(new Phaser.Geom.Circle(this.scale.width - 50, 50, 25), Phaser.Geom.Circle.Contains)
    this.closeButton.setVisible(false)

    // Add X text
    const closeX = this.add.text(this.scale.width - 50, 50, '✕', {
      fontSize: '20px',
      color: '#ffffff'
    })
    closeX.setOrigin(0.5)
    closeX.setDepth(1004)
    this.pageContainer.add(closeX)

    this.closeButton.on('pointerdown', () => this.closeBook())
    this.pageContainer.add(this.closeButton)
  }

  private updatePageContent() {
    // Clear existing content
    this.leftPageContainer.removeAll(true);
    this.rightPageContainer.removeAll(true);

    const startIndex = this.currentPage * this.maxEntriesPerPage;
    const endIndex = Math.min(startIndex + this.maxEntriesPerPage, this.discoveredMerges.length);
    
    // Add title to first page
    if (this.currentPage === 0) {
      const title = this.add.text(0, -100, 'MERGE BESTIARY', {
        fontSize: '28px',
        color: '#8B4513',
        fontStyle: 'bold'
      });
      title.setOrigin(0.5);
      this.leftPageContainer.add(title);

      const subtitle = this.add.text(0, -70, `${this.discoveredMerges.length} Discoveries`, {
        fontSize: '16px',
        color: '#A0522D'
      });
      subtitle.setOrigin(0.5);
      this.leftPageContainer.add(subtitle);
    }

    // Display entries
    let leftPageEntries = 0;
    let rightPageEntries = 0;
    const maxEntriesPerSide = 4;

    for (let i = startIndex; i < endIndex; i++) {
      const discovery = this.discoveredMerges[i];
      let container: Phaser.GameObjects.Container;
      let yOffset: number;

      // Determine which page side to use
      if (leftPageEntries < maxEntriesPerSide) {
        container = this.leftPageContainer;
        yOffset = (leftPageEntries * 80) - 20;
        leftPageEntries++;
      } else if (rightPageEntries < maxEntriesPerSide) {
        container = this.rightPageContainer;
        yOffset = (rightPageEntries * 80) - 20;
        rightPageEntries++;
      } else {
        break; // Page is full
      }

      this.createMergeEntry(container, discovery, yOffset);
    }

    // Update page navigation
    this.updatePageNavigation();
  }

  private createMergeEntry(container: Phaser.GameObjects.Container, discovery: DiscoveredMerge, yOffset: number) {
    // Entry background
    const entryBg = this.add.graphics();
    entryBg.fillStyle(0xF5DEB3, 0.3);
    entryBg.fillRoundedRect(-120, yOffset - 25, 240, 90, 5); // Increased height for sprites
    entryBg.lineStyle(1, 0x8B4513, 0.5);
    entryBg.strokeRoundedRect(-120, yOffset - 25, 240, 90, 5);
    container.add(entryBg);

    // Tier indicator
    const tierColor = this.getTierColor(discovery.tier);
    const tierBadge = this.add.graphics();
    tierBadge.fillStyle(tierColor);
    tierBadge.fillCircle(-100, yOffset - 15, 8);
    container.add(tierBadge);

    const tierText = this.add.text(-100, yOffset - 15, discovery.tier.toString(), {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    tierText.setOrigin(0.5);
    container.add(tierText);

    // Parse recipe ingredients
    const [ingredients, result] = discovery.recipe.split(' → ');
    const [itemA, itemB] = ingredients.split('+');

    // Create ingredient sprites - moved down to center vertically in the box
    const ingredientY = yOffset + 5; // Changed from yOffset - 5 to yOffset + 5 (moved down 10 pixels)
    const spriteA = this.createItemSprite(-75, ingredientY, itemA);
    const spriteB = this.createItemSprite(-25, ingredientY, itemB);
    
    if (spriteA) container.add(spriteA);
    if (spriteB) container.add(spriteB);

    // Plus sign between ingredients - at the same Y level
    const plusText = this.add.text(-50, ingredientY, '+', {
      fontSize: '12px',
      color: '#8B4513'
    });
    plusText.setOrigin(0.5);
    container.add(plusText);

    // Arrow - at the same Y level
    const arrow = this.add.text(0, ingredientY, '→', {
      fontSize: '16px',
      color: '#A0522D'
    });
    arrow.setOrigin(0.5);
    container.add(arrow);

    // Result sprite - at the same Y level as ingredients
    const resultSprite = this.createItemSprite(40, ingredientY, result);
    if (resultSprite) container.add(resultSprite);

    // Result text - positioned below the sprite, also moved down
    const resultText = this.add.text(40, yOffset + 25, result, { // Changed from yOffset + 15 to yOffset + 25
      fontSize: '14px',
      color: '#654321',
      fontStyle: 'bold',
      wordWrap: { width: 200 }
    });
    resultText.setOrigin(0.5);
    container.add(resultText);
  }

  private createItemSprite(x: number, y: number, itemName: string): Phaser.GameObjects.Sprite | null {
    // Try to create sprite using asset manager
    const sprite = this.assetManager.createSprite(itemName, x, y);
    
    if (sprite) {
      // Scale down much more for bestiary display - reduced from 0.15 to 0.05
      sprite.setScale(0.05);
      return sprite;
    } else {
      // Fallback to colored rectangle if no asset available - also smaller
      const rect = this.add.rectangle(x, y, 8, 8, 0x999999); // Reduced from 12x12 to 8x8
      rect.setStrokeStyle(1, 0x222222);
      return rect as any; // Cast to satisfy return type
    }
  }

  // Method to add discovered merge (called from merge system)
  public addDiscovery(itemA: string, itemB: string, result: string) {
    const recipe = `${itemA}+${itemB} → ${result}`;
    const tier = getTier(result);
    
    // Check if this discovery already exists
    const existingIndex = this.discoveredMerges.findIndex(d => d.recipe === recipe);
    
    if (existingIndex === -1) {
      // New discovery
      const discovery: DiscoveredMerge = {
        recipe,
        result,
        tier,
        timestamp: Date.now()
      };
      
      this.discoveredMerges.push(discovery);
      
      // Sort by tier, then by timestamp
      this.discoveredMerges.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.timestamp - b.timestamp;
      });
      
      // Save to localStorage
      this.saveDiscoveredMerges();
      
      // Update page content if book is open
      if (this.isBookOpen) {
        this.updatePageContent();
      }
    }
  }

  private saveDiscoveredMerges() {
    try {
      localStorage.setItem('bestiary_discoveries', JSON.stringify(this.discoveredMerges));
    } catch (e) {

    }
  }

  private getTierColor(tier: number): number {
    const colors = [
      0x808080, // Tier 0 - Gray
      0x00ff00, // Tier 1 - Green
      0x0080ff, // Tier 2 - Blue
      0x8000ff, // Tier 3 - Purple
      0xff0080, // Tier 4 - Magenta
      0xff8000, // Tier 5 - Orange
      0xff0000, // Tier 6+ - Red
    ];
    return colors[Math.min(tier, colors.length - 1)] || 0x808080;
  }

  private updatePageNavigation() {
    const totalPages = Math.ceil(this.discoveredMerges.length / this.maxEntriesPerPage);
    
    // Update page number
    this.pageNumberText.setText(`Page ${this.currentPage + 1} of ${Math.max(1, totalPages)}`);

    // Show/hide navigation buttons
    this.prevPageButton.setVisible(this.currentPage > 0);
    this.nextPageButton.setVisible(this.currentPage < totalPages - 1);
  }

  private previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePageContent();
      this.playPageTurnSound();
    }
  }

  private nextPage() {
    const totalPages = Math.ceil(this.discoveredMerges.length / this.maxEntriesPerPage);
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.updatePageContent();
      this.playPageTurnSound();
    }
  }

  private playPageTurnSound() {
    // Add a subtle page turn sound effect if available
    // For now, just a visual feedback
    this.tweens.add({
      targets: this.pageContainer,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 100,
      yoyo: true
    });
  }

  private setupInputHandlers() {
    // Close with Escape
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.isBookOpen) {
        this.closeBook();
      }
    });

    // Page navigation with arrow keys
    this.input.keyboard!.on('keydown-LEFT', () => {
      if (this.isBookOpen) this.previousPage();
    });

    this.input.keyboard!.on('keydown-RIGHT', () => {
      if (this.isBookOpen) this.nextPage();
    });

    // Close when clicking background (only when book is open)
    this.background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isBookOpen) {
        this.closeBook();
      }
    });
  }

  private createCustomCursorInThisScene() {
    // Create cursor sprite in this scene with maximum depth
    const cursor = this.add.sprite(0, 0, 'grabber', 0);
    cursor.setDepth(999999); // Even higher depth to ensure it's above everything
    cursor.setScrollFactor(0);
    cursor.setVisible(true);
    cursor.setFlipY(true); // Match the Game scene cursor flip
    cursor.setOrigin(0, 0); // Set origin to upper left corner
    
    // Set up pointer tracking for this scene
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      cursor.setPosition(pointer.x, pointer.y);
    });
    
    this.input.on('pointerdown', () => {
      cursor.setFrame(1); // Clicking state
    });
    
    this.input.on('pointerup', () => {
      cursor.setFrame(0); // Normal state
    });
    
    // Store reference to destroy when closing
    (this as any).customCursor = cursor;
    
    // Continuously ensure cursor stays on top
    this.time.addEvent({
      delay: 50, // Every 50ms
      callback: () => {
        if (cursor && cursor.active) {
          cursor.setDepth(999999);
        }
      },
      loop: true
    });
  }
}
