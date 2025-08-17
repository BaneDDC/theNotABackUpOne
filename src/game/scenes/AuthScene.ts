import { Scene } from "phaser";
import { AuthService } from "../../services/AuthService";

export class AuthScene extends Scene {
  private authService: AuthService;
  private backgroundImage!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Text;
  private loginButton!: Phaser.GameObjects.Text;
  private registerButton!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;
  private usernameInput!: Phaser.GameObjects.DOMElement;
  private passwordInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super("AuthScene");
    this.authService = AuthService.getInstance();
  }

  create() {
    // Create background
    this.createBackground();
    
    // Check if user is already authenticated
    this.checkAuthentication();
    
    // Create UI elements
    this.createUI();
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

    // Title
    this.title = this.add.text(centerX, centerY - 200, 'GAME LOGIN', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

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

    this.usernameInput = this.add.dom(centerX, centerY - 100, usernameInputElement).setDepth(2);

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

    this.passwordInput = this.add.dom(centerX, centerY - 40, passwordInputElement).setDepth(2);

    // Login Button
    this.loginButton = this.add.text(centerX, centerY + 20, 'LOGIN', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setInteractive().setDepth(2);

    // Register Button
    this.registerButton = this.add.text(centerX, centerY + 80, 'REGISTER', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#009900',
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setInteractive().setDepth(2);

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
      this.loginButton.setBackgroundColor('#0088ff');
      this.input.setDefaultCursor('pointer');
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.setBackgroundColor('#0066cc');
      this.input.setDefaultCursor('default');
    });

    this.loginButton.on('pointerdown', () => {
      this.handleLogin();
    });

    // Register button
    this.registerButton.on('pointerover', () => {
      this.registerButton.setBackgroundColor('#00bb00');
      this.input.setDefaultCursor('pointer');
    });

    this.registerButton.on('pointerout', () => {
      this.registerButton.setBackgroundColor('#009900');
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
