
// src/game/objects/MergeItem.ts

import { Scene } from 'phaser'
import { GAME_CONFIG, MERGE_RECIPES } from '../config/GameConfig'

export class MergeItem extends Phaser.GameObjects.Sprite {
  public level: number
  public gridX: number
  public gridY: number
  public isDragging: boolean = false
  public originalX: number
  public originalY: number
  public isInMergeSlot: boolean = false

  constructor(scene: Scene, x: number, y: number, level: number = 1) {
    super(scene, x, y, '__WHITE')
    
    this.level = level
    this.gridX = -1
    this.gridY = -1
    this.originalX = x
    this.originalY = y

    // Setup appearance
    this.setDisplaySize(GAME_CONFIG.ITEMS.SIZE, GAME_CONFIG.ITEMS.SIZE)
    this.setTint(MERGE_RECIPES[level]?.color || 0xffffff)
    this.setInteractive({ draggable: true })
    
    // Add to scene
    scene.add.existing(this)
    
    this.setupDragEvents()
  }

  private setupDragEvents() {
    this.on('dragstart', () => {
      this.isDragging = true
      this.setDepth(1000)
      this.setScale(1.1)
    })

    this.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX
      this.y = dragY
    })

    this.on('dragend', () => {
      this.isDragging = false
      this.setDepth(1)
      this.setScale(1)
      this.scene.events.emit('itemDropped', this)
    })
  }

  public setGridPosition(gridX: number, gridY: number) {
    this.gridX = gridX
    this.gridY = gridY
    
    const worldX = GAME_CONFIG.GRID.START_X + gridX * (GAME_CONFIG.GRID.CELL_SIZE + GAME_CONFIG.GRID.PADDING) + GAME_CONFIG.GRID.CELL_SIZE / 2
    const worldY = GAME_CONFIG.GRID.START_Y + gridY * (GAME_CONFIG.GRID.CELL_SIZE + GAME_CONFIG.GRID.PADDING) + GAME_CONFIG.GRID.CELL_SIZE / 2
    
    this.setPosition(worldX, worldY)
    this.originalX = worldX
    this.originalY = worldY
  }

  public returnToOriginalPosition() {
    this.setPosition(this.originalX, this.originalY)
    this.isInMergeSlot = false
  }

  public getItemName(): string {
    return MERGE_RECIPES[this.level]?.name || 'Unknown'
  }
}
