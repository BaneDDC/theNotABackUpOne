
// src/game/objects/StoreManager.ts

import { Scene } from 'phaser';

export class StoreManager {
  private scene: Scene;
  private storeContainer!: Phaser.GameObjects.Container;
  private storeBackground!: Phaser.GameObjects.Sprite;
  private isStoreOpen: boolean = false;
  private customCursor!: Phaser.GameObjects.Sprite;
  private closeButton!: Phaser.GameObjects.Container;
  
  // Free placement system properties
  private placementContainer!: Phaser.GameObjects.Container;
  private placedItems: Array<{
    container: Phaser.GameObjects.Container;
    x: number;
    y: number;
    width: number;
    height: number;
    itemName: string;
    itemNumber: number;
  }> = [];
  private controlsContainer!: Phaser.GameObjects.Container;
  private isDraggingItem: boolean = false;
  private draggedItem: any = null;
  private nextItemNumber: number = 1;
  private selectedItem: any = null; // Add selected item tracking
  private isUIVisible: boolean = false; // Add UI visibility toggle

  constructor(scene: Scene) {
    this.scene = scene;
    this.createStoreUI();
  }

  private createStoreUI() {
    // Create main container for the store
    this.storeContainer = this.scene.add.container(0, 0);
    this.storeContainer.setDepth(5000);
    this.storeContainer.setVisible(false);

    // Create store background
    this.storeBackground = this.scene.add.sprite(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      'store'
    );
    
    this.storeBackground.setDisplaySize(this.scene.scale.width, this.scene.scale.height);
    this.storeBackground.setOrigin(0.5);
    this.storeContainer.add(this.storeBackground);
    this.storeBackground.setInteractive();

    // Create placement system
    this.createPlacementSystem();

    // Create close button
    this.createCloseButton();

    // Setup input handlers
    this.setupInputHandlers();
  }

  private createPlacementSystem() {
    // Create placement container - this will hold all placed items
    this.placementContainer = this.scene.add.container(0, 0);
    this.storeContainer.add(this.placementContainer);

    // Create controls
    this.createPlacementControls();

    // Add some sample items
    this.addSampleItems();
  }

