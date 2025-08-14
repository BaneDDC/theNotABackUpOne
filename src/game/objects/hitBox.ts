import { Scene } from 'phaser'
import { GAME_CONFIG, COLORS } from '../config/constants'

interface CollisionBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  graphics: Phaser.GameObjects.Graphics
  handles: Phaser.GameObjects.Graphics[]
  nameText?: Phaser.GameObjects.Text
  renameButton?: Phaser.GameObjects.Graphics
  renameButtonText?: Phaser.GameObjects.Text
  gameObject?: any // Reference to the original game object
  isGameObject?: boolean // Flag to identify if this is from a game object
  customName?: string // Custom name set by user
}

export class CollisionEditor extends Scene {
  private collisionBoxes: CollisionBox[] = []
  private selectedBox: CollisionBox | null = null
  private isDragging: boolean = false
  private isResizing: boolean = false
  private isRelativeDragging: boolean = false // New flag for SHIFT+drag mode
  private dragStartX: number = 0
  private dragStartY: number = 0
  private resizeHandle: number = -1 // 0=TL, 1=TR, 2=BL, 3=BR
  private nextId: number = 1
  private debugCollisionBoxes: any[] = []
  private originalGameZoom: number = 1
  private gameScene: any = null
  private uiCamera!: Phaser.Cameras.Scene2D.Camera
  private worldObjects: Phaser.GameObjects.GameObject[] = []
  private isRenaming: boolean = false // Flag to track if we're in rename mode
  
  // UI Elements
  private instructionsText!: Phaser.GameObjects.Text
  private exportButton!: Phaser.GameObjects.Graphics
  private exportButtonText!: Phaser.GameObjects.Text
  private clearButton!: Phaser.GameObjects.Graphics
  private clearButtonText!: Phaser.GameObjects.Text
  private renameButton!: Phaser.GameObjects.Graphics
  private renameButtonText!: Phaser.GameObjects.Text
  
  // Tooltip system
  private tooltip!: Phaser.GameObjects.Container
  private tooltipBackground!: Phaser.GameObjects.Graphics
  private tooltipText!: Phaser.GameObjects.Text
  private hoveredBox: CollisionBox | null = null
  private tooltipUpdateTimer?: Phaser.Time.TimerEvent

  constructor() {
    super("CollisionEditor")
  }

  preload() {
    // Remove background loading - using transparent template instead
  }

  create() {
    // Get reference to the Game scene and store its current zoom
    this.gameScene = this.scene.get('Game')
    if (this.gameScene && this.gameScene.cameras && this.gameScene.cameras.main) {
      this.originalGameZoom = this.gameScene.cameras.main.zoom
      
      // Copy the Game scene's camera position and zoom to this overlay
      this.cameras.main.setZoom(this.originalGameZoom)
      this.cameras.main.setScroll(
        this.gameScene.cameras.main.scrollX,
        this.gameScene.cameras.main.scrollY
      )
    }
    
    // Set transparent background for overlay effect
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
    
    // Create a separate UI camera that never moves or zooms
    this.uiCamera = this.cameras.add(0, 0, this.sys.game.config.width as number, this.sys.game.config.height as number)
    this.uiCamera.setZoom(1)
    this.uiCamera.setScroll(0, 0)
    this.uiCamera.setBackgroundColor('rgba(0,0,0,0)')
    
    // Create weapon racks for visual reference
    this.createWeaponRacks()
    
    // Setup camera without zoom to avoid UI positioning issues
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT)
    
    // Load existing physics bodies from the game scene
    this.loadExistingPhysicsBodies()
    
    // Import predefined collision boxes
    this.importPredefinedCollisionBoxes()
    
    // Create tooltip system
    this.createTooltip()
    
    // Create UI
    this.createUI()
    
    // Setup input handlers
    this.setupInputHandlers()
    
