// src/game/objects/ui/AlienOrderSystem.ts

import Phaser from 'phaser'
import { Item, getTier, TIER1, RECIPES, getMergeResult } from '../../config/mergeDataFull'

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
  private alienSound!: Phaser.Sound.BaseSound
  private alienSound2!: Phaser.Sound.BaseSound
  private alienSound3!: Phaser.Sound.BaseSound
  private alienSound4!: Phaser.Sound.BaseSound
  private shakeTween?: Phaser.Tweens.Tween
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
  
  // Track completed orders to ensure first 4 are achievable
  private completedOrdersCount: number = 0
  private readonly FIRST_ORDERS_LIMIT = 4
  
  // Tutorial completion tracking
  private isTutorialCompleted: boolean = false
  
  // Track pending order generation timer
  private pendingOrderTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    // Initialize alien sounds
    this.alienSound = this.scene.sound.add('aliensound', { volume: 0.6 })
    this.alienSound2 = this.scene.sound.add('aliensound2', { volume: 0.6 })
    this.alienSound3 = this.scene.sound.add('aliensound3', { volume: 0.6 })
    this.alienSound4 = this.scene.sound.add('aliensound4', { volume: 0.6 })
    // Don't check tutorial completion here - wait until create() is called
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
    // Start with a random alien texture
    const alienTypes = ['alien1', 'alien2', 'alien3', 'alien4'] as const
    const randomAlien = alienTypes[Math.floor(Math.random() * alienTypes.length)]
    this.alienHead = this.scene.add.sprite(50, 0, randomAlien)
    this.alienHead.setDisplaySize(80, 80)
    this.alienHead.setDepth(1001)

    // Create order text - positioned to the right of the alien head
    this.orderText = this.scene.add.text(80, -20, '', {
      fontSize: '11px',
      color: '#000000',
      wordWrap: { width: 120 },
      align: 'left'
    }).setOrigin(0, 0.5)
    this.orderText.setDepth(1002)

    // Create reward text - positioned below the order text
    this.rewardText = this.scene.add.text(80, 30, '', {
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

    // Now check tutorial completion status after container is created
    this.checkTutorialCompletionStatus()

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

    // Click to handle different states
    this.container.on('pointerdown', () => {
      if (this.isVisible) {
        // If we have a current order, clicking hides the system
        if (this.hasCurrentOrder()) {
          this.slideOut()
        } else {
          // If no current order, clicking generates a new one immediately (skip wait)
          this.handleNewOrderRequest()
        }
      } else {
        // If hidden, clicking shows the system
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
    
    // Play alien sound based on alien type and start shake animation
    if (this.alienHead.texture.key === 'alien1' && this.alienSound) {
      this.alienSound.play()
      this.startAlienShake()
      // Stop shake when sound ends
      this.alienSound.once('complete', () => this.stopAlienShake())
    } else if (this.alienHead.texture.key === 'alien2' && this.alienSound2) {
      this.alienSound2.play()
      this.startAlienShake()
      // Stop shake when sound ends
      this.alienSound2.once('complete', () => this.stopAlienShake())
    } else if (this.alienHead.texture.key === 'alien3' && this.alienSound3) {
      this.alienSound3.play()
      this.startAlienShake()
      // Stop shake when sound ends
      this.alienSound3.once('complete', () => this.stopAlienShake())
    } else if (this.alienHead.texture.key === 'alien4' && this.alienSound4) {
      this.alienSound4.play()
      this.startAlienShake()
      // Stop shake when sound ends
      this.alienSound4.once('complete', () => this.stopAlienShake())
    }
    
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

  private startAlienShake(): void {
    // Stop any existing shake animation
    if (this.shakeTween) {
      this.shakeTween.stop()
    }

    // Create a subtle shake effect for the alien head
    this.shakeTween = this.scene.tweens.add({
      targets: this.alienHead,
      x: this.alienHead.x + 2,
      y: this.alienHead.y + 1,
      duration: 100,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onComplete: () => {
        // Reset position when shake ends
        this.alienHead.setPosition(50, 0)
      }
    })
  }

  private stopAlienShake(): void {
    if (this.shakeTween) {
      this.shakeTween.stop()
      this.shakeTween = undefined
    }
    // Reset alien head position
    this.alienHead.setPosition(50, 0)
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
    // Clean up pending order timer
    if (this.pendingOrderTimer) {
      this.pendingOrderTimer.destroy()
      this.pendingOrderTimer = undefined
    }
    
    // Clean up shake animation
    this.stopAlienShake()
    
    this.container.destroy()
  }

  // Order system methods
  private generateNewOrder(): void {
    // Don't generate orders until tutorial is completed
    if (!this.isTutorialCompleted) {
      return
    }
    
    // Change to a random alien type for each new order
    this.setRandomAlien()
    
    // For the first 4 orders, only generate orders for items that can be made with 1 merge
    if (this.completedOrdersCount < this.FIRST_ORDERS_LIMIT) {
      this.generateAchievableOrder()
    } else {
      // After first 4 orders, use the original random generation
      this.generateRandomOrder()
    }
  }

  private generateAchievableOrder(): void {
    console.log('🔄 Alien Order System: generateAchievableOrder called')
    // Get current items from the scene
    const currentItems = this.getCurrentItems()
    console.log('🔄 Alien Order System: Current items found:', currentItems.length)
    
    if (currentItems.length === 0) {
      console.log('🔄 Alien Order System: No items found, falling back to random generation')
      // If no items, fall back to random generation
      this.generateRandomOrder()
      return
    }

    // Find all possible 1-merge recipes from current items, excluding problematic items
    const achievableRecipes: Array<{ingredients: [Item, Item], result: Item}> = []
    
    // Check all pairs of current items for valid merges
    for (let i = 0; i < currentItems.length; i++) {
      for (let j = i + 1; j < currentItems.length; j++) {
        const result = getMergeResult(currentItems[i], currentItems[j])
        if (result && !this.isItemExcludedFromOrders(result)) {
          achievableRecipes.push({
            ingredients: [currentItems[i], currentItems[j]],
            result: result
          })
        }
      }
    }
    
    if (achievableRecipes.length === 0) {
      // If no achievable recipes, fall back to random generation
      this.generateRandomOrder()
      return
    }
    
    // Pick a random achievable recipe
    const randomRecipe = achievableRecipes[Math.floor(Math.random() * achievableRecipes.length)]
    const { ingredients, result } = randomRecipe
    
    // Calculate difficulty and reward
    const difficulty = getTier(result)
    const baseGoo = 10 // Base goo reward
    const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof this.DIFFICULTY_MULTIPLIERS] || 1
    const gooReward = baseGoo * multiplier

    this.currentOrder = {
      id: `order_${Date.now()}`,
      requestedItem: result,
      requiredItems: ingredients,
      difficulty,
      gooReward,
      isCompleted: false,
      timeCreated: Date.now()
    }

    // Display the order
    this.displayOrder()
    
    // Start order timer
    this.startOrderTimer()
    
    console.log('New achievable order generated:', this.currentOrder)
  }

  private generateRandomOrder(): void {
    // Find a random recipe that requires merging, excluding problematic items
    const recipeEntries = Object.entries(RECIPES)
    
    // Filter out recipes that result in excluded items
    const filteredRecipes = recipeEntries.filter(([ingredients, result]) => {
      const requestedItem = result as Item
      return !this.isItemExcludedFromOrders(requestedItem)
    })
    
    if (filteredRecipes.length === 0) {
      console.error('No valid recipes available for order generation after filtering')
      return
    }
    
    const randomRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)]
    
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
    
    console.log('New random order generated:', this.currentOrder)
  }

  private getCurrentItems(): string[] {
    const items: string[] = []
    
    // Get all items from the scene that have itemName property
    this.scene.children.list.forEach(child => {
      if ((child as any).itemName) {
        const itemName = (child as any).itemName
        // Exclude enemies and hazards from mergeable check
        if (!itemName.startsWith("Enemy:") && !itemName.startsWith("Hazard:")) {
          items.push(itemName)
        }
      }
    })
    
    return items
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
    this.orderText.setText('Order Failed!\n\nNew order in\n30-60 seconds')
    this.rewardText.setText('')
    
    // Stop timer
    if (this.orderTimer) {
      this.orderTimer.destroy()
      this.orderTimer = undefined
    }
    
    // Slide the card back into place (hidden position)
    this.slideOut()
    
    // Generate new order after a random delay between 30-60 seconds
    const delayMs = Phaser.Math.Between(30000, 60000) // 30-60 seconds
    console.log(`New order will appear in ${delayMs / 1000} seconds`)
    
    this.pendingOrderTimer = this.scene.time.delayedCall(delayMs, () => {
      // Only generate new order if we're still in tutorial completed state
      if (this.isTutorialCompleted) {
        this.generateNewOrder()
        // Slide the card back into view
        this.slideIn()
      }
      this.pendingOrderTimer = undefined
    })
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
    
    // Increment completed orders count
    this.completedOrdersCount++
    
    // Stop timer
    if (this.orderTimer) {
      this.orderTimer.destroy()
      this.orderTimer = undefined
    }
    
    // Show completion message
    this.orderText.setText('Order Complete!\n\nNew order in\n30-60 seconds')
    this.rewardText.setText(`+${gooReward} Goo!`)
    
    // Add goo to player (you'll need to implement this)
    this.addGooToPlayer(gooReward)
    
    // Slide the card back into place (hidden position) after showing completion message
    this.scene.time.delayedCall(3000, () => {
      this.slideOut()
    })
    
    // Generate new order after a random delay between 30-60 seconds
    const delayMs = Phaser.Math.Between(30000, 60000) // 30-60 seconds
    console.log(`New order will appear in ${delayMs / 1000} seconds`)
    
    this.pendingOrderTimer = this.scene.time.delayedCall(delayMs, () => {
      // Only generate new order if we're still in tutorial completed state
      if (this.isTutorialCompleted) {
        this.generateNewOrder()
        // Slide the card back into view
        this.slideIn()
      }
      this.pendingOrderTimer = undefined
    })
  }

  private addGooToPlayer(amount: number): void {
    // Add the goo amount to the player's score in the Game scene
    const gameScene = this.scene as any
    if (gameScene.addScore) {
      gameScene.addScore(amount)
      console.log(`Successfully added ${amount} points to player score from order completion`)
    } else {
      console.log(`addScore method not found on game scene - cannot award points`)
    }
    
    // Also log the goo earned for reference
    console.log(`Player earned ${amount} goo from order completion`)
  }

  public getCurrentOrder(): Order | undefined {
    return this.currentOrder
  }

  public hasCurrentOrder(): boolean {
    return this.currentOrder !== undefined
  }

  public forceNewOrder(): void {
    if (this.currentOrder) {
      this.failOrder()
    }
    this.generateNewOrder()
  }

  private handleNewOrderRequest(): void {
    // Only generate new order if tutorial is completed
    if (!this.isTutorialCompleted) {
      return
    }
    
    // Cancel any pending order generation timer
    if (this.pendingOrderTimer) {
      this.pendingOrderTimer.destroy()
      this.pendingOrderTimer = undefined
      console.log('Pending order timer cancelled - generating new order immediately')
    }
    
    // Generate new order immediately
    this.generateNewOrder()
  }

  private checkTutorialCompletionStatus(): void {
    // Check the scene's tutorialPhase property if available (this is the primary source)
    const gameScene = this.scene as any
    if (gameScene.tutorialPhase !== undefined) {
      this.isTutorialCompleted = !gameScene.tutorialPhase
      console.log('🔄 Alien Order System: Tutorial completion status from scene:', this.isTutorialCompleted)
    } else {
      // Fallback to localStorage if scene property not available
      try {
        const savedState = localStorage.getItem('toilet_merge_game_state')
        if (savedState) {
          const gameState = JSON.parse(savedState)
          this.isTutorialCompleted = gameState.tutorialCompleted === true
          console.log('🔄 Alien Order System: Tutorial completion status from localStorage:', this.isTutorialCompleted)
        }
      } catch (error) {
        // Default to tutorial not completed if we can't read the save
        this.isTutorialCompleted = false
        console.log('🔄 Alien Order System: Tutorial completion status defaulted to false')
      }
    }
    
    // If tutorial is completed, start the order system
    if (this.isTutorialCompleted && this.container) {
      console.log('🔄 Alien Order System: Starting order system due to tutorial completion')
      this.startOrderSystem()
    } else {
      console.log('🔄 Alien Order System: Not starting order system - tutorial not completed or container not ready')
    }
  }

  // Method to manually mark tutorial as completed (called from Game scene)
  public setTutorialCompleted(completed: boolean): void {
    console.log('🔄 Alien Order System: setTutorialCompleted called with:', completed, 'current status:', this.isTutorialCompleted)
    
    // Prevent duplicate calls
    if (this.isTutorialCompleted === completed) {
      console.log('🔄 Alien Order System: Tutorial completion status already set to:', completed, '- skipping')
      return
    }
    
    this.isTutorialCompleted = completed
    if (completed && this.container) {
      console.log('🔄 Alien Order System: Starting order system via setTutorialCompleted')
      // Start the order system now that tutorial is complete
      this.startOrderSystem()
    } else {
      console.log('🔄 Alien Order System: Cannot start order system - completed:', completed, 'container exists:', !!this.container)
    }
  }

  private startOrderSystem(): void {
    console.log('🔄 Alien Order System: startOrderSystem called')
    // Generate first order
    this.generateNewOrder()
    
    // Slide in from the left to reveal the system
    this.slideIn()
  }

  public generateNewOrder(): void {
    console.log('🔄 Alien Order System: generateNewOrder called, tutorial completed:', this.isTutorialCompleted)
    if (this.isTutorialCompleted) {
      console.log('🔄 Alien Order System: Generating achievable order')
      this.generateAchievableOrder();
    } else {
      console.log('🔄 Alien Order System: Cannot generate order - tutorial not completed')
    }
  }

  public restoreOrderFromSave(orderState: any): boolean {
    console.log('🔄 Alien Order System: restoreOrderFromSave called with:', orderState)
    try {
      if (!orderState || !orderState.requestedItem) {
        console.log('❌ Invalid order state for restoration');
        return false;
      }

      // Create the order object from saved state
      this.currentOrder = {
        id: `order_${Date.now()}`,
        requestedItem: orderState.requestedItem,
        requiredItems: orderState.requiredItems,
        difficulty: orderState.difficulty,
        gooReward: orderState.gooReward,
        isCompleted: orderState.isCompleted || false,
        timeCreated: orderState.timeCreated || Date.now()
      };

      // If the order is not completed, display it and start the timer
      if (!this.currentOrder.isCompleted) {
        this.displayOrder();
        this.startOrderTimer();
        console.log('✅ Alien order restored from save:', this.currentOrder);
        return true;
      } else {
        console.log('ℹ️ Restored completed order, generating new one');
        this.generateNewOrder();
        return true;
      }
    } catch (error) {
      console.error('❌ Error restoring order from save:', error);
      return false;
    }
  }

  private isTutorialCompleted(): boolean {
    // Get tutorial status from the Game scene instead of localStorage
    const gameScene = this.scene as any;
    if (gameScene.tutorialPhase !== undefined) {
      return !gameScene.tutorialPhase; // tutorialPhase is true when tutorial is active, false when completed
    }
    
    // Fallback to localStorage if scene property not available
    try {
      const savedState = localStorage.getItem('toilet_merge_game_state');
      if (!savedState) {
        return false; // No save data means tutorial not completed
      }

      const gameState = JSON.parse(savedState);
      return gameState.tutorialCompleted === true;
    } catch (error) {
      return false; // Default to tutorial not completed if we can't read the save
    }
  }

  private isFirstBoxOfSession(): boolean {
    // Check if this is the first box of the current game session
    // This should only be true for new games where tutorial is still active
    const gameScene = this.scene as any;
    if (gameScene.tutorialPhase !== undefined) {
      return gameScene.tutorialPhase; // tutorialPhase is true when tutorial is active (new game)
    }
    
    // Fallback: if we can't determine tutorial status, assume it's not the first box
    return false;
  }

  private isItemExcludedFromOrders(item: Item): boolean {
    // Exclude items that should never be requested in alien orders
    
    // Exclude specific problematic items
    if (item === "Toilet" || item === "Unstable Goo") {
      return true;
    }
    
    // Exclude all enemy items (start with "Enemy:")
    if (item.startsWith("Enemy:")) {
      return true;
    }
    
    // Exclude all hazard items (start with "Hazard:")
    if (item.startsWith("Hazard:")) {
      return true;
    }
    
    // Exclude all trigger items (start with "Trigger:")
    if (item.startsWith("Trigger:")) {
      return true;
    }
    
    // Exclude items containing "Unstable" (case-insensitive)
    if (item.toLowerCase().includes("unstable")) {
      return true;
    }
    
    // Item is allowed in orders
    return false;
  }
}
