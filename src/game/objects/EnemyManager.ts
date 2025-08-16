
// src/game/objects/EnemyManager.ts

import { Scene } from 'phaser';
import { Item, isHazard } from '../config/mergeDataFull';

type EnemySprite = Phaser.GameObjects.Sprite & {
  itemName?: Item;
  enemyType?: string;
  isEnemy?: boolean;
  // Unstable Goo specific properties
  isUnstableGoo?: boolean;
  targetAsset?: any;
  isDissolving?: boolean;
  dissolveTimer?: Phaser.Time.TimerEvent;
  moveSpeed?: number;
  hasLanded?: boolean;
  isActive?: boolean;
  maxHealth?: number;
  currentHealth?: number;
  isStopped?: boolean;
  stopTimer?: Phaser.Time.TimerEvent;
  spawnSound?: Phaser.Sound.BaseSound;
  // Confetti Storm specific properties
  isConfettiStorm?: boolean;
  targetGoo?: any;
  // Goo Tornado specific properties
  isGooTornado?: boolean;
  spawnTimer?: Phaser.Time.TimerEvent;
  destructionRadius?: number;
  // Merge prevention property
  isMerging?: boolean;
  // Destruction prevention property
  isBeingDestroyed?: boolean;
};

export class EnemyManager {
  private scene: Scene;
  private enemies: Set<EnemySprite> = new Set();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public spawnEnemy(enemyType: Item, x: number, y: number): EnemySprite | null {
    if (enemyType === "Unstable Goo") {
      return this.spawnUnstableGoo(x, y);
    }
    
    if (enemyType === "Confetti Storm") {
      return this.spawnConfettiStorm(x, y);
    }
    
    if (enemyType === "Enemy: Goo Tornado") {
      return this.spawnGooTornado(x, y);
    }
    
    // Placeholder for other enemy types
    return null;
  }

  private spawnUnstableGoo(x: number, y: number): EnemySprite {
    // Create the goo sprite directly without using ItemManager to avoid circular dependency
    let goo: EnemySprite;
    
    // Try to use the asset if available, otherwise use fallback
    if (this.scene.textures.exists('unstable_goo_asset')) {
      goo = this.scene.add.sprite(x, y, 'unstable_goo_asset') as EnemySprite;
      // Apply proper scaling for the asset - made much larger
      goo.setDisplaySize(108, 108); // Doubled from 54x54 to 108x108 (4x original size)
    } else {
      // Fallback creation with white texture and green tint
      goo = this.scene.add.sprite(x, y, '__WHITE') as EnemySprite;
      goo.setDisplaySize(108, 108); // Doubled
      goo.setTint(0x44ff44); // Green tint
    }
    
    // Add physics to the sprite
    this.scene.physics.add.existing(goo);
    
    // Set enemy depth to 11
    goo.setDepth(11);
    
    // Set up Unstable Goo properties
    this.setupUnstableGooProperties(goo);
    
    // Add to enemies set
    this.enemies.add(goo);
    
    // Start AI after landing delay
    this.scene.time.delayedCall(2000, () => {
      if (goo.active && goo.hasLanded) {
        this.startUnstableGooAI(goo);
      }
    });

    return goo;
  }

  private spawnConfettiStorm(x: number, y: number): EnemySprite {
    // Create the confetti storm sprite
    let confetti: EnemySprite;
    
    // Try to use the asset if available, otherwise use fallback
    if (this.scene.textures.exists('confetti_storm_asset')) {
      confetti = this.scene.add.sprite(x, y, 'confetti_storm_asset') as EnemySprite;
      confetti.setDisplaySize(108, 108);
    } else {
      // Fallback creation with white texture and colorful tint
      confetti = this.scene.add.sprite(x, y, '__WHITE') as EnemySprite;
      confetti.setDisplaySize(108, 108);
      confetti.setTint(0xff69b4); // Pink tint for confetti
    }
    
    // Add physics to the sprite
    this.scene.physics.add.existing(confetti);
    
    // Set enemy depth to 11
    confetti.setDepth(11);
    
    // Set up Confetti Storm properties
    this.setupConfettiStormProperties(confetti);
    
    // Add to enemies set
    this.enemies.add(confetti);
    
    // Start AI after landing delay
    this.scene.time.delayedCall(2000, () => {
      if (confetti.active && confetti.hasLanded) {
        this.startConfettiStormAI(confetti);
      }
    });

    return confetti;
  }

  private spawnGooTornado(x: number, y: number): EnemySprite {
    // Create the goo tornado sprite
    let tornado: EnemySprite;
    
    // Try to use the asset if available, otherwise use fallback
    if (this.scene.textures.exists('goo_tornado_asset')) {
      tornado = this.scene.add.sprite(x, y, 'goo_tornado_asset') as EnemySprite;
      tornado.setDisplaySize(108, 108);
    } else {
      // Fallback creation with white texture and tornado-like tint
      tornado = this.scene.add.sprite(x, y, '__WHITE') as EnemySprite;
      tornado.setDisplaySize(108, 108);
      tornado.setTint(0x00ff88); // Green-cyan tint for tornado
    }
    
    // Add physics to the sprite
    this.scene.physics.add.existing(tornado);
    
    // Set enemy depth to 11
    tornado.setDepth(11);
    
    // Set up Goo Tornado properties
    this.setupGooTornadoProperties(tornado);
    
    // Add to enemies set
    this.enemies.add(tornado);
    
    // Start AI after landing delay
    this.scene.time.delayedCall(2000, () => {
      if (tornado.active && tornado.hasLanded) {
        this.startGooTornadoAI(tornado);
      }
    });

    return tornado;
  }

