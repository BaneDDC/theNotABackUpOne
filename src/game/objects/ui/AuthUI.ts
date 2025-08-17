import { Scene } from 'phaser'
import { AuthService } from '../../../services/AuthService'

export class AuthUI {
  private scene: Scene
  private authService: AuthService
  private container: Phaser.GameObjects.Container
  private isVisible: boolean = false

  // UI Elements
  private background: Phaser.GameObjects.Rectangle
  private title: Phaser.GameObjects.Image
  private usernameInput: Phaser.GameObjects.DOMElement
  private passwordInput: Phaser.GameObjects.DOMElement
  private loginButton: Phaser.GameObjects.Image
  private registerButton: Phaser.GameObjects.Image
  private errorText: Phaser.GameObjects.Text
  private loadingText: Phaser.GameObjects.Text

  constructor(scene: Scene) {
    this.scene = scene
    this.authService = AuthService.getInstance()
    this.container = scene.add.container(0, 0)
    
    // Load the UI images and wait for them to complete
    this.loadUIImages()
  }

  private loadUIImages(): void {
    // Load the title and button images from jsDelivr CDN
    this.scene.load.image('portal-title', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/portal.png')
    this.scene.load.image('login-button', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/login.png')
    this.scene.load.image('register-button', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/reg.png')
    
    // Wait for the images to load before creating UI
    this.scene.load.once('complete', () => {
      try {
        this.createUI()
        this.hide()
      } catch (error) {
        console.error('Error creating AuthUI:', error)
        // Fallback: create a simple text-based login if DOM fails
        this.createFallbackUI()
      }
    })
    
    this.scene.load.start()
  }

  private createUI(): void {
    const centerX = this.scene.cameras.main.width / 2
    const centerY = this.scene.cameras.main.height / 2

    // Background
    this.background = this.scene.add.rectangle(centerX, centerY, 400, 500, 0x000000, 0.8)
    this.background.setStrokeStyle(2, 0xffffff)

    // Title - Using Portal Access Alert image from jsDelivr CDN
    this.title = this.scene.add.image(centerX, centerY - 180, 'portal-title')
    this.title.setScale(0.3) // Scale down to fit UI
    this.title.setOrigin(0.5)

    // Username Input
    const usernameInputElement = document.createElement('input')
    usernameInputElement.type = 'text'
    usernameInputElement.placeholder = 'Username'
    usernameInputElement.style.width = '300px'
    usernameInputElement.style.height = '40px'
    usernameInputElement.style.fontSize = '16px'
    usernameInputElement.style.padding = '8px'
    usernameInputElement.style.border = '2px solid #ffffff'
    usernameInputElement.style.borderRadius = '5px'
    usernameInputElement.style.backgroundColor = '#000000'
    usernameInputElement.style.color = '#ffffff'
    usernameInputElement.style.textAlign = 'center'

    this.usernameInput = this.scene.add.dom(centerX, centerY - 60, usernameInputElement)

    // Password Input
    const passwordInputElement = document.createElement('input')
    passwordInputElement.type = 'password'
    passwordInputElement.placeholder = 'Password'
    passwordInputElement.style.width = '300px'
    passwordInputElement.style.height = '40px'
    passwordInputElement.style.fontSize = '16px'
    passwordInputElement.style.padding = '8px'
    passwordInputElement.style.border = '2px solid #ffffff'
    passwordInputElement.style.borderRadius = '5px'
    passwordInputElement.style.backgroundColor = '#000000'
    passwordInputElement.style.color = '#ffffff'
    passwordInputElement.style.textAlign = 'center'

    this.passwordInput = this.scene.add.dom(centerX, centerY, passwordInputElement)

    // Login Button - Using image from jsDelivr CDN
    this.loginButton = this.scene.add.image(centerX, centerY + 80, 'login-button')
    this.loginButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.loginButton.setInteractive()

    // Register Button - Using image from jsDelivr CDN
    this.registerButton = this.scene.add.image(centerX, centerY + 160, 'register-button')
    this.registerButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.registerButton.setInteractive()

    // Error Text
    this.errorText = this.scene.add.text(centerX, centerY + 140, '', {
      fontSize: '16px',
      color: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Loading Text
    this.loadingText = this.scene.add.text(centerX, centerY + 180, '', {
      fontSize: '16px',
      color: '#ffff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Add all elements to container
    this.container.add([
      this.background,
      this.title,
      this.usernameInput,
      this.passwordInput,
      this.loginButton,
      this.registerButton,
      this.errorText,
      this.loadingText
    ])

    // Set up interactions
    this.setupInteractions()
  }

  private setupInteractions(): void {
    // Login button
    this.loginButton.on('pointerover', () => {
      this.loginButton.setTint(0x88ccff); // Light blue tint on hover
      this.scene.input.setDefaultCursor('pointer');
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.clearTint(); // Remove tint on hover out
      this.scene.input.setDefaultCursor('default');
    });

    this.loginButton.on('pointerdown', () => {
      this.handleLogin()
    })

    // Register button
    this.registerButton.on('pointerover', () => {
      this.registerButton.setTint(0x88ff88); // Light green tint on hover
      this.scene.input.setDefaultCursor('pointer');
    });

    this.registerButton.on('pointerout', () => {
      this.registerButton.clearTint(); // Remove tint on hover out
      this.scene.input.setDefaultCursor('default');
    });

    this.registerButton.on('pointerdown', () => {
      this.handleRegister()
    })

    // Enter key on inputs
    const usernameElement = this.usernameInput.node as HTMLInputElement
    const passwordElement = this.passwordInput.node as HTMLInputElement

    usernameElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    })

    passwordElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    })
  }

  private async handleLogin(): Promise<void> {
    const username = (this.usernameInput.node as HTMLInputElement).value.trim()
    const password = (this.passwordInput.node as HTMLInputElement).value.trim()

    if (!username || !password) {
      this.showError('Please enter both username and password')
      return
    }

    this.showLoading('Logging in...')
    this.hideError()

    const result = await this.authService.loginUser(username, password)

    if (result.success) {
      this.showLoading('Login successful!')
      this.scene.time.delayedCall(1000, () => {
        this.hide()
        this.scene.events.emit('auth:loginSuccess')
      })
    } else {
      this.hideLoading()
      this.showError(result.error || 'Login failed')
    }
  }

  private async handleRegister(): Promise<void> {
    const username = (this.usernameInput.node as HTMLInputElement).value.trim()
    const password = (this.passwordInput.node as HTMLInputElement).value.trim()

    if (!username || !password) {
      this.showError('Please enter both username and password')
      return
    }

    if (username.length < 3) {
      this.showError('Username must be at least 3 characters')
      return
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters')
      return
    }

    this.showLoading('Creating account...')
    this.hideError()

    const result = await this.authService.registerUser(username, password)

    if (result.success) {
      this.showLoading('Account created!')
      this.scene.time.delayedCall(1000, () => {
        this.hide()
        this.scene.events.emit('auth:registerSuccess')
      })
    } else {
      this.hideLoading()
      this.showError(result.error || 'Registration failed')
    }
  }

  private showError(message: string): void {
    this.errorText.setText(message)
  }

  private hideError(): void {
    this.errorText.setText('')
  }

  private showLoading(message: string): void {
    this.loadingText.setText(message)
  }

  private hideLoading(): void {
    this.loadingText.setText('')
  }

  public show(): void {
    this.container.setVisible(true)
    this.isVisible = true
    
    // Focus on username input
    const usernameElement = this.usernameInput.node as HTMLInputElement
    usernameElement.focus()
  }

  public hide(): void {
    this.container.setVisible(false)
    this.isVisible = false
    this.hideError()
    this.hideLoading()
    
    // Clear inputs
    const usernameElement = this.usernameInput.node as HTMLInputElement
    const passwordElement = this.passwordInput.node as HTMLInputElement
    usernameElement.value = ''
    passwordElement.value = ''
  }

  public isUIVisible(): boolean {
    return this.isVisible
  }

  public destroy(): void {
    this.container.destroy()
  }

  private createFallbackUI(): void {
    const centerX = this.scene.cameras.main.width / 2
    const centerY = this.scene.cameras.main.height / 2

    // Simple fallback UI without DOM elements
    this.background = this.scene.add.rectangle(centerX, centerY, 400, 500, 0x000000, 0.8)
    this.background.setStrokeStyle(2, 0xffffff)

    this.title = this.scene.add.image(centerX, centerY - 180, 'portal-title')
    this.title.setScale(0.3) // Scale down to fit UI
    this.title.setOrigin(0.5)

    this.loginButton = this.scene.add.image(centerX, centerY + 80, 'login-button')
    this.loginButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.loginButton.setInteractive()

    this.registerButton = this.scene.add.image(centerX, centerY + 160, 'register-button')
    this.registerButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.registerButton.setInteractive()

    this.errorText = this.scene.add.text(centerX, centerY + 140, 'DOM elements not available. Please use a modern browser.', {
      fontSize: '16px',
      color: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.container.add([
      this.background,
      this.title,
      this.loginButton,
      this.registerButton,
      this.errorText
    ])

    // Set up basic interactions
    this.loginButton.on('pointerover', () => {
      this.loginButton.setTint(0x88ccff); // Light blue tint on hover
      this.scene.input.setDefaultCursor('pointer');
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.clearTint(); // Remove tint on hover out
      this.scene.input.setDefaultCursor('default');
    });

    this.loginButton.on('pointerdown', () => {
      this.showError('DOM login not available. Please use a modern browser.')
    })

    this.registerButton.on('pointerover', () => {
      this.registerButton.setTint(0x88ff88); // Light green tint on hover
      this.scene.input.setDefaultCursor('pointer');
    });

    this.registerButton.on('pointerout', () => {
      this.registerButton.clearTint(); // Remove tint on hover out
      this.scene.input.setDefaultCursor('default');
    });

    this.registerButton.on('pointerdown', () => {
      this.showError('DOM registration not available. Please use a modern browser.')
    })
  }
}
