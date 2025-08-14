// src/game/scenes/Loading.ts

import { Scene } from "phaser";

export class Loading extends Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingBarBg!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private currentFileText!: Phaser.GameObjects.Text;
  private isLoadingComplete: boolean = false;
  private totalAssets: number = 0;

  constructor() {
    super("Loading");
  }

  preload() {
    // Create loading UI
    this.createLoadingUI();
    
    // Load all assets
    this.loadAllAssets();
    this.setupLoadingEvents();
    
    // Start the loader
    this.load.start();
  }

  create() {
    // Assets are loaded in preload, so we can proceed to main menu
    this.scene.start('MainMenu');
  }

  private createLoadingUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create background
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x2c3e50);

    // Title
    const title = this.add.text(centerX, centerY - 150, "TOILET MERGE GAME", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);

    // Loading bar background
    this.loadingBarBg = this.add.graphics();
    this.loadingBarBg.fillStyle(0x34495e);
    this.loadingBarBg.fillRoundedRect(centerX - 200, centerY - 20, 400, 40, 10);

    // Loading bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 60, "Loading... 0%", {
      fontSize: "24px",
      color: "#ffffff"
    });
    this.loadingText.setOrigin(0.5);

    // Current file text
    this.currentFileText = this.add.text(centerX, centerY + 40, "", {
      fontSize: "16px",
      color: "#bdc3c7",
      wordWrap: { width: 600 }
    });
    this.currentFileText.setOrigin(0.5);
  }

  private loadAllAssets() {
    // Count total assets for progress calculation
    this.totalAssets = this.getTotalAssetCount();

    // Load all assets in one go
    this.loadCriticalAssets();
    this.loadNonCriticalAssets();
  }

  private loadCriticalAssets() {
    // Load essential UI and gameplay assets first
    this.load.image('newmenu', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/newmenu.png');
    this.load.audio('mainMenuMusic', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien.mp3');
    
    // Load essential gameplay assets
    this.load.image('toilet', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22toilet%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-IKQiDYjmgMvxEJRt3rMo6ThQDqBDua.%20strait%20foreward%20front%20to%20back%20view-1');
    this.load.image('plunger', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Plunger%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-bq6jyw6EYmsBI3to7wVAZCVSDwOQ6K.5d-2');
    this.load.image('sink', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22sink%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-IYyixzsfkoTJidTzy6KeYMMA0c9Plx.5d%0A-0');
    this.load.image('towel', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Towel%22%20hanging%20on%20a%20rack%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-rC0ib1ZmGm4LxGPUNb2RLZ7pob2pit.%20strait%20foreward%20view%20no%20face-2');
    
    // Load essential sounds
    this.load.audio('toiletFlush', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/foley-toilet-flush-without-tank-refill-238004-5QbPCVstF4Oln1bjmAlQVuNaOyf4fJ.mp3');
    this.load.audio('plungerSound', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/plunge1-41079-qDvqpVQX79raem2TiioLxoJI01dP5L.mp3');
    
    // Load essential spritesheets
    this.load.spritesheet('grabber', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/grabber-lUJTyIWnq9CjliEl5ja6cxUFIeG2LM.png', {
      frameWidth: 50,
      frameHeight: 50
    });
  }

  private loadNonCriticalAssets() {
    // Load the individual background images
    this.load.image('bg1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-1.png-omFNFdYBZKMrfkDnpNjBXNPBeqAMbN.png');
    this.load.image('bg2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-2.png-ZbNJ6RRWHIRiqlo7UeNZvEnAvS8zZj.png');
    this.load.image('bg3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-3.png-jl1Pr5ArmCzxO5XnkkPkEgO1ehf1pR.png');
    this.load.image('bg4', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51-4.png-P15Xly4Z8u95svzTGjGDQDvZGbz5Gd.png');
    
    // Load portal spritesheet
    this.load.spritesheet('portal', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal_spritesheet-tuu0GUj716OBvtpw0lhDcMaD1YrejO.png', {
      frameWidth: 256,
      frameHeight: 256
    });
    
    // Load new spritesheet
    this.load.spritesheet('newSprite', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-y325clor3k7sgl1z30ajwn51%20%281%29-N0k0h97JQbjHMn2B6KTIbbaVgcQR4M.png', {
      frameWidth: 114,
      frameHeight: 86
    });
    
    // Load all toilet sprites
    this.load.image('toilet1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-1.png-8FmoeG5xdeVd1DLEd8rZ3CEuVDPqeY.png');
    this.load.image('toilet2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-2.png-nkv4UxTBRWqW2lvAhqp0vAEh9tjYsv.png');
    this.load.image('toilet3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-3.png-5RKT6lEsgJeuptGRSEoGgpOeeiwiJQ.png');
    this.load.image('toilet4', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/generated-asset-otzan6hqekmr8y0mqte48xpc%20%281%29-4.png-JwdcykiV8cLm8DCbgkDHJWg2G8X7xN.png');
    
    // Load additional sounds
    this.load.audio('splash1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash1-ZhiBCgWV50qZwEnJcnc3xe0V8TXCJp.mp3');
    this.load.audio('splash2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash2-KQSUDmq8LUv7hxqEUEQXS93tBQXuqu.mp3');
    this.load.audio('splash3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/splash3-us9Pqt7kxSAJkVojZWspen5Dd1iUXb.mp3');
    
    // Load portal sounds
    this.load.audio('portal1', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal1-oYnuTCyji35ZDy5GNXT8QFa1gzeE13.mp3');
    this.load.audio('portal2', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/portal2-VHLGnHb9sSv51U9T7qzcddlzDALFF4.mp3');
    
    // Load hint sounds
    this.load.audio('yikes', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/yikes-Vi54H0vzUClhbpF8o9H8dQs1KbAQMt.mp3');
    this.load.audio('terrible', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/terrible-r7pofktgQpHBDrrsOJAkhT6gYK42Wl.mp3');
    this.load.audio('sureabout', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/sureabout-OckNxXUPEpxGUHlr9eVuZorydeSoHW.mp3');
    this.load.audio('embarass', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/embarass-mtE8FA0viKOZ0gp2tQzqnHCZj6RU8M.mp3');
    this.load.audio('seriously', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/seriously-c0ofIrFZLOjS2Jv5VlPRbFozZsvKvH.mp3');
    
    // Load first box opening sounds
    this.load.audio('howdy', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/howdy-B3wQyU3PlqpsVpOqgCJvrp3qAUzmjv.mp3');
    this.load.audio('batery', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/batery-4osiJ6F91TN3xl3NlKxquNxtqSWpiv.mp3');
    
    // Load tutorial sounds
    this.load.audio('flush', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/flush-ESL48SbyotvOLXGGXsrUaOtSxtPakz.mp3');
    this.load.audio('down', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/down-pBkY4fmuvCzL9QSt3q8zxKnD1Ge2BY.mp3');
    this.load.audio('here', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/here-VYs3SHqYwTKDKjGtk28MZ2z5cXnQW5.mp3');
    this.load.audio('return', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/return-ZLLbqsg0Cd1gKPqiE1QP5hwZx9H8b5.mp3');
    
    // Load game-over sound
    this.load.audio('gameover', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/game-over-man-game-over-mp3cut-5cRS5010WPIgNZKiMzBQNXAjIXjIzi.mp3');
    
    // Load box sounds
    this.load.audio('boxbounce', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxbounce-CVctuQ4XqRmZFvBYejFLF92hMC6OJL.mp3');
    this.load.audio('boxcrash', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxcrash-z6pe8NjOBPqjKDEjoghCzYTFFNGrxY.mp3');
    
    // Load sink and faucet
    this.load.image('sinkon', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/sinkon-sXqY1OiqMfj2aM5ImNfiLg1A32OqrU.webp');
    this.load.audio('faucet', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/faucet-7JzQkkQ2fVhfqqYYrEgN3MTS77Qvs8.mp3');
    
    // Load goo sounds
    this.load.audio('oozesplat', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/oozesplat-FmuPEVnMRszD4eIEGb3p060MqzCPFP.mp3');
    this.load.audio('ooze', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/ooze-eKJdjuPejyaPHzcEPOP7VwPhfssZx7.mp3');
    
    // Load toilet paper assets
    this.load.image('tpblink', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/tpblink-klxAZeU4J0dsOZt3UUIQyLwPbuAOin.webp');
    this.load.image('tp', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/tp-b7pUbOjci6HEDoUu6XqNg7kruvwZsa.png');
    
    // Load recycler assets
    this.load.image('trash_recycler', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recycler4-TXaXLDoHFjOCCWWV2axZvt5XEqx29n.png');
    this.load.image('recycler3', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recycler3-nOhNttyz6urdLhU3kBwz5py05YkW6w.png');
    
    // Load goomba asset
    this.load.image('goomba', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%2090s-00s%20rick%20and%20morty%20style%20%22Roomba%22%2C%20but%20its%20called%20instead%20a%20%22Goo-mba%22%20no%20shadow%2C%20no%20people%2C%20no%20background-1-none%20it%20should%20say%20Goo-mba%22%20on%20the%20side-h084Ya81JHMTp0gdSDhkqDHOFmcXNV.%20should%20have%20a%20capsule%20on%20top%20with%20a%20happy%20good%20guy%20inside-0');
    
    // Load recycler sound
    this.load.audio('recsound', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/recsound-HB8WEyVnRhp3Vmk6oZBtP11dpUVlLT.mp3');
    
    // Load jar of goo asset
    this.load.image('jar_of_goo', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22jar%20of%20goo%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-7IxyGZuzQ9NpAIh575MQQ22EEEg0QR.-3');
    
    // Load main menu music
    this.load.audio('mainMenuMusic', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/main-menu-music-8dSJiOFThHqPPI8SA8xCPqszPxAw4D.mp3');
    
    // Load item assets (basic ones)
    this.load.image('mop_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Mop%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-0Rllm47amMc5FJ1YYSVppCf8Q9yVnx.5d-0');
    this.load.image('loose_wires_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Loose%20Wires%22%20%20just%20a%20pile%20of%20wires%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-Dctj0vehiJJX4FhO2VEzZ6Prv6OnQU.5d-0');
    this.load.image('rubber_duck_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Rubber%20Duck%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-PvFuLRK9Kcr8se4WwSYmFuN2IHiklm.5d-0');
    this.load.image('sock_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Sock%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-CG0w8V233dGR4o0GCF9gIqlSUyBpQa.5d-0');
    this.load.image('duct_tape_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Duct%20Tape%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ANR9sRNgmHPIETmpkLzRwmGIHs3VYt.5d-2');
    this.load.image('toolkit_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22tool%20kit%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2X54S3bbRtpgilzkqU00fbE5q2Sjjm.5d-0');
    
    // Load additional item assets
    this.load.image('coolant_tank_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Coolant%20Tank%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-hD6ImhqB54Dmu1j2oBsyjTDYsVrsMn.5d%0A-2');
    this.load.image('screw_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22screw%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-EyHFsBrFmVc2xvpgUbrFwQ6LnfVD55.5d-3');
    this.load.image('wrench_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22wrench%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-vraJu89JpLdkyf9PTXQXrgjatOUwy2.5d-0');
    this.load.image('energy_canister_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Energy%20Canister%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ucTd6MToNY5lCli6MjfsanFwA3m9Mv.5d-1');
    this.load.image('goldfish_bowl_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Goldfish%20Bowl%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-sTCZ7zS4vPyvNMcLFTcB2UuydfxlWq.5d-0');
    this.load.image('portal_shard_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Portal%20Shard%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-A6dp5dm7mZIq1qN5jfjWa5MTfjWuLH.5d-0');
    this.load.image('battery_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-L6oEJkPsYhgclnv8Xw9FnK2Dw9tjPL.%20Rick%20and%20morty%20style%209%20volt%20battery%20no%20shadow%20no%20background-3');
    this.load.image('fuse_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22FUSE%22%20%28like%20one%20that%20goes%20in%20a%20car%5D%20no%20shadows%20no%20background-0-Sihn5vGQnoWdQmhlOFxnPBGZ2ogEeA');
    this.load.image('pipe_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-NAJhLYKrYJ9giJEhZgoVCYDVxzQYrq.%20Rick%20and%20morty%20style%20pipe%20%28like%20a%20lead%20pipe%29%20no%20shadows%20no%20background-3');
    this.load.image('ham_sandwich_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rotten%20ham%20sandwich%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-0-SrjJtTB5gpA1aBuhTynSK4ho6NBsz4');
    this.load.image('unstable_goo_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-5oZXl4wPh90INtS5kNdVu2y4Rd5dJE.%20Rick%20and%20morty%20style%20unstable%20goo%20no%20shadows%20no%20background-0');
    this.load.image('soggy_paper_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22soggy%20toilet%20paper%22%20no%20people%20no%20shadows%20no%20background-1-yoD6JHs5ll309taZtzMspYarAxlrcm');
    this.load.image('powered_wire_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20bundle%20of%20%22Powered%20Wire%22%20electric%20wires%20with%20arcs%20of%20lightning%20arcs%20no%20shadows%20no%20background-0-NVLAh9ZxGlhZzcmcYW7gM8NImUl3US');
    this.load.image('thors_plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22Shock%20Plunger%22%20a%20metal%20toilet%20plungers%20with%20electric%20arcs%20no%20shadows%20no%20background-3-T3NB9atfbZIGDiPymHCa4KhfowIqry');
    this.load.image('goo_splatter', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%20splatter%20of%20green%20goo%2C%20cartoonish-W0Mt5IcK1nXkRIovNFBL1di1KivaGP.%20It%20should%20look%20like%20it%20is%20on%20a%20flat%20surface%20below%20eye%20level%20in%20single%20point%20perspective-3');
    this.load.image('box_closed', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/box-IT6ZUgllN2DmODelgycfajoJdMD4Pn.png');
    this.load.image('box_open', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/boxopen-f6HGm3wgSIa7RZxKXYG5U5BsxyU6jm.png');
    this.load.image('fan_blade_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Fan%20Blade%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-KiTQpjpscu6qf12HqaP8K04JnPwF3y.5d-2');
    this.load.image('toilet_brush_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Brush%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-DHWilH7Hz2GgQJRwtgfyEuKTPFY0Pk.5d-0');
    this.load.image('toilet_paper_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Paper%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-SYJCbR1Py98sYB7Pw1VpaI0U0amrRA.5d-1');
    this.load.image('soap_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Soap%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-OSZesnJPp4UP0yLXcM8DIKcFUF0wkn.5d-0');
    this.load.image('bucket_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bucket%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6muHgpXHMdW2oMNtZReBU2GfxADs0S.5d-2');
    this.load.image('plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-9TGifL3Bo8Y1k2EJXnOaliJaEao7Po.%20Rick%20and%20morty%20style%20plunger%20with%20a%20face%20no%20shadow%20no%20ground%20no%20background-2');
    this.load.image('reinforced_plunger_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Reinforce%20Plunger%22%20%28pluger%20with%20armor%20on%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6bblSfdPhJOdQqAvi26p6t6vyExayW.5d-1-none-3');
    this.load.image('pipe_lance_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Pipe%20Lance%22%20%28a%20lead%20pipe%20with%20a%20lance%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2MHjaqFxlElBmHAuKVuStgy2HH5XEb.5d-1-none-1');
    this.load.image('bandaged_towel_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bandaged%20Towel%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-YP5h206K07saeIn2VOZInZ2wu4iPAh.5d-1-none-0');
    this.load.image('chilled_pipe_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-futuristic%2090s-00s%20rick%20and%20morty%20style%20%22chilled%20pipe%22%20%28lead%20pipe%20with%20Ice%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-g3Xs7K2p8p2hIuXiZuF82ZenRkdWAu.5d-1-none-0');
    this.load.image('coolant_bowl_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22coolant%20bowl%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ConqzoanzKvOqtUIYuh1IpeXlJlgf4.5d-1-none-3');
    this.load.image('improvised_screwdriver_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-rick%20and%20morty%20style%20broken%20butter%20knife%20no%20shadow-3-0Xl0u7DVsCHMUy64RWecJ2Vzhq4GQT');
    this.load.image('chilled_sock_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20green%20sock%20with%20ice%20on%20it%2C%20%22Chilled%20Sock%22%20no%20shadow-0-T1kIMKXLEYzb15vhVUWwOlL7xX45F5');
    this.load.image('wet_mop_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20%22Wet%20Mop%22%20it%20should%20look%20like%20it%20has%20PTSD%20no%20shadow-2-tKubw33lLArlbQfFgqmDTajINn0Bxp');
    this.load.image('interactive_mop_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/mop.webp');
    this.load.image('bubble_cyclone_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20%22Soap%20Bubble%20Tornado%22%20no%20shadow-0-4UTHwEkFSzCvi1w01nov6A1j6UNT1Q');
    this.load.image('wired_fuse_asset', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20Fuse%20in%20a%20wire%20harness%2C%20car%20style%20fuse%20no%20shadow%20no%20people%2C%20anthropomorphized-0-8AR8RFyG90HoD1AfpKUMBnI6fp3ovg');
    this.load.image('book_closed', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22bestiary%20book%22%20closed%2C%20%20no%20background%20no%20shadows-0-auUOBgFdket6BYZbF0UEYWGfkUujL6');
    this.load.image('book_open', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bestiaryopen-fm4h6KDMWUK1oywWIYryPTOXlyUKm0.png');
    
    // Load store assets
    this.load.image('radio', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/radio-8dSJiOFThHqPPI8SA8xCPqszPxAw4D.png');
    this.load.image('buy_now', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/buy%20now-OQBLCSY14iMvtbGEnOgx9miJ81zv3i.png');
    this.load.image('store', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/store-02cYnBbg16M9TP1mwNQJdnEXhXpPu5.png');
    this.load.audio('store', 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/store-tRd4akrIffWZH46ovmqTNlSWNUUeqY.mp3');
    
    // Load Boot2 assets (item textures)
    this.load.image('ion_sprayer_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/ion%20sprayer.webp');
    this.load.image('maintenance_halberd_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/maintenance%20halberd.webp');
    this.load.image('portal_key_beta_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20beta.webp');
    this.load.image('portal_key_alpha_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20alpha.webp');
    this.load.image('portal_access_token_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20access%20token.webp');
    this.load.image('boss_sigil_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/boss%20sigil.webp');
    this.load.image('containment_set_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20set.webp');
    this.load.image('containment_spear_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20spear.webp');
    this.load.image('cryo_pipe_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cryo%20pipe.webp');
    this.load.image('cryo_foam_cannon_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cyro%20foam%20cannon%20.webp');
    this.load.image('foam_blaster_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/foam%20blaster.webp');
    this.load.image('heated_pipe_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/heated%20pipe.webp');
    this.load.image('laser_duck_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/laser%20duck.webp');
    this.load.image('misting_fan_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/misting%20fan.webp');
    this.load.image('pipe_serpent_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/pipe%20serpent.webp');
    this.load.image('shocking_puddle_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/shocking%20puddle.webp');
    this.load.image('voltaic_wisp_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/voltaic%20wisp.webp');
    this.load.image('stun_lance_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stun%20lance.webp');
    this.load.image('static_sock_trap_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/static%20sock%20trap.webp');
    this.load.image('stasis_snare_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stasis%20snare.webp');
    this.load.image('stabilized_fuse_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stabilized%20fuse.webp');
    this.load.image('sanitation_maul_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/sanitation%20maul.webp');
    this.load.image('quack_of_doom_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/quack%20of%20doom.webp');
    this.load.image('power_coupler_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/power%20coupler.webp');
    this.load.image('steam_burst_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/steam%20burst.webp');
    this.load.image('coolant_spill_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/spilled%20coolant.webp');
    this.load.image('portal_slime_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20slime.webp');
    this.load.image('corrosive_bristles_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/corrosive%20bristles.webp');
  }

  private getTotalAssetCount(): number {
    // Count all assets being loaded
    let count = 0;
    
    // Critical assets
    count += 8; // newmenu, mainMenuMusic, toilet, plunger, sink, towel, grabber spritesheet, toiletFlush, plungerSound
    
    // Non-critical assets
    count += 4; // bg1, bg2, bg3, bg4
    count += 2; // portal spritesheet, newSprite spritesheet
    count += 4; // toilet1, toilet2, toilet3, toilet4
    count += 3; // splash1, splash2, splash3
    count += 2; // portal1, portal2
    count += 5; // yikes, terrible, sureabout, embarass, seriously
    count += 2; // howdy, batery
    count += 4; // flush, down, here, return
    count += 1; // gameover
    count += 2; // boxbounce, boxcrash
    count += 2; // sinkon, faucet
    count += 2; // oozesplat, ooze
    count += 2; // tpblink, tp
    count += 2; // trash_recycler, recycler3
    count += 1; // goomba
    count += 1; // recsound
    count += 1; // jar_of_goo
    count += 1; // mainMenuMusic (duplicate, but needed)
    count += 5; // mop_asset, loose_wires_asset, rubber_duck_asset, sock_asset, duct_tape_asset, toolkit_asset
    count += 15; // Additional item assets (coolant_tank_asset, screw_asset, etc.)
    count += 3; // radio, buy_now, store
    count += 1; // store audio
    count += 25; // Boot2 assets
    
    return count;
  }

  private setupLoadingEvents() {
    let lastProgress = 0;
    let progressStuckTime = 0;
    const progressTimeout = 5000;
    
    // Set up loading progress events
    this.load.on('progress', (progress: number) => {
      const currentTime = this.time.now;
      
      // Check if progress is stuck
      if (progress === lastProgress) {
        if (progressStuckTime === 0) {
          progressStuckTime = currentTime;
        } else if (currentTime - progressStuckTime > progressTimeout) {
          // Force the loading to complete
          this.load.emit('complete');
          return;
        }
      } else {
        progressStuckTime = 0;
        lastProgress = progress;
      }
      
      // Update loading bar
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x3498db);
      this.loadingBar.fillRoundedRect(
        this.scale.width / 2 - 200, 
        this.scale.height / 2 - 20, 
        400 * progress, 
        40, 
        10
      );
      
      // Update loading text
      this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });

    this.load.on('complete', () => {
      this.isLoadingComplete = true;
    });
    
    // Add error handling
    this.load.on('loaderror', (file: any) => {
      // Continue loading even if some assets fail
    });
    
    // Add a global timeout for the entire loading process
    this.time.delayedCall(15000, () => {
      if (!this.isLoadingComplete) {
        this.load.emit('complete');
      }
    });
  }
}
