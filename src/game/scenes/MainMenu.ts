// src/game/scenes/MainMenu.ts

import { Scene } from "phaser";

export class MainMenu extends Scene {
  private backgroundImage!: Phaser.GameObjects.Image;
  private mainMenuMusic!: Phaser.Sound.BaseSound;
  private startButton!: Phaser.GameObjects.Image;
  private startButtonText!: Phaser.GameObjects.Text;
  private saveGameContainer!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Image;
  private newGameButton!: Phaser.GameObjects.Image;
  private saveGameChoice: 'continue' | 'new' | null = null;
  private hasSaveData: boolean = false;
  private leftHandedButton!: Phaser.GameObjects.Image;
  private rightHandedButton!: Phaser.GameObjects.Image;
  private leftHandedText!: Phaser.GameObjects.Text;
  private rightHandedText!: Phaser.GameObjects.Text;
  private handednessLabel!: Phaser.GameObjects.Text;
  private selectedHandedness: 'left' | 'right' = 'right';
  private logoutButton!: Phaser.GameObjects.Text;

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
      // Check if main menu music is already playing to prevent duplicates
      const existingMusic = this.sound.get('mainMenuMusic');
      if (existingMusic && existingMusic.isPlaying) {
        this.mainMenuMusic = existingMusic;
        return;
      }
      
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

    // Create title image
    const titleImage = this.add.image(centerX, centerY - 150, 'portalflush');
    titleImage.setDisplaySize(300, 300); // Scale the 1024x1024 image down to fit properly
    titleImage.setDepth(2);

    // Create start button
    this.startButton = this.add.image(centerX, centerY + 50, 'startgame');
    this.startButton.setDisplaySize(200, 200); // Scaled down from 250x250 to 200x200
    this.startButton.setDepth(2);
    this.startButton.setInteractive();
    this.startButton.setTint(0xffffff); // Start with normal white tint

    // Add pulsing animation - 10% larger than current scaled size (200x200)
    this.tweens.add({
      targets: this.startButton,
      displayWidth: 220,
      displayHeight: 220,
      duration: 1000,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });

    // Button text removed - using image button instead

    // Add hover effects
    this.startButton.on('pointerover', () => {
      this.startButton.setTint(0xffffff); // Keep hovered button bright
      if (this.continueButton) this.continueButton.setTint(0x666666); // Darken continue button
      if (this.newGameButton) this.newGameButton.setTint(0x666666); // Darken new game button
      this.input.setDefaultCursor('pointer');
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setTint(0xffffff); // Keep start button bright
      if (this.continueButton) this.continueButton.setTint(0xffffff); // Return continue button to normal
      if (this.newGameButton) this.newGameButton.setTint(0xffffff); // Return new game button to normal
      this.input.setDefaultCursor('default');
    });

    // Add click handler to start game
    this.startButton.on('pointerdown', () => {
      this.startButton.setVisible(false);
      this.onStartGameClick();
    });

