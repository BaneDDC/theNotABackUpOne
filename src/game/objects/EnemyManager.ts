
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
    goo.dissolveTimer = null;
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
    if (!goo.active || goo.isDissolving) return;
    
    // Reduce health
    goo.currentHealth!--;
    
    // Visual feedback
    this.scene.tweens.add({
      targets: goo,
      tint: 0xff4442,
      scaleX: goo.scaleX * 1.2,
      scaleY: goo.scaleY * 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        goo.setTint(0xffffff);
      }
    });
    
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
        goo.stopTimer = null;
        
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
    goo.isStopped = true;
    goo.isDissolving = true;
    
    // Clean up timers
    if (goo.stopTimer) {
      goo.stopTimer.destroy();
    }
    if (goo.dissolveTimer) {
      goo.dissolveTimer.destroy();
    }
    
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
        goo.dissolveTimer = null;
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
