
// src/game/managers/CollisionManager.ts
import Phaser from "phaser"

export class CollisionManager {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Public update hook to be called from the owning scene's update()
  public update(): void {
    this.checkEnemyHazardCollisions()
  }

  // Checks all enemies vs hazards and dispatches to handler when overlapping
  private checkEnemyHazardCollisions(): void {
    const enemies: any[] = []
    const hazards: any[] = []

    const { isHazard } = require("../config/mergeDataFull")

    this.scene.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const itemName = (child as any).itemName
        if (
          itemName.startsWith("Enemy:") ||
          itemName === "Unstable Goo" ||
          itemName === "Confetti Storm" ||
          itemName === "Enemy: Goo Tornado" ||
          (child as any).isUnstableGoo ||
          (child as any).isConfettiStorm ||
          (child as any).isGooTornado
        ) {
          enemies.push(child)
        } else if (isHazard(itemName)) {
          hazards.push(child)
        }
      }
    })

    enemies.forEach(enemy => {
      if (!enemy.active || (enemy as any).isBeingDestroyed) return

      hazards.forEach(hazard => {
        if (!hazard.active || (hazard as any).isBeingDestroyed) return

        if (this.areObjectsOverlapping(enemy, hazard)) {
          this.handleEnemyHazardCollision(enemy, hazard)
        }
      })
    })
  }

  // Overlap helper used by the manager
  private areObjectsOverlapping(obj1: any, obj2: any): boolean {
    const distance = Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y)
    const minDistance = 40
    if (distance > minDistance) return false

    try {
      const bounds1 = obj1.getBounds()
      const bounds2 = obj2.getBounds()
      if (bounds1 && bounds2) {
        return Phaser.Geom.Rectangle.Overlaps(bounds1, bounds2)
      }
    } catch (_e) {
      // ignore and use fallback
    }

    const obj1Size =
      Math.max(obj1.displayWidth || obj1.width || 36, obj1.displayHeight || obj1.height || 36) / 2
    const obj2Size =
      Math.max(obj2.displayWidth || obj2.width || 36, obj2.displayHeight || obj2.height || 36) / 2
    const combinedRadius = obj1Size + obj2Size

    return distance < combinedRadius * 0.7
  }

  // Centralized destruction + VFX for both enemy and hazard
  private handleEnemyHazardCollision(enemy: any, hazard: any): void {
    if ((enemy as any).isBeingDestroyed || (hazard as any).isBeingDestroyed) return

    ;(enemy as any).isBeingDestroyed = true
    ;(hazard as any).isBeingDestroyed = true

    // stop dissolves/timers
    if ((enemy as any).isDissolving) {
      ;(enemy as any).isDissolving = false
      if ((enemy as any).dissolveTimer) {
        ;(enemy as any).dissolveTimer.destroy()
        ;(enemy as any).dissolveTimer = null
      }
    }
    if ((enemy as any).spawnTimer) {
      ;(enemy as any).spawnTimer.destroy()
      ;(enemy as any).spawnTimer = null
    }
    if ((enemy as any).stopTimer) {
      ;(enemy as any).stopTimer.destroy()
      ;(enemy as any).stopTimer = null
    }

    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body
    if (enemyBody) enemyBody.setVelocity(0, 0)

    const enemyX = enemy.x
    const enemyY = enemy.y
    const enemyScale = enemy.scaleX

    const hazardX = hazard.x
    const hazardY = hazard.y
    const hazardScale = hazard.scaleX

    this.createGooSplatterAt(enemyX, enemyY, enemyScale)
    this.createGooSplatterAt(hazardX, hazardY, hazardScale)

    const oozesplatSound = this.scene.sound.add("oozesplat", { volume: 0.8 })
    oozesplatSound.play()

    this.destroyObjectWithEffect(enemy)
    this.destroyObjectWithEffect(hazard)
  }

  // Splatter decal helper
  private createGooSplatterAt(x: number, y: number, scale: number): void {
    const splatter = this.scene.add.sprite(x, y, "goo_splatter")
    const splatterScale = scale * 1.25
    splatter.setScale(splatterScale)
    splatter.setDepth(-10)

    const maxRotationDegrees = 15
    const randomRotationDegrees = Phaser.Math.Between(-maxRotationDegrees, maxRotationDegrees)
    splatter.setRotation((randomRotationDegrees * Math.PI) / 180)

    ;(splatter as any).cleanupCount = 0
    ;(splatter as any).maxCleanups = 3
    ;(splatter as any).originalAlpha = 0.8

    splatter.setAlpha(0)
    this.scene.tweens.add({
      targets: splatter,
      alpha: (splatter as any).originalAlpha,
      duration: 300,
      ease: "Power2.easeOut",
    })

    if (!(this.scene as any).gooSplatters) {
      ;(this.scene as any).gooSplatters = []
    }
    ;(this.scene as any).gooSplatters.push(splatter)
  }

  // Tweens + cleanup for a destroyed object
  private destroyObjectWithEffect(obj: any): void {
    ;(obj as any).isBeingDestroyed = true

    this.scene.tweens.killTweensOf(obj)

    if ((obj as any).spawnTimer) {
      ;(obj as any).spawnTimer.destroy()
      ;(obj as any).spawnTimer = null
    }
    if ((obj as any).dissolveTimer) {
      ;(obj as any).dissolveTimer.destroy()
      ;(obj as any).dissolveTimer = null
    }
    if ((obj as any).stopTimer) {
      ;(obj as any).stopTimer.destroy()
      ;(obj as any).stopTimer = null
    }

    if ((obj as any).spawnSound && (obj as any).spawnSound.isPlaying) {
      ;(obj as any).spawnSound.stop()
      ;(obj as any).spawnSound.destroy()
    }

    const body = obj.body as Phaser.Physics.Arcade.Body
    if (body) body.setVelocity(0, 0)

    ;(obj as any).isDissolving = false
    ;(obj as any).isStopped = true
    ;(obj as any).isActive = false

    this.scene.tweens.add({
      targets: obj,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: obj.angle + 360,
      duration: 500,
      ease: "Power2.easeIn",
      onComplete: () => {
        if (obj.active) {
          const merge =
            (this.scene as any).getMergeSystem && (this.scene as any).getMergeSystem()
          if (merge && merge.items) {
            merge.items.destroy(obj)
          } else {
            obj.destroy()
          }
        }
      },
    })

    this.scene.tweens.add({
      targets: obj,
      tint: 0xffffff,
      duration: 100,
      yoyo: true,
      repeat: 2,
    })
  }
}
