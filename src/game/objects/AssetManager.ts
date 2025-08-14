
// src/game/objects/AssetManager.ts

import { Scene } from 'phaser';
import { Item } from '../config/mergeDataFull';

export interface ItemAsset {
  key: string;
  url: string;
  displaySize?: { width: number; height: number };
  scale?: number;
}

export class AssetManager {
  private scene: Scene;
  private itemAssets: Map<Item, ItemAsset> = new Map();
  private loadedAssets: Set<string> = new Set();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeAssets();
  }

  private initializeAssets() {
    // Register item assets here
    this.registerAsset('Mop', {
      key: 'mop_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Mop%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-0Rllm47amMc5FJ1YYSVppCf8Q9yVnx.5d-0',
      scale: 0.5 // Increased from 0.25 to make assets larger and clearer
    });

    this.registerAsset('Interactive Mop', {
      key: 'interactive_mop_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/mop.webp',
      scale: 0.5
    });

    this.registerAsset('Loose Wires', {
      key: 'loose_wires_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Loose%20Wires%22%20%20just%20a%20pile%20of%20wires%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-Dctj0vehiJJX4FhO2VEzZ6Prv6OnQU.5d-0',
      scale: 0.5 // Increased from 0.25 to make assets larger and clearer
    });

    this.registerAsset('Rubber Duck', {
      key: 'rubber_duck_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Rubber%20Duck%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-PvFuLRK9Kcr8se4WwSYmFuN2IHiklm.5d-0',
      scale: 0.5 // Increased from 0.25 to make assets larger and clearer
    });

    this.registerAsset('Fan Blade', {
      key: 'fan_blade_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Fan%20Blade%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-KiTQpjpscu6qf12HqaP8K04JnPwF3y.5d-2',
      scale: 0.5
    });

    this.registerAsset('Toilet Brush', {
      key: 'toilet_brush_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Brush%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-DHWilH7Hz2GgQJRwtgfyEuKTPFY0Pk.5d-0',
      scale: 0.5
    });

    this.registerAsset('Toilet Paper', {
      key: 'toilet_paper_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Toilet%20Paper%22%20just%201%20blade%20not%20the%20entire%20fan%2C%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-SYJCbR1Py98sYB7Pw1VpaI0U0amrRA.5d-1',
      scale: 0.5
    });

    this.registerAsset('Soap', {
      key: 'soap_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Soap%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-OSZesnJPp4UP0yLXcM8DIKcFUF0wkn.5d-0',
      scale: 0.5
    });

    this.registerAsset('Bucket', {
      key: 'bucket_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bucket%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6muHgpXHMdW2oMNtZReBU2GfxADs0S.5d-2',
      scale: 0.5
    });

    this.registerAsset('Towel', {
      key: 'towel_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Towel%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-pjPIYZniLB2w9kubLL85kVG6XWuy8u.5d-3',
      scale: 0.5
    });

    this.registerAsset('Energy Canister', {
      key: 'energy_canister_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Energy%20Canister%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ucTd6MToNY5lCli6MjfsanFwA3m9Mv.5d-1',
      scale: 0.5
    });

    // Register: Ion Sprayer
    this.registerAsset('Ion Sprayer', {
      key: 'ion_sprayer_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-IRUHn4qIBXJcahBy8QdjWWQESJcym9.%2090s-00s%20rick%20and%20morty%20style%20%22Ion%20Sprayer%22%20no%20shadows%20no%20ground%20no%20background%20no%20words-1`,
      scale: 0.5
    });

    this.registerAsset('Goldfish Bowl', {
      key: 'goldfish_bowl_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Goldfish%20Bowl%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-sTCZ7zS4vPyvNMcLFTcB2UuydfxlWq.5d-0',
      scale: 0.5
    });

    this.registerAsset('Portal Shard', {
      key: 'portal_shard_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Portal%20Shard%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-A6dp5dm7mZIq1qN5jfjWa5MTfjWuLH.5d-0',
      scale: 0.5
    });

    this.registerAsset('Battery', {
      key: 'battery_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-L6oEJkPsYhgclnv8Xw9FnK2Dw9tjPL.%20Rick%20and%20morty%20style%209%20volt%20battery%20no%20shadow%20no%20background-3',
      scale: 0.5
    });

    this.registerAsset('Plunger', {
      key: 'plunger_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-9TGifL3Bo8Y1k2EJXnOaliJaEao7Po.%20Rick%20and%20morty%20style%20plunger%20with%20a%20face%20no%20shadow%20no%20ground%20no%20background-2',
      scale: 0.5
    });

    this.registerAsset('Reinforced Plunger', {
      key: 'reinforced_plunger_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Reinforce%20Plunger%22%20%28pluger%20with%20armor%20on%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-6bblSfdPhJOdQqAvi26p6t6vyExayW.5d-1-none-3',
      scale: 0.5
    });

    this.registerAsset('Sock', {
      key: 'sock_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Sock%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-CG0w8V233dGR4o0GCF9gIqlSUyBpQa.5d-0',
      scale: 0.5
    });

    this.registerAsset('Duct Tape', {
      key: 'duct_tape_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Duct%20Tape%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ANR9sRNgmHPIETmpkLzRwmGIHs3VYt.5d-2',
      scale: 0.5
    });

    this.registerAsset('Toolkit', {
      key: 'toolkit_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22tool%20kit%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2X54S3bbRtpgilzkqU00fbE5q2Sjjm.5d-0',
      scale: 0.5
    });

    this.registerAsset('Coolant Tank', {
      key: 'coolant_tank_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Coolant%20Tank%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-hD6ImhqB54Dmu1j2oBsyjTDYsVrsMn.5d%0A-2',
      scale: 0.5
    });

    this.registerAsset('Screw', {
      key: 'screw_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22screw%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-EyHFsBrFmVc2xvpgUbrFwQ6LnfVD55.5d-3',
      scale: 0.5
    });

    this.registerAsset('Wrench', {
      key: 'wrench_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22wrench%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-vraJu89JpLdkyf9PTXQXrgjatOUwy2.5d-0',
      scale: 0.5
    });

    this.registerAsset('Fuse', {
      key: 'fuse_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22FUSE%22%20%28like%20one%20that%20goes%20in%20a%20car%5D%20no%20shadows%20no%20background-0-Sihn5vGQnoWdQmhlOFxnPBGZ2ogEeA',
      scale: 0.5
    });

    this.registerAsset('Pipe', {
      key: 'pipe_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-NAJhLYKrYJ9giJEhZgoVCYDVxzQYrq.%20Rick%20and%20morty%20style%20pipe%20%28like%20a%20lead%20pipe%29%20no%20shadows%20no%20background-3',
      scale: 0.5
    });

    this.registerAsset('Ham Sandwich', {
      key: 'ham_sandwich_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rotten%20ham%20sandwich%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-0-SrjJtTB5gpA1aBuhTynSK4ho6NBsz4',
      scale: 0.5
    });

    this.registerAsset('Unstable Goo', {
      key: 'unstable_goo_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-5oZXl4wPh90INtS5kNdVu2y4Rd5dJE.%20Rick%20and%20morty%20style%20unstable%20goo%20no%20shadows%20no%20background-0',
      scale: 0.5
    });

    this.registerAsset('Soggy Paper (Hazard: Slippery)', {
      key: 'soggy_paper_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22soggy%20toilet%20paper%22%20no%20people%20no%20shadows%20no%20background-1-yoD6JHs5ll309taZtzMspYarAxlrcm',
      scale: 0.5
    });

    this.registerAsset('Powered Wire', {
      key: 'powered_wire_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20bundle%20of%20%22Powered%20Wire%22%20electric%20wires%20with%20arcs%20of%20lightning%20arcs%20no%20shadows%20no%20background-0-NVLAh9ZxGlhZzcmcYW7gM8NImUl3US',
      scale: 0.5
    });

    this.registerAsset("THOR'S PLUNGER", {
      key: 'thors_plunger_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Rick%20and%20morty%20style%20%22Shock%20Plunger%22%20a%20metal%20toilet%20plungers%20with%20electric%20arcs%20no%20shadows%20no%20background-3-T3NB9atfbZIGDiPymHCa4KhfowIqry',
      scale: 0.5
    });

    this.registerAsset('Pipe Lance', {
      key: 'pipe_lance_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Pipe%20Lance%22%20%28a%20lead%20pipe%20with%20a%20lance%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2MHjaqFxlElBmHAuKVuStgy2HH5XEb.5d-1-none-1',
      scale: 0.5
    });

    this.registerAsset('Bandaged Towel', {
      key: 'bandaged_towel_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Bandaged%20Towel%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-YP5h206K07saeIn2VOZInZ2wu4iPAh.5d-1-none-0',
      scale: 0.5
    });

    this.registerAsset('Chilled Pipe', {
      key: 'chilled_pipe_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-futuristic%2090s-00s%20rick%20and%20morty%20style%20%22chilled%20pipe%22%20%28lead%20pipe%20with%20Ice%20on%20it%29%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-g3Xs7K2p8p2hIuXiZuF82ZenRkdWAu.5d-1-none-0',
      scale: 0.5
    });

    this.registerAsset('Coolant Bowl', {
      key: 'coolant_bowl_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22coolant%20bowl%22%20%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-ConqzoanzKvOqtUIYuh1IpeXlJlgf4.5d-1-none-3',
      scale: 0.5
    });

    this.registerAsset('Chilled Sock (Throwable)', {
      key: 'chilled_sock_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20green%20sock%20with%20ice%20on%20it%2C%20%22Chilled%20Sock%22%20no%20shadow-0-T1kIMKXLEYzb15vhVUWwOlL7xX45F5',
      scale: 0.5
    });

    this.registerAsset('Wet Mop', {
      key: 'wet_mop_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%2090s-00s%20rick%20and%20morty%20style%20%22Wet%20Mop%22%20it%20should%20look%20like%20it%20has%20PTSD%20no%20shadow-2-tKubw33lLArlbQfFgqmDTajINn0Bxp',
      scale: 0.5
    });

    // Register goo splatter asset for when goos are destroyed
    this.registerAsset('Goo Splatter', {
      key: 'goo_splatter',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-A%20splatter%20of%20green%20goo%2C%20cartoonish-W0Mt5IcK1nXkRIovNFBL1di1KivaGP.%20It%20should%20look%20like%20it%20is%20on%20a%20flat%20surface%20below%20eye%20level%20in%20single%20point%20perspective-3',
      scale: 0.6
    });

    this.registerAsset('Combo Tool', {
      key: 'combo_tool_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22tool%20kit%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it.%20side%20view%20not%202-2X54S3bbRtpgilzkqU00fbE5q2Sjjm.5d-0',
      scale: 0.5
    });

    this.registerAsset('Improvised Screwdriver', {
      key: 'improvised_screwdriver_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-rick%20and%20morty%20style%20broken%20butter%20knife%20no%20shadow-3-0Xl0u7DVsCHMUy64RWecJ2Vzhq4GQT',
      scale: 0.5
    });

    this.registerAsset('Repaired Pipe', {
      key: 'repaired_pipe_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%2090s-00s%20rick%20and%20morty%20style%20%22Repaired%20Pipe%22%20%28lead%20pipe%20with%20a%20bandaid%20on%20it%29%2C%20no%20shadow%20side%20view%20not%202-ZKxjH1otSHfOpHPRbgWqovJd9OQRnH.5d-1-none%20no%20words-1',
      scale: 0.5
    });

    // Add new assets with provided URLs
    this.registerAsset('Bubble Cyclone', {
      key: 'bubble_cyclone_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20%22Soap%20Bubble%20Tornado%22%20no%20shadow-0-4UTHwEkFSzCvi1w01nov6A1j6UNT1Q',
      scale: 0.5
    });

    this.registerAsset('Wired Fuse', {
      key: 'wired_fuse_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20Fuse%20in%20a%20wire%20harness%2C%20car%20style%20fuse%20no%20shadow%20no%20people%2C%20anthropomorphized-0-8AR8RFyG90HoD1AfpKUMBnI6fp3ovg',
      scale: 0.5
    });

    this.registerAsset('Soapy Mop', {
      key: 'soapy_mop_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20anthropomorphized%20soapy%20mop%20with%20an%20uppity%20attitude%2C%20no%20shadow%2C%20no%20background%0A-3-NEplId4g1iM8UU1puLA48vUnjusYtl',
      scale: 0.5
    });

    this.registerAsset('Bubble Wand', {
      key: 'bubble_wand_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20bubble%20wand%20pistol-3-lVlkgZxFpHdha3ehktJmlAjIso8tba',
      scale: 0.5
    });

    this.registerAsset('Makeshift Vent', {
      key: 'makeshift_vent_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00%27s%20rick%20and%20morty%20style%20anthropomorphized%20desk%20fan%2C%20held%20together%20by%20duct%20tape%20and%20looking%20like%20it%20has%20anxiety-LEJnLp9B3Gy82CfQ6tMBARQJLmQz5A.%20no%20shadow%2C%20no%20people-2',
      scale: 0.5
    });

    this.registerAsset('Jury-Rigged Fan', {
      key: 'jury_rigged_fan_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20industrial%20fan%20held%20together%20at%20the%20joints%20by%20electrical%20wiring%20and%20duct%20tape.%20Anthropomorphized%20with%20a%20crazy%20manic%20look%20on%20its%20face-2KVc1DQL4dKsVfJ1P7EbW8BkRpmmyz.%20no%20shadow%2C%20no%20people-3',
      scale: 0.5
    });

    this.registerAsset('Charged Duck', {
      key: 'charged_duck_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rubber%20duck%20in%20thors%20armor%20holding%20mjolnir%2C%20no%20shadow%2C%20no%20background-3-ebrQdAY6WMP8ZEvsfPm0tMmPOfgcXD',
      scale: 0.5
    });

    this.registerAsset('Foam Roll', {
      key: 'foam_roll_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%2C%20Toilet%20paper%20roll%20taking%20a%20bubble%20bath%20no%20background%2C%20no%20shadow-3-pKbgkX40ipq2czLMKyC0rmjS0m5Ptz',
      scale: 0.5
    });

    this.registerAsset('Sticky Sock', {
      key: 'sticky_sock_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90%27s-00s%20rick%20and%20morty%20style%20green%20sock%20with%20a%20drippy%20white%20spot%20on%20the%20toe%20end%2C%20anthropomorphized%20wish%20a%20look%20of%20horror%20on%20its%20face-l45HADFipMCEXb0kWvPST6takI1cDj.-0',
      scale: 0.5
    });

    this.registerAsset('Electric Brush', {
      key: 'electric_brush_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20electric%20tooth%20brush%2C%20with%20electric%20arcs%20instead%20of%20bristles%20no%20shadow-0-G0Ry0QZitXP4jgroHEIjIvQfOLfDwD',
      scale: 0.5
    });

    this.registerAsset('Sock Puppet Duck', {
      key: 'sock_puppet_duck_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%2090s-00s%20rick%20and%20morty%20style%20%22Sock%20Puppet%20Duck%29%2C%20Its%20must%20look%20like%20a%20old%20dirty%20sock%20thats%20has%20a%20duck%20bill%20no%20shadow%20side%20view%20not%202-ZFzRsm3h1wReeR13L7Ij04vs9EOO4X.5d-1-none%20no%20words-2',
      scale: 0.5
    });

    this.registerAsset('Confetti Storm', {
      key: 'confetti_storm_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-anthropomorphized%2090s-00s%20rick%20and%20porty%20style%20confetti%20cyclone%20with%20an%20angry%20look%20and%20clenched%20fists%20no%20shadow-3-fWFRY24V5JG98VnzVx42xkQNxhFyCO',
      scale: 0.5
    });

    this.registerAsset('Paper Fuse', {
      key: 'paper_fuse_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/paper%20fuse-FUJqd9lKQyvAZpNIOMdBNrVPFVpSkz.png',
      scale: 0.5
    });

    this.registerAsset('Enemy: Goo Tornado', {
      key: 'goo_tornado_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20anthropomorphized%20green%20goo%20tornado-HDqvPAtLzJE2PnJJrt1J3oDsXnTD32.%20no%20shadow%20no%20background%0A-3',
      scale: 0.5
    });

    this.registerAsset('Jar of Goo', {
      key: 'jar_of_goo_item',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-a%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22jar%20of%20goo%22%20no%20shadow%2C%20must%20have%20the%20name%20on%20it-7IxyGZuzQ9NpAIh575MQQ22EEEg0QR.-3',
      scale: 0.5
    });

    this.registerAsset('Thermo Coil', {
      key: 'thermo_coil_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%2090s-00s%20rick%20and%20morty%20style%20%22Thermo%20Coil%22%20.%2C%20no%20shadow%20side%20view%20not%202-cpV6SKWsLsGLaQLptuTMlPqc8eTWLs.5d-1-none-2',
      scale: 0.5
    });

    this.registerAsset('Cryo Coil', {
      key: 'cryo_coil_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Cryo%20Coil%22%20%2C%20no%20shadow%20side%20view%20not%202-wxt7JRErsiZZ85JPScASCcy6FhSDsd.5d-1-none-0',
      scale: 0.5
    });

    this.registerAsset('Cryo Coupler', {
      key: 'cryo_coupler_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%20futuristic%2090s-00s%20rick%20and%20morty%20style%20%22Cryo%20Coupler%20.%2C%20no%20shadow%20side%20view%20not%202-Idhtk0JpJ48KFZkEI1eevd19IhoFsJ.5d-1-none-3',
      scale: 0.5
    });

    this.registerAsset('Arc Cell', {
      key: 'arc_cell_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20.%200s-00s%20rick%20and%20morty%20style%20%22Arc%20Cell%22%3A%20%22Electrical%20storage%20with%20a%20sparky%20personality.%20Charges%20ahead%20with%20confidence.%22%2C%20no%20shadow%20side%20view%20not%202-235kmsbahssT4hFTqL5VCvjtUJqzFq.5d-1-none%20no%20words%20NO%20SHADOWS%21%21%21%21%21%20DO%20NOT%20MAKE%20THIS%20LOOK%20LIKE%20A%20BATTERY%20MAKE%20IT%20MORE%20LIKE%20A%20TESLA%20COIL%0A%0A-0',
      scale: 0.5
    });

    this.registerAsset('Air Zap Trap', {
      key: 'air_zap_trap_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20landmine%20with%20lightning%20arcs%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-2-gQh09x9oD574e27TeWZZRDFQCqOnU1',
      scale: 0.5
    });

    this.registerAsset('Bolted Wrench', {
      key: 'bolted_wrench_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20anthropomorphized%20wrench%20bolted%20to%20an%20iron%20plate-cPLhDE4WWmKMX7EWlU5U8OyMh3ZjhJ.%20no%20shadow%2C%20no%20people%2C%20no%20background-2',
      scale: 0.5
    });

    this.registerAsset('Boss Key (Cold)', {
      key: 'boss_key_cold_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20anthropomorfized%20frozen%20key%2C%20no%20shadow%2C%20no%20background%2C%20no%20people-1-pW5UQwGTVbuef9WpgMTPqIK8zIesIO',
      scale: 0.5
    });

    this.registerAsset('Boss Key (Heat)', {
      key: 'boss_key_heat_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20anthropomorfized%20lava%20key%2C%20no%20shadow%2C%20no%20background%2C%20no%20people-0-viIVc6zP274NAL6Jvp6J90l30QPbll',
      scale: 0.5
    });

    // Register: Portal Key Beta (uses preloaded texture key; URL kept for fallback load)
    this.registerAsset('Portal Key Beta', {
      key: 'portal_key_beta_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20%22Portal%20Key%20beta%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20a%20key%20with%20an%20B%20for%20the%20handle%20no%20portal%20just%20a%20key-2-tp2qgs4e137ETJkpdTBPOZFEUCMLcx`,
      scale: 0.5
    });

    // Register: Portal Key Alpha (uses preloaded texture key; URL kept for fallback load)
    this.registerAsset('Portal Key Alpha', {
      key: 'portal_key_alpha_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20%22Portal%20Key%20Alpha%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20a%20key%20with%20an%20A%20for%20the%20handle%20no%20portal%20just%20a%20key-2-KfW6XIqufcVhpRDhDxHJdOyb0hDLnK`,
      scale: 0.5
    });

    // Register: Portal Access Token
    this.registerAsset('Portal Access Token', {
      key: 'portal_access_token_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-JvbU8zF3z3aSKp8ctRcu4iijrnQGJr.%2090s-00s%20rick%20and%20morty%20style%20%22Portal%20Access%20Token%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20this%20should%20be%20like%20a%20coin/token%20no%20people%20on%20the%20coin%20no%20rick%20and%20morty%20on%20the%20coin%20thi%20sis%20a%20coin%20to%20acess%20the%20portal-1`,
      scale: 0.5
    });

    // Register: Boss Sigil
    this.registerAsset('Boss Sigil', {
      key: 'boss_sigil_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-s0Yn07ut2d8BwmfICgu8T01M5XpIqf.%2090s-00s%20rick%20and%20morty%20style%20%22Boss%20Sigil%22%20no%20shadows%20no%20ground%20no%20background%20%28like%20an%20electrical%20breaker%29%20no%20words%20%0A-1`,
      scale: 0.5
    });

    this.registerAsset('Coolant Spill', {
      key: 'coolant_spill_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20futuristic%20coolant%20jug%20knocked%20over%2C%20laying%20on%20frozen%20ice%2C%20anthropomorphized%2C%20dead%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-3-rtXALhO77jBLSSRi38NTl2Uu13QJCE',
      scale: 0.5
    });

    this.registerAsset('Enemy: Crawling Sandwich', {
      key: 'crawling_sandwich_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rotten%20ham%20sandwich%20spider%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-0-bUWns6zO7If0nck0HXI077gzyzPjqf',
      scale: 0.5
    });

    this.registerAsset('Enemy: Ooze Fish', {
      key: 'ooze_fish_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%2C%20three%20eyed%20fish%20covered%20in%20green%20goo%20-9ZkwIMvpdAvqHXLvd5xJKuO8nU5h90.%20no%20shadow%2C%20no%20people%2C%20no%20background-3',
      scale: 0.5
    });

    this.registerAsset('Enemy: Lint Golem', {
      key: 'lint_golem_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20golem%20made%20of%20lint%20and%20dust%20balls%2C%20no%20shadow%2C%20no%20people%2C%20no%20background-0-bZgQjxqmoXiZdGwML1r1r5MetKZzvt',
      scale: 0.5
    });

    this.registerAsset('Hazard: Short Circuit', {
      key: 'short_circuit_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20sparking%20wires%20wrapped%20around%20a%20futuristic%20coolant%20jug%2C%20no%20shadows%2C%20no%20people%2C%20coolant%20jug%20is%20anthropomorphic%20and%20looks%20scared-2-9BZnOdSEgZRIrDqyPJoPT2FWxXS6Es',
      scale: 0.5
    });

    this.registerAsset('Ionic Towel (Defense: zap)', {
      key: 'ionic_towel_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%2C%20anthropomorphized%20beach%20towel%20frozen%20in%20a%20block%20of%20ice-FJpxYxOYElSbKtPNGzP9mHHx1N3ymm.%20no%20shadow%2C%20no%20people%2C%20no%20background-1',
      scale: 0.5
    });

    this.registerAsset('Chill Towel (Defense: slow)', {
      key: 'chill_towel_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%2C%20anthropomorphized%20beach%20towel%20frozen%20in%20a%20block%20of%20ice-FJpxYxOYElSbKtPNGzP9mHHx1N3ymm.%20no%20shadow%2C%20no%20people%2C%20no%20background-1',
      scale: 0.5
    });

    this.registerAsset('Static Bubble Duck', {
      key: 'static_bubble_duck_asset',
      url: 'https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20rubber%20duck%20in%20thors%20armor%20holding%20mjolnir%2C%20no%20shadow%2C%20no%20background-3-ebrQdAY6WMP8ZEvsfPm0tMmPOfgcXD',
      scale: 0.5
    });

    // Register: Maintenance Halberd
    this.registerAsset('Maintenance Halberd', {
      key: 'maintenance_halberd_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-f1fsUtoKK6nkOCebf3SR5gcXHvSHOo.%2090s-00s%20rick%20and%20morty%20style%20%22Maintenance%20Halberd%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%0A-0`,
      scale: 0.5
    });

    // Register provided assets
    this.registerAsset('Bubbly Breaker', {
      key: 'bubbly_breaker_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-Ki2Y4hqpJU26YYRRsZ6VtrCzjapcdU.%2090s-00s%20rick%20and%20morty%20style%20%22Bubbling%20Breakerl%22%20no%20shadows%20no%20ground%20no%20background%20%28like%20an%20electrical%20breaker%29%20no%20words-0`,
      scale: 0.5
    });

    this.registerAsset('Cold Vent', {
      key: 'cold_vent_asset',
      // prettier-ignore
      url: `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-7STOMxYRWINCfBgr2HhW0KkGCZBZbI.%2090s-00s%20rick%20and%20morty%20style%20%22Cold%20Vent%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20no%20snowflakes%20no%20wind%20NO%20PEOPLE%21%21%21-1`,
      scale: 0.5
    });

    // Register new containment assets
    this.registerAsset('Containment Set', {
      key: 'containment_set_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20set.webp',
      scale: 0.5
    });

    this.registerAsset('Containment Spear', {
      key: 'containment_spear_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20spear.webp',
      scale: 0.5
    });

    // Register new cryo assets
    this.registerAsset('Cryo Pipe', {
      key: 'cryo_pipe_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cryo%20pipe.webp',
      scale: 0.5
    });

    this.registerAsset('Cryo Foam Cannon', {
      key: 'cryo_foam_cannon_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cyro%20foam%20cannon%20.webp',
      scale: 0.5
    });

    // Register additional assets from merge-assets repository
    this.registerAsset('Foam Blaster', {
      key: 'foam_blaster_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/foam%20blaster.webp',
      scale: 0.5
    });

    this.registerAsset('Heated Pipe', {
      key: 'heated_pipe_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/heated%20pipe.webp',
      scale: 0.5
    });

    this.registerAsset('Ion Sprayer', {
      key: 'ion_sprayer_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/ion%20sprayer.webp',
      scale: 0.5
    });

    this.registerAsset('Laser Duck', {
      key: 'laser_duck_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/laser%20duck.webp',
      scale: 0.5
    });

    this.registerAsset('Maintenance Halberd', {
      key: 'maintenance_halberd_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/maintenance%20halberd.webp',
      scale: 0.5
    });

    this.registerAsset('Misting Fan', {
      key: 'misting_fan_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/misting%20fan.webp',
      scale: 0.5
    });

    this.registerAsset('Enemy: Pipe Serpent', {
      key: 'pipe_serpent_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/pipe%20serpent.webp',
      scale: 0.5
    });

    this.registerAsset('Portal Access Token', {
      key: 'portal_access_token_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20access%20token.webp',
      scale: 0.5
    });

    this.registerAsset('Portal Key Alpha', {
      key: 'portal_key_alpha_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20alpha.webp',
      scale: 0.5
    });

    this.registerAsset('Portal Key Beta', {
      key: 'portal_key_beta_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20beta.webp',
      scale: 0.5
    });

    this.registerAsset('Hazard: Shocking Puddle', {
      key: 'shocking_puddle_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/shocking%20puddle.webp',
      scale: 0.5
    });

    this.registerAsset('Enemy: Voltaic Wisp', {
      key: 'voltaic_wisp_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/voltaic%20wisp.webp',
      scale: 0.5
    });

    // Register additional combat and utility assets
    this.registerAsset('Stun Lance', {
      key: 'stun_lance_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stun%20lance.webp',
      scale: 0.5
    });

    this.registerAsset('Static Sock Trap', {
      key: 'static_sock_trap_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/static%20sock%20trap.webp',
      scale: 0.5
    });

    this.registerAsset('Stasis Snare', {
      key: 'stasis_snare_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stasis%20snare.webp',
      scale: 0.5
    });

    this.registerAsset('Stabilized Fuse', {
      key: 'stabilized_fuse_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stabilized%20fuse.webp',
      scale: 0.5
    });

    this.registerAsset('Sanitation Maul', {
      key: 'sanitation_maul_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/sanitation%20maul.webp',
      scale: 0.5
    });

    this.registerAsset('Quack of Doom', {
      key: 'quack_of_doom_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/quack%20of%20doom.webp',
      scale: 0.5
    });

    this.registerAsset('Power Coupler', {
      key: 'power_coupler_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/power%20coupler.webp',
      scale: 0.5
    });

    // Register additional hazard and effect assets
    this.registerAsset('Steam Burst', {
      key: 'steam_burst_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/steam%20burst.webp',
      scale: 0.5
    });

    this.registerAsset('Coolant Spill', {
      key: 'coolant_spill_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/spilled%20coolant.webp',
      scale: 0.5
    });

    this.registerAsset('Enemy: Portal Slime', {
      key: 'portal_slime_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20slime.webp',
      scale: 0.5
    });

    this.registerAsset('Hazard: Corrosive Bristles', {
      key: 'corrosive_bristles_asset',
      url: 'https://raw.githubusercontent.com/localgod13/merge-assets/main/corrosive%20bristles.webp',
      scale: 0.5
    });
  }

  private registerAsset(itemName: Item, asset: ItemAsset) {
    this.itemAssets.set(itemName, asset);
  }

  public hasAsset(itemName: Item): boolean {
    return this.itemAssets.has(itemName);
  }

  public getAsset(itemName: Item): ItemAsset | null {
    return this.itemAssets.get(itemName) || null;
  }

  public async loadAsset(itemName: Item): Promise<boolean> {
    const asset = this.getAsset(itemName);
    if (!asset) return false;

    // Check if already loaded
    if (this.loadedAssets.has(asset.key)) return true;

    // Check if the texture already exists in the cache (might have been loaded in preload)
    if (this.scene.textures.exists(asset.key)) {
      this.loadedAssets.add(asset.key);
      // Apply texture filtering to existing texture
      const texture = this.scene.textures.get(asset.key);
      if (texture && texture.source && texture.source[0]) {
        texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      return true;
    }

    return new Promise((resolve) => {
      // Load the asset
      this.scene.load.image(asset.key, asset.url);
      
      // Set up completion handler
      this.scene.load.once('complete', () => {
        this.loadedAssets.add(asset.key);
        
        // Apply texture filtering to newly loaded texture
        const texture = this.scene.textures.get(asset.key);
        if (texture && texture.source && texture.source[0]) {
          texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        
        resolve(true);
      });

      this.scene.load.once('loaderror', () => {
        resolve(false);
      });

      // Start loading if not already in progress
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    });
  }

  public async loadAllAssets(): Promise<void> {
    const loadPromises: Promise<boolean>[] = [];
    
    for (const [itemName] of this.itemAssets) {
      loadPromises.push(this.loadAsset(itemName));
    }

    await Promise.all(loadPromises);
  }

  public createSprite(itemName: Item, x: number, y: number): Phaser.GameObjects.Sprite | null {
    const asset = this.getAsset(itemName);
    if (!asset) {
      return null;
    }

    // Check both our loaded assets set AND the scene's texture cache
    const isLoaded = this.loadedAssets.has(asset.key) || this.scene.textures.exists(asset.key);
    
    if (!isLoaded) {
      return null;
    }

    // Mark as loaded in our set if it exists in texture cache but not in our set
    if (this.scene.textures.exists(asset.key) && !this.loadedAssets.has(asset.key)) {
      this.loadedAssets.add(asset.key);
    }

    const sprite = this.scene.add.sprite(x, y, asset.key);
    
    // Set texture filtering to nearest neighbor to prevent blurriness when scaling
    const texture = this.scene.textures.get(asset.key);
    if (texture && texture.source && texture.source[0]) {
      texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    
    // Apply display size or scale - use setDisplaySize for crisp scaling
    if (asset.displaySize) {
      sprite.setDisplaySize(asset.displaySize.width, asset.displaySize.height);
    } else if (asset.scale) {
      // Calculate the desired display size based on the original texture size
      const originalWidth = sprite.width;
      const originalHeight = sprite.height;
      const targetWidth = originalWidth * asset.scale;
      const targetHeight = originalHeight * asset.scale;
      
      // Use setDisplaySize instead of setScale for better quality
      sprite.setDisplaySize(targetWidth, targetHeight);
      
      // Ensure the sprite doesn't exceed a maximum size (for gameplay balance)
      const maxSize = 80; // Increased from 50 to 80 pixels for better visibility
      const currentWidth = sprite.displayWidth;
      const currentHeight = sprite.displayHeight;
      
      if (currentWidth > maxSize || currentHeight > maxSize) {
        const scaleDown = maxSize / Math.max(currentWidth, currentHeight);
        sprite.setDisplaySize(targetWidth * scaleDown, targetHeight * scaleDown);
      }
    }

    return sprite;
  }

  public getLoadedAssets(): string[] {
    return Array.from(this.loadedAssets);
  }

  public getAllRegisteredItems(): Item[] {
    return Array.from(this.itemAssets.keys());
  }
}
