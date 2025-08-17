import { Scene } from "phaser";
import { AuthService } from "../../services/AuthService";

export class AuthScene extends Scene {
  private authService: AuthService;
  private backgroundImage!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Image;
  private loginButton!: Phaser.GameObjects.Image;
  private registerButton!: Phaser.GameObjects.Image;
  private errorText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;
  private usernameInput!: Phaser.GameObjects.DOMElement;
  private passwordInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super("AuthScene");
    this.authService = AuthService.getInstance();
  }

  create() {
    // Load the UI images and wait for them to complete
    this.loadUIImages();
  }

  private loadUIImages(): void {
    // Load the title and button images from jsDelivr CDN
    this.load.image('portal-title', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/portal.png')
    this.load.image('login-button', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/login.png')
    this.load.image('register-button', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/reg.png')
    
    // Wait for the images to load before creating UI
    this.load.once('complete', () => {
      // Create background
      this.createBackground();
      
      // Check if user is already authenticated
      this.checkAuthentication();
      
      // Create UI elements
      this.createUI();
    })
    
    this.load.start()
  }

  private createBackground() {
    // Create the background image
    if (this.textures.exists('newmenu')) {
      this.backgroundImage = this.add.image(
        this.scale.width / 2, 
        this.scale.height / 2, 
        'newmenu'
      );
      this.backgroundImage.setDisplaySize(this.scale.width, this.scale.height);
      this.backgroundImage.setDepth(0);
    } else {
      // Fallback background
      this.add.rectangle(
        this.scale.width / 2, 
        this.scale.height / 2, 
        this.scale.width, 
        this.scale.height, 
        0x2c3e50
      );
    }
  }

  private async checkAuthentication() {
    try {
      const isAuthenticated = await this.authService.isAuthenticated();
      if (isAuthenticated) {
        // User is already logged in, go directly to main menu
        this.scene.start('MainMenu');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  }

  private createUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create dark overlay
    const darkOverlay = this.add.rectangle(
      centerX, 
      centerY, 
      this.scale.width, 
      this.scale.height, 
      0x000000, 
      0.7
    );
    darkOverlay.setDepth(1);

    // Title - Using Portal Access Alert image from jsDelivr CDN
    this.title = this.add.image(centerX, centerY - 180, 'portal-title').setDepth(2);
    this.title.setScale(0.3) // Scale down to fit UI
    this.title.setOrigin(0.5);

    // Username Input
    const usernameInputElement = document.createElement('input');
    usernameInputElement.type = 'text';
    usernameInputElement.placeholder = 'Username';
    usernameInputElement.style.width = '300px';
    usernameInputElement.style.height = '40px';
    usernameInputElement.style.fontSize = '16px';
    usernameInputElement.style.padding = '8px';
    usernameInputElement.style.border = '2px solid #ffffff';
    usernameInputElement.style.borderRadius = '5px';
    usernameInputElement.style.backgroundColor = '#000000';
    usernameInputElement.style.color = '#ffffff';
    usernameInputElement.style.textAlign = 'center';

    this.usernameInput = this.add.dom(centerX, centerY - 60, usernameInputElement).setDepth(2);

    // Password Input
    const passwordInputElement = document.createElement('input');
    passwordInputElement.type = 'password';
    passwordInputElement.placeholder = 'Password';
    passwordInputElement.style.width = '300px';
    passwordInputElement.style.height = '40px';
    passwordInputElement.style.fontSize = '16px';
    passwordInputElement.style.padding = '8px';
    passwordInputElement.style.border = '2px solid #ffffff';
    passwordInputElement.style.borderRadius = '5px';
    passwordInputElement.style.backgroundColor = '#000000';
    passwordInputElement.style.color = '#ffffff';
    passwordInputElement.style.textAlign = 'center';

    this.passwordInput = this.add.dom(centerX, centerY, passwordInputElement).setDepth(2);

    // Login Button - Using image from jsDelivr CDN
    this.loginButton = this.add.image(centerX, centerY + 80, 'login-button').setDepth(2);
    this.loginButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.loginButton.setInteractive();

    // Register Button - Using image from jsDelivr CDN
    this.registerButton = this.add.image(centerX, centerY + 160, 'register-button').setDepth(2);
    this.registerButton.setScale(0.15) // Scale down from 1024x1024 to fit UI
    this.registerButton.setInteractive();

    // Error Text
    this.errorText = this.add.text(centerX, centerY + 140, '', {
      fontSize: '18px',
      color: '#ff0000',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(2);

    // Loading Text
    this.loadingText = this.add.text(centerX, centerY + 180, '', {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(2);

    // Set up interactions
    this.setupInteractions();

    // Focus on username input
    const usernameElement = this.usernameInput.node as HTMLInputElement;
    usernameElement.focus();
  }

  private setupInteractions() {
    // Login button
    this.loginButton.on('pointerover', () => {
      this.loginButton.setTint(0x88ccff); // Light blue tint on hover
      this.input.setDefaultCursor('pointer');
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.clearTint(); // Remove tint on hover out
      this.input.setDefaultCursor('default');
    });

    this.loginButton.on('pointerdown', () => {
      this.handleLogin();
    });

    // Register button
    this.registerButton.on('pointerover', () => {
      this.registerButton.setTint(0x88ff88); // Light green tint on hover
      this.input.setDefaultCursor('pointer');
    });

    this.registerButton.on('pointerout', () => {
      this.registerButton.clearTint(); // Remove tint on hover out
      this.input.setDefaultCursor('default');
    });

    this.registerButton.on('pointerdown', () => {
      this.handleRegister();
    });

    // Enter key on inputs
    const usernameElement = this.usernameInput.node as HTMLInputElement;
    const passwordElement = this.passwordInput.node as HTMLInputElement;

    usernameElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });

    passwordElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  private async handleLogin() {
    const username = (this.usernameInput.node as HTMLInputElement).value.trim();
    const password = (this.passwordInput.node as HTMLInputElement).value.trim();

    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }

    this.showLoading('Logging in...');
    this.hideError();

    const result = await this.authService.loginUser(username, password);

         if (result.success) {
       this.showLoading('Login successful!');
       this.time.delayedCall(1000, () => {
         this.scene.start('MainMenu');
       });
     } else {
      this.hideLoading();
      this.showError(result.error || 'Login failed');
    }
  }

  private async handleRegister() {
    const username = (this.usernameInput.node as HTMLInputElement).value.trim();
    const password = (this.passwordInput.node as HTMLInputElement).value.trim();

    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }

    if (username.length < 3) {
      this.showError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    this.showLoading('Creating account...');
    this.hideError();

    const result = await this.authService.registerUser(username, password);

         if (result.success) {
       this.showLoading('Account created!');
       this.time.delayedCall(1000, () => {
         this.scene.start('MainMenu');
       });
     } else {
      this.hideLoading();
      this.showError(result.error || 'Registration failed');
    }
  }

  private showError(message: string) {
    this.errorText.setText(message);
  }

  private hideError() {
    this.errorText.setText('');
  }

  private showLoading(message: string) {
    this.loadingText.setText(message);
  }

  private hideLoading() {
    this.loadingText.setText('');
  }
}
