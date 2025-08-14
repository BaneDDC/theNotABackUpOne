
// src/game/scenes/RecipeOverlay.ts

import { Scene } from "phaser";
import { RECIPES, TIER1, getTier } from "../config/mergeDataFull";
import { AssetManager } from "../objects/AssetManager";

export class RecipeOverlay extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private recipeContainer!: Phaser.GameObjects.Container;
  private assetManager!: AssetManager;

  constructor() {
    super("RecipeOverlay");
  }

  create() {
    // Ensure custom cursor works in this scene by hiding default cursor
    this.input.setDefaultCursor('none')
    
    // Create cursor in THIS scene instead of trying to recreate in Game scene
    this.createCustomCursorInThisScene();
    
    // Initialize asset manager for loading item sprites
    this.assetManager = new AssetManager(this);
    
    // Create semi-transparent background
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.setInteractive();
    this.background.setDepth(1000);

    // Create main container for recipes
    this.recipeContainer = this.add.container(0, 0);
    this.recipeContainer.setDepth(1001);

    // Create title
    const title = this.add.text(this.scale.width / 2, 40, "MERGE RECIPES", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.recipeContainer.add(title);

    // Create close instruction
    const closeText = this.add.text(this.scale.width / 2, 80, "Press Ctrl+Shift+I to close", {
      fontSize: "16px",
      color: "#cccccc"
    }).setOrigin(0.5);
    this.recipeContainer.add(closeText);

    // Load assets first, then create recipe list
    this.assetManager.loadAllAssets().then(() => {
      this.createRecipeList();
    });

    // Setup input handlers
    this.setupInputHandlers();

    // Setup scroll
    this.setupScrolling();
  }

  private createCustomCursorInThisScene() {
    // Create cursor sprite in this scene with maximum depth
    const cursor = this.add.sprite(0, 0, 'grabber', 0);
    cursor.setDepth(100000); // Increased from 50000 to 100000
    cursor.setScrollFactor(0);
    cursor.setVisible(true);
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
  }

  private createRecipeList() {
    const startY = 120;
    let currentY = startY;
    const leftColumn = this.scale.width * 0.25;
    const rightColumn = this.scale.width * 0.75;
    const lineHeight = 60; // Increased to accommodate sprites

    // Group recipes by tier
    const recipesByTier: { [key: number]: string[] } = {};
    
    Object.entries(RECIPES).forEach(([recipe, result]) => {
      const tier = getTier(result);
      if (!recipesByTier[tier]) {
        recipesByTier[tier] = [];
      }
      recipesByTier[tier].push(`${recipe} → ${result}`);
    });

    // Display recipes by tier
    const sortedTiers = Object.keys(recipesByTier).map(Number).sort((a, b) => a - b);
    
    sortedTiers.forEach(tier => {
      // Tier header
      const tierHeader = this.add.text(this.scale.width / 2, currentY, `TIER ${tier}`, {
        fontSize: "24px",
        color: "#ffff00",
        fontStyle: "bold"
      }).setOrigin(0.5);
      this.recipeContainer.add(tierHeader);
      currentY += 40;

      // Recipes for this tier
      const recipes = recipesByTier[tier].sort();
      recipes.forEach((recipe, index) => {
        const [ingredients, result] = recipe.split(" → ");
        const [itemA, itemB] = ingredients.split("+");
        
        // Use alternating columns for better space usage
        const x = index % 2 === 0 ? leftColumn : rightColumn;
        const y = currentY + Math.floor(index / 2) * lineHeight;

        this.createRecipeEntry(x, y, itemA, itemB, result);
      });

      currentY += Math.ceil(recipes.length / 2) * lineHeight + 20;
    });

    // Add Tier 1 items section
    currentY += 20;
    const tier1Header = this.add.text(this.scale.width / 2, currentY, "TIER 1 BASE ITEMS", {
      fontSize: "24px",
      color: "#ffff00",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.recipeContainer.add(tier1Header);
    currentY += 40;

    // Display Tier 1 items in columns with sprites
    TIER1.forEach((item, index) => {
      const x = (index % 3) * (this.scale.width / 3) + (this.scale.width / 6);
      const y = currentY + Math.floor(index / 3) * 50; // Increased spacing for sprites

      this.createTier1Entry(x, y, item);
    });

    currentY += Math.ceil(TIER1.length / 3) * 50 + 40;

    // Set max scroll based on content height
    this.maxScrollY = Math.max(0, currentY - this.scale.height + 100);
  }

  private createRecipeEntry(x: number, y: number, itemA: string, itemB: string, result: string) {
    // Create sprites for ingredients
    const spriteA = this.createItemSprite(x - 80, y, itemA);
    const spriteB = this.createItemSprite(x - 40, y, itemB);
    
    // Plus sign
    const plusText = this.add.text(x - 20, y, "+", {
      fontSize: "16px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.recipeContainer.add(plusText);

    // Arrow
    const arrow = this.add.text(x, y, "→", {
      fontSize: "16px",
      color: "#00ff00"
    }).setOrigin(0.5);
    this.recipeContainer.add(arrow);

    // Result sprite and text
    const resultSprite = this.createItemSprite(x + 20, y, result);
    const resultText = this.add.text(x + 50, y, result, {
      fontSize: "12px",
      color: "#00ffff",
      wordWrap: { width: 120 }
    }).setOrigin(0, 0.5);
    this.recipeContainer.add(resultText);

    // Add sprites to container if they were created
    if (spriteA) this.recipeContainer.add(spriteA);
    if (spriteB) this.recipeContainer.add(spriteB);
    if (resultSprite) this.recipeContainer.add(resultSprite);
  }

  private createTier1Entry(x: number, y: number, item: string) {
    // Create sprite for tier 1 item
    const sprite = this.createItemSprite(x, y - 10, item);
    
    // Item name text
    const itemText = this.add.text(x, y + 15, item, {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: 100 }
    }).setOrigin(0.5);
    this.recipeContainer.add(itemText);

    // Add sprite to container if it was created
    if (sprite) this.recipeContainer.add(sprite);
  }

  private createItemSprite(x: number, y: number, itemName: string): Phaser.GameObjects.Sprite | null {
    // Try to create sprite using asset manager
    const sprite = this.assetManager.createSprite(itemName, x, y);
    
    if (sprite) {
      // Scale down for recipe display
      sprite.setScale(0.3);
      return sprite;
    } else {
      // Fallback to colored rectangle if no asset available
      const rect = this.add.rectangle(x, y, 20, 20, 0x999999);
      rect.setStrokeStyle(1, 0x222222);
      this.recipeContainer.add(rect);
      return null;
    }
  }

  private setupInputHandlers() {
    // Close overlay with Ctrl+Shift+I
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        this.closeOverlay();
      }
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
      this.recipeContainer.setY(-this.scrollY);
    });

    // Arrow key scrolling
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          this.scrollY = Phaser.Math.Clamp(this.scrollY - 30, 0, this.maxScrollY);
          this.recipeContainer.setY(-this.scrollY);
          break;
        case 'ArrowDown':
          this.scrollY = Phaser.Math.Clamp(this.scrollY + 30, 0, this.maxScrollY);
          this.recipeContainer.setY(-this.scrollY);
          break;
      }
    });
  }

  private closeOverlay() {
    // Destroy cursor in this scene
    if ((this as any).customCursor) {
      (this as any).customCursor.destroy();
      (this as any).customCursor = null;
    }
    
    this.scene.resume('Game');
    
    // Recreate cursor in Game scene
    const gameScene = this.scene.get('Game') as any;
    if (gameScene && gameScene.recreateCustomCursor) {
      gameScene.recreateCustomCursor();
    }
    
    this.scene.stop();
  }
}
