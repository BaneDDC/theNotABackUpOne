
// src/game/config/mergeDataFull.ts
// Full merge data with tier mapping and helpers for Phaser game.
// Pulls from your known recipes and derives ITEM_TIERS at load time.

export type Item = string;

// --- Tier 1 base items (only these spawn from portal) ---
export const TIER1: Item[] = [
  "Plunger", "Toilet Paper", "Toilet Brush", "Soap", "Mop", "Bucket",
  "Pipe", "Loose Wires", "Battery", "Fan Blade", "Toolkit", "Coolant Tank",
  "Rubber Duck", "Goldfish Bowl", "Sock", "Ham Sandwich",
  "Portal Shard", "Energy Canister", // Removed "Unstable Goo" from tier 1
  "Towel", "Wrench", "Duct Tape", "Screw", "Fuse", "Toilet"
];

// --- All recipes: "A+B" must be sorted alphabetically ---
export const RECIPES: Record<string, Item> = {
  "Air Zap Trap+Static Sock Trap": "Stasis Snare",
  "Arc Cell+Cryo Coupler": "Portal Key Beta",
  "Arc Cell+Power Coupler": "Portal Key Alpha",
  "Bandaged Towel+Coolant Tank": "Chill Towel (Defense: slow)",
  "Battery+Loose Wires": "Powered Wire",
  "Battery+Plunger": "THOR'S PLUNGER",
  "Battery+Toilet Brush": "Electric Brush",
  "Battery+Wet Mop": "Hazard: Shocking Puddle",
  "Bolted Wrench+Improvised Screwdriver": "Combo Tool",
  "Boss Key (Cold)+Boss Key (Heat)": "Boss Sigil",
  "Boss Sigil+Toilet": "Trigger:Boss Summon",
  "Bubble Wand+Charged Duck": "Static Bubble Duck",
  "Bubble Wand+Sanitation Maul": "Bubbly Breaker",
  "Bucket+Mop": "Wet Mop",
  "Chilled Pipe+Powered Wire": "Cryo Pipe",
  "Cold Vent+Foam Blaster": "Cryo Foam Cannon",
  "Combo Tool+Cryo Coil": "Cryo Coupler",
  "Combo Tool+Stun Lance": "Maintenance Halberd",
  "Combo Tool+Thermo Coil": "Power Coupler",
  "Containment Set+Toilet": "Trigger:Seal Leak",
  "Containment Spear+Cryo Foam Cannon": "Containment Set",
  "Coolant Bowl+Fan Blade": "Misting Fan",
  "Coolant Spill+Thermo Coil": "Steam Burst",
  "Coolant Tank+Goldfish Bowl": "Coolant Bowl",
  "Coolant Tank+Loose Wires": "Hazard: Short Circuit",
  "Coolant Tank+Makeshift Vent": "Cold Vent",
  "Coolant Tank+Pipe": "Chilled Pipe",
  "Coolant Tank+Sock": "Chilled Sock (Throwable)",
  "Coolant Tank+Wet Mop": "Coolant Spill",
  "Cryo Coil+Portal Shard": "Boss Key (Cold)",
  "Cryo Pipe+Stabilized Fuse": "Cryo Coil",
  "Duct Tape+Fan Blade": "Makeshift Vent",
  "Duct Tape+Plunger": "Reinforced Plunger",
  "Duct Tape+Sock": "Sticky Sock",
  "Duct Tape+Towel": "Bandaged Towel",
  "Electric Brush+Foam Roll": "Foam Blaster",
  "Energy Canister+Misting Fan": "Ion Sprayer",
  "Energy Canister+Portal Shard": "Arc Cell",
  "Energy Canister+Rubber Duck": "Charged Duck",
  "Energy Canister+Unstable Goo": "Enemy: Voltaic Wisp",
  "Fan Blade+Loose Wires": "Jury-Rigged Fan",
  "Fan Blade+Soap": "Bubble Cyclone",
  "Fan Blade+Toilet Paper": "Confetti Storm",
  "Fuse+Loose Wires": "Wired Fuse",
  "Goldfish Bowl+Unstable Goo": "Enemy: Ooze Fish",
  "Ham Sandwich+Unstable Goo": "Enemy: Crawling Sandwich",
  "Heated Pipe+Stabilized Fuse": "Thermo Coil",
  "Ion Sprayer+Static Bubble Duck": "Laser Duck",
  "Ion Sprayer+Towel": "Ionic Towel (Defense: zap)",
  "Jury-Rigged Fan+Powered Wire": "Air Zap Trap",
  "Laser Duck+Steam Burst": "Quack of Doom",
  "Loose Wires+Sticky Sock": "Static Sock Trap",
  "Loose Wires+Toilet Paper": "Paper Fuse",
  "Maintenance Halberd+Stasis Snare": "Containment Spear",
  "Mop+Soap": "Soapy Mop",
  "Paper Fuse+Wired Fuse": "Stabilized Fuse",
  "Pipe Lance+THOR'S PLUNGER": "Stun Lance",
  "Pipe+Plunger": "Pipe Lance",
  "Pipe+Toolkit": "Repaired Pipe",
  "Pipe+Unstable Goo": "Enemy: Pipe Serpent",
  "Portal Access Token+Toilet": "Trigger:Boss Finisher",
  "Portal Key Alpha+Portal Key Beta": "Portal Access Token",
  "Portal Shard+Thermo Coil": "Boss Key (Heat)",
  "Portal Shard+Unstable Goo": "Enemy: Portal Slime",
  "Powered Wire+Repaired Pipe": "Heated Pipe",
  "Quack of Doom+Toilet": "Trigger:Next Wave",
  "Reinforced Plunger+Soapy Mop": "Sanitation Maul",
  "Rubber Duck+Sock": "Sock Puppet Duck",
  "Screw+Toolkit": "Improvised Screwdriver",
  "Screw+Wrench": "Bolted Wrench",
  "Soap+Toilet Brush": "Bubble Wand",
  "Soap+Toilet Paper": "Foam Roll",
  "Sock+Unstable Goo": "Enemy: Lint Golem",
  "Toilet Brush+Unstable Goo": "Hazard: Corrosive Bristles",
  "Toilet Paper+Wet Mop": "Soggy Paper (Hazard: Slippery)"
};

