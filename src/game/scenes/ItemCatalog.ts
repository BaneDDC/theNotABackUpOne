
// src/game/scenes/ItemCatalog.ts

import { Scene } from "phaser";
import { AssetManager } from "../objects/AssetManager";

export class ItemCatalog extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private catalogContainer!: Phaser.GameObjects.Container;
  private assetManager!: AssetManager;
  private customCursor!: Phaser.GameObjects.Sprite;
  private cursorReady: boolean = false;

  constructor() {
    super("ItemCatalog");
  }

  create() {
    // Ensure custom cursor works in this scene by hiding default cursor
    this.input.setDefaultCursor('none');
    
    // Initialize asset manager for loading item sprites
    this.assetManager = new AssetManager(this);
    
    // Create semi-transparent background
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.setInteractive();
    this.background.setDepth(1000);

    // Create main container for catalog
    this.catalogContainer = this.add.container(0, 0);
    this.catalogContainer.setDepth(1001);

    // Create title
    const title = this.add.text(this.scale.width / 2, 40, "ITEM CATALOG", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.catalogContainer.add(title);

    // Create close instruction
    const closeText = this.add.text(this.scale.width / 2, 80, "Press F8 or ESC to close", {
      fontSize: "16px",
      color: "#cccccc"
    }).setOrigin(0.5);
    this.catalogContainer.add(closeText);

    // Load assets first, then create catalog grid
    this.assetManager.loadAllAssets().then(() => {
      this.createCatalogGrid();
    });

    // Setup input handlers
    this.setupInputHandlers();

    // Setup scroll
    this.setupScrolling();
    
    // Create cursor after a short delay to ensure textures are ready
    this.time.delayedCall(100, () => {
      this.createCustomCursorInThisScene();
    });
  }

  private isCursorReady(): boolean {
    return this.cursorReady && this.customCursor && this.customCursor.active && this.customCursor.visible;
  }

  private createCustomCursorInThisScene() {
    // Create cursor sprite in this scene with maximum depth
    try {
      // Check if the grabber texture is available
      if (!this.textures.exists('grabber')) {

        this.input.setDefaultCursor('none');
        this.cursorReady = false;
        return;
      }
      
      this.customCursor = this.add.sprite(0, 0, 'grabber', 0);
      this.customCursor.setDepth(100000);
      this.customCursor.setScrollFactor(0);
      this.customCursor.setVisible(true);
      this.customCursor.setFlipY(true); // Match the Game scene cursor flip
      this.customCursor.setOrigin(0, 0); // Set origin to upper left corner
      
      this.cursorReady = true;
      
      // Set up pointer tracking for this scene only after cursor is ready
      this.setupCursorInputHandlers();
      
    } catch (error) {

      // Fallback: hide default cursor but don't create custom one
      this.input.setDefaultCursor('none');
      this.cursorReady = false;
    }
  }

  private setupCursorInputHandlers() {
    // Set up pointer tracking for this scene
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isCursorReady()) {
        this.customCursor.setPosition(pointer.x, pointer.y);
      }
    });
    
    this.input.on('pointerdown', () => {
      if (this.isCursorReady()) {
        this.customCursor.setFrame(1); // Clicking state
      }
    });
    
    this.input.on('pointerup', () => {
      if (this.isCursorReady()) {
        this.customCursor.setFrame(0); // Normal state
      }
    });
  }

  private createCatalogGrid() {
    const startY = 120;
    const itemsPerRow = 6; // 6 items per row for good spacing
    const itemWidth = 120; // Width of each grid cell
    const itemHeight = 80; // Height of each grid cell
    const startX = (this.scale.width - (itemsPerRow * itemWidth)) / 2; // Center the grid

    // Get all registered items from the asset manager
    const allItems = this.assetManager.getAllRegisteredItems();
    
    // Get all items from merge data as well
    const { RECIPES, TIER1, isHazard } = require('../config/mergeDataFull');
    const mergeItems = new Set<string>();
    
    // Add all tier 1 items
    TIER1.forEach((item: string) => mergeItems.add(item));
    
    // Add all recipe results
    Object.values(RECIPES).forEach((result: any) => mergeItems.add(result as string));
    
    // Add all recipe ingredients
    Object.keys(RECIPES).forEach((recipe: string) => {
      const [itemA, itemB] = recipe.split('+');
      mergeItems.add(itemA);
      mergeItems.add(itemB);
    });
    
    // Add known hazards that might not be in recipes
    const knownHazards = [
      "Hazard: Shocking Puddle",
      "Hazard: Short Circuit", 
      "Hazard: Corrosive Bristles",
      "Soggy Paper (Hazard: Slippery)",
      "Coolant Spill",
      "Steam Burst",
      "Air Zap Trap",
      "Static Sock Trap",
      "Stasis Snare",
      "Bubble Cyclone"
    ];
    knownHazards.forEach(hazard => mergeItems.add(hazard));
    
    // Combine asset manager items with merge data items
    const combinedItems = new Set([...allItems, ...Array.from(mergeItems)]);
    
    // Filter out trigger items and toilet
    const catalogItems = Array.from(combinedItems)
      .filter(itemName => 
        !itemName.startsWith("Trigger:") && 
        itemName !== "Toilet"
      )
      .sort();

    let currentX = startX;
    let currentY = startY;
    let itemsInCurrentRow = 0;

    catalogItems.forEach((itemName, index) => {
      // Create item container
      const itemContainer = this.add.container(currentX + itemWidth/2, currentY + itemHeight/2);
      this.catalogContainer.add(itemContainer);

      // Create item sprite (32x32 as requested)
      const sprite = this.createItemSprite(0, -10, itemName);
      if (sprite) {
        itemContainer.add(sprite);
      } else {
        // Fallback rectangle if no sprite available - use different colors for different item types
        let rectColor = 0x999999; // Default gray
        
        if (itemName.startsWith("Enemy:")) {
          rectColor = 0xff4444; // Red for enemies
        } else if (isHazard(itemName)) {
          rectColor = 0xff8800; // Orange for hazards (using improved detection)
        } else if (itemName.startsWith("Trigger:")) {
          rectColor = 0x4444ff; // Blue for triggers
        } else {
          // Check tier for other items
          const { getTier } = require('../config/mergeDataFull');
          const tier = getTier(itemName);
          if (tier === 1) {
            rectColor = 0x00ff00; // Green for tier 1
          } else if (tier === 2) {
            rectColor = 0x0088ff; // Light blue for tier 2
          } else if (tier >= 3) {
            rectColor = 0x8800ff; // Purple for tier 3+
          }
        }
        
        const rect = this.add.rectangle(0, -10, 32, 32, rectColor);
        rect.setStrokeStyle(1, 0x222222);
        itemContainer.add(rect);
      }

      // Create item name text (font size 16 as requested)
      const nameText = this.add.text(0, 25, itemName, {
        fontSize: "16px",
        color: "#ffffff",
        wordWrap: { width: itemWidth - 10 },
        align: "center"
      });
      nameText.setOrigin(0.5);
      itemContainer.add(nameText);

      // Update position for next item
      itemsInCurrentRow++;
      if (itemsInCurrentRow >= itemsPerRow) {
        // Move to next row
        currentX = startX;
        currentY += itemHeight;
        itemsInCurrentRow = 0;
      } else {
        // Move to next column
        currentX += itemWidth;
      }
    });

    // Calculate total height for scrolling
    const totalRows = Math.ceil(catalogItems.length / itemsPerRow);
    const totalHeight = startY + (totalRows * itemHeight) + 40;
    
    // Set max scroll based on content height
    this.maxScrollY = Math.max(0, totalHeight - this.scale.height + 100);
  }

  private createItemSprite(x: number, y: number, itemName: string): Phaser.GameObjects.Sprite | null {
    // Try to create sprite using asset manager
    const sprite = this.assetManager.createSprite(itemName, x, y);
    
    if (sprite) {
      // Set to exactly 32x32 as requested
      sprite.setDisplaySize(32, 32);
      return sprite;
    }
    
    return null;
  }

  private setupInputHandlers() {
    // Close overlay with F8
    this.input.keyboard!.on('keydown-F8', () => {
      this.closeOverlay();
    });

    // Close with Escape
    this.input.keyboard!.on('keydown-ESC', () => {
      this.closeOverlay();
    });

    // Close when clicking background
    this.background.on('pointerdown', () => {
      this.closeOverlay();
    });
  }

  private setupScrolling() {
    // Mouse wheel scrolling
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
      const scrollAmount = deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + scrollAmount, 0, this.maxScrollY);
      this.catalogContainer.setY(-this.scrollY);
    });

    // Arrow key scrolling
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          this.scrollY = Phaser.Math.Clamp(this.scrollY - 30, 0, this.maxScrollY);
          this.catalogContainer.setY(-this.scrollY);
          break;
        case 'ArrowDown':
          this.scrollY = Phaser.Math.Clamp(this.scrollY + 30, 0, this.maxScrollY);
          this.catalogContainer.setY(-this.scrollY);
          break;
      }
    });
  }

  private closeOverlay() {
    // Destroy cursor in this scene
    if (this.isCursorReady()) {
      this.customCursor.destroy();
    }
    this.customCursor = null!;
    this.cursorReady = false;
    
    this.scene.resume('Game');
    
    // Recreate cursor in Game scene
    const gameScene = this.scene.get('Game') as any;
    if (gameScene && gameScene.recreateCustomCursor) {
      gameScene.recreateCustomCursor();
    }
    
    this.scene.stop();
  }
}
