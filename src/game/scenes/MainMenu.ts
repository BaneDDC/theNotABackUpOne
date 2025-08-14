// src/game/scenes/MainMenu.ts

import { Scene } from "phaser";

export class MainMenu extends Scene {
  private backgroundImage!: Phaser.GameObjects.Image;
  private mainMenuMusic!: Phaser.Sound.BaseSound;
  private startButton!: Phaser.GameObjects.Graphics;
  private startButtonText!: Phaser.GameObjects.Text;
  private saveGameContainer!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Graphics;
  private newGameButton!: Phaser.GameObjects.Graphics;
  private saveGameChoice: 'continue' | 'new' | null = null;
  private hasSaveData: boolean = false;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Create background
    this.createBackground();
    
    // Start main menu music
    this.startMainMenuMusic();
    
    // Check for save data
    this.checkForSaveData();
    
    // Create main menu UI
    this.createMainMenuUI();
  }

  private createBackground() {
    // Create the background image
    if (this.textures.exists('newmenu')) {
      this.backgroundImage = this.add.image(
        this.scale.width / 2, 
        this.scale.height / 2, 
        'newmenu'
      );
      this.backgroundImage.setDisplaySize(this.scale.width, this.scale.height);
      this.backgroundImage.setDepth(0);
    } else {
      // Fallback background
      this.add.rectangle(
        this.scale.width / 2, 
        this.scale.height / 2, 
        this.scale.width, 
        this.scale.height, 
        0x2c3e50
      );
    }
  }

  private startMainMenuMusic() {
    if (this.cache.audio.exists('mainMenuMusic')) {
      this.mainMenuMusic = this.sound.add('mainMenuMusic', { 
        volume: 0.3,
        loop: true 
      });
      this.mainMenuMusic.play();
    }
  }

  private checkForSaveData() {
    // Check if there's any meaningful save data
    const discoveries = localStorage.getItem('bestiary_discoveries');
    const gameState = localStorage.getItem('toilet_merge_game_state');
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

    let hasGameState = false;
    if (gameState) {
      try {
        const parsed = JSON.parse(gameState);
        // Check if it's a valid game state with meaningful progress
        hasGameState = parsed.version && (parsed.tutorialCompleted || (parsed.items && parsed.items.length > 0));
      } catch (e) {
        hasGameState = false;
      }
    }

    // Consider save data meaningful if there are discoveries OR game state
    this.hasSaveData = discoveryCount > 0 || hasGameState;
  }

  private createMainMenuUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create dark overlay for the start screen
    const darkOverlay = this.add.rectangle(
      centerX, 
      centerY, 
      this.scale.width, 
      this.scale.height, 
      0x000000, 
      0.7
    );
    darkOverlay.setDepth(1);

    // Create title
    const title = this.add.text(centerX, centerY - 150, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    title.setDepth(2);

    // Create start button
    this.startButton = this.add.rectangle(centerX, centerY + 50, 300, 80, 0x27ae60);
    this.startButton.setStrokeStyle(4, 0x2ecc71);
    this.startButton.setDepth(2);
    this.startButton.setInteractive();

    // Create button text
    this.startButtonText = this.add.text(centerX, centerY + 50, "START GAME", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this.startButtonText.setOrigin(0.5);
    this.startButtonText.setDepth(3);

    // Add hover effects
    this.startButton.on('pointerover', () => {
      this.startButton.setFillStyle(0x2ecc71);
      this.input.setDefaultCursor('pointer');
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setFillStyle(0x27ae60);
      this.input.setDefaultCursor('default');
    });

    // Add click handler to start game
    this.startButton.on('pointerdown', () => {
      this.onStartGameClick();
    });

    // Also allow Enter key to start
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.onStartGameClick();
    });

    // Create save game choice UI (initially hidden)
    this.createSaveGameChoiceUI(centerX, centerY);
  }

  private createSaveGameChoiceUI(centerX: number, centerY: number) {
    this.saveGameContainer = this.add.container(centerX, centerY);
    this.saveGameContainer.setVisible(false);
    this.saveGameContainer.setDepth(1000);

    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-this.scale.width/2, -this.scale.height/2, this.scale.width, this.scale.height);
    this.saveGameContainer.add(overlay);

    // Title
    const saveTitle = this.add.text(0, -120, "SAVE DATA FOUND", {
      fontSize: "32px",
      color: "#f1c40f",
      fontStyle: "bold"
    });
    saveTitle.setOrigin(0.5);
    this.saveGameContainer.add(saveTitle);

    // Description
    const description = this.add.text(0, -60, "Would you like to continue where you left off\nor start a new game?", {
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 8
    });
    description.setOrigin(0.5);
    this.saveGameContainer.add(description);

    // Continue button
    this.continueButton = this.add.graphics();
    this.continueButton.fillStyle(0x27ae60);
    this.continueButton.fillRoundedRect(-120, -15, 240, 50, 8);
    this.continueButton.setPosition(0, 20);
    this.continueButton.setInteractive(new Phaser.Geom.Rectangle(-120, -15, 240, 50), Phaser.Geom.Rectangle.Contains);
    this.saveGameContainer.add(this.continueButton);

    const continueButtonText = this.add.text(0, 20, "CONTINUE GAME", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    continueButtonText.setOrigin(0.5);
    this.saveGameContainer.add(continueButtonText);

    // New game button
    this.newGameButton = this.add.graphics();
    this.newGameButton.fillStyle(0xe74c3c);
    this.newGameButton.fillRoundedRect(-120, -15, 240, 50, 8);
    this.newGameButton.setPosition(0, 90);
    this.newGameButton.setInteractive(new Phaser.Geom.Rectangle(-120, -15, 240, 50), Phaser.Geom.Rectangle.Contains);
    this.saveGameContainer.add(this.newGameButton);

    const newGameButtonText = this.add.text(0, 90, "START NEW GAME", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    newGameButtonText.setOrigin(0.5);
    this.saveGameContainer.add(newGameButtonText);

    // Button hover effects
    this.continueButton.on('pointerover', () => {
      this.continueButton.clear();
      this.continueButton.fillStyle(0x2ecc71);
      this.continueButton.fillRoundedRect(-120, -15, 240, 50, 8);
    });

    this.continueButton.on('pointerout', () => {
      this.continueButton.clear();
      this.continueButton.fillStyle(0x27ae60);
      this.continueButton.fillRoundedRect(-120, -15, 240, 50, 8);
    });

    this.newGameButton.on('pointerover', () => {
      this.newGameButton.clear();
      this.newGameButton.fillStyle(0xc0392b);
      this.newGameButton.fillRoundedRect(-120, -15, 240, 50, 8);
    });

    this.newGameButton.on('pointerout', () => {
      this.newGameButton.clear();
      this.newGameButton.fillStyle(0xe74c3c);
      this.newGameButton.fillRoundedRect(-120, -15, 240, 50, 8);
    });

    // Button click handlers
    this.continueButton.on('pointerdown', () => {
      this.saveGameChoice = 'continue';
      this.playFlushSoundAndStartGame();
    });

    this.newGameButton.on('pointerdown', () => {
      this.saveGameChoice = 'new';
      this.showNewGameConfirmation();
    });
  }

  private showNewGameConfirmation() {
    // Hide current choice UI
    this.saveGameContainer.setVisible(false);

    // Create confirmation container
    const confirmContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
    confirmContainer.setDepth(1001);

    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(-this.scale.width/2, -this.scale.height/2, this.scale.width, this.scale.height);
    confirmContainer.add(overlay);

    // Warning title
    const warningTitle = this.add.text(0, -100, "WARNING!", {
      fontSize: "36px",
      color: "#e74c3c",
      fontStyle: "bold"
    });
    warningTitle.setOrigin(0.5);
    confirmContainer.add(warningTitle);

    // Warning text
    const warningText = this.add.text(0, -30, "Starting a new game will permanently\ndelete your current save data!\n\nThis action cannot be undone.", {
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 8
    });
    warningText.setOrigin(0.5);
    confirmContainer.add(warningText);

    // Confirm button
    const confirmButton = this.add.graphics();
    confirmButton.fillStyle(0xe74c3c);
    confirmButton.fillRoundedRect(-100, -20, 200, 40, 8);
    confirmButton.setPosition(0, 60);
    confirmButton.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);
    confirmContainer.add(confirmButton);

    const confirmButtonText = this.add.text(0, 60, "DELETE & START NEW", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    confirmButtonText.setOrigin(0.5);
    confirmContainer.add(confirmButtonText);

    // Cancel button
    const cancelButton = this.add.graphics();
    cancelButton.fillStyle(0x95a5a6);
    cancelButton.fillRoundedRect(-100, -20, 200, 40, 8);
    cancelButton.setPosition(0, 120);
    cancelButton.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);
    confirmContainer.add(cancelButton);

    const cancelButtonText = this.add.text(0, 120, "CANCEL", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    cancelButtonText.setOrigin(0.5);
    confirmContainer.add(cancelButtonText);

    // Button handlers
    confirmButton.on('pointerdown', () => {
      this.clearSaveData();
      this.saveGameChoice = 'new';
      confirmContainer.destroy();
      this.playFlushSoundAndStartGame();
    });

    cancelButton.on('pointerdown', () => {
      confirmContainer.destroy();
      this.saveGameContainer.setVisible(true);
    });

    // Hover effects
    confirmButton.on('pointerover', () => {
      confirmButton.clear();
      confirmButton.fillStyle(0xc0392b);
      confirmButton.fillRoundedRect(-100, -20, 200, 40, 8);
    });

    confirmButton.on('pointerout', () => {
      confirmButton.clear();
      confirmButton.fillStyle(0xe74c3c);
      confirmButton.fillRoundedRect(-100, -20, 200, 40, 8);
    });

    cancelButton.on('pointerover', () => {
      cancelButton.clear();
      cancelButton.fillStyle(0x7f8c8d);
      cancelButton.fillRoundedRect(-100, -20, 200, 40, 8);
    });

    cancelButton.on('pointerout', () => {
      cancelButton.clear();
      cancelButton.fillStyle(0x95a5a6);
      cancelButton.fillRoundedRect(-100, -20, 200, 40, 8);
    });
  }

  private clearSaveData() {
    try {
      localStorage.removeItem('bestiary_discoveries');
      localStorage.removeItem('toilet_merge_game_state');
      localStorage.removeItem('game_volume');
      localStorage.removeItem('goo_count'); // Reset goo count for new game
    } catch (e) {
      // Ignore errors
    }
  }

  private onStartGameClick() {
    if (this.hasSaveData) {
      // Show save game choice
      this.saveGameContainer.setVisible(true);
    } else {
      // No save data, start new game directly
      this.saveGameChoice = 'new';
      this.startGame();
    }
  }

  private playFlushSoundAndStartGame() {
    // Hide the save game choice UI immediately
    this.saveGameContainer.setVisible(false);
    
    // Disable all input to prevent multiple clicks
    this.input.enabled = false;
    
    // Play toilet flush sound
    if (this.cache.audio.exists('toiletFlush')) {
      this.sound.play('toiletFlush', { volume: 0.5 });
    }
    
    // Wait for the flush sound to play, then start the game
    this.time.delayedCall(1500, () => {
      this.startGame();
    });
  }

  private startGame() {
    // Set the save game choice in the registry so Game scene can access it
    this.registry.set('saveGameChoice', this.saveGameChoice);
    
    // If starting a new game, ensure save data is cleared
    if (this.saveGameChoice === 'new') {
      this.clearSaveData();
    }
    
    // Ensure input is disabled to prevent multiple game starts
    this.input.enabled = false;
    
    // Fade out the main menu music before starting the game
    if (this.mainMenuMusic && this.mainMenuMusic.isPlaying) {
      // Use a more reliable fade out method
      const fadeOutDuration = 2000;
      const fadeOutSteps = 20;
      const stepDuration = fadeOutDuration / fadeOutSteps;
      
      let currentStep = 0;
      const fadeOutInterval = setInterval(() => {
        if (currentStep < fadeOutSteps) {
          // Use the sound system's volume control
          const currentVolume = this.sound.volume;
          const newVolume = Math.max(0, currentVolume - (0.3 / fadeOutSteps));
          this.sound.volume = newVolume;
          currentStep++;
        } else {
          clearInterval(fadeOutInterval);
          this.mainMenuMusic.stop();
          this.sound.volume = 0.3; // Reset volume for game sounds

          // Start the main game scene after music fades out
          this.scene.start('Game');
        }
      }, stepDuration);
      
      // Fallback: if fade out takes too long, force stop after 3 seconds
      this.time.delayedCall(3000, () => {
        clearInterval(fadeOutInterval);
        if (this.mainMenuMusic && this.mainMenuMusic.isPlaying) {
          this.mainMenuMusic.stop();
          this.sound.volume = 0.3; // Reset volume for game sounds
        }
        this.scene.start('Game');
      });
    } else {
      // If no music is playing, start the game immediately
      this.time.delayedCall(100, () => {
        this.scene.start('Game');
      });
    }
  }
}
