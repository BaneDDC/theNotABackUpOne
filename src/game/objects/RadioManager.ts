
// src/game/objects/RadioManager.ts

import { Scene } from 'phaser';

export class RadioManager {
  private scene: Scene;
  private radioSprite: Phaser.GameObjects.Sprite;
  private controlPanel?: Phaser.GameObjects.Container;
  private volumeDial?: Phaser.GameObjects.Graphics;
  private volumeKnob?: Phaser.GameObjects.Graphics;
  private prevButton?: Phaser.GameObjects.Graphics;
  private nextButton?: Phaser.GameObjects.Graphics;
  private closeButton?: Phaser.GameObjects.Graphics;
  private volumeText?: Phaser.GameObjects.Text;
  private songText?: Phaser.GameObjects.Text;
  private powerButton?: Phaser.GameObjects.Graphics;
  private powerButtonText?: Phaser.GameObjects.Text;
  
  private isControlsVisible: boolean = false;
  private currentVolume: number = 0.5; // 0 to 1
  private currentSong: number = 0;
  private totalSongs: number = 4; // Updated from 5 to 4 since we now have 4 actual songs
  private isDraggingDial: boolean = false;
  private isPoweredOn: boolean = false; // Track power state - changed to false (off by default)
  private currentMusic?: Phaser.Sound.BaseSound; // Currently playing music
  
  // Song list with actual audio
  private songList: string[] = [
    "Adventure Theme",
    "80s Synthwave", // Updated from placeholder
    "Neon Dreams", // Updated from placeholder
    "Retrowave", // Updated from placeholder
    "Song 5 - Placeholder"
  ];

  // Audio keys for each song
  private audioKeys: string[] = [
    "adventure2", // First song uses the provided audio asset
    "80s", // Second song uses the 80s audio asset
    "neon", // Third song uses the neon audio asset
    "retrowave", // Fourth song uses the retrowave audio asset
    ""
  ];

  constructor(scene: Scene, radioSprite: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.radioSprite = radioSprite;
    
    // Load the adventure2 audio if not already loaded
    this.loadAudioAssets();
    
    this.setupRadioInteraction();
  }