// --- Helpers ---
export function getMergeResult(a: Item, b: Item): Item | null {
  const key = [a, b].sort().join("+");
  return RECIPES[key] ?? null;
}

export function isTier1(item: Item): boolean {
  return TIER1.includes(item);
}

export function isEnemy(item: Item): boolean {
  return item.startsWith("Enemy:");
}

export function isHazard(item: Item): boolean {
  // First check if it's an enemy - enemies are not hazards for collision purposes
  if (item.startsWith("Enemy:") || item === "Unstable Goo" || item === "Confetti Storm" || item === "Enemy: Goo Tornado") {
    return false;
  }
  
  // Check for explicit hazard naming
  if (item.startsWith("Hazard:") || 
      item === "Soggy Paper (Hazard: Slippery)" ||
      item.includes("(Hazard:")) {
    return true;
  }
  
  // Check for items that have hazardous properties based on their descriptions or nature
  const hazardousItems = [
    "Coolant Spill", // Described as slippery and dangerous
    "Steam Burst", // Hot steam that could be dangerous
    "Air Zap Trap", // Electrical trap
    "Static Sock Trap", // Electrical trap
    "Stasis Snare", // Trap that freezes things
    "Bubble Cyclone", // Destructive tornado of bubbles
    // Note: Removed "Confetti Storm" and "Enemy: Goo Tornado" as they are enemies
  ];
  
  return hazardousItems.includes(item);
}

export function isTrigger(item: Item): boolean {
  return item.startsWith("Trigger:");
}

// --- Compute tier levels dynamically ---
export const ITEM_TIERS: Record<string, number> = (() => {
  const tiers: Record<string, number> = {};
  // Tier 1 seeds
  for (const i of TIER1) tiers[i] = 1;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    for (const [key, result] of Object.entries(RECIPES)) {
      const [a, b] = key.split("+");
      if (tiers[a] && tiers[b]) {
        const t = Math.max(tiers[a], tiers[b]) + 1;
        if (!tiers[result] || t < tiers[result]) {
          tiers[result] = t;
          changed = true;
        }
      }
    }
  }
  return tiers;
})();

export function getTier(item: Item): number {
  return ITEM_TIERS[item] ?? 0;
}

// --- For random spawning ---
export function pickRandomTier1(): Item {
  return TIER1[Math.floor(Math.random() * TIER1.length)];
}

// Build Tier1 -> partners map from RECIPES
export const TIER1_PARTNERS: Record<string, string[]> = (() => {
  const map: Record<string, Set<string>> = {};
  for (const a of TIER1) map[a] = new Set<string>();
  for (const [key] of Object.entries(RECIPES)) {
    const [a, b] = key.split("+");
    if (TIER1.includes(a) && TIER1.includes(b)) {
      map[a].add(b);
      map[b].add(a);
    }
  }
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(map)) out[k] = Array.from(map[k]).sort();
  return out;
})();

// Only Tier1 items that can actually merge with some other Tier1
export const SPAWNABLE_TIER1: string[] = TIER1.filter(n => (TIER1_PARTNERS[n]?.length ?? 0) > 0);

// Helpers
export function getTier1Partners(name: string): string[] {
  return TIER1_PARTNERS[name] || [];
}
