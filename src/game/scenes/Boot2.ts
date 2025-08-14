
// src/game/scenes/Boot2.ts
import { Scene } from "phaser"

export class Boot2 extends Scene {
  constructor() {
    super("Boot2")
  }

  preload() {
    // Intentionally minimal: put future global preloads here

    // Preload item textures that AssetManager will use later
    // Ion Sprayer
    // prettier-ignore
    this.load.image('ion_sprayer_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-IRUHn4qIBXJcahBy8QdjWWQESJcym9.%2090s-00s%20rick%20and%20morty%20style%20%22Ion%20Sprayer%22%20no%20shadows%20no%20ground%20no%20background%20no%20words-1`)
    // Maintenance Halberd (from @maintenanc-1)
    // prettier-ignore
    this.load.image('maintenance_halberd_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-f1fsUtoKK6nkOCebf3SR5gcXHvSHOo.%2090s-00s%20rick%20and%20morty%20style%20%22Maintenance%20Halberd%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%0A-0`)
    // Portal Key Beta (from @portalbeta-1)
    // prettier-ignore
    this.load.image('portal_key_beta_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20%22Portal%20Key%20beta%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20a%20key%20with%20an%20B%20for%20the%20handle%20no%20portal%20just%20a%20key-2-tp2qgs4e137ETJkpdTBPOZFEUCMLcx`)
    // Portal Key Alpha (from @portalkeya-1)
    // prettier-ignore
    this.load.image('portal_key_alpha_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-90s-00s%20rick%20and%20morty%20style%20%22Portal%20Key%20Alpha%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20a%20key%20with%20an%20A%20for%20the%20handle%20no%20portal%20just%20a%20key-2-KfW6XIqufcVhpRDhDxHJdOyb0hDLnK`)
    // Portal Access Token (from @portalacce-1)
    // prettier-ignore
    this.load.image('portal_access_token_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-JvbU8zF3z3aSKp8ctRcu4iijrnQGJr.%2090s-00s%20rick%20and%20morty%20style%20%22Portal%20Access%20Token%22%20no%20shadows%20no%20ground%20no%20background%20no%20words%20this%20should%20be%20like%20a%20coin/token%20no%20people%20on%20the%20coin%20no%20rick%20and%20morty%20on%20the%20coin%20thi%20sis%20a%20coin%20to%20acess%20the%20portal-1`)
    // Boss Sigil (from @boss-sigil-2)
    // prettier-ignore
    this.load.image('boss_sigil_asset', `https://1jnxxd5hmjmhwwrc.public.blob.vercel-storage.com/bg-removed-Chibi%20art%20style%20with%20no%20anthropomorphisms%20-s0Yn07ut2d8BwmfICgu8T01M5XpIqf.%2090s-00s%20rick%20and%20morty%20style%20%22Boss%20Sigil%22%20no%20shadows%20no%20ground%20no%20background%20%28like%20an%20electrical%20breaker%29%20no%20words%20%0A-1`)
    
    // New containment assets
    this.load.image('containment_set_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20set.webp')
    this.load.image('containment_spear_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/containment%20spear.webp')
    
    // New cryo assets
    this.load.image('cryo_pipe_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cryo%20pipe.webp')
    this.load.image('cryo_foam_cannon_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/cyro%20foam%20cannon%20.webp')
    
    // Additional assets from merge-assets repository
    this.load.image('foam_blaster_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/foam%20blaster.webp')
    this.load.image('heated_pipe_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/heated%20pipe.webp')
    this.load.image('ion_sprayer_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/ion%20sprayer.webp')
    this.load.image('laser_duck_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/laser%20duck.webp')
    this.load.image('maintenance_halberd_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/maintenance%20halberd.webp')
    this.load.image('misting_fan_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/misting%20fan.webp')
    this.load.image('pipe_serpent_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/pipe%20serpent.webp')
    this.load.image('portal_access_token_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20access%20token.webp')
    this.load.image('portal_key_alpha_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20alpha.webp')
    this.load.image('portal_key_beta_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20key%20beta.webp')
    this.load.image('shocking_puddle_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/shocking%20puddle.webp')
    this.load.image('voltaic_wisp_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/voltaic%20wisp.webp')
    
    // Additional combat and utility assets
    this.load.image('stun_lance_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stun%20lance.webp')
    this.load.image('static_sock_trap_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/static%20sock%20trap.webp')
    this.load.image('stasis_snare_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stasis%20snare.webp')
    this.load.image('stabilized_fuse_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/stabilized%20fuse.webp')
    this.load.image('sanitation_maul_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/sanitation%20maul.webp')
    this.load.image('quack_of_doom_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/quack%20of%20doom.webp')
    this.load.image('power_coupler_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/power%20coupler.webp')
    
    // Additional hazard and effect assets
    this.load.image('steam_burst_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/steam%20burst.webp')
    this.load.image('coolant_spill_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/spilled%20coolant.webp')
    this.load.image('portal_slime_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/portal%20slime.webp')
    this.load.image('corrosive_bristles_asset', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/corrosive%20bristles.webp')
  }

  create() {
    // After Boot2 finishes loading its assets, go to existing Boot (which handles UI and bulk asset preloads)
    this.registry.set('boot2SceneLoaded', true);
    this.scene.start("Boot")
  }
}