    // Also allow Enter key to start
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.onStartGameClick();
    });

    // Create handedness selection UI
    this.createHandednessSelectionUI(centerX, centerY);

    // Create achievement button
    this.createAchievementButton(centerX, centerY);

    // Create logout button
    this.createLogoutButton();

    // Create save game choice UI (initially hidden)
    this.createSaveGameChoiceUI(centerX, centerY);
    
    // Check authentication status and show/hide logout button
    this.checkAuthenticationStatus();
  }

  private createAchievementButton(centerX: number, centerY: number) {
    // Create achievement button using trophy image in top right corner
    const achievementButton = this.add.image(this.scale.width - 50, 50, 'trophy');
    achievementButton.setDisplaySize(60, 60); // Same size as the previous circle (30 radius * 2)
    achievementButton.setDepth(2);
    achievementButton.setInteractive();
    
    // Add hover effects
    achievementButton.on('pointerover', () => {
      achievementButton.setDisplaySize(63, 63); // 5% larger than 60x60
      this.input.setDefaultCursor('pointer');
    });
    
    achievementButton.on('pointerout', () => {
      achievementButton.setDisplaySize(60, 60); // Return to original size
      this.input.setDefaultCursor('default');
    });
    
    // Add click handler
    achievementButton.on('pointerdown', () => {
      this.scene.start('AchievementScene');
    });
  }



  private createLogoutButton() {
    // Create logout button in upper left corner
    this.logoutButton = this.add.text(50, 50, 'LOGOUT', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#cc0000',
      padding: { x: 15, y: 8 },
      fontFamily: 'Arial, sans-serif'
    });
    this.logoutButton.setOrigin(0, 0);
    this.logoutButton.setDepth(2);
    this.logoutButton.setInteractive();
    
    // Add hover effects
    this.logoutButton.on('pointerover', () => {
      this.logoutButton.setBackgroundColor('#ff0000');
      this.input.setDefaultCursor('pointer');
    });
    
    this.logoutButton.on('pointerout', () => {
      this.logoutButton.setBackgroundColor('#cc0000');
      this.input.setDefaultCursor('default');
    });
    
    // Add click handler
    this.logoutButton.on('pointerdown', () => {
      this.handleLogout();
    });

    // Initially hide logout button (show only when logged in)
    this.logoutButton.setVisible(false);
  }

  private async handleLogout() {
    try {
      const { AuthService } = await import('../../services/AuthService');
      const authService = AuthService.getInstance();
      await authService.logoutUser();
      
      // Go back to auth scene
      this.scene.start('AuthScene');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  private disableMainMenu() {
    // Disable all interactive elements
    if (this.startButton) this.startButton.disableInteractive();
    if (this.leftHandedButton) this.leftHandedButton.disableInteractive();
    if (this.rightHandedButton) this.rightHandedButton.disableInteractive();
    if (this.logoutButton) this.logoutButton.disableInteractive();
    
    // Disable input temporarily
    this.input.enabled = false;
  }

  private enableMainMenu() {
    // Re-enable all interactive elements
    if (this.startButton) this.startButton.setInteractive();
    if (this.leftHandedButton) this.leftHandedButton.setInteractive();
    if (this.rightHandedButton) this.rightHandedButton.setInteractive();
    if (this.logoutButton) this.logoutButton.setInteractive();
    
    // Re-enable input
    this.input.enabled = true;
  }

  private async checkAuthenticationStatus() {
    try {
      const { AuthService } = await import('../../services/AuthService');
      const authService = AuthService.getInstance();
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // User is logged in, show logout button
        this.logoutButton.setVisible(true);
      } else {
        // User is not logged in, hide logout button
        this.logoutButton.setVisible(false);
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.logoutButton.setVisible(false);
    }
  }

  private createHandednessSelectionUI(centerX: number, centerY: number) {
    // Load saved handedness preference or default to right-handed
    const savedHandedness = localStorage.getItem('player_handedness');
    this.selectedHandedness = (savedHandedness as 'left' | 'right') || 'right';

    // Handedness label removed

    // Create left-handed button
    this.leftHandedButton = this.add.image(50, this.scale.height - 50, 'lefthand');
    this.leftHandedButton.setDisplaySize(75, 75); // Reduced to half size (75x75)
    this.leftHandedButton.setDepth(2);
    this.leftHandedButton.setInteractive();

    // Left handed text removed

    // Create right-handed button
    this.rightHandedButton = this.add.image(this.scale.width - 50, this.scale.height - 50, 'righthand');
    this.rightHandedButton.setDisplaySize(75, 75); // Reduced to half size (75x75)
    this.rightHandedButton.setDepth(2);
    this.rightHandedButton.setInteractive();

    // Right handed text removed

    // Set initial button states
    this.updateHandednessButtonStates();

    // Add button interactions
    this.leftHandedButton.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
    });

    this.leftHandedButton.on('pointerout', () => {
      this.updateHandednessButtonStates();
      this.input.setDefaultCursor('default');
    });

    this.leftHandedButton.on('pointerdown', () => {
      this.selectedHandedness = 'left';
      this.updateHandednessButtonStates();
      this.saveHandednessPreference();
    });

    this.rightHandedButton.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
    });

    this.rightHandedButton.on('pointerout', () => {
      this.updateHandednessButtonStates();
      this.input.setDefaultCursor('default');
    });

    this.rightHandedButton.on('pointerdown', () => {
      this.selectedHandedness = 'right';
      this.updateHandednessButtonStates();
      this.saveHandednessPreference();
    });
  }

  private updateHandednessButtonStates() {
    // Stop any existing tweens
    this.tweens.killTweensOf(this.leftHandedButton);
    this.tweens.killTweensOf(this.rightHandedButton);
    
    if (this.selectedHandedness === 'left') {
      this.leftHandedButton.setScale(0.1, 0.1); // Normal size
      this.rightHandedButton.setScale(0.1, 0.1); // Normal size
      
      // Add pulsing animation to selected button
      this.tweens.add({
        targets: this.leftHandedButton,
        scaleX: 0.11, // 10% larger
        scaleY: 0.11,
        duration: 1000,
        ease: 'Power2',
        yoyo: true,
        repeat: -1
      });
    } else {
      this.leftHandedButton.setScale(0.1, 0.1); // Normal size
      this.rightHandedButton.setScale(0.1, 0.1); // Normal size
      
      // Add pulsing animation to selected button
      this.tweens.add({
        targets: this.rightHandedButton,
        scaleX: 0.11, // 10% larger
        scaleY: 0.11,
        duration: 1000,
        ease: 'Power2',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private saveHandednessPreference() {
    try {
      localStorage.setItem('player_handedness', this.selectedHandedness);
    } catch (e) {
      // Ignore errors
    }
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
    this.continueButton = this.add.image(0, 20, 'loadgame');
    this.continueButton.setDisplaySize(150, 150); // Scaled down from 200x200 to 150x150
    this.continueButton.setInteractive();
    this.saveGameContainer.add(this.continueButton);

    // Continue button text removed - using image button instead

    // New game button
    this.newGameButton = this.add.image(0, 130, 'newgame');
    this.newGameButton.setDisplaySize(150, 150); // Scaled down from 200x200 to 150x150
    this.newGameButton.setInteractive();
    this.saveGameContainer.add(this.newGameButton);

    // New game button text removed - using image button instead

    // Button hover effects
    this.continueButton.on('pointerover', () => {
      this.continueButton.setTint(0xffffff); // Keep hovered button bright
      this.newGameButton.setTint(0x666666); // Darken the other button
    });

    this.continueButton.on('pointerout', () => {
      this.continueButton.setTint(0xffffff); // Keep continue button bright
      this.newGameButton.setTint(0xffffff); // Return new game button to normal
    });

    this.newGameButton.on('pointerover', () => {
      this.newGameButton.setTint(0xffffff); // Keep hovered button bright
      this.continueButton.setTint(0x666666); // Darken the other button
    });

    this.newGameButton.on('pointerout', () => {
      this.newGameButton.setTint(0xffffff); // Keep new game button bright
      this.continueButton.setTint(0xffffff); // Return continue button to normal
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
    const warningTitle = this.add.text(0, -220, "WARNING!", {
      fontSize: "36px",
      color: "#e74c3c",
      fontStyle: "bold"
    });
    warningTitle.setOrigin(0.5);
    confirmContainer.add(warningTitle);

    // Warning text
    const warningText = this.add.text(0, -150, "Starting a new game will permanently\ndelete your current save data!\n\nThis action cannot be undone.", {
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 8
    });
    warningText.setOrigin(0.5);
    confirmContainer.add(warningText);

    // Confirm button
    const confirmButton = this.add.image(0, 30, 'deletenew');
    confirmButton.setDisplaySize(200, 200); // Since it's 1024x1024, scale it down to fit the button area
    confirmButton.setInteractive();
    confirmContainer.add(confirmButton);

    // Cancel button
    const cancelButton = this.add.image(0, 160, 'cancel');
    cancelButton.setDisplaySize(200, 200); // Since it's 1024x1024, scale it down to fit the button area
    cancelButton.setInteractive();
    confirmContainer.add(cancelButton);

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
      confirmButton.setTint(0xffffff); // Keep hovered button bright
      cancelButton.setTint(0x666666); // Darken the other button
    });

    confirmButton.on('pointerout', () => {
      confirmButton.setTint(0xffffff); // Keep confirm button bright
      cancelButton.setTint(0xffffff); // Return cancel button to normal
    });

    cancelButton.on('pointerover', () => {
      cancelButton.setTint(0xffffff); // Keep hovered button bright
      confirmButton.setTint(0x666666); // Darken the other button
    });

    cancelButton.on('pointerout', () => {
      cancelButton.setTint(0xffffff); // Keep cancel button bright
      confirmButton.setTint(0xffffff); // Return confirm button to normal
    });
  }

  private clearSaveData() {
    try {
      localStorage.removeItem('bestiary_discoveries');
      localStorage.removeItem('toilet_merge_game_state');
      localStorage.removeItem('game_volume');
      localStorage.removeItem('goo_count'); // Reset goo count for new game
      // Note: achievement_progress is NOT cleared - achievements persist across new games
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
    
    // Set the handedness preference in the registry
    this.registry.set('playerHandedness', this.selectedHandedness);
    
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