  private loadAudioAssets() {
    // Load adventure2 audio if it's not already in the cache
    if (!this.scene.cache.audio.exists('adventure2')) {
      this.scene.load.audio('adventure2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/adventure2-Ybp4dLj9YICm4rIEUPoCPcbCtFgMXV.mp3');
    }
    
    // Load 80s audio if it's not already in the cache
    if (!this.scene.cache.audio.exists('80s')) {
      this.scene.load.audio('80s', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/80s-0JPuISQK5dWL0hv6uHW04U6ZdYMIFz.mp3');
    }
    
    // Load neon audio if it's not already in the cache
    if (!this.scene.cache.audio.exists('neon')) {
      this.scene.load.audio('neon', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/neon-IJ8o0nCBRSid1xKD0lLYBoIhQV7yoK.mp3');
    }
    
    // Load retrowave audio if it's not already in the cache
    if (!this.scene.cache.audio.exists('retrowave')) {
      this.scene.load.audio('retrowave', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/retrowave-lJ93xv7NnpGqu3eaLkvrGHHFNfb2Ra.mp3');
    }
    
    // Start loading if not already in progress
    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  private setupRadioInteraction() {
    // Make radio clickable
    this.radioSprite.setInteractive();
    this.radioSprite.on('pointerdown', () => {
      this.toggleControls();
    });

    // Add hover effect
    this.radioSprite.on('pointerover', () => {
      this.scene.tweens.add({
        targets: this.radioSprite,
        scaleX: this.radioSprite.scaleX * 1.05,
        scaleY: this.radioSprite.scaleY * 1.05,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    this.radioSprite.on('pointerout', () => {
      this.scene.tweens.add({
        targets: this.radioSprite,
        scaleX: this.radioSprite.scaleX / 1.05,
        scaleY: this.radioSprite.scaleY / 1.05,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
  }

  private toggleControls() {
    if (this.isControlsVisible) {
      this.hideControls();
    } else {
      this.showControls();
    }
  }

  private showControls() {
    if (this.controlPanel) {
      this.controlPanel.destroy();
    }

    this.isControlsVisible = true;

    // Create control panel container
    this.controlPanel = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
    this.controlPanel.setDepth(2000);

    // Create background panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x2c3e50, 0.95);
    panelBg.lineStyle(3, 0x34495e);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 15);
    panelBg.strokeRoundedRect(-200, -150, 400, 300, 15);
    this.controlPanel.add(panelBg);

    // Title
    const title = this.scene.add.text(0, -120, "RADIO CONTROLS", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);
    this.controlPanel.add(title);

    // Power button (positioned in top-left area)
    this.createPowerButton();

    // Current song display
    this.songText = this.scene.add.text(0, -80, this.isPoweredOn ? this.songList[this.currentSong] : "RADIO OFF", {
      fontSize: "16px",
      color: this.isPoweredOn ? "#ecf0f1" : "#7f8c8d",
      wordWrap: { width: 350 },
      align: "center"
    });
    this.songText.setOrigin(0.5);
    this.controlPanel.add(this.songText);

    // Only create volume dial and navigation if powered on
    if (this.isPoweredOn) {
      // Create volume dial
      this.createVolumeDial();

      // Create navigation buttons
      this.createNavigationButtons();
    } else {
      // Show "POWER OFF" message where controls would be
      const powerOffText = this.scene.add.text(0, 20, "POWER OFF", {
        fontSize: "20px",
        color: "#7f8c8d",
        fontStyle: "bold"
      });
      powerOffText.setOrigin(0.5);
      this.controlPanel.add(powerOffText);
    }

    // Create close button
    this.createCloseButton();

    // Entrance animation
    this.controlPanel.setScale(0);
    this.scene.tweens.add({
      targets: this.controlPanel,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private createPowerButton() {
    if (!this.controlPanel) return;

    const buttonSize = 35;
    const buttonX = -150;
    const buttonY = -120;

    // Power button background
    this.powerButton = this.scene.add.graphics();
    const buttonColor = this.isPoweredOn ? 0x27ae60 : 0xe74c3c; // Green when on, red when off
    this.powerButton.fillStyle(buttonColor);
    this.powerButton.fillCircle(buttonX, buttonY, buttonSize / 2);
    this.powerButton.setInteractive(new Phaser.Geom.Circle(buttonX, buttonY, buttonSize / 2), Phaser.Geom.Circle.Contains);
    this.controlPanel.add(this.powerButton);

    // Power button symbol
    const powerSymbol = this.isPoweredOn ? "⏻" : "⏻"; // Power symbol (same for both states, color will differentiate)
    this.powerButtonText = this.scene.add.text(buttonX, buttonY, powerSymbol, {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this.powerButtonText.setOrigin(0.5);
    this.controlPanel.add(this.powerButtonText);

    // Power button hover effects
    this.powerButton.on('pointerover', () => {
      const hoverColor = this.isPoweredOn ? 0x2ecc71 : 0xc0392b;
      this.powerButton.clear();
      this.powerButton.fillStyle(hoverColor);
      this.powerButton.fillCircle(buttonX, buttonY, buttonSize / 2);
    });

    this.powerButton.on('pointerout', () => {
      const normalColor = this.isPoweredOn ? 0x27ae60 : 0xe74c3c;
      this.powerButton.clear();
      this.powerButton.fillStyle(normalColor);
      this.powerButton.fillCircle(buttonX, buttonY, buttonSize / 2);
    });

    // Power button click handler
    this.powerButton.on('pointerdown', () => {
      this.togglePower();
    });
  }

  private togglePower() {
    this.isPoweredOn = !this.isPoweredOn;
    
    // Add click feedback animation
    if (this.powerButton && this.powerButtonText) {
      this.scene.tweens.add({
        targets: [this.powerButton, this.powerButtonText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    }
    
    // Close and reopen controls to refresh the UI
    this.hideControls();
    
    // Reopen controls after a brief delay
    this.scene.time.delayedCall(250, () => {
      this.showControls();
    });
    
    // Apply power state to any playing music
    this.applyPowerState();
  }

  private applyPowerState() {
    if (!this.isPoweredOn) {
      // When powered off, stop any playing music
      if (this.currentMusic && this.currentMusic.isPlaying) {
        this.currentMusic.stop();
      }

    } else {
      // When powered on, resume or start music if needed

      this.playSong();
    }
  }

  private createVolumeDial() {
    if (!this.controlPanel) return;

    // Volume label
    const volumeLabel = this.scene.add.text(0, -30, "VOLUME", {
      fontSize: "14px",
      color: "#bdc3c7"
    });
    volumeLabel.setOrigin(0.5);
    this.controlPanel.add(volumeLabel);

    // Volume dial background (outer circle)
    this.volumeDial = this.scene.add.graphics();
    this.volumeDial.lineStyle(4, 0x7f8c8d);
    this.volumeDial.strokeCircle(0, 20, 50);
    
    // Volume dial inner circle (darker)
    this.volumeDial.fillStyle(0x34495e);
    this.volumeDial.fillCircle(0, 20, 45);
    
    // Volume dial tick marks
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 150) * Math.PI / 180; // -150 to +150 degrees
      const startRadius = 35;
      const endRadius = 42;
      const startX = Math.cos(angle) * startRadius;
      const startY = Math.sin(angle) * startRadius + 20;
      const endX = Math.cos(angle) * endRadius;
      const endY = Math.sin(angle) * endRadius + 20;
      
      this.volumeDial.lineStyle(2, 0x95a5a6);
      this.volumeDial.lineBetween(startX, startY, endX, endY);
    }
    
    this.controlPanel.add(this.volumeDial);

    // Volume knob (draggable)
    this.volumeKnob = this.scene.add.graphics();
    this.updateVolumeKnob();
    this.controlPanel.add(this.volumeKnob);

    // Make volume knob interactive
    const knobHitArea = new Phaser.Geom.Circle(0, 20, 15);
    this.volumeKnob.setInteractive(knobHitArea, Phaser.Geom.Circle.Contains);
    
    this.volumeKnob.on('pointerdown', () => {
      this.isDraggingDial = true;
    });

    // Volume percentage text
    this.volumeText = this.scene.add.text(0, 85, `${Math.round(this.currentVolume * 100)}%`, {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this.volumeText.setOrigin(0.5);
    this.controlPanel.add(this.volumeText);

    // Set up global pointer events for dial dragging
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }

  private updateVolumeKnob() {
    if (!this.volumeKnob) return;

    this.volumeKnob.clear();
    
    // Calculate knob angle based on volume (from -150 to +150 degrees)
    const angle = (-150 + (this.currentVolume * 300)) * Math.PI / 180;
    
    // Knob body
    this.volumeKnob.fillStyle(0xe74c3c);
    this.volumeKnob.fillCircle(0, 20, 12);
    
    // Knob indicator line
    this.volumeKnob.lineStyle(3, 0xffffff);
    const indicatorX = Math.cos(angle) * 8;
    const indicatorY = Math.sin(angle) * 8 + 20;
    this.volumeKnob.lineBetween(0, 20, indicatorX, indicatorY);
  }

  private createNavigationButtons() {
    if (!this.controlPanel) return;

    const buttonY = -10;
    const buttonSize = 30;

    // Previous button (left arrow)
    this.prevButton = this.scene.add.graphics();
    this.prevButton.fillStyle(0x3498db);
    this.prevButton.fillRoundedRect(-120 - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize, 5);
    this.prevButton.setInteractive(new Phaser.Geom.Rectangle(-120 - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize), Phaser.Geom.Rectangle.Contains);
    this.controlPanel.add(this.prevButton);

    // Previous arrow text
    const prevArrow = this.scene.add.text(-120, buttonY, "◀", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    prevArrow.setOrigin(0.5);
    this.controlPanel.add(prevArrow);

    // Next button (right arrow)
    this.nextButton = this.scene.add.graphics();
    this.nextButton.fillStyle(0x3498db);
    this.nextButton.fillRoundedRect(120 - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize, 5);
    this.nextButton.setInteractive(new Phaser.Geom.Rectangle(120 - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize), Phaser.Geom.Rectangle.Contains);
    this.controlPanel.add(this.nextButton);

    // Next arrow text
    const nextArrow = this.scene.add.text(120, buttonY, "▶", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    nextArrow.setOrigin(0.5);
    this.controlPanel.add(nextArrow);

    // Button hover effects and click handlers
    this.setupButtonEffects();
  }

  private setupButtonEffects() {
    if (!this.prevButton || !this.nextButton) return;

    // Previous button effects
    this.prevButton.on('pointerover', () => {
      this.prevButton!.clear();
      this.prevButton!.fillStyle(0x2980b9);
      this.prevButton!.fillRoundedRect(-120 - 15, -25, 30, 30, 5);
    });

    this.prevButton.on('pointerout', () => {
      this.prevButton!.clear();
      this.prevButton!.fillStyle(0x3498db);
      this.prevButton!.fillRoundedRect(-120 - 15, -25, 30, 30, 5);
    });

    this.prevButton.on('pointerdown', () => {
      this.previousSong();
    });

    // Next button effects
    this.nextButton.on('pointerover', () => {
      this.nextButton!.clear();
      this.nextButton!.fillStyle(0x2980b9);
      this.nextButton!.fillRoundedRect(120 - 15, -25, 30, 30, 5);
    });

    this.nextButton.on('pointerout', () => {
      this.nextButton!.clear();
      this.nextButton!.fillStyle(0x3498db);
      this.nextButton!.fillRoundedRect(120 - 15, -25, 30, 30, 5);
    });

    this.nextButton.on('pointerdown', () => {
      this.nextSong();
    });
  }

  private createCloseButton() {
    if (!this.controlPanel) return;

    this.closeButton = this.scene.add.graphics();
    this.closeButton.fillStyle(0xe74c3c);
    this.closeButton.fillCircle(170, -120, 15);
    this.closeButton.setInteractive(new Phaser.Geom.Circle(170, -120, 15), Phaser.Geom.Circle.Contains);
    this.controlPanel.add(this.closeButton);

    // Close button X
    const closeX = this.scene.add.text(170, -120, "✕", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    closeX.setOrigin(0.5);
    this.controlPanel.add(closeX);

    // Close button effects
    this.closeButton.on('pointerover', () => {
      this.closeButton!.clear();
      this.closeButton!.fillStyle(0xc0392b);
      this.closeButton!.fillCircle(170, -120, 15);
    });

    this.closeButton.on('pointerout', () => {
      this.closeButton!.clear();
      this.closeButton!.fillStyle(0xe74c3c);
      this.closeButton!.fillCircle(170, -120, 15);
    });

    this.closeButton.on('pointerdown', () => {
      this.hideControls();
    });
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDraggingDial || !this.controlPanel || !this.isPoweredOn) return; // Don't allow volume changes when powered off

    // Convert pointer position to control panel local coordinates
    const localPoint = this.controlPanel.getLocalPoint(pointer.x, pointer.y);
    
    // Calculate angle from dial center to pointer
    const dialCenterX = 0;
    const dialCenterY = 20;
    const angle = Math.atan2(localPoint.y - dialCenterY, localPoint.x - dialCenterX);
    
    // Convert angle to degrees and normalize to dial range (-150 to +150)
    let degrees = angle * 180 / Math.PI;
    
    // Clamp to dial range
    if (degrees < -150) degrees = -150;
    if (degrees > 150) degrees = 150;
    
    // Convert to volume (0 to 1)
    this.currentVolume = (degrees + 150) / 300;
    this.currentVolume = Phaser.Math.Clamp(this.currentVolume, 0, 1);
    
    // Update visuals
    this.updateVolumeKnob();
    if (this.volumeText) {
      this.volumeText.setText(`${Math.round(this.currentVolume * 100)}%`);
    }
    
    // Apply volume to game (when we have music)
    this.applyVolume();
  }

  private onPointerUp() {
    this.isDraggingDial = false;
  }

  private previousSong() {
    if (!this.isPoweredOn) return; // Don't change songs when powered off
    
    this.currentSong = (this.currentSong - 1 + this.totalSongs) % this.totalSongs;
    this.updateSongDisplay();
    this.playSong();
  }

  private nextSong() {
    if (!this.isPoweredOn) return; // Don't change songs when powered off
    
    this.currentSong = (this.currentSong + 1) % this.totalSongs;
    this.updateSongDisplay();
    this.playSong();
  }

  private updateSongDisplay() {
    if (this.songText) {
      if (this.isPoweredOn) {
        this.songText.setText(this.songList[this.currentSong]);
        this.songText.setColor("#ecf0f1");
      } else {
        this.songText.setText("RADIO OFF");
        this.songText.setColor("#7f8c8d");
      }
    }
  }

  private playSong() {
    if (!this.isPoweredOn) return; // Don't play songs when powered off
    
    // Stop any currently playing music
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
    }
    
    // Get the audio key for the current song
    const audioKey = this.audioKeys[this.currentSong];
    
    if (audioKey && this.scene.cache.audio.exists(audioKey)) {
      // Play the actual audio
      this.currentMusic = this.scene.sound.add(audioKey, { 
        volume: this.currentVolume,
        loop: true // Loop the music
      });
      this.currentMusic.play();
      
      // Playing song
    } else {
      // Fallback for placeholder songs
              // Playing song (placeholder - no audio)
    }
    
    // Add visual feedback for song change
    if (this.songText) {
      this.scene.tweens.add({
        targets: this.songText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    }
  }

  private applyVolume() {
    if (!this.isPoweredOn) return; // Don't apply volume when powered off
    
    // Apply volume to currently playing music
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.setVolume(this.currentVolume);
    }
    
    // Volume set
  }

  private applyPowerState() {
    if (!this.isPoweredOn) {
      // When powered off, stop any playing music
      if (this.currentMusic && this.currentMusic.isPlaying) {
        this.currentMusic.stop();
      }

    } else {
      // When powered on, resume or start music if needed

      this.playSong();
    }
  }

  private hideControls() {
    if (!this.controlPanel) return;

    this.isControlsVisible = false;

    // Clean up pointer events
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);

    // Exit animation
    this.scene.tweens.add({
      targets: this.controlPanel,
      scaleX: 0,
      scaleY: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (this.controlPanel) {
          this.controlPanel.destroy();
          this.controlPanel = undefined;
        }
      }
    });
  }

  // Public methods for external control
  public setVolume(volume: number) {
    if (!this.isPoweredOn) return; // Don't allow volume changes when powered off
    
    this.currentVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.updateVolumeKnob();
    if (this.volumeText) {
      this.volumeText.setText(`${Math.round(this.currentVolume * 100)}%`);
    }
    this.applyVolume();
  }

  public getVolume(): number {
    return this.isPoweredOn ? this.currentVolume : 0;
  }

  public setPowerState(powered: boolean) {
    this.isPoweredOn = powered;
    this.applyPowerState();
  }

  public isPowered(): boolean {
    return this.isPoweredOn;
  }

  public setSongList(songs: string[]) {
    this.songList = songs;
    this.totalSongs = songs.length;
    this.currentSong = 0;
    this.updateSongDisplay();
  }

  public getCurrentSong(): number {
    return this.currentSong;
  }

  public getCurrentMusic(): Phaser.Sound.BaseSound | undefined {
    return this.currentMusic;
  }

  public destroy() {
    // Stop any playing music
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
    }
    
    // Clean up pointer events
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);

    if (this.controlPanel) {
      this.controlPanel.destroy();
    }
  }
}