  private createPlacementControls() {
    this.controlsContainer = this.scene.add.container(20, 20);
    this.storeContainer.add(this.controlsContainer);

    // Background for controls - smaller now
    const controlsBg = this.scene.add.graphics();
    controlsBg.fillStyle(0x000000, 0.8);
    controlsBg.fillRoundedRect(0, 0, 350, 280, 8); // Reduced height
    this.controlsContainer.add(controlsBg);

    // Title
    const title = this.scene.add.text(10, 10, 'Free Placement Store', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.controlsContainer.add(title);

    // Instructions
    const instructions = this.scene.add.text(10, 40, 
      'Press = key to toggle this UI\n' +
      'Click to place items anywhere!\n' +
      'Drag existing items to move them.\n' +
      'Mouse wheel on items to resize them.\n' +
      'Items are automatically numbered.', {
      fontSize: '12px',
      color: '#cccccc',
      lineSpacing: 4
    });
    this.controlsContainer.add(instructions);

    // Add Item button
    this.createAddItemButton();

    // Item counter
    this.createItemCounter();

    // Control buttons
    this.createControlButtons();

    // Hide UI by default
    this.controlsContainer.setVisible(false);
  }

  private createAddItemButton() {
    const buttonY = 100;
    
    // Add Item button
    const addButton = this.scene.add.graphics();
    addButton.fillStyle(0x27ae60, 0.8);
    addButton.fillRoundedRect(10, buttonY, 100, 30, 4);
    this.controlsContainer.add(addButton);

    const addText = this.scene.add.text(60, buttonY + 15, 'ADD ITEM', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    addText.setOrigin(0.5);
    this.controlsContainer.add(addText);

    addButton.setInteractive(new Phaser.Geom.Rectangle(10, buttonY, 100, 30), Phaser.Geom.Rectangle.Contains);
    addButton.on('pointerdown', () => this.addNewItem());

    // Hover effect
    addButton.on('pointerover', () => {
      addButton.clear();
      addButton.fillStyle(0x2ecc71, 0.8);
      addButton.fillRoundedRect(10, buttonY, 100, 30, 4);
    });

    addButton.on('pointerout', () => {
      addButton.clear();
      addButton.fillStyle(0x27ae60, 0.8);
      addButton.fillRoundedRect(10, buttonY, 100, 30, 4);
    });
  }

  private createItemCounter() {
    const counterY = 140;
    
    // Item count display
    const counterText = this.scene.add.text(10, counterY, `Items: ${this.placedItems.length}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.controlsContainer.add(counterText);

    // Store reference for updates
    (this as any).itemCounterText = counterText;
  }

  private createControlButtons() {
    const buttonY = 170;

    // Save button
    const saveBtn = this.scene.add.graphics();
    saveBtn.fillStyle(0x3498db, 0.8);
    saveBtn.fillRoundedRect(10, buttonY, 80, 25, 4);
    this.controlsContainer.add(saveBtn);

    const saveText = this.scene.add.text(50, buttonY + 12, 'SAVE', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    saveText.setOrigin(0.5);
    this.controlsContainer.add(saveText);

    saveBtn.setInteractive(new Phaser.Geom.Rectangle(10, buttonY, 80, 25), Phaser.Geom.Rectangle.Contains);
    saveBtn.on('pointerdown', () => this.saveConfiguration());

    // Load button
    const loadBtn = this.scene.add.graphics();
    loadBtn.fillStyle(0x9b59b6, 0.8);
    loadBtn.fillRoundedRect(100, buttonY, 80, 25, 4);
    this.controlsContainer.add(loadBtn);

    const loadText = this.scene.add.text(140, buttonY + 12, 'LOAD', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    loadText.setOrigin(0.5);
    this.controlsContainer.add(loadText);

    loadBtn.setInteractive(new Phaser.Geom.Rectangle(100, buttonY, 80, 25), Phaser.Geom.Rectangle.Contains);
    loadBtn.on('pointerdown', () => this.loadConfiguration());

    // Clear button
    const clearBtn = this.scene.add.graphics();
    clearBtn.fillStyle(0xe74c3c, 0.8);
    clearBtn.fillRoundedRect(190, buttonY, 80, 25, 4);
    this.controlsContainer.add(clearBtn);

    const clearText = this.scene.add.text(230, buttonY + 12, 'CLEAR', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    clearText.setOrigin(0.5);
    this.controlsContainer.add(clearText);

    clearBtn.setInteractive(new Phaser.Geom.Rectangle(190, buttonY, 80, 25), Phaser.Geom.Rectangle.Contains);
    clearBtn.on('pointerdown', () => this.clearAllItems());

    // Delete Mode button
    const deleteBtn = this.scene.add.graphics();
    deleteBtn.fillStyle(0xf39c12, 0.8);
    deleteBtn.fillRoundedRect(10, buttonY + 35, 120, 25, 4);
    this.controlsContainer.add(deleteBtn);

    const deleteText = this.scene.add.text(70, buttonY + 47, 'DELETE MODE', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    deleteText.setOrigin(0.5);
    this.controlsContainer.add(deleteText);

    deleteBtn.setInteractive(new Phaser.Geom.Rectangle(10, buttonY + 35, 120, 25), Phaser.Geom.Rectangle.Contains);
    deleteBtn.on('pointerdown', () => this.toggleDeleteMode());

    // Rename Mode button
    const renameBtn = this.scene.add.graphics();
    renameBtn.fillStyle(0x8e44ad, 0.8);
    renameBtn.fillRoundedRect(140, buttonY + 35, 120, 25, 4);
    this.controlsContainer.add(renameBtn);

    const renameText = this.scene.add.text(200, buttonY + 47, 'RENAME MODE', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    renameText.setOrigin(0.5);
    this.controlsContainer.add(renameText);

    renameBtn.setInteractive(new Phaser.Geom.Rectangle(140, buttonY + 35, 120, 25), Phaser.Geom.Rectangle.Contains);
    renameBtn.on('pointerdown', () => this.toggleRenameMode());

    // Store references
    (this as any).deleteButton = deleteBtn;
    (this as any).deleteButtonText = deleteText;
    (this as any).isDeleteMode = false;
    (this as any).renameButton = renameBtn;
    (this as any).renameButtonText = renameText;
    (this as any).isRenameMode = false;
  }

  private addSampleItems() {
    // Use predefined items configuration with recycler3 asset and goo costs
    const predefinedItems = [
      {
        name: "Recycler",
        x: 180,
        y: 211,
        width: 117,
        height: 117,
        itemNumber: 1,
        useAsset: true,
        assetKey: 'recycler3',
        gooCost: 10 // Add goo cost for Recycler
      },
      {
        name: "Item 3",
        x: 728,
        y: 209,
        width: 117,
        height: 117,
        itemNumber: 3
      },
      {
        name: "Item 4",
        x: 997,
        y: 211,
        width: 116,
        height: 116,
        itemNumber: 4
      },
      {
        name: "Item 5",
        x: 176,
        y: 381,
        width: 115,
        height: 115,
        itemNumber: 5
      },
      {
        name: "Item 6",
        x: 451,
        y: 378,
        width: 116,
        height: 116,
        itemNumber: 6
      },
      {
        name: "Item 7",
        x: 735,
        y: 381,
        width: 117,
        height: 117,
        itemNumber: 7
      },
      {
        name: "Item 8",
        x: 997,
        y: 384,
        width: 116,
        height: 116,
        itemNumber: 8
      },
      {
        name: "Goo-mba",
        x: 449,
        y: 211,
        width: 117,
        height: 117,
        itemNumber: 10,
        useAsset: true,
        assetKey: 'goomba',
        gooCost: 25 // Add goo cost for Goo-mba
      }
    ];

    // Create each predefined item with its specific properties
    predefinedItems.forEach(item => {
      if (item.useAsset && item.assetKey) {
        this.createPlacedItemWithAsset(item.x, item.y, item.name, item.width, item.height, item.assetKey, item.gooCost);
      } else {
        this.createPlacedItemWithSize(item.x, item.y, item.name, item.width, item.height);
      }
    });

    // Set the next item number to continue from the highest item number + 1
    this.nextItemNumber = 11;
  }

  private addNewItem() {
    // Add new item at center of screen
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    this.createPlacedItem(centerX, centerY, `Item ${this.nextItemNumber}`);
  }

  private createPlacedItem(x: number, y: number, itemName: string) {
    // Create placeholder sprite
    const sprite = this.scene.add.sprite(0, 0, '__WHITE');
    const defaultSize = 60;
    sprite.setDisplaySize(defaultSize, defaultSize);
    
    // Assign color based on item number for variety
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b, 0x6c5ce7, 0xa29bfe];
    const colorIndex = (this.nextItemNumber - 1) % colors.length;
    sprite.setTint(colors[colorIndex]);
    sprite.setOrigin(0.5);

    // Add item name text
    const nameText = this.scene.add.text(0, 40, itemName, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 }
    });
    nameText.setOrigin(0.5);

    // Create container for sprite and text at the specified position
    const itemContainer = this.scene.add.container(x, y);
    itemContainer.add([sprite, nameText]);

    // Make item interactive
    this.makeItemInteractive(itemContainer, itemName, defaultSize, defaultSize);

    // Add to placement container (which is already in store container)
    this.placementContainer.add(itemContainer);

    // Add to placed items array with size information
    const itemData = {
      container: itemContainer,
      x: x,
      y: y,
      width: defaultSize,
      height: defaultSize,
      itemName: itemName,
      itemNumber: this.nextItemNumber
    };
    
    this.placedItems.push(itemData);

    this.nextItemNumber++;
    this.updateItemCounter();
  }

  private makeItemInteractive(item: Phaser.GameObjects.Container, itemName: string, width: number, height: number) {
    item.setSize(width, height);
    item.setInteractive();

    let startX = 0;
    let startY = 0;

    item.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if in delete mode
      if ((this as any).isDeleteMode) {
        this.deleteItem(item);
        return;
      }

      // Check if in rename mode
      if ((this as any).isRenameMode) {
        this.selectItemForRename(item);
        return;
      }

      // Normal drag mode
      this.isDraggingItem = true;
      this.draggedItem = item;
      
      // Store starting position for dragging
      startX = pointer.x;
      startY = pointer.y;
      
      // Bring to front
      this.placementContainer.bringToTop(item);
      
      // Visual feedback
      item.setScale(1.1);
      item.setAlpha(0.8);
    });

    // Mouse wheel resize functionality
    item.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      const itemData = this.getItemData(item);
      if (!itemData) return;

      // Calculate resize factor based on wheel direction
      const resizeFactor = deltaY > 0 ? 0.9 : 1.1; // Scroll down = smaller, scroll up = bigger
      
      // Calculate new size
      let newWidth = itemData.width * resizeFactor;
      let newHeight = itemData.height * resizeFactor;
      
      // Ensure minimum and maximum size limits
      newWidth = Math.max(20, Math.min(200, newWidth));
      newHeight = Math.max(20, Math.min(200, newHeight));
      
      // Update the sprite size
      const sprite = item.list[0] as Phaser.GameObjects.Sprite;
      const text = item.list[1] as Phaser.GameObjects.Text;
      
      sprite.setDisplaySize(newWidth, newHeight);
      
      // Update text position to stay below the sprite
      text.setPosition(0, newHeight / 2 + 10);
      
      // Update item data
      itemData.width = newWidth;
      itemData.height = newHeight;
      
      // Update container size
      item.setSize(newWidth, newHeight);
      
      // Prevent event from bubbling to background
      pointer.event.stopPropagation();
    });

    // Use scene-level pointer events for better drag handling
    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingItem && this.draggedItem === item && this.isStoreOpen) {
        // Calculate movement delta
        const deltaX = pointer.x - startX;
        const deltaY = pointer.y - startY;
        
        // Update item position
        item.x += deltaX;
        item.y += deltaY;
        
        // Update start position for next frame
        startX = pointer.x;
        startY = pointer.y;
        
        // Update position in placedItems array
        const itemData = this.placedItems.find(placedItem => placedItem.container === item);
        if (itemData) {
          itemData.x = item.x;
          itemData.y = item.y;
        }
      }
    };

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingItem && this.draggedItem === item) {
        this.isDraggingItem = false;
        
        // Reset visual feedback
        item.setScale(1.0);
        item.setAlpha(1.0);
        
        this.draggedItem = null;
      }
    };

    // Store references to remove later
    (item as any).onPointerMove = onPointerMove;
    (item as any).onPointerUp = onPointerUp;

    // Add scene-level listeners
    this.scene.input.on('pointermove', onPointerMove);
    this.scene.input.on('pointerup', onPointerUp);
  }

  private getItemData(container: Phaser.GameObjects.Container) {
    return this.placedItems.find(item => item.container === container);
  }

  private deleteItem(item: Phaser.GameObjects.Container) {
    // Find and remove from placedItems array
    const index = this.placedItems.findIndex(placedItem => placedItem.container === item);
    if (index > -1) {
      this.placedItems.splice(index, 1);
    }

    // Remove scene-level listeners
    if ((item as any).onPointerMove) {
      this.scene.input.off('pointermove', (item as any).onPointerMove);
    }
    if ((item as any).onPointerUp) {
      this.scene.input.off('pointerup', (item as any).onPointerUp);
    }

    // Destroy the item
    item.destroy();
    this.updateItemCounter();
    
    // Show feedback
    this.showNotification('Item deleted!', 0xe74c3c);
  }

  private toggleDeleteMode() {
    (this as any).isDeleteMode = !(this as any).isDeleteMode;
    
    // Update button appearance
    const deleteBtn = (this as any).deleteButton;
    const deleteText = (this as any).deleteButtonText;
    
    deleteBtn.clear();
    if ((this as any).isDeleteMode) {
      deleteBtn.fillStyle(0xe74c3c, 0.8);
      deleteText.setText('EXIT DELETE');
      this.showNotification('Delete mode ON - Click items to delete', 0xe74c3c);
    } else {
      deleteBtn.fillStyle(0xf39c12, 0.8);
      deleteText.setText('DELETE MODE');
      this.showNotification('Delete mode OFF', 0x27ae60);
    }
    deleteBtn.fillRoundedRect(10, 205, 120, 25, 4);
  }

  private updateItemCounter() {
    const counterText = (this as any).itemCounterText;
    if (counterText) {
      counterText.setText(`Items: ${this.placedItems.length}`);
    }
  }

  private clearAllItems() {
    // Remove all scene-level listeners
    this.placedItems.forEach(item => {
      if ((item.container as any).onPointerMove) {
        this.scene.input.off('pointermove', (item.container as any).onPointerMove);
      }
      if ((item.container as any).onPointerUp) {
        this.scene.input.off('pointerup', (item.container as any).onPointerUp);
      }
      item.container.destroy();
    });

    this.placedItems = [];
    this.nextItemNumber = 1;
    this.updateItemCounter();
    this.showNotification('All items cleared!', 0xf39c12);
  }

  private selectItemForRename(item: Phaser.GameObjects.Container) {
    // Clear previous selection
    this.clearSelection();
    
    // Find item data
    const itemData = this.getItemData(item);
    if (!itemData) return;
    
    this.selectedItem = itemData;
    
    // Visual feedback for selection
    item.setScale(1.05);
    
    // Get the sprite (first child) and apply tint to it
    const sprite = item.list[0] as Phaser.GameObjects.Sprite;
    if (sprite && sprite.setTint) {
      sprite.setTint(0x8e44ad); // Purple tint for selected item in rename mode
    }
    
    // Show rename dialog
    this.showRenameDialog(itemData);
  }

  private clearSelection() {
    if (this.selectedItem) {
      // Reset visual feedback
      this.selectedItem.container.setScale(1.0);
      
      // Get the sprite (first child) and reset tint
      const sprite = this.selectedItem.container.list[0] as Phaser.GameObjects.Sprite;
      if (sprite && sprite.setTint) {
        sprite.setTint(0xffffff); // Reset to normal
      }
      
      this.selectedItem = null;
    }
  }

  private showRenameDialog(itemData: any) {
    // Temporarily disable Phaser input to prevent conflicts
    this.scene.input.enabled = false;
    
    // Create a temporary HTML input element for better text editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = itemData.itemName;
    input.style.position = 'fixed';
    input.style.top = '50%';
    input.style.left = '50%';
    input.style.transform = 'translate(-50%, -50%)';
    input.style.zIndex = '10000';
    input.style.padding = '15px';
    input.style.fontSize = '18px';
    input.style.border = '3px solid #8e44ad';
    input.style.borderRadius = '8px';
    input.style.backgroundColor = '#ffffff';
    input.style.color = '#000000';
    input.style.width = '400px';
    input.style.outline = 'none';
    input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    
    // Create a backdrop
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    backdrop.style.zIndex = '9999';
    
    // Create instruction text
    const instructions = document.createElement('div');
    instructions.style.position = 'fixed';
    instructions.style.top = 'calc(50% + 60px)';
    instructions.style.left = '50%';
    instructions.style.transform = 'translateX(-50%)';
    instructions.style.color = '#ffffff';
    instructions.style.fontSize = '14px';
    instructions.style.textAlign = 'center';
    instructions.style.zIndex = '10001';
    instructions.innerHTML = 'Press ENTER to save • Press ESCAPE to cancel';
    
    // Add elements to page
    document.body.appendChild(backdrop);
    document.body.appendChild(input);
    document.body.appendChild(instructions);
    
    // Focus and select all text after a brief delay
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
    
    // Handle input completion
    const handleComplete = (save: boolean) => {
      // Re-enable Phaser input
      this.scene.input.enabled = true;
      
      if (save && input.value.trim() !== '') {
        const newName = input.value.trim();
        itemData.itemName = newName;
        
        // Update the text display
        const text = itemData.container.list[1] as Phaser.GameObjects.Text;
        if (text) {
          text.setText(newName);
        }
        
        this.showNotification(`Renamed to: ${newName}`, 0x8e44ad);
      }
      
      // Clear selection
      this.clearSelection();
      
      // Clean up
      if (document.body.contains(input)) document.body.removeChild(input);
      if (document.body.contains(backdrop)) document.body.removeChild(backdrop);
      if (document.body.contains(instructions)) document.body.removeChild(instructions);
    };
    
    // Handle Enter key (save)
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // Prevent Phaser from handling this
      
      if (e.key === 'Enter') {
        e.preventDefault();
        handleComplete(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleComplete(false);
      }
    });
    
    // Prevent other key events from reaching Phaser
    input.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    
    input.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });
    
    // Handle clicking outside (cancel)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleComplete(false);
      }
    });
  }

  private toggleRenameMode() {
    (this as any).isRenameMode = !(this as any).isRenameMode;
    
    // Update button appearance
    const renameBtn = (this as any).renameButton;
    const renameText = (this as any).renameButtonText;
    
    renameBtn.clear();
    if ((this as any).isRenameMode) {
      renameBtn.fillStyle(0xad6bad, 0.8);
      renameText.setText('EXIT RENAME');
      this.showNotification('Rename mode ON - Click items to rename', 0x8e44ad);
    } else {
      renameBtn.fillStyle(0x8e44ad, 0.8);
      renameText.setText('RENAME MODE');
      this.showNotification('Rename mode OFF', 0x27ae60);
      this.clearSelection(); // Clear selection when exiting rename mode
    }
    renameBtn.fillRoundedRect(140, 205, 120, 25, 4);
  }

  private saveConfiguration() {
    const config = {
      items: this.placedItems.map(item => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        itemName: item.itemName,
        itemNumber: item.itemNumber
      })),
      nextItemNumber: this.nextItemNumber
    };

    localStorage.setItem('storeConfiguration', JSON.stringify(config));
    
    // Log detailed information to console for permanent positioning




    
    this.placedItems.forEach((item, index) => {


      // Position and size info
      // Scale info
      
      // Get the sprite color/tint if available
      const sprite = item.container.list[0] as Phaser.GameObjects.Sprite;
      if (sprite && sprite.tint !== 0xffffff) {
        // Tint color info
      }
    });
    
    // Also log as a formatted JSON for easy copying

    // JSON config data
    
    // Log as JavaScript object format for direct code use


    this.placedItems.forEach((item, index) => {
      const isLast = index === this.placedItems.length - 1;


      // Item position and size data


    });

    

    
    this.showNotification('Configuration saved! Check console for detailed data.', 0x27ae60);
  }

  private loadConfiguration() {
    const savedConfig = localStorage.getItem('storeConfiguration');
    if (!savedConfig) {
      this.showNotification('No saved configuration found!', 0xe74c3c);
      return;
    }

    try {
      const config = JSON.parse(savedConfig);
      
      // Clear existing items
      this.clearAllItems();
      
      // Load saved items with their sizes
      config.items.forEach((itemData: any) => {
        this.createPlacedItemWithSize(itemData.x, itemData.y, itemData.itemName, itemData.width || 60, itemData.height || 60);
      });
      
      this.nextItemNumber = config.nextItemNumber || this.placedItems.length + 1;
      this.showNotification('Configuration loaded!', 0x27ae60);
    } catch (error) {
      this.showNotification('Error loading configuration!', 0xe74c3c);
    }
  }

  private createPlacedItemWithSize(x: number, y: number, itemName: string, width: number, height: number) {
    const container = this.scene.add.container(x, y);
    
    // Create background rectangle
    const background = this.scene.add.rectangle(0, 0, width, height, 0x3498db, 0.3);
    background.setStrokeStyle(2, 0x2980b9);
    container.add(background);
    
    // Create text label
    const text = this.scene.add.text(0, 0, itemName, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 },
      wordWrap: { width: width - 10 }
    });
    text.setOrigin(0.5);
    container.add(text);
    
    // Set depth to appear above background but below other UI
    container.setDepth(10);
    
    // Hide by default since UI starts hidden
    container.setVisible(this.isUIVisible);
    
    // Make interactive for dragging
    container.setSize(width, height);
    container.setInteractive({ draggable: true });
    
    // Store item data
    const itemData = {
      container: container,
      x: x,
      y: y,
      width: width,
      height: height,
      itemName: itemName,
      itemNumber: this.nextItemNumber++
    };
    
    this.placedItems.push(itemData);
    this.storeContainer.add(container);
    
    // Set up drag handlers
    this.setupItemDragHandlers(container, itemData);
    
    return itemData;
  }

  private createPlacedItemWithAsset(x: number, y: number, itemName: string, width: number, height: number, assetKey: string, gooCost?: number) {
    const container = this.scene.add.container(x, y);
    
    // Create sprite using the provided asset instead of background rectangle
    const sprite = this.scene.add.sprite(0, 0, assetKey);
    sprite.setDisplaySize(width, height);
    container.add(sprite);
    
    // Create text label positioned below the sprite
    let labelText = itemName;
    if (gooCost !== undefined) {
      labelText += `\n${gooCost} Goo`;
    }
    
    const text = this.scene.add.text(0, height/2 + 15, labelText, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 },
      wordWrap: { width: width - 10 },
      align: 'center'
    });
    text.setOrigin(0.5);
    container.add(text);
    
    // Set depth to appear above background but below other UI
    container.setDepth(10);
    
    // Hide by default since UI starts hidden
    container.setVisible(this.isUIVisible);
    
    // Make interactive for purchasing if it has a cost
    if (gooCost !== undefined) {
      container.setSize(width, height);
      container.setInteractive({ draggable: false }); // Not draggable, just clickable
      
      // Add click handler for purchasing
      container.on('pointerdown', () => {
        this.attemptPurchase(itemName, gooCost);
      });
      
      // Add hover effect for purchasable items
      container.on('pointerover', () => {
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      container.on('pointerout', () => {
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
    } else {
      // Make interactive for dragging if no cost (free placement items)
      container.setSize(width, height);
      container.setInteractive({ draggable: true });
      this.setupItemDragHandlers(container, {
        container: container,
        x: x,
        y: y,
        width: width,
        height: height,
        itemName: itemName,
        itemNumber: this.nextItemNumber++
      });
    }
    
    // Store item data
    const itemData = {
      container: container,
      x: x,
      y: y,
      width: width,
      height: height,
      itemName: itemName,
      itemNumber: this.nextItemNumber++,
      gooCost: gooCost
    };
    
    this.placedItems.push(itemData);
    this.storeContainer.add(container);
    
    return itemData;
  }

  private attemptPurchase(itemName: string, cost: number) {
    // Get the goo counter from the Game scene
    const gameScene = this.scene as any;
    const gooCounter = gameScene.gooCounter;
    
    if (!gooCounter) {
      this.showNotification('Goo counter not available!', 0xe74c3c);
      return;
    }
    
    const currentGoo = gooCounter.getGooCount();
    
    if (currentGoo < cost) {
      this.showNotification(`Not enough Goo! Need ${cost}, have ${currentGoo}`, 0xe74c3c);
      return;
    }
    
    // Deduct the cost
    gooCounter.setGooCount(currentGoo - cost);
    
    // Spawn the purchased item in the game world
    this.spawnPurchasedItem(itemName);
    
    // Show success notification
    this.showNotification(`Purchased ${itemName} for ${cost} Goo!`, 0x27ae60);
  }
  
  private spawnPurchasedItem(itemName: string) {
    // Get the merge system to spawn the item
    const gameScene = this.scene as any;
    
    // Special handling for Recycler purchase
    if (itemName === 'Recycler') {
      // Show the trash recycler in the game scene instead of spawning as an item
      this.showTrashRecycler(gameScene);
      return;
    }
    
    // Special handling for Goo-mba purchase
    if (itemName === 'Goo-mba') {
      // Spawn the Goo-mba in the game scene using the goomba asset
      this.spawnGoomba(gameScene);
      return;
    }
    
    const merge = gameScene.getMergeSystem ? gameScene.getMergeSystem() : null;
    
    if (!merge) {

      return;
    }
    
    // Calculate spawn position - center of the game area
    const spawnX = this.scene.scale.width / 2;
    const spawnY = this.scene.scale.height / 2;
    
    // Spawn the item using the merge system
    const spawnedItem = merge.items.spawn(itemName, spawnX, spawnY);
    
    if (spawnedItem) {
      // Add a special effect to show it was purchased
      this.scene.tweens.add({
        targets: spawnedItem,
        scaleX: 0,
        scaleY: 0,
        duration: 0,
        onComplete: () => {
          this.scene.tweens.add({
            targets: spawnedItem,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut'
          });
        }
      });
      
      // Add golden glow effect - check if setTint method exists
      if (spawnedItem && typeof spawnedItem.setTint === 'function') {
        this.scene.tweens.add({
          targets: spawnedItem,
          tint: 0xffd700, // Gold tint
          duration: 300,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            if (spawnedItem && spawnedItem.active && typeof spawnedItem.setTint === 'function') {
              spawnedItem.setTint(0xffffff); // Reset to normal
            }
          }
        });
      } else {
        // Fallback visual effect if setTint is not available
        this.scene.tweens.add({
          targets: spawnedItem,
          alpha: 0.7,
          duration: 300,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            if (spawnedItem && spawnedItem.active) {
              spawnedItem.setAlpha(1); // Reset to normal
            }
          }
        });
      }
    }
  }

  private spawnGoomba(gameScene: any) {
    // Calculate spawn position - center of the game area
    const spawnX = this.scene.scale.width / 2;
    const spawnY = this.scene.scale.height / 2;
    
    // Create the Goo-mba sprite using the goomba asset
    const goomba = this.scene.add.sprite(spawnX, spawnY, 'goomba');
    goomba.setScale(0.10); // Increased from 0.08 to 0.10 to make it larger
    goomba.setDepth(-0.5); // Changed from -1.5 to -0.5 to be in front of toilet (-1) and towel (-1)
    
    // Add physics to make it interactive
    this.scene.physics.add.existing(goomba);
    
    // Make it draggable like other items
    goomba.setInteractive({ draggable: true });
    this.scene.input.setDraggable(goomba);
    
    // Set item name for merge system compatibility
    (goomba as any).itemName = 'Goo-mba';
    
    // Add patrol properties
    (goomba as any).isPatrolling = false;
    (goomba as any).patrolSpeed = 50; // Pixels per second
    (goomba as any).patrolDirection = 1; // 1 for right, -1 for left
    (goomba as any).patrolBounds = {
      left: 100,
      right: this.scene.scale.width - 100
    };
    
    // Add goo collection properties
    (goomba as any).isCollectingGoo = false;
    (goomba as any).collectionRange = 60; // Range to detect goo splatters
    (goomba as any).collectionTimer = null;
    (goomba as any).suckingAnimation = null;
    
    // Add drag events
    goomba.on('drag', (pointer: any, dragX: number, dragY: number) => {
      goomba.setPosition(dragX, dragY);
      // Stop patrolling and goo collection when being dragged
      (goomba as any).isPatrolling = false;
      (goomba as any).isCollectingGoo = false;
      this.stopGooCollection(goomba);
      const body = goomba.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
    });
    
    goomba.on('dragstart', () => {
      goomba.setDepth(1000); // Bring to front while dragging
      
      // Stop patrolling and goo collection when picked up
      (goomba as any).isPatrolling = false;
      (goomba as any).isCollectingGoo = false;
      this.stopGooCollection(goomba);
      const body = goomba.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      
      // Rotate item to normal facing (0 degrees) when picked up
      this.scene.tweens.add({
        targets: goomba,
        angle: 0,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    goomba.on('dragend', () => {
      goomba.setDepth(-0.5); // Return to in front of toilet/towel but behind plunger/sink
      
      // Resume patrolling after a short delay if on the floor
      this.scene.time.delayedCall(1000, () => {
        const floorY = 473 - 30;
        if (Math.abs(goomba.y - floorY) < 50) { // If close to floor level
          this.startGoombaPatrol(goomba);
        }
      });
    });

    // Add purchase effect animation - start small and grow
    goomba.setScale(0, 0);
    this.scene.tweens.add({
      targets: goomba,
      scaleX: 0.10, // Grow to the larger scale
      scaleY: 0.10, // Grow to the larger scale
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Add golden glow effect
    this.scene.tweens.add({
      targets: goomba,
      tint: 0xffd700, // Gold tint
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        goomba.setTint(0xffffff); // Reset to normal
      }
    });
    
    // Make it fall to floor level after spawning
    const floorY = 473 - 30; // Floor platform top minus half item height (reduced for smaller size)
    
    this.scene.time.delayedCall(1000, () => {
      if (goomba.active && goomba.y < floorY - 50) {
        this.scene.tweens.add({
          targets: goomba,
          y: floorY,
          duration: 800,
          ease: 'Power2.easeIn',
          onComplete: () => {
            // Small bounce when hitting floor
            this.scene.tweens.add({
              targets: goomba,
              y: floorY - 10,
              duration: 150,
              ease: 'Power2.easeOut',
              onComplete: () => {
                this.scene.tweens.add({
                  targets: goomba,
                  y: floorY,
                  duration: 100,
                  ease: 'Power2.easeIn',
                  onComplete: () => {
                    // Start patrolling after landing
                    this.scene.time.delayedCall(500, () => {
                      this.startGoombaPatrol(goomba);
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    
    // Goo-mba spawned successfully
  }

  private startGoombaPatrol(goomba: any) {
    if (!goomba.active || (goomba as any).isPatrolling) return;
    
    (goomba as any).isPatrolling = true;
    const body = goomba.body as Phaser.Physics.Arcade.Body;
    const patrolSpeed = (goomba as any).patrolSpeed;
    const patrolBounds = (goomba as any).patrolBounds;
    
    // Set initial direction based on position
    if (goomba.x < patrolBounds.left + 50) {
      (goomba as any).patrolDirection = 1; // Move right
    } else if (goomba.x > patrolBounds.right - 50) {
      (goomba as any).patrolDirection = -1; // Move left
    }
    
    // Start moving
    const direction = (goomba as any).patrolDirection;
    body.setVelocityX(patrolSpeed * direction);
    
    // Flip sprite based on direction
    goomba.setFlipX(direction < 0);
    
    // Set up patrol update loop with goo detection
    const patrolUpdate = () => {
      if (!goomba.active || !(goomba as any).isPatrolling) return;
      
      // Check for nearby goo splatters first
      const nearbyGoo = this.findNearbyGooSplatter(goomba);
      if (nearbyGoo && !(goomba as any).isCollectingGoo) {
        // Stop patrolling and start collecting goo
        (goomba as any).isPatrolling = false;
        body.setVelocity(0, 0);
        this.startGooCollection(goomba, nearbyGoo);
        return;
      }
      
      // Check bounds and reverse direction if needed
      if (goomba.x <= patrolBounds.left && (goomba as any).patrolDirection === -1) {
        (goomba as any).patrolDirection = 1;
        body.setVelocityX(patrolSpeed);
        goomba.setFlipX(false);
      } else if (goomba.x >= patrolBounds.right && (goomba as any).patrolDirection === 1) {
        (goomba as any).patrolDirection = -1;
        body.setVelocityX(-patrolSpeed);
        goomba.setFlipX(true);
      }
      
      // Continue patrol update
      this.scene.time.delayedCall(100, patrolUpdate);
    };
    
    // Start the patrol update loop
    patrolUpdate();
    

  }

  private findNearbyGooSplatter(goomba: any): any {
    const gooSplatters = (this.scene as any).gooSplatters || [];
    const collectionRange = (goomba as any).collectionRange;
    
    let nearestSplatter = null;
    let nearestDistance = Infinity;
    
    gooSplatters.forEach((splatter: any) => {
      if (!splatter.active) return;
      
      const distance = Phaser.Math.Distance.Between(
        goomba.x, goomba.y,
        splatter.x, splatter.y
      );
      
      if (distance <= collectionRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestSplatter = splatter;
      }
    });
    
    return nearestSplatter;
  }

  private startGooCollection(goomba: any, targetSplatter: any) {
    if ((goomba as any).isCollectingGoo || !targetSplatter.active) return;
    
    (goomba as any).isCollectingGoo = true;

    
    // Move towards the splatter
    const moveToSplatter = () => {
      if (!goomba.active || !targetSplatter.active || !(goomba as any).isCollectingGoo) {
        this.stopGooCollection(goomba);
        return;
      }
      
      const distance = Phaser.Math.Distance.Between(
        goomba.x, goomba.y,
        targetSplatter.x, targetSplatter.y
      );
      
      // If close enough, start sucking animation
      if (distance <= 30) {
        this.startSuckingAnimation(goomba, targetSplatter);
        return;
      }
      
      // Move towards splatter
      const body = goomba.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(goomba.x, goomba.y, targetSplatter.x, targetSplatter.y);
      const moveSpeed = 30; // Slower when collecting
      
      body.setVelocity(
        Math.cos(angle) * moveSpeed,
        Math.sin(angle) * moveSpeed
      );
      
      // Face the direction of movement
      goomba.setFlipX(Math.cos(angle) < 0);
      
      // Continue moving towards splatter
      (goomba as any).collectionTimer = this.scene.time.delayedCall(100, moveToSplatter);
    };
    
    moveToSplatter();
  }

  private startSuckingAnimation(goomba: any, targetSplatter: any) {
    if (!goomba.active || !targetSplatter.active) {
      this.stopGooCollection(goomba);
      return;
    }
    

    
    // Stop movement
    const body = goomba.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Create sucking visual effect - particles moving from splatter to goomba
    this.createSuckingEffect(goomba, targetSplatter);
    
    // Play sucking sound (reuse existing sound or create new one)
    try {
      const suckSound = this.scene.sound.add('faucet', { volume: 0.3 }); // Reuse faucet sound at lower volume
      suckSound.play();
      
      // Stop sound after collection
      (goomba as any).currentSuckSound = suckSound;
    } catch (error) {

    }
    
    // Animate goomba slightly growing during suction
    const originalScale = goomba.scaleX;
    this.scene.tweens.add({
      targets: goomba,
      scaleX: originalScale * 1.1,
      scaleY: originalScale * 1.1,
      duration: 300,
      yoyo: true,
      repeat: 2
    });
    
    // Complete collection after animation
    this.scene.time.delayedCall(1500, () => {
      this.completeGooCollection(goomba, targetSplatter);
    });
  }

  private createSuckingEffect(goomba: any, targetSplatter: any) {
    // Create multiple small particles that move from splatter to goomba
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (!goomba.active || !targetSplatter.active) return;
        
        // Create small green particle at splatter position
        const particle = this.scene.add.circle(
          targetSplatter.x + Phaser.Math.Between(-20, 20),
          targetSplatter.y + Phaser.Math.Between(-20, 20),
          3,
          0x44ff44
        );
        particle.setDepth(100); // Above most objects
        
        // Animate particle moving to goomba
        this.scene.tweens.add({
          targets: particle,
          x: goomba.x,
          y: goomba.y - 10, // Slightly above goomba center
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 400,
          ease: 'Power2.easeIn',
          onComplete: () => {
            particle.destroy();
          }
        });
      });
    }
  }

  private completeGooCollection(goomba: any, targetSplatter: any) {
    if (!goomba.active) return;
    

    
    // Stop sucking sound
    if ((goomba as any).currentSuckSound) {
      (goomba as any).currentSuckSound.stop();
      (goomba as any).currentSuckSound.destroy();
      (goomba as any).currentSuckSound = null;
    }
    
    // Add goo to player's collection
    const { GooCollectionSystem } = require('./GooCounter');
    GooCollectionSystem.getInstance().collectGooFromSplatter();
    
    // Remove the splatter
    if (targetSplatter.active) {
      // Create collection effect at splatter location
      const collectEffect = this.scene.add.circle(targetSplatter.x, targetSplatter.y, 15, 0x44ff44);
      collectEffect.setDepth(100);
      collectEffect.setAlpha(0.8);
      
      this.scene.tweens.add({
        targets: collectEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          collectEffect.destroy();
        }
      });
      
      // Remove splatter from array and destroy
      const gooSplatters = (this.scene as any).gooSplatters || [];
      const index = gooSplatters.indexOf(targetSplatter);
      if (index > -1) {
        gooSplatters.splice(index, 1);
      }
      targetSplatter.destroy();
    }
    
    // Show +1 goo text above goomba
    const plusText = this.scene.add.text(goomba.x, goomba.y - 40, '+1 Goo', {
      fontSize: '16px',
      color: '#44ff44',
      fontStyle: 'bold'
    });
    plusText.setOrigin(0.5);
    plusText.setDepth(200);
    
    this.scene.tweens.add({
      targets: plusText,
      y: plusText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        plusText.destroy();
      }
    });
    
    // Reset goomba state and resume patrolling after a short delay
    this.stopGooCollection(goomba);
    
    this.scene.time.delayedCall(1000, () => {
      if (goomba.active) {
        this.startGoombaPatrol(goomba);
      }
    });
  }

  private stopGooCollection(goomba: any) {
    (goomba as any).isCollectingGoo = false;
    
    // Clear collection timer
    if ((goomba as any).collectionTimer) {
      (goomba as any).collectionTimer.destroy();
      (goomba as any).collectionTimer = null;
    }
    
    // Stop sucking sound
    if ((goomba as any).currentSuckSound) {
      (goomba as any).currentSuckSound.stop();
      (goomba as any).currentSuckSound.destroy();
      (goomba as any).currentSuckSound = null;
    }
    
    // Stop movement
    if (goomba.body) {
      const body = goomba.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
    }
  }

  private showTrashRecycler(gameScene: any) {
    if (!gameScene.trashRecycler) {

      return;
    }
    
    const recycler = gameScene.trashRecycler;
    
    // If recycler is inside a scaled container, remove it and add to scene root
    if (recycler.parentContainer) {
      recycler.parentContainer.remove(recycler);
      gameScene.add.existing(recycler);
    }
    
    // Restore original scale before showing
    const orig = recycler.getData('__origScale');
    if (orig) {
      recycler.setScale(orig.x, orig.y);
    }
    
    // Show the recycler with activation effect
    recycler.setActive(true).setVisible(true);
    
    // Add purchase effect animation
    recycler.setAlpha(0);
    recycler.setScale(0, 0);
    
    gameScene.tweens.add({
      targets: recycler,
      alpha: 1,
      scaleX: orig ? orig.x : 1,
      scaleY: orig ? orig.y : 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Add golden glow effect
    gameScene.tweens.add({
      targets: recycler,
      tint: 0xffd700, // Gold tint
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        recycler.setTint(0xffffff); // Reset to normal
      }
    });
  }

  private setupItemDragHandlers(container: Phaser.GameObjects.Container, itemData: any) {
    // Mouse wheel resize functionality
    container.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      const itemData = this.getItemData(container);
      if (!itemData) return;

      // Calculate resize factor based on wheel direction
      const resizeFactor = deltaY > 0 ? 0.9 : 1.1; // Scroll down = smaller, scroll up = bigger
      
      // Calculate new size
      let newWidth = itemData.width * resizeFactor;
      let newHeight = itemData.height * resizeFactor;
      
      // Ensure minimum and maximum size limits
      newWidth = Math.max(20, Math.min(200, newWidth));
      newHeight = Math.max(20, Math.min(200, newHeight));
      
      // Update the sprite size
      const sprite = container.list[0] as Phaser.GameObjects.Sprite;
      const text = container.list[1] as Phaser.GameObjects.Text;
      
      sprite.setDisplaySize(newWidth, newHeight);
      
      // Update text position to stay below the sprite
      text.setPosition(0, newHeight / 2 + 10);
      
      // Update item data
      itemData.width = newWidth;
      itemData.height = newHeight;
      
      // Update container size
      container.setSize(newWidth, newHeight);
      
      // Prevent event from bubbling to background
      pointer.event.stopPropagation();
    });

    // Use scene-level pointer events for better drag handling
    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingItem && this.draggedItem === container && this.isStoreOpen) {
        // Calculate movement delta
        const deltaX = pointer.x - startX;
        const deltaY = pointer.y - startY;
        
        // Update item position
        container.x += deltaX;
        container.y += deltaY;
        
        // Update start position for next frame
        startX = pointer.x;
        startY = pointer.y;
        
        // Update position in placedItems array
        const itemData = this.placedItems.find(placedItem => placedItem.container === container);
        if (itemData) {
          itemData.x = container.x;
          itemData.y = container.y;
        }
      }
    };

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingItem && this.draggedItem === container) {
        this.isDraggingItem = false;
        
        // Reset visual feedback
        container.setScale(1.0);
        container.setAlpha(1.0);
        
        this.draggedItem = null;
      }
    };

    // Store references to remove later
    (container as any).onPointerMove = onPointerMove;
    (container as any).onPointerUp = onPointerUp;

    // Add scene-level listeners
    this.scene.input.on('pointermove', onPointerMove);
    this.scene.input.on('pointerup', onPointerUp);
  }

  private showNotification(message: string, color: number) {
    const notification = this.scene.add.text(
      this.scene.scale.width / 2,
      100,
      message,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        padding: { x: 12, y: 8 }
      }
    );
    notification.setOrigin(0.5);
    notification.setDepth(6000);

    // Fade out after 2 seconds
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    });
  }

  private createCloseButton() {
    this.closeButton = this.scene.add.container(
      this.scene.scale.width - 60,
      60
    );

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0xff4758, 0.9);
    closeBg.fillCircle(0, 0, 25);
    this.closeButton.add(closeBg);

    const closeText = this.scene.add.text(0, 0, '×', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    closeText.setOrigin(0.5);
    this.closeButton.add(closeText);

    this.closeButton.setSize(50, 50);
    this.closeButton.setInteractive();
    this.closeButton.on('pointerdown', () => this.closeStore());

    this.storeContainer.add(this.closeButton);
  }

  private setupInputHandlers() {
    // Handle background clicks for placement
    this.storeBackground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't place items if we're dragging or in delete mode or UI is not visible
      if (this.isDraggingItem || (this as any).isDeleteMode || !this.isUIVisible) {
        return;
      }

      // Don't place if clicking on UI elements (only when UI is visible)
      if (this.isUIVisible && pointer.x < 370 && pointer.y < 290) {
        return;
      }

      // Place new item at click position (only when UI is visible)
      if (this.isUIVisible) {
        this.createPlacedItem(pointer.x, pointer.y, `Item ${this.nextItemNumber}`);
      }
    });

    // Add = key handler to toggle UI visibility
    this.scene.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === '=') {
        this.toggleUI();
      }
    });
  }

  private toggleUI() {
    this.isUIVisible = !this.isUIVisible;
    this.controlsContainer.setVisible(this.isUIVisible);
    
    // Toggle visibility of placed item containers
    this.placedItems.forEach(item => {
      // Check if this item has an actual asset (not just a rectangle placeholder)
      const hasAsset = this.itemHasAsset(item.itemName);
      
      if (hasAsset) {
        // Items with assets should always be visible (no change from current state)
        // They're already visible from openStore(), so keep them visible
        item.container.setVisible(true);
      } else {
        // Items without assets (rectangles) follow the UI toggle
        item.container.setVisible(this.isUIVisible);
      }
    });
    
    // Show notification about UI state
    const message = this.isUIVisible ? 'Free Placement UI: ON' : 'Free Placement UI: OFF';
    const color = this.isUIVisible ? 0x27ae60 : 0xe74c3c;
    this.showNotification(message, color);
  }

  private itemHasAsset(itemName: string): boolean {
    // Check if the item has a corresponding asset key in the scene's texture cache
    // Based on the predefined items, check for known asset keys
    const assetKeys = [
      'recycler3',  // For "Recycler"
      'goomba'      // For "Goo-mba"
    ];
    
    // Check if any of the asset keys exist in the texture cache
    return assetKeys.some(key => this.scene.textures.exists(key));
  }

  public openStore() {
    this.isStoreOpen = true;
    this.storeContainer.setVisible(true);
    
    // Hide the bestiary book when store opens
    const bestiaryScene = this.scene.scene.get('Bestiary') as any;
    if (bestiaryScene && bestiaryScene.bookClosed) {
      bestiaryScene.bookClosed.setVisible(false);
    }
    
    // Show asset-based items immediately when store opens
    this.placedItems.forEach(item => {
      const hasAsset = this.itemHasAsset(item.itemName);
      
      if (hasAsset) {
        // Items with assets should be visible when store opens
        item.container.setVisible(true);
      } else {
        // Items without assets remain hidden until UI is toggled
        item.container.setVisible(this.isUIVisible);
      }
    });
    
    // Animate store opening
    this.storeContainer.setAlpha(0);
    this.scene.tweens.add({
      targets: this.storeContainer,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  public closeStore() {
    // Exit all modes when closing
    if ((this as any).isDeleteMode) {
      this.toggleDeleteMode();
    }
    if ((this as any).isRenameMode) {
      this.toggleRenameMode();
    }

    // Stop store audio when closing store - get it from goo counter
    const gameScene = this.scene as any;
    if (gameScene.gooCounter && gameScene.gooCounter.getCurrentStoreSound) {
      const storeSound = gameScene.gooCounter.getCurrentStoreSound();
      if (storeSound && storeSound.isPlaying) {
        storeSound.stop();
      }
    }

    // Resume radio if it was paused by store opening
    if (gameScene.gooCounter && gameScene.gooCounter.wasRadioPausedByStore()) {
      if (gameScene.radioManager) {
        const radioManager = gameScene.radioManager;
        if (radioManager.isPowered() && radioManager.getCurrentMusic) {
          const currentMusic = radioManager.getCurrentMusic();
          if (currentMusic && currentMusic.isPaused) {
            currentMusic.resume();
          }
        }
      }
      // Clear the flag after resuming
      gameScene.gooCounter.clearRadioPauseFlag();
    }

    // Hide UI when closing store
    this.isUIVisible = false;
    this.controlsContainer.setVisible(false);
    
    // Show the bestiary book when store closes - fix typo
    const bestiaryScene = this.scene.scene.get('Bestiary') as any;
    if (bestiaryScene && bestiaryScene.bookClosed) {
      bestiaryScene.bookClosed.setVisible(true);
    }
    
    // When closing store, keep asset-based items visible but hide placeholder rectangles
    this.placedItems.forEach(item => {
      const hasAsset = this.itemHasAsset(item.itemName);
      
      if (hasAsset) {
        // Items with assets should remain visible even when store is closed
        item.container.setVisible(true);
      } else {
        // Items without assets get hidden when store closes
        item.container.setVisible(false);
      }
    });

    this.scene.tweens.add({
      targets: this.storeContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.isStoreOpen = false;
        this.storeContainer.setVisible(false);
      }
    });
  }

  public isOpen(): boolean {
    return this.isStoreOpen;
  }

  public destroy() {
    // Clean up all scene-level listeners
    this.placedItems.forEach(item => {
      if ((item.container as any).onPointerMove) {
        this.scene.input.off('pointermove', (item.container as any).onPointerMove);
      }
      if ((item.container as any).onPointerUp) {
        this.scene.input.off('pointerup', (item.container as any).onPointerUp);
      }
    });

    this.storeContainer.destroy();
  }
}
