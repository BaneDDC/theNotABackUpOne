// src/game/scenes/Boot.ts

import { Scene } from "phaser";

export class Boot extends Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingBarBg!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private currentFileText!: Phaser.GameObjects.Text;
  private continueText!: Phaser.GameObjects.Text;
  private isLoadingComplete: boolean = false;
  private totalAssets: number = 0;
  private loadedAssets: number = 0;
  private hasSaveData: boolean = false;
  private saveGameContainer!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Graphics;
  private newGameButton!: Phaser.GameObjects.Graphics;
  private saveGameChoice: 'continue' | 'new' | null = null;
  private startScreenDarkOverlay!: Phaser.GameObjects.Rectangle;
  private mainMenuMusic!: Phaser.Sound.BaseSound;
  private initialLoadingScreen!: Phaser.GameObjects.Container;

  constructor() {
    super("Boot");
  }

  preload() {
    // Create initial loading screen immediately
    this.createInitialLoadingScreen();
    
    // Load the background image and audio FIRST, before anything else
    this.load.image('newmenu', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/newmenu.png');
    this.load.audio('mainMenuMusic', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien.mp3');
    
    // Wait for both the background image and audio to load, then create the start button
    let imageLoaded = false;
    let audioLoaded = false;
    
    this.load.once('filecomplete', (key: string) => {
      if (key === 'newmenu') {
        imageLoaded = true;
        if (imageLoaded && audioLoaded) {
          this.createStartButton();
        }
      }
      if (key === 'mainMenuMusic') {
        audioLoaded = true;
        if (imageLoaded && audioLoaded) {
          this.createStartButton();
        }
      }
    });
    
    // If either fails to load, create start button anyway
    this.load.once('loaderror', (file: any) => {
      if (file.key === 'newmenu' || file.key === 'mainMenuMusic') {
        if (file.key === 'newmenu') imageLoaded = true;
        if (file.key === 'mainMenuMusic') audioLoaded = true;
        if (imageLoaded && audioLoaded) {
          this.createStartButton();
        }
      }
    });
    
    // Add a timeout fallback - if assets take too long, create start button anyway
    this.time.delayedCall(3000, () => {
      if (!imageLoaded || !audioLoaded) {
        this.createStartButton();
      }
    });
  }
  
  create() {
    // Background image is created when the newmenu asset finishes loading
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

  private createInitialLoadingScreen() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create a blue background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x2c3e50);

    // Create loading title
    const title = this.add.text(centerX, centerY - 100, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);

    // Create loading message
    const loadingText = this.add.text(centerX, centerY, "Loading", {
      fontSize: "24px",
      color: "#ffffff"
    });
    loadingText.setOrigin(0.5);

    // Create animated dots
    const dots = this.add.text(centerX + 80, centerY, "", {
      fontSize: "24px",
      color: "#ffffff"
    });
    dots.setOrigin(0.5);

    // Animate the dots through the pattern: . .. ... . .. ...
    let dotCount = 0;
    this.time.addEvent({
      delay: 300,
      callback: () => {
        dotCount = (dotCount + 1) % 6;
        const dotPatterns = ['', '.', '..', '...', '..', '.'];
        dots.setText(dotPatterns[dotCount]);
      },
      loop: true
    });

    // Store reference to clear this screen later
    this.initialLoadingScreen = this.add.container(0, 0);
    this.initialLoadingScreen.add([title, loadingText, dots]);
  }

  private createStartButton() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create the background image
    if (this.textures.exists('newmenu')) {

      const backgroundImage = this.add.image(centerX, centerY, 'newmenu');
      backgroundImage.setDisplaySize(this.scale.width, this.scale.height);
      backgroundImage.setDepth(0);

    } else {

      this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x2c3e50);
    }

    // Create dark overlay for the start screen
    const darkOverlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.7);
    darkOverlay.setDepth(1);
    this.startScreenDarkOverlay = darkOverlay; // Store reference for removal

    // Create title
    const title = this.add.text(centerX, centerY - 150, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    title.setDepth(2);

    // Create start button
    const startButton = this.add.rectangle(centerX, centerY + 50, 300, 80, 0x27ae60);
    startButton.setStrokeStyle(4, 0x2ecc71);
    startButton.setDepth(2);
    startButton.setInteractive();

    // Create button text
    const buttonText = this.add.text(centerX, centerY + 50, "CLICK TO BEGIN", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    buttonText.setOrigin(0.5);
    buttonText.setDepth(3);

    // Add hover effects
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x2ecc71);
      this.input.setDefaultCursor('pointer');
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x27ae60);
      this.input.setDefaultCursor('default');
    });

    // Add click handler to start loading
    startButton.on('pointerdown', () => {

      this.beginLoading();
    });

    // Also allow Enter key to start
    this.input.keyboard!.once('keydown-ENTER', () => {

      this.beginLoading();
    });
  }

  private beginLoading() {

    
    // Clear the start button screen
    this.children.removeAll(true);
    
    // Start playing the main menu music if it's available and not already playing
    if (this.cache.audio.exists('mainMenuMusic') && (!this.mainMenuMusic || !this.mainMenuMusic.isPlaying)) {
      this.mainMenuMusic = this.sound.add('mainMenuMusic', { 
        volume: 0.3,
        loop: true 
      });
      this.mainMenuMusic.play();

    } else if (this.mainMenuMusic && this.mainMenuMusic.isPlaying) {

    } else {

    }
    
    // Create the loading screen first
    this.createLoadingUI();
    this.checkForSaveData();
    
    // Reset the loader state and start fresh
    this.load.reset();
    
    // Start the asset loading process
    this.loadAllAssets();
    this.setupLoadingEvents();
    
    // Start the loader
    this.load.start();
  }

  private createLoadingUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create the background image immediately since it's already loaded
    if (this.textures.exists('newmenu')) {

      const backgroundImage = this.add.image(centerX, centerY, 'newmenu');
      backgroundImage.setDisplaySize(this.scale.width, this.scale.height);
      backgroundImage.setDepth(0);

    } else {

      this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x2c3e50);
    }

    // Title
    const title = this.add.text(centerX, centerY - 150, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);

    // Loading bar background
    this.loadingBarBg = this.add.graphics();
    this.loadingBarBg.fillStyle(0x34495e);
    this.loadingBarBg.fillRoundedRect(centerX - 200, centerY - 20, 400, 40, 10);

    // Loading bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 60, "Loading... 0%", {
      fontSize: "24px",
      color: "#ffffff"
    });
    this.loadingText.setOrigin(0.5);

    // Current file text
    this.currentFileText = this.add.text(centerX, centerY + 40, "", {
      fontSize: "16px",
      color: "#bdc3c7",
      wordWrap: { width: 600 }
    });
    this.currentFileText.setOrigin(0.5);

    // Continue text (initially hidden)
    this.continueText = this.add.text(centerX, centerY + 100, "Click to continue", {
      fontSize: "20px",
      color: "#27ae60",
      fontStyle: "bold"
    });
    this.continueText.setOrigin(0.5);
    this.continueText.setVisible(false);

    // Add blinking animation to continue text
    this.tweens.add({
      targets: this.continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Create save game choice container (initially hidden)
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
      this.hideSaveGameChoice();
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
      this.hideSaveGameChoice();
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

    }
  }

  private hideSaveGameChoice() {
    this.saveGameContainer.setVisible(false);
    this.startGame();
  }

  private onLoadComplete() {
    // Set isLoadingComplete to true
    this.isLoadingComplete = true;

    // Mark that Boot scene has finished loading
    this.ensureAllScenesLoaded();

    // Hide loading screen elements
    this.loadingBar.setVisible(false);
    this.loadingBarBg.setVisible(false);
    this.loadingText.setVisible(false);
    this.currentFileText.setVisible(false);
    this.continueText.setVisible(true);

    // Add click handler to continue to game
    this.input.once('pointerdown', () => {
      this.proceedToGame();
    });

    // Also allow Enter key to continue
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.proceedToGame();
    });

    // Wait for player to click or press Enter - no auto-proceed
    // If we have save data, show the save game choice
    if (this.hasSaveData) {
      this.time.delayedCall(500, () => {
        this.saveGameContainer.setVisible(true);
      });
    }
  }

  private proceedToGame() {
    if (this.hasSaveData && this.saveGameChoice === null) {
      // Show save game choice if we haven't made one yet
      this.saveGameContainer.setVisible(true);
      return;
    }

    // Set default choice if none was made
    if (this.saveGameChoice === null) {
      this.saveGameChoice = 'new';
    }

    this.startGame();
  }

  private startGame() {
    // Set the save game choice in the registry so Game scene can access it
    this.registry.set('saveGameChoice', this.saveGameChoice);
    
    // If starting a new game, ensure save data is cleared
    if (this.saveGameChoice === 'new') {
      this.clearSaveData();
    }
    
    // Check if all required assets are loaded before starting the game
    if (!this.areAllAssetsLoaded()) {

      this.showLoadingMessage('Loading remaining assets...');
      
      // Wait for all assets to load
      this.waitForAllAssets(() => {

        this.startGameScene();
      });
      return;
    }
    
    this.startGameScene();
  }

  private startGameScene() {
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

  private areAllAssetsLoaded(): boolean {
    // Check for critical assets that must be loaded from both Boot2 and Boot scenes
    const criticalAssets = [
      // Background assets (from Boot)
      'bg1', 'bg2', 'bg3', 'bg4',
      // Core gameplay assets (from Boot)
      'toilet', 'plunger', 'sink', 'towel', 'portal', 'grabber',
      // Audio assets (from Boot)
      'toiletFlush', 'plungerSound',
      // Boot2 assets (critical items)
      'ion_sprayer_asset', 'maintenance_halberd_asset', 'portal_key_beta_asset',
      'portal_key_alpha_asset', 'portal_access_token_asset', 'boss_sigil_asset',
      'containment_set_asset', 'containment_spear_asset', 'cryo_pipe_asset',
      'cryo_foam_cannon_asset', 'foam_blaster_asset', 'heated_pipe_asset',
      'laser_duck_asset', 'misting_fan_asset', 'pipe_serpent_asset',
      'shocking_puddle_asset', 'voltaic_wisp_asset', 'stun_lance_asset',
      'static_sock_trap_asset', 'stasis_snare_asset', 'stabilized_fuse_asset',
      'sanitation_maul_asset', 'quack_of_doom_asset', 'power_coupler_asset',
      'steam_burst_asset', 'coolant_spill_asset', 'portal_slime_asset',
      'corrosive_bristles_asset'
    ];
    
    const missingAssets = criticalAssets.filter(asset => {
      if (asset.includes('Sound') || asset.includes('audio')) {
        return !this.cache.audio.exists(asset);
      } else if (asset === 'portal' || asset === 'grabber') {
        return !this.cache.json.exists(asset);
      } else {
        return !this.textures.exists(asset);
      }
    });
    
    if (missingAssets.length > 0) {

      return false;
    }
    
    // Also check if both loading scenes have completed
    const boot2Loaded = this.registry.get('boot2SceneLoaded') || false;
    const bootLoaded = this.registry.get('bootSceneLoaded') || false;
    
    if (!boot2Loaded || !bootLoaded) {

      return false;
    }
    
    return true;
  }

  private waitForAllAssets(callback: () => void) {
    const checkInterval = setInterval(() => {
      // Show progress while waiting
      this.showAssetLoadingProgress();
      
      if (this.areAllAssetsLoaded()) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
    
    // Fallback timeout after 10 seconds
    this.time.delayedCall(10000, () => {
      clearInterval(checkInterval);

      callback();
    });
  }

  private showLoadingMessage(message: string) {
    if (this.continueText) {
      this.continueText.setText(message);
      this.continueText.setColor('#ffff00');
    }
  }

  private showAssetLoadingProgress() {
    const criticalAssets = [
      'bg1', 'bg2', 'bg3', 'bg4', 'toilet', 'plunger', 'sink', 'towel',
      'portal', 'grabber', 'toiletFlush', 'plungerSound'
    ];
    
    const loadedAssets = criticalAssets.filter(asset => {
      if (asset.includes('Sound') || asset.includes('audio')) {
        return this.cache.audio.exists(asset);
      } else if (asset === 'portal' || asset === 'grabber') {
        return this.cache.json.exists(asset);
      } else {
        return this.textures.exists(asset);
      }
    });
    
    const progress = Math.round((loadedAssets.length / criticalAssets.length) * 100);
    const message = `Loading assets... ${progress}% (${loadedAssets.length}/${criticalAssets.length})`;
    
    if (this.continueText) {
      this.continueText.setText(message);
      this.continueText.setColor('#ffff00');
    }
  }

  private ensureAllScenesLoaded() {
    // Mark that Boot scene has finished loading
    this.registry.set('bootSceneLoaded', true);
    
    // Check if both Boot2 and Boot have loaded
    const boot2Loaded = this.registry.get('boot2SceneLoaded') || false;
    const bootLoaded = this.registry.get('bootSceneLoaded') || false;
    
    if (boot2Loaded && bootLoaded) {

      this.registry.set('allAssetsLoaded', true);
    }
  }

  private loadAllAssets() {
    // Count total assets for progress calculation
    this.totalAssets = this.getTotalAssetCount();

    // Load critical assets first (UI and basic gameplay)
    this.loadCriticalAssets();
    
    // Load non-critical assets after critical ones complete
    this.load.once('complete', () => {
      this.loadNonCriticalAssets();
    });
  }

  private loadCriticalAssets() {

    
    // Load essential UI and gameplay assets first
    this.load.image('newmenu', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/newmenu-8dSJiOFThHqPPI8SA8xCPqszPxAw4D.png');
    
    // Load essential gameplay assets
    this.load.image('toilet', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22toilet%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-IKQiDYjmgMvxEJRt3rMo6ThQDqBDua.%20strait%20foreward%20front%20to%20back%20view-1');
    this.load.image('plunger', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Plunger%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-bq6jyw6EYmsBI3to7wVAZCVSDwOQ6K.5d-2');
    this.load.image('sink', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22sink%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-IYyixzsfkoTJidTzy6KeYMMA0c9Plx.5d%0A-0');
    this.load.image('towel', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Towel%22%20hanging%20on%20a%20rack%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-rC0ib1ZmGm4LxGPUNb2RLZ7pob2pit.%20strait%20foreward%20view%20no%20face-2');
    
    // Load essential sounds
    this.load.audio('toiletFlush', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/foley-toilet-flush-without-tank-refill-238004-5QbPCVstF4Oln1bjmAlQVuNaOyf4fJ.mp3');
    this.load.audio('plungerSound', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/plunge1-41079-qDvqpVQX79raem2TiioLxoJI01dP5L.mp3');
    
    // Load essential spritesheets
    this.load.spritesheet('grabber', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/grabber-lUJTyIWnq9CjliEl5ja6cxUFIeG2LM.png', {
      frameWidth: 50,
      frameHeight: 50
    });
    
    // Add debugging for critical assets
    this.load.on('complete', () => {
      // Critical assets loaded successfully
    });
    
    this.load.on('loaderror', (file: any) => {

    });
    
    // Start loading critical assets
    this.load.start();
  }

  private loadNonCriticalAssets() {

    
    // Reset loader for non-critical assets
    this.load.reset();
    
    // Load the individual background images
    this.load.image('bg1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-1.png-omFNFdYBZKMrfkDnpNjBXNPBeqAMbN.png');
    this.load.image('bg2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-2.png-ZbNJ6RRWHIRiqlo7UeNZvEnAvS8zZj.png');
    this.load.image('bg3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-3.png-jl1Pr5ArmCzxO5XnkkPkEgO1ehf1pR.png');
    this.load.image('bg4', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-4.png-P15Xly4Z8u95svzTGjGDQDvZGbz5Gd.png');
    
    // Load portal spritesheet
    this.load.spritesheet('portal', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal_spritesheet-tuu0GUj716OBvtpw0lhDcMaD1YrejO.png', {
      frameWidth: 256,
      frameHeight: 256
    });
    
    // Load new spritesheet
    this.load.spritesheet('newSprite', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51%20%281%29-N0k0h97JQbjHMn2B6KTIbbaVgcQR4M.png', {
      frameWidth: 114,
      frameHeight: 86
    });
    
    // Load all toilet sprites
    this.load.image('toilet1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-1.png-8FmoeG5xdeVd1DLEd8rZ3CEuVDPqeY.png');
    this.load.image('toilet2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-2.png-nkv4UxTBRWqW2lvAhqp0vAEh9tjYsv.png');
    this.load.image('toilet3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-3.png-5RKT6lEsgJeuptGRSEoGgpOeeiwiJQ.png');
    this.load.image('toilet4', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-4.png-JwdcykiV8cLm8DCbgkDHJWg2G8X7xN.png');
    
    // Load additional sounds
    this.load.audio('splash1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash1-ZhiBCgWV50qZwEnJcnc3xe0V8TXCJp.mp3');
    this.load.audio('splash2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash2-KQSUDmq8LUv7hxqEUEQXS93tBQXuqu.mp3');
    this.load.audio('splash3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash3-us9Pqt7kxSAJkVojZWspen5Dd1iUXb.mp3');
    
    // Load portal sounds
    this.load.audio('portal1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal1-oYnuTCyji35ZDy5GNXT8QFa1gzeE13.mp3');
    this.load.audio('portal2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal2-VHLGnHb9sSv51U9T7qzcddlzDALFF4.mp3');
    
    // Load hint sounds
    this.load.audio('yikes', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/yikes-Vi54H0vzUClhbpF8o9H8dQs1KbAQMt.mp3');
    this.load.audio('terrible', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/terrible-r7pofktgQpHBDrrsOJAkhT6gYK42Wl.mp3');
    this.load.audio('sureabout', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/sureabout-OckNxXUPEpxGUHlr9eVuZorydeSoHW.mp3');
    this.load.audio('embarass', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/embarass-mtE8FA0viKOZ0gp2tQzqnHCZj6RU8M.mp3');
    this.load.audio('seriously', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/seriously-c0ofIrFZLOjS2Jv5VlPRbFozZsvKvH.mp3');
    
    // Load first box opening sounds
    this.load.audio('howdy', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/howdy-B3wQyU3PlqpsVpOqgCJvrp3qAUzmjv.mp3');
    this.load.audio('batery', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/batery-4osiJ6F91TN3xl3NlKxquNxtqSWpiv.mp3');
    
    // Load tutorial sounds
    this.load.audio('flush', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/flush-ESL48SbyotvOLXGGXsrUaOtSxtPakz.mp3');
    this.load.audio('down', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/down-pBkY4fmuvCzL9QSt3q8zxKnD1Ge2BY.mp3');
    this.load.audio('here', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/here-VYs3SHqYwTKDKjGtk28MZ2z5cXnQW5.mp3');
    this.load.audio('return', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/return-ZLLbqsg0Cd1gKPqiE1QP5hwZx9H8b5.mp3');
    
    // Load game-over sound
    this.load.audio('gameover', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/game-over-man-game-over-mp3cut-5cRS5010WPIgNZKiMzBQNXAjIXjIzi.mp3');
    
    // Load box sounds
    this.load.audio('boxbounce', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxbounce-CVctuQ4XqRmZFvBYejFLF92hMC6OJL.mp3');
    this.load.audio('boxcrash', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxcrash-z6pe8NjOBPqjKDEjoghCzYTFFNGrxY.mp3');
    
    // Load sink and faucet
    this.load.image('sinkon', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/sinkon-sXqY1OiqMfj2aM5ImNfiLg1A32OqrU.webp');
    this.load.audio('faucet', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/faucet-7JzQkkQ2fVhfqqYYrEgN3MTS77Qvs8.mp3');
    
    // Load goo sounds
    this.load.audio('oozesplat', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/oozesplat-FmuPEVnMRszD4eIEGb3p060MqzCPFP.mp3');
    this.load.audio('ooze', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/ooze-eKJdjuPejyaPHzcEPOP7VwPhfssZx7.mp3');
    
    // Load toilet paper assets
    this.load.image('tpblink', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/tpblink-klxAZeU4J0dsOZt3UUIQyLwPbuAOin.webp');
    this.load.image('tp', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/tp-b7pUbOjci6HEDoUu6XqNg7kruvwZsa.png');
    
    // Load recycler assets
    this.load.image('trash_recycler', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recycler4-TXaXLDoHFjOCCWWV2axZvt5XEqx29n.png');
    this.load.image('recycler3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recycler3-nOhNttyz6urdLhU3kBwz5py05YkW6w.png');
    
    // Load goomba asset
    this.load.image('goomba', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%2090s-00s%20rick%20and%20morty%20style%20%22Roomba%22%2C%20but%20its%20called%20instead%20a%20%22Goo-mba%22%20no%20shadow%2C%20no%20people%2C%20no%20background-1-none%20it%20should%20say%20Goo-mba%22%20on%20the%20side-h084Ya81JHMTp0gdSDhkqDHOFmcXNV.%20should%20have%20a%20capsule%20on%20top%20with%20a%20happy%20good%20guy%20inside-0');
    
    // Load recycler sound
    this.load.audio('recsound', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recsound-HB8WEyVnRhp3Vmk6oZBtP11dpUVlLT.mp3');
    
    // Load jar of goo asset
    this.load.image('jar_of_goo', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22jar%20of%20goo%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-7IxyGZuzQ9NpAIh575MQQ22EEEg0QR.-3');
    
    // Load main menu music
    this.load.audio('mainMenuMusic', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/main-menu-music-8dSJiOFThHqPPI8SA8xCPqszPxAw4D.mp3');
    
    // Load item assets
    this.load.image('mop_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Mop%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-0Rllm47amMc5FJ1YYSVppCf8Q9yVnx.5d-0');
    this.load.image('loose_wires_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Loose%20Wires%22%20%20just%20a%20pile%20of%20wires%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-Dctj0vehiJJX4FhO2VEzZ6Prv6OnQU.5d-0');
    this.load.image('rubber_duck_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Rubber%20Duck%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-PvFuLRK9Kcr8se4WwSYmFuN2IHiklm.5d-0');
    this.load.image('sock_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Sock%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-CG0w8V233dGR4o0GCF9gIqlSUyBpQa.5d-0');
    this.load.image('duct_tape_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Duct%20Tape%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ANR9sRNgmHPIETmpkLzRwmGIHs3VYt.5d-2');
    this.load.image('toolkit_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22tool%20kit%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2X54S3bbRtpgilzkqU00fbE5q2Sjjm.5d-0');
    // Note: Many item assets are loaded by AssetManager.ts to avoid duplicate texture warnings
    // Only unique assets that aren't handled by AssetManager are loaded here
    this.load.image('coolant_tank_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Coolant%20Tank%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-hD6ImhqB54Dmu1j2oBsyjTDYsVrsMn.5d%0A-2');
    this.load.image('screw_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22screw%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-EyHFsBrFmVc2xvpgUbrFwQ6LnfVD55.5d-3');
    this.load.image('wrench_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22wrench%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-vraJu89JpLdkyf9PTXQXrgjatOUwy2.5d-0');
    this.load.image('energy_canister_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Energy%20Canister%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ucTd6MToNY5lCli6MjfsanFwA3m9Mv.5d-1');
    this.load.image('goldfish_bowl_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Goldfish%20Bowl%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-sTCZ7zS4vPyvNMcLFTcB2UuydfxlWq.5d-0');
    this.load.image('portal_shard_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Portal%20Shard%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-A6dp5dm7mZIq1qN5jfjWa5MTfjWuLH.5d-0');
    this.load.image('battery_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-L6oEJkPsYhgclnv8Xw9FnK2Dw9tjPL.%20Rick%20and%20morty%20style%209%20volt%20battery%20no%20shadow%20no%20background-3');
    this.load.image('fuse_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22FUSE%22%20%28like%20one%20that%20goes%20in%20a%20car%5D%20no%20shadows%20no%20background-0-Sihn5vGQnoWdQmhlOFxnPBGZ2ogEeA');
    this.load.image('pipe_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-NAJhLYKrYJ9giJEhZgoVCYDVxzQYrq.%20Rick%20and%20morty%20style%20pipe%20%28like%20a%20lead%20pipe%29%20no%20shadows%20no%20background-3');
    this.load.image('ham_sandwich_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rotten%20ham%20sandwich%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-0-SrjJtTB5gpA1aBuhTynSK4ho6NBsz4');
    this.load.image('unstable_goo_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-5oZXl4wPh90INtS5kNdVu2y4Rd5dJE.%20Rick%20and%20morty%20style%20unstable%20goo%20no%20shadows%20no%20background-0');
    this.load.image('soggy_paper_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22soggy%20toilet%20paper%22%20no%20people%20no%20shadows%20no%20background-1-yoD6JHs5ll309taZtzMspYarAxlrcm');
    this.load.image('powered_wire_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20bundle%20of%20%22Powered%20Wire%22%20electric%20wires%20with%20arcs%20of%20lightning%20arcs%20no%20shadows%20no%20background-0-NVLAh9ZxGlhZzcmcYW7gM8NImUl3US');
    this.load.image('thors_plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22Shock%20Plunger%22%20a%20metal%20toilet%20plungers%20with%20electric%20arcs%20no%20shadows%20no%20background-3-T3NB9atfbZIGDiPymHCa4KhfowIqry');
    this.load.image('goo_splatter', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%20splatter%20of%20green%20goo%2C%20cartoonish-W0Mt5IcK1nXkRIovNFBL1di1KivaGP.%20It%20should%20look%20like%20it%20is%20on%20a%20flat%20surface%20below%20eye%20level%20in%20single%20point%20perspective-3');
    this.load.image('box_closed', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/box-IT6ZUgllN2DmODelgycfajoJdMD4Pn.png');
    this.load.image('box_open', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxopen-f6HGm3wgSIa7RZxKXYG5U5BsxyU6jm.png');
    this.load.image('fan_blade_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Fan%20Blade%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-KiTQpjpscu6qf12HqaP8K04JnPwF3y.5d-2');
    this.load.image('toilet_brush_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Brush%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-DHWilH7Hz2GgQJRwtgfyEuKTPFY0Pk.5d-0');
    this.load.image('toilet_paper_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Paper%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-SYJCbR1Py98sYB7Pw1VpaI0U0amrRA.5d-1');
    this.load.image('soap_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Soap%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-OSZesnJPp4UP0yLXcM8DIKcFUF0wkn.5d-0');
    this.load.image('bucket_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bucket%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6muHgpXHMdW2oMNtZReBU2GfxADs0S.5d-2');
    this.load.image('plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-9TGifL3Bo8Y1k2EJXnOaliJaEao7Po.%20Rick%20and%20morty%20style%20plunger%20with%20a%20face%20no%20shadow%20no%20ground%20no%20background-2');
    this.load.image('reinforced_plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Reinforce%20Plunger%22%20%28pluger%20with%20armor%20on%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6bblSfdPhJOdQqAvi26p6t6vyExayW.5d-1-none-3');
    this.load.image('pipe_lance_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Pipe%20Lance%22%20%28a%20lead%20pipe%20with%20a%20lance%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2MHjaqFxlElBmHAuKVuStgy2HH5XEb.5d-1-none-1');
    this.load.image('bandaged_towel_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bandaged%20Towel%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-YP5h206K07saeIn2VOZInZ2wu4iPAh.5d-1-none-0');
    this.load.image('chilled_pipe_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-futuristic%2090s-00s%20rick%20and%20morty%20style%20%22chilled%20pipe%22%20%28lead%20pipe%20with%20Ice%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-g3Xs7K2p8p2hIuXiZuF82ZenRkdWAu.5d-1-none-0');
    this.load.image('coolant_bowl_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22coolant%20bowl%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ConqzoanzKvOqtUIYuh1IpeXlJlgf4.5d-1-none-3');
    this.load.image('improvised_screwdriver_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-rick%20and%20morty%20style%20broken%20butter%20knife%20no%20shadow-3-0Xl0u7DVsCHMUy64RWecJ2Vzhq4GQT');
    this.load.image('chilled_sock_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20green%20sock%20with%20ice%20on%20it%2C%20%22Chilled%20Sock%22%20no%20shadow-0-T1kIMKXLEYzb15vhVUWwOlL7xX45F5');
    this.load.image('wet_mop_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20%22Wet%20Mop%22%20it%20should%20look%20like%20it%20has%20PTSD%20no%20shadow-2-tKubw33lLArlbQfFgqmDTajINn0Bxp');
    this.load.image('interactive_mop_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/mop.webp');
    this.load.image('bubble_cyclone_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20%22Soap%20Bubble%20Tornado%22%20no%20shadow-0-4UTHwEkFSzCvi1w01nov6A1j6UNT1Q');
    this.load.image('wired_fuse_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20Fuse%20in%20a%20wire%20harness%2C%20car%20style%20fuse%20no%20shadow%20no%20people%2C%20anthropomorphized-0-8AR8RFyG90HoD1AfpKUMBnI6fp3ovg');
    // soapy_mop_asset, bubble_wand_asset, makeshift_vent_asset, charged_duck_asset, foam_roll_asset are loaded by AssetManager.ts
    // sticky_sock_asset is loaded by AssetManager.ts
    this.load.image('book_closed', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22bestiary%20book%22%20closed%2C%20%20no%20background%20no%20shadows-0-auUOBgFdket6BYZbF0UEYWGfkUujL6');
    this.load.image('book_open', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bestiaryopen-fm4h6KDMWUK1oywWIYryPTOXlyUKm0.png');
    // electric_brush_asset, confetti_storm_asset, goo_tornado_asset, thermo_coil_asset, cryo_coil_asset, cryo_coupler_asset, repaired_pipe_asset are loaded by AssetManager.ts
    this.load.image('radio', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/radio-8dSJiOFThHqPPI8SA8xCPqszPxAw4D.png');
    this.load.image('buy_now', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/buy%20now-OQBLCSY14iMvtbGEnOgx9miJ81zv3i.png');
    this.load.image('store', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/store-02cYnBbg16M9TP1mwNQJdnEXhXpPu5.png');
    
    // Load store audio
    this.load.audio('store', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/store-tRd4akrIffWZH46ovmqTNlSWNUUeqY.mp3');
    
    // Start loading non-critical assets
    this.load.start();
  }

  private getTotalAssetCount(): number {
    // Count critical assets
    let count = 0;
    
    // Critical assets (always loaded)
    count += 6; // newmenu, toilet, plunger, sink, towel, grabber spritesheet, toiletFlush, plungerSound
    
    // Non-critical assets (loaded after critical ones)
    count += 4; // bg1, bg2, bg3, bg4
    count += 2; // portal spritesheet, newSprite spritesheet
    count += 4; // toilet1, toilet2, toilet3, toilet4
    count += 3; // splash1, splash2, splash3
    count += 2; // portal1, portal2
    count += 5; // yikes, terrible, sureabout, embarass, seriously
    count += 2; // howdy, batery
    count += 4; // flush, down, here, return
    count += 1; // gameover
    count += 2; // boxbounce, boxcrash
    count += 2; // sinkon, faucet
    count += 2; // oozesplat, ooze
    count += 2; // tpblink, tp
    count += 2; // trash_recycler, recycler3
    count += 1; // goomba
    count += 1; // recsound
    count += 1; // jar_of_goo
    count += 1; // mainMenuMusic
    count += 30; // Reduced count since many assets are loaded by AssetManager.ts to avoid duplicates
    count += 3; // radio, buy_now, store
    count += 1; // store audio
    
    return count;
  }

  private setupLoadingEvents() {
    let lastProgress = 0;
    let progressStuckTime = 0;
    const progressTimeout = 5000; // Reduced from 10s to 5s for stuck progress
    
    // Track failed assets for retry
    let failedAssets: string[] = [];
    let retryCount = 0;
    const maxRetries = 2;
    
    // Set up loading progress events
    this.load.on('progress', (progress: number) => {
      const currentTime = this.time.now;
      
      // Check if progress is stuck
      if (progress === lastProgress) {
        if (progressStuckTime === 0) {
          progressStuckTime = currentTime;
        } else if (currentTime - progressStuckTime > progressTimeout) {

          // Force the loading to complete by triggering the complete event
          this.load.emit('complete');
          return;
        }
      } else {
        progressStuckTime = 0; // Reset stuck timer
        lastProgress = progress;
      }
      
      // Update loading bar
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x3498db);
      this.loadingBar.fillRoundedRect(
        this.scale.width / 2 - 200, 
        this.scale.height / 2 - 20, 
        400 * progress, 
        40, 
        10
      );
      
      // Update loading text
      this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });

    this.load.on('complete', () => {
      this.onLoadComplete();
    });
    
    // Add error handling for individual assets with retry mechanism
    this.load.on('loaderror', (file: any) => {

      
      // Add to failed assets list
      if (!failedAssets.includes(file.key)) {
        failedAssets.push(file.key);
      }
      
      // Continue loading even if some assets fail
      // But if too many fail, consider it a critical error
      if (failedAssets.length > 10) {

        this.handleCriticalLoadFailure();
        return;
      }
    });
    
    // Add a global timeout for the entire loading process - reduced from 30s to 15s
    this.time.delayedCall(15000, () => {
      if (!this.isLoadingComplete) {
        // Force the loading to complete by triggering the complete event
        this.load.emit('complete');
      }
    });
    
    // Add a faster timeout for critical assets (5 seconds)
    this.time.delayedCall(5000, () => {
      if (!this.isLoadingComplete && this.load.list.size === 0) {
        this.load.emit('complete');
      }
    });
  }
  
  private handleCriticalLoadFailure() {

    
    // Try to create start button with minimal assets
    if (this.textures.exists('newmenu')) {

      this.createStartButton();
    } else {

      this.createFallbackStartButton();
    }
  }

  private createFallbackStartButton() {
    // Create a minimal start button when critical assets fail
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    
    // Clear any existing elements
    this.children.removeAll(true);
    
    // Create fallback background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x2c3e50);
    
    // Create title
    const title = this.add.text(centerX, centerY - 100, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    
    // Create start button
    const startButton = this.add.graphics();
    startButton.fillStyle(0x27ae60);
    startButton.fillRoundedRect(-120, -25, 240, 50, 8);
    startButton.setPosition(centerX, centerY + 50);
    startButton.setInteractive(new Phaser.Geom.Rectangle(-120, -25, 240, 50), Phaser.Geom.Rectangle.Contains);
    
    const startText = this.add.text(centerX, centerY + 50, "START GAME", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    startText.setOrigin(0.5);
    
    // Add click handler
    startButton.on('pointerdown', () => {
      this.saveGameChoice = 'new';
      this.startGame();
    });
    
    // Add hover effects
    startButton.on('pointerover', () => {
      startButton.clear();
      startButton.fillStyle(0x2ecc71);
      startButton.fillRoundedRect(-120, -25, 240, 50, 8);
    });
    
    startButton.on('pointerout', () => {
      startButton.clear();
      startButton.fillStyle(0x27ae60);
      startButton.fillRoundedRect(-120, -25, 240, 50, 8);
    });
    

  }

}