  private setupGooTornadoProperties(tornado: EnemySprite): void {
    // Make interactive for clicking (but not draggable)
    tornado.setInteractive();
    
    // Set up physics
    const body = tornado.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.3, 0.3);
    
    // Set enemy properties
    tornado.itemName = "Enemy: Goo Tornado";
    tornado.isGooTornado = true;
    tornado.isEnemy = true;
    tornado.isActive = true;
    tornado.moveSpeed = 60; // 2x faster than unstable goo
    tornado.hasLanded = false;
    tornado.spawnTimer = null; // Timer for spawning goos
    tornado.destructionRadius = 50; // Add destruction radius
    
    // Health system properties - random between 5-15 clicks
    tornado.maxHealth = Phaser.Math.Between(5, 15);
    tornado.currentHealth = tornado.maxHealth;
    
    // Add click handler for damaging the tornado
    tornado.on('pointerdown', () => {
      this.damageGooTornado(tornado);
    });
    
    // Start spawning unstable goos immediately when created
    this.startGooSpawning(tornado);
    
    // Mark as landed after delay
    this.scene.time.delayedCall(2000, () => {
      if (tornado.active) {
        tornado.hasLanded = true;
        this.correctTornadoFacing(tornado);
      }
    });
  }

  private setupConfettiStormProperties(confetti: EnemySprite): void {
    // Make interactive for clicking (but not draggable)
    confetti.setInteractive();
    
    // Set up physics
    const body = confetti.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.2, 0.2);
    
    // Set enemy properties
    confetti.itemName = "Confetti Storm";
    confetti.isConfettiStorm = true;
    confetti.isEnemy = true;
    confetti.targetGoo = null;
    confetti.isActive = true;
    confetti.moveSpeed = 50; // Faster than goo
    confetti.hasLanded = false;
    
    // Health system properties
    confetti.maxHealth = 3; // Fixed health instead of random
    confetti.currentHealth = confetti.maxHealth;
    
    // Add click handler for damaging the confetti storm
    confetti.on('pointerdown', () => {
      this.damageConfettiStorm(confetti);
    });
    
    // Mark as landed after delay
    this.scene.time.delayedCall(2000, () => {
      if (confetti.active) {
        confetti.hasLanded = true;
        this.correctConfettiFacing(confetti);
      }
    });
  }

  private setupUnstableGooProperties(goo: EnemySprite): void {
    // Make interactive for clicking (but not draggable)
    goo.setInteractive();
    
    // Play spawn sound
    const oozeSpawnSound = this.scene.sound.add('ooze', { volume: 0.7 });
    oozeSpawnSound.play();
    goo.spawnSound = oozeSpawnSound;
    
    // Set up physics
    const body = goo.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.2, 0.2);
    
    // Set enemy properties
    goo.itemName = "Unstable Goo";
    goo.isUnstableGoo = true;
    goo.isEnemy = true;
    goo.targetAsset = null;
    goo.isDissolving = false;
    goo.dissolveTimer = undefined;
    goo.moveSpeed = 30;
    goo.hasLanded = false;
    goo.isActive = true;
    
    // Health system
    goo.maxHealth = Phaser.Math.Between(1, 10);
    goo.currentHealth = goo.maxHealth;
    goo.isStopped = false;
    goo.stopTimer = null;
    
    // Add click handler for damage
    goo.on('pointerdown', () => {
      this.damageUnstableGoo(goo);
    });
    
    // Mark as landed after delay
    this.scene.time.delayedCall(2000, () => {
      if (goo.active) {
        goo.hasLanded = true;
        this.correctGooFacing(goo);
      }
    });
  }

  private damageUnstableGoo(goo: EnemySprite): void {
    if (!goo.active || goo.isBeingDestroyed) return;
    
    // Allow damage even while dissolving, but give visual feedback
    const isCurrentlyEating = goo.isDissolving;
    
    // Reduce health
    goo.currentHealth!--;
    
    // Visual feedback - different effect if currently eating
    if (isCurrentlyEating) {
      // Special effect when eating - more dramatic visual feedback
      this.scene.tweens.add({
        targets: goo,
        tint: 0xff0000,
        scaleX: goo.scaleX * 1.1,
        scaleY: goo.scaleY * 1.1,
        duration: 150,
        yoyo: true,
        onComplete: () => {
          goo.setTint(0xffffff);
        }
      });
      
      // If eating, also interrupt the eating process
      if (goo.dissolveTimer) {
        goo.dissolveTimer.destroy();
        goo.dissolveTimer = undefined;
      }
      goo.isDissolving = false;
      
      // Reset any visual effects on the target asset
      this.scene.children.list.forEach(child => {
        if ((child as any).itemName && 
            (child as any).itemName !== "Unstable Goo" && 
            !(child as any).isUnstableGoo &&
            child.active) {
          const asset = child as any;
          // Aggressively stop ALL tweens and effects on this asset
          this.scene.tweens.killTweensOf(asset);
          // Force reset all visual properties
          asset.setTint(0xffffff);
          asset.setAlpha(1);
          asset.setScale(asset.scaleX, asset.scaleY);
          // Clear any custom properties that might be causing issues
          if (asset.dissolveTween) {
            asset.dissolveTween = undefined;
          }
          // Force a complete visual reset
          asset.clearTint();
          asset.setAlpha(1);
        }
      });
      
      // Resume AI after a short delay
      this.scene.time.delayedCall(500, () => {
        if (goo.active && !goo.isDissolving) {
          this.startUnstableGooAI(goo);
        }
      });
    } else {
      // Normal damage effect when not eating
      this.scene.tweens.add({
        targets: goo,
        tint: 0xff4442,
        scaleX: goo.scaleX * 1.1,
        scaleY: goo.scaleY * 1.1,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          goo.setTint(0xffffff);
        }
      });
    }
    
    // Stop movement temporarily
    this.stopGoo(goo, 250);
    
    // Check if destroyed
    if (goo.currentHealth! <= 0) {
      this.destroyUnstableGoo(goo);
    }
  }

  private stopGoo(goo: EnemySprite, duration: number): void {
    if (!goo.active) return;
    
    goo.isStopped = true;
    
    const body = goo.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    if (goo.stopTimer) {
      goo.stopTimer.destroy();
    }
    
    goo.stopTimer = this.scene.time.delayedCall(duration, () => {
      if (goo.active && !goo.isDissolving) {
        goo.isStopped = false;
        goo.stopTimer = undefined;
        
        if (goo.hasLanded) {
          this.resumeGooMovement(goo);
        }
      }
    });
  }

  private resumeGooMovement(goo: EnemySprite): void {
    if (!goo.active || goo.isDissolving || goo.isStopped) return;
    
    const target = goo.targetAsset || this.findNearestAsset(goo);
    if (target && target.active) {
      goo.targetAsset = target;
      this.moveGooTowardTarget(goo, target);
    }
  }

  private destroyUnstableGoo(goo: EnemySprite): void {
    // Prevent multiple destruction calls
    if (goo.isBeingDestroyed) return;
    goo.isBeingDestroyed = true;
    
    // Disable interactivity immediately
    goo.disableInteractive();
    
    goo.isStopped = true;
    goo.isDissolving = true;
    
    // Clean up timers
    if (goo.stopTimer) {
      goo.stopTimer.destroy();
    }
    if (goo.dissolveTimer) {
      goo.dissolveTimer.destroy();
    }
    
    // Clean up any dissolving items - stop their flashing effects
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName && 
          (child as any).itemName !== "Unstable Goo" && 
          !(child as any).isUnstableGoo &&
          child.active) {
        const asset = child as any;
        // Aggressively stop ALL tweens and effects on this asset
        this.scene.tweens.killTweensOf(asset);
        
        // Check if the asset has the required methods before calling them
        if (asset.setTint && typeof asset.setTint === 'function') {
          asset.setTint(0xffffff);
        }
        if (asset.setAlpha && typeof asset.setAlpha === 'function') {
          asset.setAlpha(1);
        }
        if (asset.setScale && typeof asset.setScale === 'function') {
          asset.setScale(asset.scaleX, asset.scaleY);
        }
        if (asset.clearTint && typeof asset.clearTint === 'function') {
          asset.clearTint();
        }
        
        // Clear any custom properties that might be causing issues
        if (asset.dissolveTween) {
          asset.dissolveTween = undefined;
        }
      }
    });
    
    // Additional cleanup: stop ALL tweens in the scene to be extra sure
    this.scene.tweens.killAll();
    
    // Stop spawn sound
    if (goo.spawnSound && goo.spawnSound.isPlaying) {
      goo.spawnSound.stop();
      goo.spawnSound.destroy();
    }
    
    // Stop movement
    const body = goo.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Play death sound
    const oozesplatSound = this.scene.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();
    
    // Create splatter
    this.createGooSplatter(goo.x, goo.y, goo.scaleX);
    
    // Check if this is the tutorial goo and complete tutorial if so
    const gameScene = this.scene as any;
    if (gameScene.tutorialPhase && gameScene.tutorialPhase === true) {
      // This is the tutorial goo being destroyed - complete the tutorial
      this.scene.time.delayedCall(500, () => {
        if (gameScene.completeTutorial) {
          gameScene.completeTutorial();
        }
      });
    }
    
    // Death animation
    this.scene.tweens.add({
      targets: goo,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: goo.angle + 180,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.destroyEnemy(goo);
      }
    });
    
    // Visual effect
    this.scene.tweens.add({
      targets: goo,
      tint: 0x44ff44,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  private damageConfettiStorm(confetti: EnemySprite): void {
    if (!confetti.active || confetti.isBeingDestroyed) return;
    
    // Reduce health
    confetti.currentHealth!--;
    
    // Visual feedback
    this.scene.tweens.add({
      targets: confetti,
      tint: 0xff4442,
      scaleX: confetti.scaleX * 1.1,
      scaleY: confetti.scaleY * 1.1,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        confetti.setTint(0xffffff);
      }
    });
    
    // Stop movement temporarily
    this.stopConfettiStorm(confetti, 250);
    
    // Check if destroyed
    if (confetti.currentHealth! <= 0) {
      this.destroyConfettiStorm(confetti);
    }
  }

  private stopConfettiStorm(confetti: EnemySprite, duration: number): void {
    if (!confetti.active) return;
    
    const body = confetti.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    this.scene.time.delayedCall(duration, () => {
      if (confetti.active) {
        this.resumeConfettiStormMovement(confetti);
      }
    });
  }

  private resumeConfettiStormMovement(confetti: EnemySprite): void {
    if (!confetti.active) return;
    
    const target = confetti.targetGoo || this.findNearestGoo(confetti);
    if (target && target.active) {
      confetti.targetGoo = target;
      this.moveConfettiTowardTarget(confetti, target);
    }
  }

  private destroyConfettiStorm(confetti: EnemySprite): void {
    // Prevent multiple destruction calls
    if (confetti.isBeingDestroyed) return;
    confetti.isBeingDestroyed = true;
    
    // Disable interactivity immediately
    confetti.disableInteractive();
    
    // Stop movement immediately
    const body = confetti.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Play death sound
    const oozesplatSound = this.scene.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();
    
    // Create splatter
    this.createGooSplatter(confetti.x, confetti.y, confetti.scaleX);
    
    // Destroy immediately without animation delay
    this.destroyEnemy(confetti);
  }

  private correctConfettiFacing(confetti: EnemySprite): void {
    this.scene.tweens.add({
      targets: confetti,
      angle: 0,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  private startConfettiStormAI(confetti: EnemySprite): void {
    if (!confetti.active) return;
    
    // Find target goo
    const nearestGoo = this.findNearestGoo(confetti);
    confetti.targetGoo = nearestGoo;
    
    // Start movement
    if (nearestGoo) {
      this.moveConfettiTowardTarget(confetti, nearestGoo);
    }
    
    // Repeat AI update
    this.scene.time.delayedCall(100, () => { // More responsive AI
      if (confetti.active) {
        this.startConfettiStormAI(confetti);
      }
    });
  }

  private findNearestGoo(confetti: EnemySprite): any {
    let nearestGoo: any = null;
    let nearestDistance = Infinity;
    
    this.scene.children.list.forEach(child => {
      if ((child as any).isUnstableGoo && child.active) {
        const distance = Phaser.Math.Distance.Between(
          confetti.x, confetti.y,
          child.x, child.y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestGoo = child;
        }
      }
    });
    
    return nearestGoo;
  }

  private moveConfettiTowardTarget(confetti: EnemySprite, target: any): void {
    if (!confetti.active || !target.active) return;
    
    const body = confetti.body as Phaser.Physics.Arcade.Body;
    const moveSpeed = confetti.moveSpeed!;
    
    const angle = Phaser.Math.Angle.Between(confetti.x, confetti.y, target.x, target.y);
    
    body.setVelocity(
      Math.cos(angle) * moveSpeed,
      Math.sin(angle) * moveSpeed
    );
    
    // Check if close enough to merge
    const distance = Phaser.Math.Distance.Between(
      confetti.x, confetti.y,
      target.x, target.y
    );
    
    if (distance < 30) { // Close enough to merge
      this.mergeConfettiWithGoo(confetti, target);
    }
  }

  private mergeConfettiWithGoo(confetti: EnemySprite, goo: any): void {
    // Prevent multiple merges from happening simultaneously
    if ((confetti as any).isMerging || (goo as any).isMerging) {
      return;
    }
    
    // Mark both enemies as merging to prevent multiple calls
    (confetti as any).isMerging = true;
    (goo as any).isMerging = true;
    
    // When Confetti Storm merges with Unstable Goo, spawn ONLY a Goo Tornado
    const newEnemyType = "Enemy: Goo Tornado";
    
    // Get the position where they merged (average X position, but use floor Y)
    const mergeX = (confetti.x + goo.x) / 2;
    const floorY = Phaser.Math.Between(400, 450); // Spawn on the floor
    
    // Destroy Confetti Storm immediately
    this.destroyConfettiStorm(confetti);
    
    // Destroy Unstable Goo immediately
    this.destroyUnstableGoo(goo);
    
    // Spawn the Goo Tornado at the floor position immediately
    this.spawnEnemy(newEnemyType as any, mergeX, floorY);
  }
  


  private damageGooTornado(tornado: EnemySprite): void {
    if (!tornado.active || tornado.isBeingDestroyed) return;
    
    // Reduce health
    tornado.currentHealth!--;
    
    // Visual feedback
    this.scene.tweens.add({
      targets: tornado,
      tint: 0xff4442,
      scaleX: tornado.scaleX * 1.1,
      scaleY: tornado.scaleY * 1.1,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        tornado.setTint(0xffffff);
      }
    });
    
    // Stop movement temporarily
    this.stopGooTornado(tornado, 250);
    
    // Check if destroyed
    if (tornado.currentHealth! <= 0) {
      this.destroyGooTornado(tornado);
    }
  }

  private stopGooTornado(tornado: EnemySprite, duration: number): void {
    if (!tornado.active) return;
    
    const body = tornado.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    this.scene.time.delayedCall(duration, () => {
      if (tornado.active) {
        this.resumeGooTornadoMovement(tornado);
      }
    });
  }

  private resumeGooTornadoMovement(tornado: EnemySprite): void {
    if (!tornado.active) return;
    
    // Tornado moves side-to-side randomly on the floor
    const randomX = Phaser.Math.Between(100, 1000);
    const floorY = Phaser.Math.Between(400, 450);
    this.moveGooTornadoToPosition(tornado, randomX, floorY);
  }

  private destroyGooTornado(tornado: EnemySprite): void {
    // Prevent multiple destruction calls
    if (tornado.isBeingDestroyed) return;
    tornado.isBeingDestroyed = true;
    
    // Disable interactivity immediately
    tornado.disableInteractive();
    
    // Stop movement
    const body = tornado.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Stop spawning
    if (tornado.spawnTimer) {
      tornado.spawnTimer.destroy();
      tornado.spawnTimer = null;
    }
    
    // Play death sound
    const oozesplatSound = this.scene.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();
    
    // Create splatter
    this.createGooSplatter(tornado.x, tornado.y, tornado.scaleX);
    
    // Death animation
    this.scene.tweens.add({
      targets: tornado,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: tornado.angle + 360,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.destroyEnemy(tornado);
      }
    });
    
    // Visual effect
    this.scene.tweens.add({
      targets: tornado,
      tint: 0x00ff88,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  private correctTornadoFacing(tornado: EnemySprite): void {
    this.scene.tweens.add({
      targets: tornado,
      angle: 0,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  private startGooTornadoAI(tornado: EnemySprite): void {
    if (!tornado.active) return;
    
    // Move side-to-side randomly on the floor (around Y position 400-450)
    const randomX = Phaser.Math.Between(100, 1000);
    const floorY = Phaser.Math.Between(400, 450);
    this.moveGooTornadoToPosition(tornado, randomX, floorY);
    
    // Repeat AI update
    this.scene.time.delayedCall(3000, () => { // Move every 3 seconds
      if (tornado.active) {
        this.startGooTornadoAI(tornado);
      }
    });
  }

  private moveGooTornadoToPosition(tornado: EnemySprite, targetX: number, targetY: number): void {
    if (!tornado.active) return;
    
    const body = tornado.body as Phaser.Physics.Arcade.Body;
    const moveSpeed = tornado.moveSpeed!;
    
    // Only move horizontally (side-to-side), keep Y position fixed
    const direction = targetX > tornado.x ? 1 : -1;
    
    body.setVelocity(
      direction * moveSpeed,
      0 // No Y movement - stay on the floor
    );
  }

  private startGooSpawning(tornado: EnemySprite): void {
    if (!tornado.active) return;
    
    // Spawn an unstable goo every 5 seconds
    tornado.spawnTimer = this.scene.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (tornado.active) {
          this.spawnUnstableGooFromTornado(tornado);
        }
      }
    });
  }

  private spawnUnstableGooFromTornado(tornado: EnemySprite): void {
    if (!tornado.active) return;
    
    // Spawn position near the tornado but on the floor
    const spawnX = tornado.x + Phaser.Math.Between(-50, 50);
    const floorY = Phaser.Math.Between(400, 450); // Spawn directly on the floor
    
    // Create the goo sprite directly without using ItemManager to avoid circular dependency
    let goo: EnemySprite;
    
    // Try to use the asset if available, otherwise use fallback
    if (this.scene.textures.exists('unstable_goo_asset')) {
      goo = this.scene.add.sprite(spawnX, floorY, 'unstable_goo_asset') as EnemySprite;
      goo.setDisplaySize(108, 108);
    } else {
      // Fallback creation with white texture and green tint
      goo = this.scene.add.sprite(spawnX, floorY, '__WHITE') as EnemySprite;
      goo.setDisplaySize(108, 108);
      goo.setTint(0x44ff44); // Green tint
    }
    
    // Add physics to the sprite
    this.scene.physics.add.existing(goo);
    
    // Set up Unstable Goo properties (same as regular spawn but with immediate landing)
    this.setupUnstableGooProperties(goo);
    
    // Mark as immediately landed since it's spawned on the floor
    goo.hasLanded = true;
    
    // Add to enemies set
    this.enemies.add(goo);
    
    // Start AI immediately since it's already on the floor
    this.startUnstableGooAI(goo);
    
    // Create a small visual effect
    this.scene.tweens.add({
      targets: goo,
      scaleX: goo.scaleX * 1.2,
      scaleY: goo.scaleY * 1.2,
      duration: 200,
      yoyo: true
    });
  }

  private createGooSplatter(x: number, y: number, gooScale: number): void {
    const splatter = this.scene.add.sprite(x, y, 'goo_splatter');
    
    const splatterScale = gooScale * 1.25;
    splatter.setScale(splatterScale);
    splatter.setDepth(-10);
    
    // Random rotation
    const maxRotationDegrees = 15;
    const randomRotationDegrees = Phaser.Math.Between(-maxRotationDegrees, maxRotationDegrees);
    splatter.setRotation(randomRotationDegrees * Math.PI / 180);
    
    // Splatter properties
    (splatter as any).cleanupCount = 0;
    (splatter as any).maxCleanups = 3;
    (splatter as any).originalAlpha = 0.8;
    
    // Fade in
    splatter.setAlpha(0);
    this.scene.tweens.add({
      targets: splatter,
      alpha: (splatter as any).originalAlpha,
      duration: 300,
      ease: 'Power2.easeOut'
    });
    
    // Store splatter reference
    if (!(this.scene as any).gooSplatters) {
      (this.scene as any).gooSplatters = [];
    }
    (this.scene as any).gooSplatters.push(splatter);
  }

  private correctGooFacing(goo: EnemySprite): void {
    this.scene.tweens.add({
      targets: goo,
      angle: 0,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  private startUnstableGooAI(goo: EnemySprite): void {
    if (!goo.active || goo.isDissolving) return;
    
    // Find target
    const nearestAsset = this.findNearestAsset(goo);
    goo.targetAsset = nearestAsset;
    
    // Start movement
    if (nearestAsset && !goo.isStopped) {
      this.moveGooTowardTarget(goo, nearestAsset);
    }
    
    // Set up overlap detection
    this.setupGooOverlapDetection(goo);
    
    // Repeat AI update
    this.scene.time.delayedCall(2000, () => {
      if (goo.active && !goo.isDissolving) {
        this.startUnstableGooAI(goo);
      }
    });
  }

  private findNearestAsset(goo: EnemySprite): any {
    let nearestAsset: any = null;
    let nearestDistance = Infinity;
    
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName && 
          (child as any).itemName !== "Unstable Goo" && 
          !(child as any).isUnstableGoo &&
          (child as any).itemName !== "Enemy: Goo Tornado" &&
          !(child as any).isGooTornado &&
          child.active) {
        
        const distance = Phaser.Math.Distance.Between(
          goo.x, goo.y,
          child.x, child.y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestAsset = child;
        }
      }
    });
    
    return nearestAsset;
  }

  private moveGooTowardTarget(goo: EnemySprite, target: any): void {
    if (!goo.active || !target.active || goo.isDissolving || goo.isStopped) return;
    
    const body = goo.body as Phaser.Physics.Arcade.Body;
    const moveSpeed = goo.moveSpeed!;
    
    const angle = Phaser.Math.Angle.Between(goo.x, goo.y, target.x, target.y);
    
    body.setVelocity(
      Math.cos(angle) * moveSpeed,
      Math.sin(angle) * moveSpeed
    );
  }

  private setupGooOverlapDetection(goo: EnemySprite): void {
    if (!goo.active || goo.isDissolving) return;
    
    const overlapCheck = () => {
      if (!goo.active || goo.isDissolving) return;
      
      this.scene.children.list.forEach(child => {
        if ((child as any).itemName && 
            (child as any).itemName !== "Unstable Goo" && 
            !(child as any).isUnstableGoo &&
            (child as any).itemName !== "Enemy: Goo Tornado" &&
            !(child as any).isGooTornado &&
            child.active) {
          
          const asset = child as any;
          
          if (this.isFullyOverlapping(goo, asset)) {
            this.startDissolveProcess(goo, asset);
            return;
          }
        }
      });
      
      if (goo.active && !goo.isDissolving) {
        this.scene.time.delayedCall(100, overlapCheck);
      }
    };
    
    overlapCheck();
  }

  private isFullyOverlapping(goo: EnemySprite, asset: any): boolean {
    const gooBounds = goo.getBounds();
    const assetBounds = asset.getBounds();
    
    const intersectionLeft = Math.max(gooBounds.left, assetBounds.left);
    const intersectionRight = Math.min(gooBounds.right, assetBounds.right);
    const intersectionTop = Math.max(gooBounds.top, assetBounds.top);
    const intersectionBottom = Math.min(gooBounds.bottom, assetBounds.bottom);
    
    if (intersectionLeft >= intersectionRight || intersectionTop >= intersectionBottom) {
      return false;
    }
    
    const intersectionWidth = intersectionRight - intersectionLeft;
    const intersectionHeight = intersectionBottom - intersectionTop;
    const intersectionArea = intersectionWidth * intersectionHeight;
    
    const assetWidth = assetBounds.right - assetBounds.left;
    const assetHeight = assetBounds.bottom - assetBounds.top;
    const assetArea = assetWidth * assetHeight;
    
    const overlapPercentage = intersectionArea / assetArea;
    return overlapPercentage >= 0.25;
  }

  private startDissolveProcess(goo: EnemySprite, asset: any): void {
    if (goo.isDissolving || goo.isStopped) return;
    
    // Check if asset is a hazard
    if (isHazard(asset.itemName!)) {
      this.destroyGooFromHazard(goo, asset);
      return;
    }
    
    goo.isDissolving = true;
    
    // Stop goo movement
    const body= goo.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Visual feedback on asset
    this.scene.tweens.add({
      targets: asset,
      tint: 0xff4444,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1
    });
    
    // Start dissolve timer
    goo.dissolveTimer = this.scene.time.delayedCall(3000, () => {
      this.completeDissolveProcess(goo, asset);
    });
    
    // Visual feedback on goo
    const currentScaleX = goo.scaleX;
    const currentScaleY = goo.scaleY;
    
    this.scene.tweens.add({
      targets: goo,
      scaleX: currentScaleX * 1.1,
      scaleY: currentScaleY * 1.1,
      duration: 300,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        goo.setScale(currentScaleX, currentScaleY);
      }
    });
  }

  private completeDissolveProcess(goo: EnemySprite, asset: any): void {
    if (!goo.active || !asset.active) return;
    
    // Destroy the asset
    const merge = (this.scene as any).getMergeSystem ? (this.scene as any).getMergeSystem() : null;
    if (merge && merge.items) {
      merge.items.destroy(asset);
    } else {
      asset.destroy();
    }
    
    // Grow the goo
    const newScaleX = goo.scaleX * 1.25;
    const newScaleY = goo.scaleY * 1.25;
    
    this.scene.tweens.add({
      targets: goo,
      scaleX: newScaleX,
      scaleY: newScaleY,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Reset goo state
        goo.isDissolving = false;
        goo.dissolveTimer = undefined;
        goo.targetAsset = null;
        
        // Resume AI
        this.scene.time.delayedCall(1000, () => {
          if (goo.active && !goo.isDissolving) {
            this.startUnstableGooAI(goo);
          }
        });
      }
    });
    
    // Success visual effect
    this.scene.tweens.add({
      targets: goo,
      tint: 0x44ff44,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        goo.setTint(0xffffff);
      }
    });
  }

  private destroyGooFromHazard(goo: EnemySprite, hazard: any): void {
    goo.isStopped = true;
    goo.isDissolving = true;
    
    // Clean up timers
    if (goo.stopTimer) {
      goo.stopTimer.destroy();
      goo.stopTimer = null;
    }
    if (goo.dissolveTimer) {
      goo.dissolveTimer.destroy();
      goo.dissolveTimer = null;
    }
    
    // Stop spawn sound
    if (goo.spawnSound && goo.spawnSound.isPlaying) {
      goo.spawnSound.stop();
      goo.spawnSound.destroy();
    }
    
    // Stop movement
    const body = goo.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Play destruction sound
    const oozesplatSound = this.scene.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();
    
    // Create splatter
    this.createGooSplatter(goo.x, goo.y, goo.scaleX);
    
    // Death animation
    this.scene.tweens.add({
      targets: goo,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: goo.angle + 360,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.destroyEnemy(goo);
      }
    });
    
    // Red flash for hazard destruction
    this.scene.tweens.add({
      targets: goo,
      tint: 0xff4444,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  public destroyEnemy(enemy: EnemySprite): void {
    // Emit achievement event for enemy defeat
    const enemyType = enemy.itemName || 'Unknown';
    this.scene.events.emit('achievement:enemy_defeated', enemyType);
    
    // Remove from enemies set
    this.enemies.delete(enemy);
    
    // Clean up timers
    if (enemy.stopTimer) {
      enemy.stopTimer.destroy();
    }
    if (enemy.dissolveTimer) {
      enemy.dissolveTimer.destroy();
    }
    
    // Stop sounds
    if (enemy.spawnSound) {
      if (enemy.spawnSound.isPlaying) {
        enemy.spawnSound.stop();
      }
      enemy.spawnSound.destroy();
    }
    
    // Destroy sprite
    if (enemy.active) {
      enemy.destroy();
    }
  }

  public updateEnemies(): void {
    // Update logic for all active enemies
    this.enemies.forEach(enemy => {
      if (!enemy.active) {
        this.enemies.delete(enemy);
        return;
      }
      
      if (enemy.isUnstableGoo && enemy.hasLanded && !enemy.isDissolving && !enemy.isStopped) {
        if (enemy.targetAsset && enemy.targetAsset.active) {
          this.moveGooTowardTarget(enemy, enemy.targetAsset);
        }
      }
    });
  }

  public getActiveEnemies(): EnemySprite[] {
    return Array.from(this.enemies).filter(enemy => enemy.active);
  }

  public getEnemyCount(): number {
    return this.getActiveEnemies().length;
  }

  public getUnstableGooCount(): number {
    return this.getActiveEnemies().filter(enemy => enemy.isUnstableGoo).length;
  }

  public destroy(): void {
    // Clean up all enemies and resources
    this.enemies.forEach(enemy => {
      this.destroyEnemy(enemy);
    });
    this.enemies.clear();
  }

  // --- New public API moved from Game.ts ---

  public checkEnemyHazardCollisions(): void {
    const enemies: any[] = [];
    const hazards: any[] = [];

    const { isHazard } = require('../config/mergeDataFull');

    this.scene.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const itemName = (child as any).itemName;

        if (itemName.startsWith("Enemy:") || 
            itemName === "Unstable Goo" || 
            itemName === "Confetti Storm" || 
            itemName === "Enemy: Goo Tornado" ||
            (child as any).isUnstableGoo ||
            (child as any).isConfettiStorm ||
            (child as any).isGooTornado) {
          enemies.push(child);
        } else if (isHazard(itemName)) {
          hazards.push(child);
        }
      }
    });

    enemies.forEach(enemy => {
      if (!enemy.active || (enemy as any).isBeingDestroyed) return;

      hazards.forEach(hazard => {
        if (!hazard.active || (hazard as any).isBeingDestroyed) return;

        if (this.areObjectsOverlapping(enemy, hazard)) {
          this.handleEnemyHazardCollision(enemy, hazard);
        }
      });
    });
  }

  public areObjectsOverlapping(obj1: any, obj2: any): boolean {
    const distance = Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y);
    const minDistance = 40;
    if (distance > minDistance) return false;

    try {
      const bounds1 = obj1.getBounds();
      const bounds2 = obj2.getBounds();
      if (bounds1 && bounds2) {
        return Phaser.Geom.Rectangle.Overlaps(bounds1, bounds2);
      }
    } catch (_e) {}

    const obj1Size = Math.max(obj1.displayWidth || obj1.width || 36, obj1.displayHeight || obj1.height || 36) / 2;
    const obj2Size = Math.max(obj2.displayWidth || obj2.width || 36, obj2.displayHeight || obj2.height || 36) / 2;
    const combinedRadius = obj1Size + obj2Size;

    return distance < combinedRadius * 0.7;
  }

  public handleEnemyHazardCollision(enemy: any, hazard: any): void {
    if ((enemy as any).isBeingDestroyed || (hazard as any).isBeingDestroyed) return;

    (enemy as any).isBeingDestroyed = true;
    (hazard as any).isBeingDestroyed = true;

    if ((enemy as any).isDissolving) {
      (enemy as any).isDissolving = false;
      if ((enemy as any).dissolveTimer) {
        (enemy as any).dissolveTimer.destroy();
        (enemy as any).dissolveTimer = null;
      }
    }

    if ((enemy as any).spawnTimer) {
      (enemy as any).spawnTimer.destroy();
      (enemy as any).spawnTimer = null;
    }
    if ((enemy as any).stopTimer) {
      (enemy as any).stopTimer.destroy();
      (enemy as any).stopTimer = null;
    }

    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    if (enemyBody) enemyBody.setVelocity(0, 0);

    const enemyX = enemy.x;
    const enemyY = enemy.y;
    const enemyScale = enemy.scaleX;

    const hazardX = hazard.x;
    const hazardY = hazard.y;
    const hazardScale = hazard.scaleX;

    this.createGooSplatterAt(enemyX, enemyY, enemyScale);
    this.createGooSplatterAt(hazardX, hazardY, hazardScale);

    const oozesplatSound = this.scene.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();

    this.destroyObjectWithEffect(enemy);
    this.destroyObjectWithEffect(hazard);
  }

  public createGooSplatterAt(x: number, y: number, scale: number): void {
    const splatter = this.scene.add.sprite(x, y, 'goo_splatter');
    const splatterScale = scale * 1.25;
    splatter.setScale(splatterScale);
    splatter.setDepth(-10);

    const maxRotationDegrees = 15;
    const randomRotationDegrees = Phaser.Math.Between(-maxRotationDegrees, maxRotationDegrees);
    splatter.setRotation(randomRotationDegrees * Math.PI / 180);

    (splatter as any).cleanupCount = 0;
    (splatter as any).maxCleanups = 3;
    (splatter as any).originalAlpha = 0.8;

    splatter.setAlpha(0);
    this.scene.tweens.add({
      targets: splatter,
      alpha: (splatter as any).originalAlpha,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    if (!(this.scene as any).gooSplatters) {
      (this.scene as any).gooSplatters = [];
    }
    (this.scene as any).gooSplatters.push(splatter);
  }

  public destroyObjectWithEffect(obj: any): void {
    (obj as any).isBeingDestroyed = true;

    this.scene.tweens.killTweensOf(obj);

    if ((obj as any).spawnTimer) {
      (obj as any).spawnTimer.destroy();
      (obj as any).spawnTimer = null;
    }
    if ((obj as any).dissolveTimer) {
      (obj as any).dissolveTimer.destroy();
      (obj as any).dissolveTimer = null;
    }
    if ((obj as any).stopTimer) {
      (obj as any).stopTimer.destroy();
      (obj as any).stopTimer = null;
    }

    if ((obj as any).spawnSound && (obj as any).spawnSound.isPlaying) {
      (obj as any).spawnSound.stop();
      (obj as any).spawnSound.destroy();
    }

    const body = obj.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    (obj as any).isDissolving = false;
    (obj as any).isStopped = true;
    (obj as any).isActive = false;

    this.scene.tweens.add({
      targets: obj,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: obj.angle + 360,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        if (obj.active) {
          const merge = (this.scene as any).getMergeSystem ? (this.scene as any).getMergeSystem() : null;
          if (merge && merge.items) {
            merge.items.destroy(obj);
          } else {
            obj.destroy();
          }
        }
      }
    });

    this.scene.tweens.add({
      targets: obj,
      tint: 0xffffff,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }
}
