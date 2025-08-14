
// src/game/managers/AnimationManager.ts

import Phaser from 'phaser'

/**
 * Centralised helper for small animation utilities that don't need scene state.
 * Keep it stateless so any scene can use it.
 */
export class AnimationManager {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Creates and plays the animated background using the bg1-4 textures.
   * Puts it at the lowest depth behind everything.
   */
  public setupAnimatedBackground(): void {
    if (!this.scene.anims.exists('backgroundAnim')) {
      this.scene.anims.create({
        key: 'backgroundAnim',
        frames: [{ key: 'bg1' }, { key: 'bg2' }, { key: 'bg3' }, { key: 'bg4' }],
        frameRate: 6,
        duration: 4000, // 4 frames at 6fps = 4/6 = 0.67 seconds per cycle, so 4 seconds total
        repeat: -1
      })
    }

    const bg = this.scene.add.sprite(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      'bg1'
    )
    bg.setDisplaySize(this.scene.cameras.main.width, this.scene.cameras.main.height)
    bg.setDepth(-1000)
    bg.play('backgroundAnim')
  }

  /**
   * Utility: show a brief "Game Saved" notification. Kept here for reuse.
   */
  public showSaveNotification(): void {
    const notification = this.scene.add.text(
      this.scene.scale.width - 20,
      20,
      'Game Saved',
      {
        fontSize: '16px',
        color: '#27ae60',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 8, y: 4 }
      }
    )
    notification.setOrigin(1, 0)
    notification.setDepth(2000)

    notification.setAlpha(0)
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => notification.destroy()
          })
        })
      }
    })
  }

  /**
   * Pulse a target relative to its current scale and return the tween.
   */
  public pulseTarget(
    target: Phaser.GameObjects.Sprite,
    currentScaleX: number,
    currentScaleY: number,
    multiplier: number,
    duration: number
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scaleX: currentScaleX * multiplier,
      scaleY: currentScaleY * multiplier,
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * Shake/jitter a sprite by randomly moving around its current position for a duration.
   * intensity: pixels offset, interval in ms.
   */
  public shakeSprite(
    sprite: Phaser.GameObjects.Sprite,
    opts: { intensity: number; duration: number; interval: number }
  ): void {
    const { intensity, duration, interval } = opts
    const baseX = sprite.x
    const baseY = sprite.y

    const update = () => {
      const rx = baseX + Phaser.Math.Between(-intensity, intensity)
      const ry = baseY + Phaser.Math.Between(-intensity, intensity)
      sprite.setPosition(rx, ry)
    }

    const repeats = Math.max(0, Math.floor(duration / interval) - 1)
    const timer = this.scene.time.addEvent({
      delay: interval,
      callback: update,
      repeat: repeats
    })

    this.scene.time.delayedCall(duration, () => {
      timer.destroy()
      sprite.setPosition(baseX, baseY)
    })
  }

  /**
   * Subtle jitter tween that keeps an object near its original position.
   * Returns the tween so caller can store and destroy it later.
   */
  public subtleJitter(
    sprite: Phaser.GameObjects.Sprite,
    opts: { intensity: number; interval: number }
  ): Phaser.Tweens.Tween {
    const baseX = sprite.x
    const baseY = sprite.y
    return this.scene.tweens.add({
      targets: sprite,
      x: baseX + Phaser.Math.Between(-opts.intensity, opts.intensity),
      y: baseY + Phaser.Math.Between(-opts.intensity, opts.intensity),
      duration: opts.interval,
      ease: 'Power1.easeInOut',
      yoyo: true,
      repeat: -1,
      onRepeat: () => {
        sprite.setPosition(
          baseX + Phaser.Math.Between(-opts.intensity, opts.intensity),
          baseY + Phaser.Math.Between(-opts.intensity, opts.intensity)
        )
      }
    })
  }
}