    // Add camera controls
    this.setupCameraControls()
  }

  private createTooltip() {
    // Create tooltip container
    this.tooltip = this.add.container(0, 0)
    this.tooltip.setDepth(3000)
    this.tooltip.setVisible(false)
    
    // Create tooltip background
    this.tooltipBackground = this.add.graphics()
    this.tooltip.add(this.tooltipBackground)
    
    // Create tooltip text with doubled font size
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '24px', // Doubled from 12px
      color: '#ffffff',
      padding: { x: 16, y: 12 }, // Doubled padding
      lineSpacing: 4 // Doubled line spacing
    })
    this.tooltip.add(this.tooltipText)
    
    // Make tooltip follow UI camera (never moves with world)
    this.cameras.main.ignore([this.tooltip])
  }

  private createWeaponRacks() {
    // Create a simple grid template for reference
    const gridGraphics = this.add.graphics()
    gridGraphics.lineStyle(1, 0x333333, 0.3)
    
    // Draw grid lines every 100 pixels
    const gridSize = 100
    for (let x = 0; x <= GAME_CONFIG.WORLD_WIDTH; x += gridSize) {
      gridGraphics.moveTo(x, 0)
      gridGraphics.lineTo(x, GAME_CONFIG.WORLD_HEIGHT)
    }
    for (let y = 0; y <= GAME_CONFIG.WORLD_HEIGHT; y += gridSize) {
      gridGraphics.moveTo(0, y)
      gridGraphics.lineTo(GAME_CONFIG.WORLD_WIDTH, y)
    }
    gridGraphics.strokePath()
    
    // Add center reference point
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2
    
    const refGraphics = this.add.graphics()
    refGraphics.lineStyle(2, 0x666666, 0.5)
    refGraphics.strokeRect(centerX - 50, centerY - 50, 100, 100)
    
    // Add coordinate text at center
    const centerText = this.add.text(centerX, centerY, `Center\n(${centerX}, ${centerY})`, {
      fontSize: '16px',
      color: '#666666',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5)
    
    // Store world objects to exclude from UI camera
    this.worldObjects = [gridGraphics, refGraphics, centerText]
  }

  private loadExistingPhysicsBodies() {
    if (!this.gameScene) return

    // Check if physics is enabled in the game scene
    if (!this.gameScene.physics || !this.gameScene.physics.world) {

      return
    }

    // Get all physics bodies from the game scene
    const physicsBodies = this.gameScene.physics.world.bodies.entries

    physicsBodies.forEach((body: any) => {
      if (body.gameObject) {
        const gameObject = body.gameObject
        let objectName = 'Unknown'
        
        // Determine object type/name
        if (gameObject.constructor.name === 'Player') {
          objectName = 'Player'
        } else if (gameObject.constructor.name === 'Ball') {
          objectName = 'Ball'
        } else if (gameObject.constructor.name === 'BlueFireBall') {
          objectName = 'BlueFireBall'
        } else if (gameObject.constructor.name === 'Obstacle') {
          objectName = 'Obstacle'
        } else {
          objectName = gameObject.constructor.name
        }

        // Create collision box from physics body
        this.createBoxFromPhysicsBody(
          body.x,
          body.y,
          body.width,
          body.height,
          `${objectName}_${this.nextId++}`,
          gameObject,
          objectName
        )
      }
    })
  }

  private createBoxFromPhysicsBody(x: number, y: number, width: number, height: number, id: string, gameObject: any, objectName: string) {
    const box: CollisionBox = {
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      graphics: this.add.graphics(),
      handles: [],
      gameObject: gameObject,
      isGameObject: true,
      customName: objectName // Set initial custom name to object type
    }
    
    // Create resize handles
    for (let i = 0; i < 4; i++) {
      box.handles.push(this.add.graphics())
    }

    // Create name text with doubled font size
    box.nameText = this.add.text(x + width/2, y - 20, box.customName || objectName, {
      fontSize: '28px', // Doubled from 14px
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 } // Doubled padding
    }).setOrigin(0.5)
    
    // Add collision box graphics to world objects so UI camera ignores them
    this.worldObjects.push(box.graphics, ...box.handles, box.nameText)
    this.uiCamera.ignore([box.graphics, ...box.handles, box.nameText])
    
    this.collisionBoxes.push(box)
    this.updateBoxGraphics(box)
  }

  private createBoxFromData(x: number, y: number, width: number, height: number, id: string, customName?: string) {
    const box: CollisionBox = {
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      graphics: this.add.graphics(),
      handles: [],
      isGameObject: false,
      customName: customName || 'Custom Box'
    }
    
    // Create resize handles
    for (let i = 0; i < 4; i++) {
      box.handles.push(this.add.graphics())
    }

    // Create name text for custom boxes with doubled font size
    box.nameText = this.add.text(x + width/2, y - 20, box.customName, {
      fontSize: '28px', // Doubled from 14px
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 } // Doubled padding
    }).setOrigin(0.5)
    
    // Add collision box graphics to world objects so UI camera ignores them
    this.worldObjects.push(box.graphics, ...box.handles, box.nameText)
    this.uiCamera.ignore([box.graphics, ...box.handles, box.nameText])
    
    this.collisionBoxes.push(box)
    this.updateBoxGraphics(box)
  }

  private createBox(x: number, y: number) {
    const box: CollisionBox = {
      id: `box_${this.nextId++}`,
      x: x,
      y: y,
      width: 100,
      height: 100,
      graphics: this.add.graphics(),
      handles: [],
      isGameObject: false,
      customName: 'Custom Box'
    }
    
    // Create resize handles
    for (let i = 0; i < 4; i++) {
      box.handles.push(this.add.graphics())
    }

    // Create name text for custom boxes with doubled font size
    box.nameText = this.add.text(x + 50, y - 20, box.customName, {
      fontSize: '28px', // Doubled from 14px
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 } // Doubled padding
    }).setOrigin(0.5)
    
    // Add collision box graphics to world objects so UI camera ignores them
    this.worldObjects.push(box.graphics, ...box.handles, box.nameText)
    this.uiCamera.ignore([box.graphics, ...box.handles, box.nameText])
    
    this.collisionBoxes.push(box)
    this.selectedBox = box
    this.updateBoxGraphics(box)
    this.updateBoxSelection()
  }

  private updateBoxGraphics(box: CollisionBox) {
    box.graphics.clear()
    
    // Draw box outline and fill - different colors for game objects vs custom boxes
    const isSelected = box === this.selectedBox
    let boxColor = box.isGameObject ? 0x0066ff : 0xff0000 // Blue for game objects, red for custom
    
    // Change color if in relative dragging mode
    if (this.isRelativeDragging && isSelected && box.isGameObject) {
      boxColor = 0xff8800 // Orange to indicate relative dragging mode
    }
    
    const selectedColor = isSelected ? 0x00ff00 : boxColor
    
    box.graphics.lineStyle(3, selectedColor, 0.8)
    box.graphics.fillStyle(boxColor, 0.3)
    box.graphics.fillRect(box.x, box.y, box.width, box.height)
    box.graphics.strokeRect(box.x, box.y, box.width, box.height)
    
    // Update name text position and content
    if (box.nameText) {
      box.nameText.setText(box.customName || 'Unnamed')
      box.nameText.setPosition(box.x + box.width/2, box.y - 20)
    }
    
    // Update resize handles
    if (isSelected) {
      const handlePositions = [
        { x: box.x, y: box.y }, // Top-left
        { x: box.x + box.width, y: box.y }, // Top-right
        { x: box.x, y: box.y + box.height }, // Bottom-left
        { x: box.x + box.width, y: box.y + box.height } // Bottom-right
      ]
      
      box.handles.forEach((handle, index) => {
        handle.clear()
        handle.fillStyle(0x00ff00)
        handle.fillCircle(handlePositions[index].x, handlePositions[index].y, 8)
        handle.setVisible(true)
      })
    } else {
      box.handles.forEach(handle => handle.setVisible(false))
    }
  }

  private updateGameObjectFromBox(box: CollisionBox) {
    if (box.isGameObject && box.gameObject && box.gameObject.body) {
      // Update the game object's physics body position and size
      const body = box.gameObject.body
      
      // Update position
      box.gameObject.setPosition(box.x + box.width/2, box.y + box.height/2)
      
      // Update physics body size
      body.setSize(box.width, box.height)
      body.setOffset(-box.width/2, -box.height/2)
      
      // Reset BlueFireBall to default facing when moved
      this.resetGameObjectToDefaultFacing(box.gameObject)
    }
  }

  private applyChangesToGameObjects() {
    // Apply all changes to game objects before closing the editor
    this.collisionBoxes.forEach(box => {
      if (box.isGameObject) {
        this.updateGameObjectFromBox(box)
      }
    })
  }

  private updateBoxSelection() {
    this.collisionBoxes.forEach(box => {
      this.updateBoxGraphics(box)
    })
    
    // Show/hide rename button based on selection
    if (this.selectedBox) {
      this.renameButton.setVisible(true)
      this.renameButtonText.setVisible(true)
    } else {
      this.renameButton.setVisible(false)
      this.renameButtonText.setVisible(false)
    }
  }

  private getBoxAtPosition(x: number, y: number): CollisionBox | null {
    for (const box of this.collisionBoxes) {
      if (x >= box.x && x <= box.x + box.width && 
          y >= box.y && y <= box.y + box.height) {
        return box
      }
    }
    return null
  }

  private getResizeHandleAtPosition(x: number, y: number): { box: CollisionBox, handle:number } | null {
    for (const box of this.collisionBoxes) {
      if (box !== this.selectedBox) continue
      
      const handlePositions = [
        { x: box.x, y: box.y }, // Top-left
        { x: box.x + box.width, y: box.y }, // Top-right
        { x: box.x, y: box.y + box.height }, // Bottom-left
        { x: box.x + box.width, y: box.y + box.height } // Bottom-right
      ]
      
      for (let i = 0; i < handlePositions.length; i++) {
        const handle = handlePositions[i]
        const distance = Phaser.Math.Distance.Between(x, y, handle.x, handle.y)
        if (distance <= 12) {
          return { box, handle: i }
        }
      }
    }
    return null
  }

  private resizeBox(box: CollisionBox, x: number, y: number) {
    const originalX = box.x
    const originalY = box.y
    const originalWidth = box.width
    const originalHeight = box.height
    
    switch (this.resizeHandle) {
      case 0: // Top-left
        box.width = originalWidth + (originalX - x)
        box.height = originalHeight + (originalY - y)
        box.x = x
        box.y = y
        break
      case 1: // Top-right
        box.width = x - originalX
        box.height = originalHeight + (originalY - y)
        box.y = y
        break
      case 2: // Bottom-left
        box.width = originalWidth + (originalX - x)
        box.height = y - originalY
        box.x = x
        break
      case 3: // Bottom-right
        box.width = x - originalX
        box.height = y - originalY
        break
    }
    
    // Ensure minimum size
    box.width = Math.max(20, box.width)
    box.height = Math.max(20, box.height)
    
    this.updateBoxGraphics(box)
  }

  private deleteBox(box: CollisionBox) {
    const index = this.collisionBoxes.indexOf(box)
    if (index > -1) {
      box.graphics.destroy()
      box.handles.forEach(handle => handle.destroy())
      if (box.nameText) {
        box.nameText.destroy()
      }
      this.collisionBoxes.splice(index, 1)
      
      if (this.selectedBox === box) {
        this.selectedBox = null
      }
      
      // Hide tooltip if it was showing this box
      if (this.hoveredBox === box) {
        this.hideTooltip()
      }
    }
  }

  private clearAllBoxes() {
    // Only clear custom boxes, not game object boxes
    const customBoxes = this.collisionBoxes.filter(box => !box.isGameObject)
    customBoxes.forEach(box => {
      this.deleteBox(box)
    })
  }

  private exportCollisionBoxes() {
    const exportData = this.collisionBoxes.map(box => ({
      id: box.id,
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
      isGameObject: box.isGameObject || false,
      objectType: box.isGameObject ? box.id.split('_')[0] : 'Custom',
      customName: box.customName || (box.isGameObject ? box.id.split('_')[0] : 'Custom Box')
    }))
    
    const jsonString = JSON.stringify(exportData, null, 2)
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {


      
      // Show temporary success message in center of viewport with doubled font size
      const gameWidth = this.sys.game.config.width as number
      const gameHeight = this.sys.game.config.height as number
      
      const successText = this.add.text(gameWidth / 2, gameHeight / 2, 
        'EXPORTED TO CLIPBOARD!', {
        fontSize: '40px', // Doubled from 20px
        color: '#00ff00',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 24, y: 12 } // Doubled padding
      })
      successText.setOrigin(0.5)
      successText.setScrollFactor(0)
      successText.setDepth(2000)
      
      this.time.delayedCall(2000, () => {
        successText.destroy()
      })
    }).catch(() => {


    })
  }

  private destroyDebugCollisionBoxes() {
    this.debugCollisionBoxes.forEach(item => {
      if (item && item.active) {
        item.destroy()
      }
    })
    this.debugCollisionBoxes = []
  }

  private resetGameObjectToDefaultFacing(gameObject: any) {
    // Reset BlueFireBall objects to default facing (no rotation)
    if (gameObject.constructor.name === 'BlueFireBall') {
      // Find the sprite child and reset its rotation
      const sprite = gameObject.list.find((child: any) => child.type === 'Sprite')
      if (sprite) {
        sprite.setRotation(0) // Reset to default facing
      }
    }
  }

  private importPredefinedCollisionBoxes() {
    const predefinedBoxes = [
      {
        "id": "box_1",
        "x": 1,
        "y": 303,
        "width": 20,
        "height": 108,
        "isGameObject": false,
        "objectType": "Custom",
        "customName": "Left Wall"
      },
      {
        "id": "box_2",
        "x": 3,
        "y": 337,
        "width": 62,
        "height": 89,
        "isGameObject": false,
        "objectType": "Custom",
        "customName": "Step 1"
      },
      {
        "id": "box_3",
        "x": 1,
        "y": 369,
        "width": 115,
        "height": 58,
        "isGameObject": false,
        "objectType": "Custom",
        "customName": "Step 2"
      },
      {
        "id": "box_4",
        "x": 2,
        "y": 403,
        "width": 158,
        "height": 32,
        "isGameObject": false,
        "objectType": "Custom",
        "customName": "Step 3"
      },
      {
        "id": "box_5",
        "x": 29,
        "y": 473,
        "width": 1096,
        "height": 83,
        "isGameObject": false,
        "objectType": "Custom",
        "customName": "Floor Platform"
      }
    ]

    predefinedBoxes.forEach(boxData => {
      this.createBoxFromData(boxData.x, boxData.y, boxData.width, boxData.height, boxData.id, boxData.customName)
    })


  }

  private importCollisionBoxes(jsonData: string) {
    try {
      const boxesData = JSON.parse(jsonData)
      
      // Clear existing custom boxes first
      this.clearAllBoxes()
      
      boxesData.forEach((boxData: any) => {
        if (!boxData.isGameObject) {
          this.createBoxFromData(
            boxData.x, 
            boxData.y, 
            boxData.width, 
            boxData.height, 
            boxData.id,
            boxData.customName || boxData.objectType || 'Custom Box'
          )
        }
      })
      

    } catch (error) {

    }
  }

  private startRenaming(box: CollisionBox) {
    if (this.isRenaming) return // Prevent multiple rename operations
    
    // Starting rename for box
    
    this.isRenaming = true
    const currentName = box.customName || (box.isGameObject ? box.id.split('_')[0] : 'Custom Box')
    
    // Create a more reliable text input method
    const newName = this.createTextInput(currentName)
    
    this.isRenaming = false
  }

  private createTextInput(currentName: string) {
    // Temporarily disable Phaser input to prevent conflicts
    this.input.enabled = false
    
    // Create a temporary HTML input element for better text editing
    const input = document.createElement('input')
    input.type = 'text'
    input.value = currentName
    input.style.position = 'fixed'
    input.style.top = '50%'
    input.style.left = '50%'
    input.style.transform = 'translate(-50%, -50%)'
    input.style.zIndex = '10000'
    input.style.padding = '15px'
    input.style.fontSize = '18px'
    input.style.border = '3px solid #aa6600'
    input.style.borderRadius = '8px'
    input.style.backgroundColor = '#ffffff'
    input.style.color = '#000000'
    input.style.width = '400px'
    input.style.outline = 'none'
    input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
    
    // Create a backdrop
    const backdrop = document.createElement('div')
    backdrop.style.position = 'fixed'
    backdrop.style.top = '0'
    backdrop.style.left = '0'
    backdrop.style.width = '100%'
    backdrop.style.height = '100%'
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    backdrop.style.zIndex = '9999'
    
    // Create instruction text
    const instructions = document.createElement('div')
    instructions.style.position = 'fixed'
    instructions.style.top = 'calc(50% + 60px)'
    instructions.style.left = '50%'
    instructions.style.transform = 'translateX(-50%)'
    instructions.style.color = '#ffffff'
    instructions.style.fontSize = '14px'
    instructions.style.textAlign = 'center'
    instructions.style.zIndex = '10001'
    instructions.innerHTML = 'Press ENTER to save • Press ESCAPE to cancel'
    
    // Add elements to page
    document.body.appendChild(backdrop)
    document.body.appendChild(input)
    document.body.appendChild(instructions)
    
    // Focus and select all text after a brief delay
    setTimeout(() => {
      input.focus()
      input.select()
    }, 100)
    
    // Handle input completion
    const handleComplete = (save: boolean) => {
      // Re-enable Phaser input
      this.input.enabled = true
      
      if (save && input.value.trim() !== '') {
        const newName = input.value.trim()
        if (this.selectedBox) {
          this.selectedBox.customName = newName
          this.updateBoxNameText(this.selectedBox)
          this.showRenameSuccess(this.selectedBox)
          // Renamed box
        }
      }
      
      // Clean up
      if (document.body.contains(input)) document.body.removeChild(input)
      if (document.body.contains(backdrop)) document.body.removeChild(backdrop)
      if (document.body.contains(instructions)) document.body.removeChild(instructions)
    }
    
    // Handle Enter key (save)
    input.addEventListener('keydown', (e) => {
      e.stopPropagation() // Prevent Phaser from handling this
      
      if (e.key === 'Enter') {
        e.preventDefault()
        handleComplete(true)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleComplete(false)
      }
    })
    
    // Prevent other key events from reaching Phaser
    input.addEventListener('keyup', (e) => {
      e.stopPropagation()
    })
    
    input.addEventListener('keypress', (e) => {
      e.stopPropagation()
    })
    
    // Handle clicking outside (cancel)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleComplete(false)
      }
    })
    
    // Remove the problematic blur handler that was causing focus issues
    // The input will now stay focused properly
  }

  private updateBoxNameText(box: CollisionBox) {
    if (box.nameText) {
      box.nameText.setText(box.customName || 'Unnamed')
      // Update position to keep it centered above the box
      box.nameText.setPosition(box.x + box.width/2, box.y - 20)
    }
  }

  private showRenameSuccess(box: CollisionBox) {
    // Create temporary success indicator
    const successText = this.add.text(box.x + box.width/2, box.y - 50, 'RENAMED!', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5)
    
    // Add to world objects so UI camera ignores it
    this.worldObjects.push(successText)
    this.uiCamera.ignore([successText])
    
    // Fade out and destroy after 1.5 seconds
    this.tweens.add({
      targets: successText,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        successText.destroy()
        // Remove from worldObjects array
        const index = this.worldObjects.indexOf(successText)
        if (index > -1) {
          this.worldObjects.splice(index, 1)
        }
      }
    })
  }

  private createUI() {
    // Use the actual game canvas dimensions from the config
    const gameWidth = this.sys.game.config.width as number
    const gameHeight = this.sys.game.config.height as number
    
    // Instructions - anchored to UI camera (never moves or zooms) with doubled font size
    this.instructionsText = this.add.text(5, 5, [
      'COLLISION EDITOR (F9)',
      'L-Click: Create box',
      'Select box: Click RENAME button to rename',
      'Drag: Move box (updates game object)',
      'SHIFT+Drag: Move box relative to object',
      'Drag corners: Resize (updates game object)',
      'R-Click or Double-Click: Delete',
      'WASD: Move camera',
      'Mouse Wheel: Zoom in/out',
      'Blue boxes = Game Objects, Red boxes = Custom',
      'Hover over boxes for detailed info'
    ], {
      fontSize: '24px', // Doubled from 12px
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 12, y: 8 } // Doubled padding
    })
    this.instructionsText.setDepth(1000)
    
    // Position buttons at bottom with safe margins
    const buttonY = gameHeight - 45
    const buttonWidth = 80
    const buttonHeight = 30
    const margin = 5
    
    // Export button - anchored to UI camera
    this.exportButton = this.add.graphics()
    this.exportButton.fillStyle(0x00aa00)
    this.exportButton.fillRoundedRect(margin, buttonY, buttonWidth, buttonHeight, 3)
    this.exportButton.setDepth(1000)
    this.exportButton.setInteractive(new Phaser.Geom.Rectangle(margin, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
    
    this.exportButtonText = this.add.text(margin + buttonWidth/2, buttonY + buttonHeight/2, 'EXPORT', {
      fontSize: '24px', // Doubled from 12px
      color: '#ffffff'
    })
    this.exportButtonText.setOrigin(0.5)
    this.exportButtonText.setDepth(1001)
    
    // Clear button - anchored to UI camera
    const clearButtonX = margin + buttonWidth + 10
    this.clearButton = this.add.graphics()
    this.clearButton.fillStyle(0xaa0000)
    this.clearButton.fillRoundedRect(clearButtonX, buttonY, buttonWidth, buttonHeight, 3)
    this.clearButton.setDepth(1000)
    this.clearButton.setInteractive(new Phaser.Geom.Rectangle(clearButtonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
    
    this.clearButtonText = this.add.text(clearButtonX + buttonWidth/2, buttonY + buttonHeight/2, 'CLEAR', {
      fontSize: '24px', // Doubled from 12px
      color: '#ffffff'
    })
    this.clearButtonText.setOrigin(0.5)
    this.clearButtonText.setDepth(1001)
    
    // Import button - anchored to UI camera
    const importButtonX = clearButtonX + buttonWidth + 10
    const importButton = this.add.graphics()
    importButton.fillStyle(0x0066aa)
    importButton.fillRoundedRect(importButtonX, buttonY, buttonWidth, buttonHeight, 3)
    importButton.setDepth(1000)
    importButton.setInteractive(new Phaser.Geom.Rectangle(importButtonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
    
    const importButtonText = this.add.text(importButtonX + buttonWidth/2, buttonY + buttonHeight/2, 'IMPORT', {
      fontSize: '24px',
      color: '#ffffff'
    })
    importButtonText.setOrigin(0.5)
    importButtonText.setDepth(1001)
    
    // Import button click handler
    importButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      this.promptForImport()
    })
    
    // Rename button - anchored to UI camera (positioned next to import button)
    const renameButtonX = importButtonX + buttonWidth + 10
    this.renameButton = this.add.graphics()
    this.renameButton.fillStyle(0xaa6600)
    this.renameButton.fillRoundedRect(renameButtonX, buttonY, buttonWidth, buttonHeight, 3)
    this.renameButton.setDepth(1000)
    this.renameButton.setInteractive(new Phaser.Geom.Rectangle(renameButtonX, buttonY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
    this.renameButton.setVisible(false) // Hidden by default
    
    this.renameButtonText = this.add.text(renameButtonX + buttonWidth/2, buttonY + buttonHeight/2, 'RENAME', {
      fontSize: '24px',
      color: '#ffffff'
    })
    this.renameButtonText.setOrigin(0.5)
    this.renameButtonText.setDepth(1001)
    this.renameButtonText.setVisible(false) // Hidden by default
    
    // Rename button click handler
    this.renameButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      if (this.selectedBox) {
        this.startRenaming(this.selectedBox)
      }
    })
    
    // Add hover effects to rename button
    this.renameButton.on('pointerover', () => {
      this.renameButton.clear()
      this.renameButton.fillStyle(0xcc8800) // Lighter orange on hover
      this.renameButton.fillRoundedRect(renameButtonX, buttonY, buttonWidth, buttonHeight, 3)
    })
    
    this.renameButton.on('pointerout', () => {
      this.renameButton.clear()
      this.renameButton.fillStyle(0xaa6600) // Original orange
      this.renameButton.fillRoundedRect(renameButtonX, buttonY, buttonWidth, buttonHeight, 3)
    })
    
    // Export button click handler
    this.exportButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      this.exportCollisionBoxes()
    })
    
    // Clear button click handler
    this.clearButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      this.clearAllBoxes()
    })
    
    // UI elements array for camera management
    const uiElements = [
      this.instructionsText,
      this.exportButton,
      this.exportButtonText,
      this.clearButton,
      this.clearButtonText,
      importButton,
      importButtonText,
      this.renameButton,
      this.renameButtonText
    ]
    
    // Make UI camera ignore world objects (grid, collision boxes, etc.)
    this.uiCamera.ignore(this.worldObjects)
    
    // Make main camera ignore UI elements
    this.cameras.main.ignore(uiElements)
    
    // Add debug info to verify positioning


  }

  private createNavigationButtons() {
    const buttonY = this.scale.height * 0.85
    const buttonSize = 50

    // Previous page button
    this.prevPageButton = this.add.graphics()
    this.prevPageButton.fillStyle(0x8B4513, 0.8)
    this.prevPageButton.fillCircle(this.scale.width * 0.2, buttonY, buttonSize / 2)
    this.prevPageButton.setDepth(1003)
    this.prevPageButton.setInteractive({
      hitArea: new Phaser.Geom.Circle(this.scale.width * 0.2, buttonY, buttonSize / 2),
      hitAreaCallback: Phaser.Geom.Circle.Contains
    })
    this.prevPageButton.setVisible(false)

    // Add arrow text for previous
    const prevArrow = this.add.text(this.scale.width * 0.2, buttonY, '◀', {
      fontSize: '24px',
      color: '#ffffff'
    })
    prevArrow.setOrigin(0.5)
    prevArrow.setDepth(1004)
    this.pageContainer.add(prevArrow)

    // Next page button
    this.nextPageButton = this.add.graphics()
    this.nextPageButton.fillStyle(0x8B4513, 0.8)
    this.nextPageButton.fillCircle(this.scale.width * 0.8, buttonY, buttonSize / 2)
    this.nextPageButton.setDepth(1003)
    this.nextPageButton.setInteractive({
      hitArea: new Phaser.Geom.Circle(this.scale.width * 0.8, buttonY, buttonSize / 2),
      hitAreaCallback: Phaser.Geom.Circle.Contains
    })
    this.nextPageButton.setVisible(false)

    // Add arrow text for next
    const nextArrow = this.add.text(this.scale.width * 0.8, buttonY, '▶', {
      fontSize: '24px',
      color: '#ffffff'
    })
    nextArrow.setOrigin(0.5)
    nextArrow.setDepth(1004)
    this.pageContainer.add(nextArrow)

    // Button click handlers
    this.prevPageButton.on('pointerdown', () => this.previousPage())
    this.nextPageButton.on('pointerdown', () => this.nextPage())

    // Add to page container so they hide/show with the book
    this.pageContainer.add([this.prevPageButton, this.nextPageButton])
  }

  private createCloseButton() {
    this.closeButton = this.add.graphics()
    this.closeButton.fillStyle(0xaa0000, 0.8)
    this.closeButton.fillCircle(this.scale.width - 50, 50, 25)
    this.closeButton.setDepth(1003)
    this.closeButton.setInteractive({
      hitArea: new Phaser.Geom.Circle(this.scale.width - 50, 50, 25),
      hitAreaCallback: Phaser.Geom.Circle.Contains
    })
    this.closeButton.setVisible(false)

    // Add X text
    const closeX = this.add.text(this.scale.width - 50, 50, '✕', {
      fontSize: '20px',
      color: '#ffffff'
    })
    closeX.setOrigin(0.5)
    closeX.setDepth(1004)
    this.pageContainer.add(closeX)

    this.closeButton.on('pointerdown', () => this.closeBook())
    this.pageContainer.add(this.closeButton)
  }

  private setupInputHandlers() {
    // Mouse input handlers
    this.input.on('pointerdown', this.onPointerDown, this)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup', this.onPointerUp, this)
    
    // Mouse wheel for zooming
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom * zoomFactor, 0.1, 3)
      this.cameras.main.setZoom(newZoom)
    })
    
    // Keyboard input for closing editor
    this.input.keyboard!.on('keydown-ESC', () => {
      this.closeEditor()
    })
    
    this.input.keyboard!.on('keydown-F9', () => {
      this.closeEditor()
    })
  }

  private setupCameraControls() {
    // WASD camera movement
    const cursors = this.input.keyboard!.createCursorKeys()
    const wasd = this.input.keyboard!.addKeys('W,S,A,D')
    
    // Camera movement speed
    const cameraSpeed = 5
    
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          this.cameras.main.scrollY -= cameraSpeed
          break
        case 'KeyS':
          this.cameras.main.scrollY += cameraSpeed
          break
        case 'KeyA':
          this.cameras.main.scrollX -= cameraSpeed
          break
        case 'KeyD':
          this.cameras.main.scrollX += cameraSpeed
          break
      }
    })
  }

  private promptForImport() {
    const jsonData = prompt('Paste collision boxes JSON data:')
    if (jsonData) {
      this.importCollisionBoxes(jsonData)
    }
  }

  private closeEditor() {
    // Apply all changes to game objects before closing
    this.applyChangesToGameObjects()
    
    // Resume the game scene and stop this editor
    this.scene.resume('Game')
    this.scene.stop()
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    // Check if clicking on UI buttons first - use screen coordinates
    const gameWidth = this.sys.game.config.width as number
    const gameHeight = this.sys.game.config.height as number
    const buttonY = gameHeight - 45
    const buttonWidth = 80
    const buttonHeight = 30
    const margin = 5
    const clearButtonX = margin + buttonWidth + 10
    const importButtonX = clearButtonX + buttonWidth + 10
    const renameButtonX = importButtonX + buttonWidth + 10
    
    // Check if clicking on export button (screen coordinates, not world coordinates)
    if (pointer.x >= margin && pointer.x <= margin + buttonWidth &&
        pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
      return // Don't process further
    }
    
    // Check if clicking on clear button (screen coordinates, not world coordinates)
    if (pointer.x >= clearButtonX && pointer.x <= clearButtonX + buttonWidth &&
        pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
      return // Don't process further
    }
    
    // Check if clicking on import button (screen coordinates, not world coordinates)
    if (pointer.x >= importButtonX && pointer.x <= importButtonX + buttonWidth &&
        pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
      return // Don't process further
    }
    
    // Check if clicking on rename button (screen coordinates, not world coordinates)
    if (this.renameButton.visible && 
        pointer.x >= renameButtonX && pointer.x <= renameButtonX + buttonWidth &&
        pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
      // Handle rename button click directly here
      if (this.selectedBox) {
        this.startRenaming(this.selectedBox)
      }
      return // Don't process further
    }
    
    // For world interactions, convert to world coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    
    if (pointer.rightButtonDown()) {
      // Right click - delete box (but not game object boxes)
      const box = this.getBoxAtPosition(worldPoint.x, worldPoint.y)
      if (box && !box.isGameObject) {
        this.deleteBox(box)
      }
      return
    }
    
    // Check for double-click to delete box
    if (pointer.getDuration() < 300 && pointer.event.detail === 2) {
      const box = this.getBoxAtPosition(worldPoint.x, worldPoint.y)
      if (box && !box.isGameObject) {
        this.deleteBox(box)
        return
      }
    }
    
    // Check if clicking on a resize handle
    const handleInfo = this.getResizeHandleAtPosition(worldPoint.x, worldPoint.y)
    if (handleInfo) {
      this.selectedBox = handleInfo.box
      this.isResizing = true
      this.resizeHandle = handleInfo.handle
      this.dragStartX = worldPoint.x
      this.dragStartY = worldPoint.y
      this.updateBoxSelection()
      return
    }
    
    // Check if clicking on an existing box
    const box = this.getBoxAtPosition(worldPoint.x, worldPoint.y)
    if (box) {
      this.selectedBox = box
      this.isDragging = true
      
      // Check if SHIFT is held for relative dragging
      const shiftKey = this.input.keyboard!.addKey('SHIFT')
      if (shiftKey.isDown && box.isGameObject) {
        this.isRelativeDragging = true
        // For relative dragging, store offset from box position
        this.dragStartX = worldPoint.x - box.x
        this.dragStartY = worldPoint.y - box.y
      } else {
        this.isRelativeDragging = false
        // For normal dragging, store offset from box position
        this.dragStartX = worldPoint.x - box.x
        this.dragStartY = worldPoint.y - box.y
      }
      
      this.updateBoxSelection()
      return
    }
    
    // Create new box (only if not clicking on a game object box)
    this.createBox(worldPoint.x, worldPoint.y)
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    
    if (this.isDragging && this.selectedBox) {
      // Move the selected box
      this.selectedBox.x = worldPoint.x - this.dragStartX
      this.selectedBox.y = worldPoint.y - this.dragStartY
      this.updateBoxGraphics(this.selectedBox)
      
      // Update game object position if not in relative dragging mode
      if (!this.isRelativeDragging) {
        this.updateGameObjectFromBox(this.selectedBox)
      }
    } else if (this.isResizing && this.selectedBox) {
      // Resize the selected box
      this.resizeBox(this.selectedBox, worldPoint.x, worldPoint.y)
      
      // Update game object size
      this.updateGameObjectFromBox(this.selectedBox)
    } else {
      // Handle hover effects for tooltip
      const hoveredBox = this.getBoxAtPosition(worldPoint.x, worldPoint.y)
      if (hoveredBox !== this.hoveredBox) {
        this.hoveredBox = hoveredBox
        if (hoveredBox) {
          this.showTooltip(hoveredBox, pointer.x, pointer.y)
        } else {
          this.hideTooltip()
        }
      } else if (hoveredBox) {
        // Update tooltip position if still hovering over the same box
        this.updateTooltipPosition(pointer.x, pointer.y)
      }
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.isDragging && this.selectedBox && this.isRelativeDragging) {
      // Apply relative position change to game object
      this.updateGameObjectFromBox(this.selectedBox)
    }
    
    this.isDragging = false
    this.isResizing = false
    this.isRelativeDragging = false
    this.resizeHandle = -1
  }

  private showTooltip(box: CollisionBox, screenX: number, screenY: number) {
    if (!this.tooltip) return
    
    const info = [
      `ID: ${box.id}`,
      `Name: ${box.customName || 'Unnamed'}`,
      `Position: (${Math.round(box.x)}, ${Math.round(box.y)})`,
      `Size: ${Math.round(box.width)} x ${Math.round(box.height)}`,
      `Type: ${box.isGameObject ? 'Game Object' : 'Custom'}`
    ]
    
    if (box.isGameObject && box.gameObject) {
      info.push(`Object: ${box.gameObject.constructor.name}`)
    }
    
    this.tooltipText.setText(info.join('\n'))
    
    // Update tooltip background size
    const textBounds = this.tooltipText.getBounds()
    this.tooltipBackground.clear()
    this.tooltipBackground.fillStyle(0x000000, 0.8)
    this.tooltipBackground.fillRoundedRect(-8, -8, textBounds.width + 16, textBounds.height + 16, 4)
    
    // Position tooltip near cursor but keep it on screen
    const gameWidth = this.sys.game.config.width as number
    const gameHeight = this.sys.game.config.height as number
    
    let tooltipX = screenX + 15
    let tooltipY = screenY - 10
    
    // Keep tooltip on screen
    if (tooltipX + textBounds.width + 16 > gameWidth) {
      tooltipX = screenX - textBounds.width - 25
    }
    if (tooltipY - textBounds.height - 16 < 0) {
      tooltipY = screenY + 25
    }
    
    this.tooltip.setPosition(tooltipX, tooltipY)
    this.tooltip.setVisible(true)
  }

  private updateTooltipPosition(screenX: number, screenY: number) {
    if (!this.tooltip || !this.tooltip.visible) return
    
    const textBounds = this.tooltipText.getBounds()
    const gameWidth = this.sys.game.config.width as number
    const gameHeight = this.sys.game.config.height as number
    
    let tooltipX = screenX + 15
    let tooltipY = screenY - 10
    
    // Keep tooltip on screen
    if (tooltipX + textBounds.width + 16 > gameWidth) {
      tooltipX = screenX - textBounds.width - 25
    }
    if (tooltipY - textBounds.height - 16 < 0) {
      tooltipY = screenY + 25
    }
    
    this.tooltip.setPosition(tooltipX, tooltipY)
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.tooltip.setVisible(false)
    }
    this.hoveredBox = null
  }
}
