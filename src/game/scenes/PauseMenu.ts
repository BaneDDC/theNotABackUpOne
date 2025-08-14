
// src/game/scenes/PauseMenu.ts

import { Scene } from "phaser";

export class PauseMenu extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private mainMenuContainer!: Phaser.GameObjects.Container;
  private optionsContainer!: Phaser.GameObjects.Container;
  private saveFileContainer!: Phaser.GameObjects.Container;
  private currentMenu: 'main' | 'options' | 'saveFile' = 'main';
  private masterVolume: number = 1.0;
  private volumeSlider!: Phaser.GameObjects.Graphics;
  private volumeHandle!: Phaser.GameObjects.Graphics;
  private volumeText!: Phaser.GameObjects.Text;
  private isDraggingSlider: boolean = false;

  constructor() {
    super("PauseMenu");
  }

  create() {
    // Hide default cursor and create custom cursor for this scene
    this.input.setDefaultCursor('none');
    this.createCustomCursorInThisScene();

    // Load saved volume setting
    this.loadVolumeSettings();

    // Create semi-transparent background
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.setInteractive();
    this.background.setDepth(1000);

    // Create menu containers
    this.createMainMenu();
    this.createOptionsMenu();
    this.createSaveFileMenu();

    // Setup input handlers
    this.setupInputHandlers();

    // Show main menu initially
    this.showMainMenu();
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

  private createMainMenu() {
    this.mainMenuContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.mainMenuContainer.setDepth(1001);

    // Title
    const title = this.add.text(0, -150, "GAME PAUSED", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    this.mainMenuContainer.add(title);

    // Resume button - make it larger and more prominent for mobile
    const resumeButton = this.createMenuButton(0, -50, "RESUME GAME", () => {
      this.resumeGame();
    }, 0x27ae60, 0x2ecc71); // Green color to make it stand out
    
    // Make resume button larger for mobile
    resumeButton.button.clear();
    resumeButton.button.fillStyle(0x27ae60);
    resumeButton.button.fillRoundedRect(-120, -30, 240, 60, 12); // Larger button
    
    resumeButton.text.setFontSize("24px"); // Larger text
    
    // Add hover effects for the larger button
    resumeButton.button.on('pointerover', () => {
      resumeButton.button.clear();
      resumeButton.button.fillStyle(0x2ecc71);
      resumeButton.button.fillRoundedRect(-120, -30, 240, 60, 12);
    });

    resumeButton.button.on('pointerout', () => {
      resumeButton.button.clear();
      resumeButton.button.fillStyle(0x27ae60);
      resumeButton.button.fillRoundedRect(-120, -30, 240, 60, 12);
    });
    
    this.mainMenuContainer.add(resumeButton.container);

    // Options button
    const optionsButton = this.createMenuButton(0, 20, "OPTIONS", () => {
      this.showOptionsMenu();
    });
    this.mainMenuContainer.add(optionsButton.container);

    // Save File button
    const saveFileButton = this.createMenuButton(0, 90, "SAVE FILE", () => {
      this.showSaveFileMenu();
    });
    this.mainMenuContainer.add(saveFileButton.container);

    // Instructions - updated for mobile
    const instructions = this.add.text(0, 180, "Tap RESUME GAME to continue", {
      fontSize: "18px",
      color: "#cccccc"
    });
    instructions.setOrigin(0.5);
    this.mainMenuContainer.add(instructions);
  }

  private createOptionsMenu() {
    this.optionsContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.optionsContainer.setDepth(1001);
    this.optionsContainer.setVisible(false);

    // Title
    const title = this.add.text(0, -150, "OPTIONS", {
      fontSize: "36px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    this.optionsContainer.add(title);

    // Sound section - moved up since no display section
    const soundYOffset = -80; // Moved up from previous position
    const soundTitle = this.add.text(0, soundYOffset, "SOUND", {
      fontSize: "24px",
      color: "#ffff00",
      fontStyle: "bold"
    });
    soundTitle.setOrigin(0.5);
    this.optionsContainer.add(soundTitle);

    // Master Volume label
    const volumeLabel = this.add.text(0, soundYOffset + 40, "Master Volume", {
      fontSize: "18px",
      color: "#ffffff"
    });
    volumeLabel.setOrigin(0.5);
    this.optionsContainer.add(volumeLabel);

    // Volume slider background
    this.volumeSlider = this.add.graphics();
    this.volumeSlider.fillStyle(0x444444);
    this.volumeSlider.fillRoundedRect(-100, -5, 200, 10, 5);
    this.volumeSlider.setPosition(0, soundYOffset + 80);
    this.optionsContainer.add(this.volumeSlider);

    // Volume slider handle
    this.volumeHandle = this.add.graphics();
    this.volumeHandle.fillStyle(0x00ff00);
    this.volumeHandle.fillCircle(0, 0, 8);
    this.volumeHandle.setPosition(this.masterVolume * 200 - 100, soundYOffset + 80);
    this.volumeHandle.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);
    this.optionsContainer.add(this.volumeHandle);

    // Volume percentage text
    this.volumeText = this.add.text(0, soundYOffset + 110, `${Math.round(this.masterVolume * 100)}%`, {
      fontSize: "16px",
      color: "#ffffff"
    });
    this.volumeText.setOrigin(0.5);
    this.optionsContainer.add(this.volumeText);

    // Setup volume slider interaction
    this.setupVolumeSlider();

    // Back button
    const backButton = this.createMenuButton(0, 140, "BACK", () => {
      this.showMainMenu();
    });
    this.optionsContainer.add(backButton.container);
  }

  private createSaveFileMenu() {
    this.saveFileContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.saveFileContainer.setDepth(1001);
    this.saveFileContainer.setVisible(false);

    // Title
    const title = this.add.text(0, -150, "SAVE FILE", {
      fontSize: "36px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    this.saveFileContainer.add(title);

    // Save info
    const saveInfo = this.getSaveFileInfo();
    const saveInfoText = this.add.text(0, -80, saveInfo, {
      fontSize: "16px",
      color: "#cccccc",
      align: "center",
      lineSpacing: 8
    });
    saveInfoText.setOrigin(0.5);
    this.saveFileContainer.add(saveInfoText);

    // Reset save button
    const resetButton = this.createMenuButton(0, 20, "RESET SAVE DATA", () => {
      this.showResetConfirmation();
    }, 0xaa0000, 0xcc0000);
    this.saveFileContainer.add(resetButton.container);

    // Export save button
    const exportButton = this.createMenuButton(0, 90, "EXPORT SAVE", () => {
      this.exportSaveData();
    }, 0x0066aa, 0x0088cc);
    this.saveFileContainer.add(exportButton.container);

    // Back button
    const backButton = this.createMenuButton(0, 160, "BACK", () => {
      this.showMainMenu();
    });
    this.saveFileContainer.add(backButton.container);
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void, normalColor: number = 0x3498db, hoverColor: number = 0x2980b9) {
    const container = this.add.container(x, y);
    
    const button = this.add.graphics();
    button.fillStyle(normalColor);
    button.fillRoundedRect(-80, -20, 160, 40, 8);
    container.add(button);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    buttonText.setOrigin(0.5);
    container.add(buttonText);

    // Make interactive with larger hit area for mobile
    button.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);

    button.on('pointerover', () => {
      button.clear();
      button.fillStyle(hoverColor);
      button.fillRoundedRect(-80, -20, 160, 40, 8);
    });

    button.on('pointerout', () => {
      button.clear();
      button.fillStyle(normalColor);
      button.fillRoundedRect(-80, -20, 160, 40, 8);
    });

    button.on('pointerdown', callback);

    return { container, button, text: buttonText };
  }

  private setupVolumeSlider() {
    // Make the entire slider area interactive
    const sliderArea = this.add.graphics();
    sliderArea.fillStyle(0x000000, 0); // Invisible but interactive
    sliderArea.fillRect(-110, -15, 220, 30);
    sliderArea.setPosition(0, 60); // Updated position to match new slider position
    sliderArea.setInteractive(new Phaser.Geom.Rectangle(-110, -15, 220, 30), Phaser.Geom.Rectangle.Contains);
    this.optionsContainer.add(sliderArea);

    // Handle dragging
    this.volumeHandle.on('pointerdown', () => {
      this.isDraggingSlider = true;
    });

    sliderArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingSlider = true;
      this.updateVolumeFromPointer(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingSlider) {
        this.updateVolumeFromPointer(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isDraggingSlider = false;
    });
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer) {
    // Convert pointer position to slider value
    const sliderX = this.optionsContainer.x;
    const soundYOffset = -80; // Updated to use fixed offset
    const sliderY = this.optionsContainer.y + soundYOffset + 80;
    const relativeX = pointer.x - sliderX;
    const sliderValue = Phaser.Math.Clamp((relativeX + 100) / 200, 0, 1);
    
    this.setMasterVolume(sliderValue);
  }

  private setMasterVolume(volume: number) {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    // Update slider handle position with fixed offset
    const soundYOffset = -80;
    this.volumeHandle.setPosition(this.masterVolume * 200 - 100, soundYOffset + 80);
    
    // Update volume text
    this.volumeText.setText(`${Math.round(this.masterVolume * 100)}%`);
    
    // Apply volume to game
    this.game.sound.volume = this.masterVolume;
    
    // Save volume setting
    this.saveVolumeSettings();
  }

  private loadVolumeSettings() {
    const saved = localStorage.getItem('game_volume');
    if (saved) {
      try {
        this.masterVolume = parseFloat(saved);
        this.game.sound.volume = this.masterVolume;
      } catch (e) {
        this.masterVolume = 1.0;
      }
    }
  }

  private saveVolumeSettings() {
    try {
      localStorage.setItem('game_volume', this.masterVolume.toString());
    } catch (e) {

    }
  }

  private getSaveFileInfo(): string {
    const discoveries = localStorage.getItem('bestiary_discoveries');
    const volume = localStorage.getItem('game_volume');
    
    let discoveryCount = 0;
    if (discoveries) {
      try {
        const parsed = JSON.parse(discoveries);
        discoveryCount = parsed.length;
      } catch (e) {
        discoveryCount = 0;
      }
    }

    const volumePercent = volume ? Math.round(parseFloat(volume) * 100) : 100;

    return `Save Data Status:\n\nBestiary Discoveries: ${discoveryCount}\nMaster Volume: ${volumePercent}%\n\nLast Modified: ${this.getLastModifiedDate()}`;
  }

  private getLastModifiedDate(): string {
    const discoveries = localStorage.getItem('bestiary_discoveries');
    if (discoveries) {
      try {
        const parsed = JSON.parse(discoveries);
        if (parsed.length > 0) {
          const lastTimestamp = Math.max(...parsed.map((d: any) => d.timestamp || 0));
          return new Date(lastTimestamp).toLocaleDateString();
        }
      } catch (e) {
        // Fall through to default
      }
    }
    return 'No save data';
  }

  private showResetConfirmation() {
    // Create confirmation dialog
    const confirmContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    confirmContainer.setDepth(1002);

    // Background
    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(0x000000, 0.9);
    confirmBg.fillRoundedRect(-200, -100, 400, 200, 10);
    confirmBg.lineStyle(2, 0xff0000);
    confirmBg.strokeRoundedRect(-200, -100, 400, 200, 10);
    confirmContainer.add(confirmBg);

    // Warning text
    const warningText = this.add.text(0, -50, "WARNING!", {
      fontSize: "24px",
      color: "#ff0000",
      fontStyle: "bold"
    });
    warningText.setOrigin(0.5);
    confirmContainer.add(warningText);

    const confirmText = this.add.text(0, -10, "This will permanently delete\nall your save data!", {
      fontSize: "16px",
      color: "#ffffff",
      align: "center"
    });
    confirmText.setOrigin(0.5);
    confirmContainer.add(confirmText);

    // Confirm button
    const confirmButton = this.createMenuButton(-70, 40, "DELETE", () => {
      this.resetSaveData();
      confirmContainer.destroy();
      this.refreshSaveFileMenu();
    }, 0xaa0000, 0xcc0000);
    confirmContainer.add(confirmButton.container);

    // Cancel button
    const cancelButton = this.createMenuButton(70, 40, "CANCEL", () => {
      confirmContainer.destroy();
    });
    confirmContainer.add(cancelButton.container);
  }

  private resetSaveData() {
    try {
      localStorage.removeItem('bestiary_discoveries');
      localStorage.removeItem('game_volume');
      
      // Reset volume to default
      this.masterVolume = 1.0;
      this.game.sound.volume = 1.0;
      this.setMasterVolume(1.0);
      
      // Show success message
      this.showMessage("Save data reset successfully!", 0x00ff00);
    } catch (e) {
      this.showMessage("Failed to reset save data!", 0xff0000);
    }
  }

  private exportSaveData() {
    try {
      // First, trigger a save of the current game state
      const gameScene = this.scene.get('Game') as any;
      if (gameScene && gameScene.saveGameState) {
        gameScene.saveGameState();
      }
      
      // Then export all save data including the newly saved game state
      const saveData = {
        bestiary_discoveries: localStorage.getItem('bestiary_discoveries'),
        game_volume: localStorage.getItem('game_volume'),
        toilet_merge_game_state: localStorage.getItem('toilet_merge_game_state'), // Include game state
        goo_count: localStorage.getItem('goo_count'), // Include goo count if stored separately
        export_date: new Date().toISOString()
      };

      const jsonString = JSON.stringify(saveData, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
        this.showMessage("Game saved and exported to clipboard!", 0x00ff00);
      }).catch(() => {
        // Fallback: show the data in console

        this.showMessage("Game saved and exported to console!", 0xffaa00);
      });
    } catch (e) {
      this.showMessage("Failed to save and export data!", 0xff0000);
    }
  }

  private showMessage(text: string, color: number) {
    const message = this.add.text(this.scale.width / 2, this.scale.height - 100, text, {
      fontSize: "18px",
      color: `#${color.toString(16).padStart(6, '0')}`,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 16, y: 8 }
    });
    message.setOrigin(0.5);
    message.setDepth(2000);

    // Fade out after 3 seconds
    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 3000,
      delay: 1000,
      onComplete: () => {
        message.destroy();
      }
    });
  }

  private refreshSaveFileMenu() {
    // Update save file info
    const saveInfoText = this.saveFileContainer.list.find(child => 
      child instanceof Phaser.GameObjects.Text && child.text.includes('Save Data Status')
    ) as Phaser.GameObjects.Text;
    
    if (saveInfoText) {
      saveInfoText.setText(this.getSaveFileInfo());
    }
  }

  private showMainMenu() {
    this.currentMenu = 'main';
    this.mainMenuContainer.setVisible(true);
    this.optionsContainer.setVisible(false);
    this.saveFileContainer.setVisible(false);
  }

  private showOptionsMenu() {
    this.currentMenu = 'options';
    this.mainMenuContainer.setVisible(false);
    this.optionsContainer.setVisible(true);
    this.saveFileContainer.setVisible(false);
  }

  private showSaveFileMenu() {
    this.currentMenu = 'saveFile';
    this.mainMenuContainer.setVisible(false);
    this.optionsContainer.setVisible(false);
    this.saveFileContainer.setVisible(true);
    this.refreshSaveFileMenu();
  }

  private setupInputHandlers() {
    // ESC key to close pause menu (for desktop)
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.currentMenu === 'main') {
        this.resumeGame();
      } else {
        this.showMainMenu();
      }
    });

    // Prevent clicking background from closing menu - users should use the resume button
    this.background.on('pointerdown', () => {
      // Do nothing - prevent accidental closing, force users to use resume button
    });
  }

  private resumeGame() {
    // Destroy cursor in this scene
    if ((this as any).customCursor) {
      (this as any).customCursor.destroy();
      (this as any).customCursor = null;
    }

    // Resume the game scene
    this.scene.resume('Game');
    
    // Recreate cursor in Game scene
    const gameScene = this.scene.get('Game') as any;
    if (gameScene && gameScene.recreateCustomCursor) {
      gameScene.recreateCustomCursor();
    }
    
    // Stop this scene
    this.scene.stop();
  }
}
