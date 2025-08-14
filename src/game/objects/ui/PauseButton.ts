
// src/game/objects/ui/PauseButton.ts

import Phaser from 'phaser'

export class PauseButton {
  private scene: Phaser.Scene
  private button!: Phaser.GameObjects.Sprite
  private symbol!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Creates a pause button on the left side below the goo counter.
  public create(): { button: Phaser.GameObjects.Sprite; symbol: Phaser.GameObjects.Text } {
    const buttonSize = 80
    const cornerPadding = 20
    const spacing = 10

    // Position below the goo counter on the left side
    // Goo counter is at (20, 20) with height 40, so bottom is at y = 60
    // Add spacing below it
    const x = cornerPadding + (buttonSize / 2) // Left side
    const y = 60 + spacing + (buttonSize / 2) // Below goo counter

    this.button = this.scene.add.sprite(x, y, '__WHITE')
    this.button.setDisplaySize(buttonSize, buttonSize)
    this.button.setTint(0x34495e)
    this.button.setDepth(1000)
    this.button.setInteractive(
      new Phaser.Geom.Rectangle(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize),
      Phaser.Geom.Rectangle.Contains
    )

    this.symbol = this.scene.add.text(x, y, '❚❚', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.symbol.setOrigin(0.5)
    this.symbol.setDepth(1001)

    // Click pauses current scene and launches PauseMenu.
    this.button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      this.scene.scene.pause()
      this.scene.scene.launch('PauseMenu')
    })

    // Hover effects
    this.button.on('pointerover', () => {
      this.button.setTint(0x5a6c7d)
      this.scene.tweens.add({
        targets: [this.button, this.symbol],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut'
      })
    })

    this.button.on('pointerout', () => {
      this.button.setTint(0x34495e)
      this.scene.tweens.add({
        targets: [this.button, this.symbol],
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 200,
        ease: 'Power2.easeOut'
      })
    })

    // Subtle floating animation
    this.scene.tweens.add({
      targets: [this.button, this.symbol],
      y: y - 3,
      duration: 2500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 500
    })

    return { button: this.button, symbol: this.symbol }
  }
}
