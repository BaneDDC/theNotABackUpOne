// src/game/objects/ui/AlienOrderSystem.ts

import Phaser from 'phaser'
import { Item, getTier, TIER1, RECIPES } from '../../config/mergeDataFull'

interface Order {
  id: string
  requestedItem: Item
  requiredItems: [Item, Item]
  difficulty: number
  gooReward: number
  isCompleted: boolean
  timeCreated: number
}

export class AlienOrderSystem {
  private scene: Phaser.Scene
  private alienHead!: Phaser.GameObjects.Sprite
  private card!: Phaser.GameObjects.Sprite
  private container!: Phaser.GameObjects.Container
  private isDragging: boolean = false
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  private floatingTween!: Phaser.Tweens.Tween
  private isVisible: boolean = false
  private readonly PERMANENT_X = -10
  private readonly PERMANENT_Y = 178
  private readonly HIDDEN_X = -180 // Only shows a little bit of the right side
  private readonly HOVER_X = -120 // Slides out a bit more when hovering
  private hoverTween?: Phaser.Tweens.Tween
  
  // Order system properties
  private currentOrder?: Order
  private orderText!: Phaser.GameObjects.Text
  private rewardText!: Phaser.GameObjects.Text
  private orderTimer?: Phaser.Time.TimerEvent
  private readonly ORDER_DURATION = 60000 // 60 seconds to complete order
  private readonly DIFFICULTY_MULTIPLIERS = {
    1: 1,    // Tier 1 merges: 1x goo
    2: 2,    // Tier 2 merges: 2x goo  
    3: 4,    // Tier 3 merges: 4x goo
    4: 8,    // Tier 4 merges: 8x goo
    5: 16    // Tier 5+ merges: 16x goo
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  public create(): { container: Phaser.GameObjects.Container; alienHead: Phaser.GameObjects.Sprite; card: Phaser.GameObjects.Sprite } {
    // Start at the hidden position (off-screen to the left)
    const startX = this.HIDDEN_X
    const startY = this.PERMANENT_Y

    // Create a container first at the hidden position
    this.container = this.scene.add.container(startX, startY)
    this.container.setDepth(1000)

    // Create the card positioned relative to the container (0,0)
    this.card = this.scene.add.sprite(100, 0, 'card')
    this.card.setDisplaySize(200, 120)
    this.card.setDepth(1000)

    // Create the alien head positioned relative to the container (0,0)
    this.alienHead = this.scene.add.sprite(50, 0, 'alien1')
    this.alienHead.setDisplaySize(80, 80)
    this.alienHead.setDepth(1001)

    // Create order text - positioned to the right of the alien head
    this.orderText = this.scene.add.text(90, -20, '', {
      fontSize: '11px',
      color: '#000000',
      wordWrap: { width: 120 },
      align: 'left'
    }).setOrigin(0, 0.5)
    this.orderText.setDepth(1002)

    // Create reward text - positioned below the order text
    this.rewardText = this.scene.add.text(90, 20, '', {
      fontSize: '12px',
      color: '#00aa00',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)
    this.rewardText.setDepth(1002)

    // Add sprites to the container
    this.container.add([this.card, this.alienHead, this.orderText, this.rewardText])

    // Make the container interactive
    this.setupInteraction()

    // Add spacebar key listener to log position
    this.setupSpacebarListener()

    // Generate first order
    this.generateNewOrder()

    // Slide in from the left when first created
    this.slideIn()

    return { 
      container: this.container, 
      alienHead: this.alienHead, 
      card: this.card 
    }
  }

  private setupInteraction(): void {
    // Make the container interactive with a hit area that covers the entire visible area
    // When hidden, extend the hit area further right to make the visible edge clickable
    this.container.setInteractive(new Phaser.Geom.Rectangle(-120, -80, 300, 160), Phaser.Geom.Rectangle.Contains)
    
    // Debug: Log that the container is interactive
    console.log('Alien Order System: Container made interactive')

    // Click to toggle visibility
    this.container.on('pointerdown', () => {
      if (this.isVisible) {
        this.slideOut()
      } else {
        this.slideIn()
      }
    })

    // Hover effect to show it's interactive
    this.container.on('pointerover', () => {
      console.log('Alien Order System: Pointer over detected')
      if (this.isVisible) {
        // Scale up when visible
        this.scene.tweens.add({
          targets: this.container,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 200,
          ease: 'Power2.easeOut'
        })
      } else {
        // Slide out a bit more when hovering over hidden system
        this.slideOutOnHover()
      }
    })

    this.container.on('pointerout', () => {
      if (this.isVisible) {
        // Scale back to normal when visible
        this.scene.tweens.add({
          targets: this.container,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 200,
          ease: 'Power2.easeOut'
        })
      } else {
        // Slide back to hidden position when not hovering
        this.slideBackToHidden()
      }
    })
  }

  private slideIn(): void {
    console.log('Alien Order System: Sliding in')
    this.isVisible = true
    
    // Stop any existing floating animation
    if (this.floatingTween) {
      this.floatingTween.stop()
    }

    // Slide to permanent position
    this.scene.tweens.add({
      targets: this.container,
      x: this.PERMANENT_X,
      y: this.PERMANENT_Y,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Start floating animation at permanent position
        this.startFloatingAnimation()
      }
    })
  }

  private slideOut(): void {
    console.log('Alien Order System: Sliding out')
    this.isVisible = false
    
    // Stop floating animation
    if (this.floatingTween) {
      this.floatingTween.stop()
    }

    // Slide to hidden position
    this.scene.tweens.add({
      targets: this.container,
      x: this.HIDDEN_X,
      y: this.PERMANENT_Y,
      duration: 600,
      ease: 'Power2.easeIn'
    })
  }

  private slideOutOnHover(): void {
    // Stop any existing hover animation
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Slide out to hover position
    this.hoverTween = this.scene.tweens.add({
      targets: this.container,
      x: this.HOVER_X,
      duration: 300,
      ease: 'Power2.easeOut'
    })
  }

  private slideBackToHidden(): void {
    // Stop any existing hover animation
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Slide back to hidden position
    this.hoverTween = this.scene.tweens.add({
      targets: this.container,
      x: this.HIDDEN_X,
      duration: 300,
      ease: 'Power2.easeOut'
    })
  }

  private startFloatingAnimation(): void {
    // Create floating animation from current position
    this.floatingTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 2,
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 1000
    })
  }

  private setupSpacebarListener(): void {
    const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    spaceKey.on('down', () => {
      console.log('Alien Order System Position:', {
        containerX: Math.round(this.container.x),
        containerY: Math.round(this.container.y),
        cardX: Math.round(this.card.x),
        cardY: Math.round(this.card.y),
        alienX: Math.round(this.alienHead.x),
        isVisible: this.isVisible,
        permanentX: this.PERMANENT_X,
        permanentY: this.PERMANENT_Y,
        hiddenX: this.HIDDEN_X
      })
    })
  }

  // Method to change the alien head
  public setAlienHead(alienType: 'alien1' | 'alien2' | 'alien3' | 'alien4'): void {
    this.alienHead.setTexture(alienType)
  }

  // Method to get the current alien type
  public getCurrentAlienType(): string {
    return this.alienHead.texture.key
  }

  // Method to set a random alien head
  public setRandomAlien(): void {
    const alienTypes = ['alien1', 'alien2', 'alien3', 'alien4'] as const
    const randomAlien = alienTypes[Math.floor(Math.random() * alienTypes.length)]
    this.setAlienHead(randomAlien)
  }

  // Method to show/hide the order system
  public setVisible(visible: boolean): void {
    if (visible) {
      this.slideIn()
    } else {
      this.slideOut()
    }
  }

  // Method to destroy the order system
  public destroy(): void {
    this.container.destroy()
  }

  // Order system methods
  private generateNewOrder(): void {
    // Find a random recipe that requires merging
    const recipeEntries = Object.entries(RECIPES)
    const randomRecipe = recipeEntries[Math.floor(Math.random() * recipeEntries.length)]
    
    if (!randomRecipe) {
      console.error('No recipes available for order generation')
      return
    }

    const [ingredients, result] = randomRecipe
    const [itemA, itemB] = ingredients.split('+') as [Item, Item]
    const requestedItem = result as Item
    
    // Calculate difficulty and reward
    const difficulty = getTier(requestedItem)
    const baseGoo = 10 // Base goo reward
    const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof this.DIFFICULTY_MULTIPLIERS] || 1
    const gooReward = baseGoo * multiplier

    this.currentOrder = {
      id: `order_${Date.now()}`,
      requestedItem,
      requiredItems: [itemA, itemB],
      difficulty,
      gooReward,
      isCompleted: false,
      timeCreated: Date.now()
    }

    // Display the order
    this.displayOrder()
    
    // Start order timer
    this.startOrderTimer()
    
    console.log('New order generated:', this.currentOrder)
  }

  private displayOrder(): void {
    if (!this.currentOrder) return

    const { requestedItem, requiredItems, gooReward } = this.currentOrder
    
    // Format order text - organized layout that doesn't overlap alien
    const orderText = `I need a\n${requestedItem}!\n\nMerge:\n${requiredItems[0]}\n+ ${requiredItems[1]}`
    this.orderText.setText(orderText)
    
    // Format reward text
    this.rewardText.setText(`Reward: ${gooReward} Goo`)
  }

  private startOrderTimer(): void {
    if (this.orderTimer) {
      this.orderTimer.destroy()
    }

    this.orderTimer = this.scene.time.delayedCall(this.ORDER_DURATION, () => {
      if (this.currentOrder && !this.currentOrder.isCompleted) {
        this.failOrder()
      }
    })
  }

  private failOrder(): void {
    if (!this.currentOrder) return

    console.log('Order failed:', this.currentOrder.requestedItem)
    
    // Clear the order
    this.currentOrder = undefined
    
    // Clear display
    this.orderText.setText('Order Failed!\n\nClick to get\nnew order')
    this.rewardText.setText('')
    
    // Stop timer
    if (this.orderTimer) {
      this.orderTimer.destroy()
      this.orderTimer = undefined
    }
  }

  public checkOrderCompletion(mergedItem: Item): boolean {
    if (!this.currentOrder || this.currentOrder.isCompleted) {
      return false
    }

    if (mergedItem === this.currentOrder.requestedItem) {
      this.completeOrder()
      return true
    }

    return false
  }

  private completeOrder(): void {
    if (!this.currentOrder) return

    const { gooReward, requestedItem } = this.currentOrder
    
    console.log(`Order completed! ${requestedItem} earned ${gooReward} goo`)
    
    // Mark as completed
    this.currentOrder.isCompleted = true
    
    // Stop timer
    if (this.orderTimer) {
      this.orderTimer.destroy()
      this.orderTimer = undefined
    }
    
    // Show completion message
    this.orderText.setText('Order Complete!\n\nClick to get\nnew order')
    this.rewardText.setText(`+${gooReward} Goo!`)
    
    // Add goo to player (you'll need to implement this)
    this.addGooToPlayer(gooReward)
    
    // Generate new order after a delay
    this.scene.time.delayedCall(3000, () => {
      this.generateNewOrder()
    })
  }

  private addGooToPlayer(amount: number): void {
    // Try to find the goo counter in the scene
    const gameScene = this.scene as any
    if (gameScene.getGooCounter) {
      const gooCounter = gameScene.getGooCounter()
      if (gooCounter && gooCounter.addGoo) {
        gooCounter.addGoo(amount)
      }
    }
    
    // Fallback: log the goo earned
    console.log(`Player earned ${amount} goo from order completion`)
  }

  public getCurrentOrder(): Order | undefined {
    return this.currentOrder
  }

  public forceNewOrder(): void {
    if (this.currentOrder) {
      this.failOrder()
    }
    this.generateNewOrder()
  }
}
