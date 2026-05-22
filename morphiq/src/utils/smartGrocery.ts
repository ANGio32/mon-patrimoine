// ─── Types ────────────────────────────────────────────────────────────────────

export type StoreId = 'metro' | 'iga' | 'walmart' | 'superc' | 'maxi';

export type OptimizationMode =
  | 'cheapest'
  | 'organic'
  | 'local'
  | 'fewest_stores'
  | 'best_value';

export interface RecipeIngredient {
  raw: string;       // original string from recipe, e.g. "200g de Skyr nature"
  qty: number;       // numeric quantity
  unit: string;      // "g", "ml", "unités", "c.à.s", etc.
  name: string;      // normalized name, e.g. "skyr nature"
  category: string;  // ingredient category key for catalog lookup
}

export interface StoreProduct {
  id: string;
  storeId: StoreId;
  name: string;
  brand: string;
  packageSize: string;   // e.g. "500g", "1L", "12 unités"
  packageQty: number;    // numeric package size (in same unit as recipe)
  packageUnit: string;
  price: number;         // CAD
  pricePerUnit: number;  // price per base unit (per g, per ml, per unit)
  isOrganic: boolean;
  isLocal: boolean;
  tags: string[];
}

export interface MatchedProduct extends StoreProduct {
  quantityNeeded: number;
  packagesNeeded: number;
  totalCost: number;
}

export interface GroceryLineItem {
  ingredient: RecipeIngredient;
  candidates: MatchedProduct[];   // all matching products across stores
  selected: MatchedProduct | null;
}

export interface GroceryCart {
  items: GroceryLineItem[];
  totalCost: number;
  costPerServing: number;
  servings: number;
  store: StoreId | 'mixed';
}

// ─── Store Configs ─────────────────────────────────────────────────────────────

export const STORES: Record<StoreId, { name: string; color: string; searchUrl: string }> = {
  metro:   { name: 'Metro',   color: '#E31837', searchUrl: 'https://www.metro.ca/epicerie-en-ligne/recherche?filter=', },
  iga:     { name: 'IGA',     color: '#D41F26', searchUrl: 'https://www.iga.net/fr/recherche?k=', },
  walmart: { name: 'Walmart', color: '#0071CE', searchUrl: 'https://www.walmart.ca/search?q=', },
  superc:  { name: 'Super C', color: '#F5821F', searchUrl: 'https://www.superc.ca/epicerie-en-ligne/recherche?filter=', },
  maxi:    { name: 'Maxi',    color: '#FFD200', searchUrl: 'https://www.maxi.ca/epicerie-en-ligne/recherche?filter=', },
};

// ─── Mock Product Catalog ─────────────────────────────────────────────────────
// Realistic 2024-2025 Quebec pricing (CAD). Structured for future real API swap.

const catalog: StoreProduct[] = [
  // ── Skyr / Greek Yogurt ─────────────────────────────────────────────────────
  { id: 'skyr-metro-1', storeId: 'metro', name: 'Skyr nature', brand: 'Siggi\'s', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 6.49, pricePerUnit: 0.01298, isOrganic: false, isLocal: false, tags: ['skyr', 'yogourt', 'protéines'] },
  { id: 'skyr-iga-1', storeId: 'iga', name: 'Skyr nature 0%', brand: 'Skyr.is', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 5.99, pricePerUnit: 0.01198, isOrganic: false, isLocal: false, tags: ['skyr', 'yogourt', 'protéines'] },
  { id: 'skyr-walmart-1', storeId: 'walmart', name: 'Skyr Icelandic nature', brand: 'President\'s Choice', packageSize: '650g', packageQty: 650, packageUnit: 'g', price: 5.47, pricePerUnit: 0.00842, isOrganic: false, isLocal: false, tags: ['skyr', 'yogourt', 'protéines'] },
  { id: 'skyr-superc-1', storeId: 'superc', name: 'Skyr nature', brand: 'Compliments', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 4.99, pricePerUnit: 0.00998, isOrganic: false, isLocal: false, tags: ['skyr', 'yogourt', 'protéines'] },
  { id: 'skyr-maxi-1', storeId: 'maxi', name: 'Skyr nature', brand: 'Skyr.is', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 5.79, pricePerUnit: 0.01158, isOrganic: false, isLocal: false, tags: ['skyr', 'yogourt', 'protéines'] },
  // Greek yogurt fallbacks
  { id: 'greek-metro-1', storeId: 'metro', name: 'Yogourt grec nature 0%', brand: 'Fage', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 7.99, pricePerUnit: 0.01065, isOrganic: false, isLocal: false, tags: ['yogourt', 'grec', 'protéines'] },
  { id: 'greek-iga-1', storeId: 'iga', name: 'Yogourt grec nature', brand: 'Liberté', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 7.49, pricePerUnit: 0.00999, isOrganic: false, isLocal: true, tags: ['yogourt', 'grec', 'protéines'] },
  { id: 'greek-walmart-1', storeId: 'walmart', name: 'Greek Yogurt Plain', brand: 'Great Value', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 5.97, pricePerUnit: 0.00796, isOrganic: false, isLocal: false, tags: ['yogourt', 'grec', 'protéines'] },
  { id: 'greek-superc-1', storeId: 'superc', name: 'Yogourt grec 2%', brand: 'Oikos', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 7.29, pricePerUnit: 0.00972, isOrganic: false, isLocal: false, tags: ['yogourt', 'grec', 'protéines'] },
  { id: 'greek-maxi-1', storeId: 'maxi', name: 'Yogourt grec nature', brand: 'Oikos', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 6.99, pricePerUnit: 0.00932, isOrganic: false, isLocal: false, tags: ['yogourt', 'grec', 'protéines'] },

  // ── Oeufs / Eggs ───────────────────────────────────────────────────────────
  { id: 'eggs-metro-1', storeId: 'metro', name: 'Œufs extra-gros', brand: 'Burnbrae', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 5.49, pricePerUnit: 0.4575, isOrganic: false, isLocal: true, tags: ['oeufs', 'protéines'] },
  { id: 'eggs-iga-1', storeId: 'iga', name: 'Œufs gros blancs', brand: 'Ferme Bertrand', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 4.99, pricePerUnit: 0.4158, isOrganic: false, isLocal: true, tags: ['oeufs', 'protéines'] },
  { id: 'eggs-walmart-1', storeId: 'walmart', name: 'Large White Eggs', brand: 'Great Value', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 3.97, pricePerUnit: 0.3308, isOrganic: false, isLocal: false, tags: ['oeufs', 'protéines'] },
  { id: 'eggs-superc-1', storeId: 'superc', name: 'Œufs extra-gros', brand: 'Selection', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 4.49, pricePerUnit: 0.3742, isOrganic: false, isLocal: false, tags: ['oeufs', 'protéines'] },
  { id: 'eggs-maxi-1', storeId: 'maxi', name: 'Œufs gros', brand: 'Compliments', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 4.29, pricePerUnit: 0.3575, isOrganic: false, isLocal: false, tags: ['oeufs', 'protéines'] },
  { id: 'eggs-org-metro-1', storeId: 'metro', name: 'Œufs biologiques', brand: 'Natura', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 8.49, pricePerUnit: 0.7075, isOrganic: true, isLocal: true, tags: ['oeufs', 'bio', 'protéines'] },
  { id: 'eggs-org-iga-1', storeId: 'iga', name: 'Œufs biologiques gros', brand: 'Élite', packageSize: '12 unités', packageQty: 12, packageUnit: 'unités', price: 7.99, pricePerUnit: 0.6658, isOrganic: true, isLocal: true, tags: ['oeufs', 'bio', 'protéines'] },

  // ── Flocons d'avoine / Oats ────────────────────────────────────────────────
  { id: 'oats-metro-1', storeId: 'metro', name: 'Flocons d\'avoine à l\'ancienne', brand: 'Quaker', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 5.49, pricePerUnit: 0.00549, isOrganic: false, isLocal: false, tags: ['avoine', 'flocons', 'céréales'] },
  { id: 'oats-iga-1', storeId: 'iga', name: 'Gruau à l\'ancienne', brand: 'Robin Hood', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 4.99, pricePerUnit: 0.00499, isOrganic: false, isLocal: false, tags: ['avoine', 'flocons', 'céréales'] },
  { id: 'oats-walmart-1', storeId: 'walmart', name: 'Old-fashioned Oats', brand: 'Great Value', packageSize: '1.36kg', packageQty: 1360, packageUnit: 'g', price: 4.27, pricePerUnit: 0.00314, isOrganic: false, isLocal: false, tags: ['avoine', 'flocons', 'céréales'] },
  { id: 'oats-superc-1', storeId: 'superc', name: 'Flocons d\'avoine', brand: 'Selection', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 4.49, pricePerUnit: 0.00449, isOrganic: false, isLocal: false, tags: ['avoine', 'flocons', 'céréales'] },
  { id: 'oats-maxi-1', storeId: 'maxi', name: 'Gruau à l\'ancienne', brand: 'Quaker', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 5.19, pricePerUnit: 0.00519, isOrganic: false, isLocal: false, tags: ['avoine', 'flocons', 'céréales'] },
  { id: 'oats-org-1', storeId: 'metro', name: 'Flocons d\'avoine biologiques', brand: 'Bob\'s Red Mill', packageSize: '907g', packageQty: 907, packageUnit: 'g', price: 8.99, pricePerUnit: 0.00991, isOrganic: true, isLocal: false, tags: ['avoine', 'bio', 'céréales'] },

  // ── Poulet / Chicken ────────────────────────────────────────────────────────
  { id: 'chicken-metro-1', storeId: 'metro', name: 'Poitrines de poulet sans os', brand: 'Maple Leaf', packageSize: '900g', packageQty: 900, packageUnit: 'g', price: 13.99, pricePerUnit: 0.01554, isOrganic: false, isLocal: false, tags: ['poulet', 'viande', 'protéines'] },
  { id: 'chicken-iga-1', storeId: 'iga', name: 'Poitrines de poulet désossées', brand: 'Ferme Famille Goulet', packageSize: '800g', packageQty: 800, packageUnit: 'g', price: 12.99, pricePerUnit: 0.01624, isOrganic: false, isLocal: true, tags: ['poulet', 'viande', 'protéines'] },
  { id: 'chicken-walmart-1', storeId: 'walmart', name: 'Chicken Breast Boneless', brand: 'Great Value', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 10.97, pricePerUnit: 0.01097, isOrganic: false, isLocal: false, tags: ['poulet', 'viande', 'protéines'] },
  { id: 'chicken-superc-1', storeId: 'superc', name: 'Poitrines de poulet', brand: 'Selection', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 11.49, pricePerUnit: 0.01149, isOrganic: false, isLocal: false, tags: ['poulet', 'viande', 'protéines'] },
  { id: 'chicken-maxi-1', storeId: 'maxi', name: 'Poitrines poulet sans os/sans peau', brand: 'Olymel', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 11.99, pricePerUnit: 0.01199, isOrganic: false, isLocal: false, tags: ['poulet', 'viande', 'protéines'] },
  { id: 'chicken-org-1', storeId: 'iga', name: 'Poitrines poulet biologiques', brand: 'Ferme Bio', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 16.99, pricePerUnit: 0.02832, isOrganic: true, isLocal: true, tags: ['poulet', 'bio', 'protéines'] },

  // ── Fruits rouges / Berries ─────────────────────────────────────────────────
  { id: 'berries-metro-1', storeId: 'metro', name: 'Mélange baies surgelées', brand: 'M\'Lord', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 7.49, pricePerUnit: 0.01248, isOrganic: false, isLocal: false, tags: ['fruits', 'baies', 'surgelé'] },
  { id: 'berries-iga-1', storeId: 'iga', name: 'Baies mélangées surgelées', brand: 'Irresistibles', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 7.29, pricePerUnit: 0.01215, isOrganic: false, isLocal: false, tags: ['fruits', 'baies', 'surgelé'] },
  { id: 'berries-walmart-1', storeId: 'walmart', name: 'Mixed Berries Frozen', brand: 'Great Value', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 6.47, pricePerUnit: 0.00863, isOrganic: false, isLocal: false, tags: ['fruits', 'baies', 'surgelé'] },
  { id: 'berries-superc-1', storeId: 'superc', name: 'Mélange 3 fruits surgelés', brand: 'Selection', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 6.99, pricePerUnit: 0.01165, isOrganic: false, isLocal: false, tags: ['fruits', 'baies', 'surgelé'] },
  { id: 'berries-maxi-1', storeId: 'maxi', name: 'Baies sauvages surgelées', brand: 'Compliments', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 6.79, pricePerUnit: 0.01132, isOrganic: false, isLocal: false, tags: ['fruits', 'baies', 'surgelé'] },
  { id: 'blueberries-org-1', storeId: 'metro', name: 'Bleuets biologiques surgelés', brand: 'Nature\'s Touch', packageSize: '600g', packageQty: 600, packageUnit: 'g', price: 9.99, pricePerUnit: 0.01665, isOrganic: true, isLocal: true, tags: ['bleuets', 'bio', 'surgelé'] },

  // ── Banane / Banana ─────────────────────────────────────────────────────────
  { id: 'banana-metro-1', storeId: 'metro', name: 'Bananes', brand: 'Dole', packageSize: '1 régime (~6)', packageQty: 6, packageUnit: 'unités', price: 1.99, pricePerUnit: 0.332, isOrganic: false, isLocal: false, tags: ['banane', 'fruits'] },
  { id: 'banana-iga-1', storeId: 'iga', name: 'Bananes jaunes', brand: 'Chiquita', packageSize: '1 régime (~5)', packageQty: 5, packageUnit: 'unités', price: 1.79, pricePerUnit: 0.358, isOrganic: false, isLocal: false, tags: ['banane', 'fruits'] },
  { id: 'banana-walmart-1', storeId: 'walmart', name: 'Bananas', brand: 'Generic', packageSize: '1.36kg', packageQty: 1360, packageUnit: 'g', price: 1.57, pricePerUnit: 0.00115, isOrganic: false, isLocal: false, tags: ['banane', 'fruits'] },
  { id: 'banana-superc-1', storeId: 'superc', name: 'Bananes', brand: 'Generic', packageSize: '1 kg', packageQty: 1000, packageUnit: 'g', price: 1.29, pricePerUnit: 0.00129, isOrganic: false, isLocal: false, tags: ['banane', 'fruits'] },
  { id: 'banana-maxi-1', storeId: 'maxi', name: 'Bananes mûres', brand: 'Generic', packageSize: '1 kg', packageQty: 1000, packageUnit: 'g', price: 1.19, pricePerUnit: 0.00119, isOrganic: false, isLocal: false, tags: ['banane', 'fruits'] },

  // ── Protéines en poudre / Protein Powder ────────────────────────────────────
  { id: 'protein-metro-1', storeId: 'metro', name: 'Protéines whey vanille', brand: 'Optimum Nutrition', packageSize: '908g', packageQty: 908, packageUnit: 'g', price: 44.99, pricePerUnit: 0.04955, isOrganic: false, isLocal: false, tags: ['protéine', 'whey', 'supplément'] },
  { id: 'protein-walmart-1', storeId: 'walmart', name: 'Whey Protein Vanilla', brand: 'Kirkland', packageSize: '1.13kg', packageQty: 1130, packageUnit: 'g', price: 34.97, pricePerUnit: 0.03094, isOrganic: false, isLocal: false, tags: ['protéine', 'whey', 'supplément'] },
  { id: 'protein-iga-1', storeId: 'iga', name: 'Protéines de lactosérum', brand: 'Neilson', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 39.99, pricePerUnit: 0.03999, isOrganic: false, isLocal: false, tags: ['protéine', 'whey', 'supplément'] },

  // ── Lait / Milk ─────────────────────────────────────────────────────────────
  { id: 'milk-metro-1', storeId: 'metro', name: 'Lait 2%', brand: 'Lactantia', packageSize: '2L', packageQty: 2000, packageUnit: 'ml', price: 4.99, pricePerUnit: 0.0025, isOrganic: false, isLocal: true, tags: ['lait', 'dairy'] },
  { id: 'milk-iga-1', storeId: 'iga', name: 'Lait 2% homogénéisé', brand: 'Natrel', packageSize: '2L', packageQty: 2000, packageUnit: 'ml', price: 5.29, pricePerUnit: 0.00265, isOrganic: false, isLocal: true, tags: ['lait', 'dairy'] },
  { id: 'milk-walmart-1', storeId: 'walmart', name: '2% Partly Skimmed Milk', brand: 'Great Value', packageSize: '2L', packageQty: 2000, packageUnit: 'ml', price: 3.97, pricePerUnit: 0.00199, isOrganic: false, isLocal: false, tags: ['lait', 'dairy'] },
  { id: 'milk-superc-1', storeId: 'superc', name: 'Lait partiellement écrémé 2%', brand: 'Sealtest', packageSize: '2L', packageQty: 2000, packageUnit: 'ml', price: 4.49, pricePerUnit: 0.00225, isOrganic: false, isLocal: false, tags: ['lait', 'dairy'] },
  { id: 'milk-maxi-1', storeId: 'maxi', name: 'Lait 2%', brand: 'Sealtest', packageSize: '2L', packageQty: 2000, packageUnit: 'ml', price: 4.69, pricePerUnit: 0.00235, isOrganic: false, isLocal: false, tags: ['lait', 'dairy'] },

  // ── Beurre d'amandes / Almond Butter ────────────────────────────────────────
  { id: 'almond-butter-metro-1', storeId: 'metro', name: 'Beurre d\'amandes naturel', brand: 'Krema', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 10.99, pricePerUnit: 0.02198, isOrganic: false, isLocal: false, tags: ['beurre amandes', 'noix', 'protéines'] },
  { id: 'almond-butter-iga-1', storeId: 'iga', name: 'Beurre d\'amandes', brand: 'Justin\'s', packageSize: '454g', packageQty: 454, packageUnit: 'g', price: 12.49, pricePerUnit: 0.02751, isOrganic: false, isLocal: false, tags: ['beurre amandes', 'noix', 'protéines'] },
  { id: 'almond-butter-walmart-1', storeId: 'walmart', name: 'Almond Butter Natural', brand: 'Great Value', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 8.97, pricePerUnit: 0.01794, isOrganic: false, isLocal: false, tags: ['beurre amandes', 'noix', 'protéines'] },
  { id: 'peanut-butter-metro-1', storeId: 'metro', name: 'Beurre d\'arachide naturel', brand: 'Kraft', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 8.99, pricePerUnit: 0.00899, isOrganic: false, isLocal: false, tags: ['beurre arachide', 'noix', 'protéines'] },
  { id: 'peanut-butter-walmart-1', storeId: 'walmart', name: 'Peanut Butter Natural', brand: 'Great Value', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 6.97, pricePerUnit: 0.00697, isOrganic: false, isLocal: false, tags: ['beurre arachide', 'noix', 'protéines'] },

  // ── Riz / Rice ──────────────────────────────────────────────────────────────
  { id: 'rice-metro-1', storeId: 'metro', name: 'Riz basmati blanc', brand: 'Riviana', packageSize: '2kg', packageQty: 2000, packageUnit: 'g', price: 8.49, pricePerUnit: 0.00425, isOrganic: false, isLocal: false, tags: ['riz', 'céréales', 'glucides'] },
  { id: 'rice-iga-1', storeId: 'iga', name: 'Riz à grain long', brand: 'Uncle Ben\'s', packageSize: '1.8kg', packageQty: 1800, packageUnit: 'g', price: 7.99, pricePerUnit: 0.00444, isOrganic: false, isLocal: false, tags: ['riz', 'céréales', 'glucides'] },
  { id: 'rice-walmart-1', storeId: 'walmart', name: 'Long Grain White Rice', brand: 'Great Value', packageSize: '2kg', packageQty: 2000, packageUnit: 'g', price: 5.47, pricePerUnit: 0.00274, isOrganic: false, isLocal: false, tags: ['riz', 'céréales', 'glucides'] },
  { id: 'rice-superc-1', storeId: 'superc', name: 'Riz blanc à grain long', brand: 'Selection', packageSize: '2kg', packageQty: 2000, packageUnit: 'g', price: 6.49, pricePerUnit: 0.00325, isOrganic: false, isLocal: false, tags: ['riz', 'céréales', 'glucides'] },
  { id: 'rice-maxi-1', storeId: 'maxi', name: 'Riz basmati', brand: 'Elephant', packageSize: '2kg', packageQty: 2000, packageUnit: 'g', price: 7.29, pricePerUnit: 0.00365, isOrganic: false, isLocal: false, tags: ['riz', 'céréales', 'glucides'] },

  // ── Épinards / Spinach ──────────────────────────────────────────────────────
  { id: 'spinach-metro-1', storeId: 'metro', name: 'Épinards frais', brand: 'Earthbound Farm', packageSize: '142g', packageQty: 142, packageUnit: 'g', price: 4.99, pricePerUnit: 0.03514, isOrganic: false, isLocal: false, tags: ['épinards', 'légumes', 'salade'] },
  { id: 'spinach-iga-1', storeId: 'iga', name: 'Bébés épinards', brand: 'Attitude Fraîche', packageSize: '142g', packageQty: 142, packageUnit: 'g', price: 4.79, pricePerUnit: 0.03373, isOrganic: false, isLocal: true, tags: ['épinards', 'légumes', 'salade'] },
  { id: 'spinach-walmart-1', storeId: 'walmart', name: 'Baby Spinach', brand: 'Great Value', packageSize: '340g', packageQty: 340, packageUnit: 'g', price: 4.97, pricePerUnit: 0.01462, isOrganic: false, isLocal: false, tags: ['épinards', 'légumes', 'salade'] },
  { id: 'spinach-superc-1', storeId: 'superc', name: 'Épinards bébé', brand: 'Selection', packageSize: '142g', packageQty: 142, packageUnit: 'g', price: 3.99, pricePerUnit: 0.02810, isOrganic: false, isLocal: false, tags: ['épinards', 'légumes', 'salade'] },
  { id: 'spinach-maxi-1', storeId: 'maxi', name: 'Épinards frais', brand: 'Generic', packageSize: '227g', packageQty: 227, packageUnit: 'g', price: 3.79, pricePerUnit: 0.01670, isOrganic: false, isLocal: false, tags: ['épinards', 'légumes', 'salade'] },
  { id: 'spinach-frozen-1', storeId: 'walmart', name: 'Épinards hachés surgelés', brand: 'Great Value', packageSize: '300g', packageQty: 300, packageUnit: 'g', price: 2.97, pricePerUnit: 0.00990, isOrganic: false, isLocal: false, tags: ['épinards', 'surgelé', 'légumes'] },

  // ── Patate douce / Sweet Potato ─────────────────────────────────────────────
  { id: 'sweetpotato-metro-1', storeId: 'metro', name: 'Patates douces', brand: 'Generic', packageSize: '1.5kg', packageQty: 1500, packageUnit: 'g', price: 5.99, pricePerUnit: 0.00399, isOrganic: false, isLocal: false, tags: ['patate douce', 'légumes', 'glucides'] },
  { id: 'sweetpotato-iga-1', storeId: 'iga', name: 'Patates douces orange', brand: 'Generic', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 4.49, pricePerUnit: 0.00449, isOrganic: false, isLocal: false, tags: ['patate douce', 'légumes', 'glucides'] },
  { id: 'sweetpotato-walmart-1', storeId: 'walmart', name: 'Sweet Potatoes', brand: 'Generic', packageSize: '2kg', packageQty: 2000, packageUnit: 'g', price: 5.97, pricePerUnit: 0.00299, isOrganic: false, isLocal: false, tags: ['patate douce', 'légumes', 'glucides'] },
  { id: 'sweetpotato-superc-1', storeId: 'superc', name: 'Patates douces', brand: 'Generic', packageSize: '1.5kg', packageQty: 1500, packageUnit: 'g', price: 4.99, pricePerUnit: 0.00333, isOrganic: false, isLocal: false, tags: ['patate douce', 'légumes', 'glucides'] },

  // ── Huile d'olive / Olive Oil ────────────────────────────────────────────────
  { id: 'oliveoil-metro-1', storeId: 'metro', name: 'Huile d\'olive extra vierge', brand: 'Bertolli', packageSize: '750ml', packageQty: 750, packageUnit: 'ml', price: 12.99, pricePerUnit: 0.01732, isOrganic: false, isLocal: false, tags: ['huile', 'huile olive', 'gras'] },
  { id: 'oliveoil-iga-1', storeId: 'iga', name: 'Huile d\'olive vierge extra', brand: 'Carbonell', packageSize: '750ml', packageQty: 750, packageUnit: 'ml', price: 11.99, pricePerUnit: 0.01599, isOrganic: false, isLocal: false, tags: ['huile', 'huile olive', 'gras'] },
  { id: 'oliveoil-walmart-1', storeId: 'walmart', name: 'Extra Virgin Olive Oil', brand: 'Great Value', packageSize: '1L', packageQty: 1000, packageUnit: 'ml', price: 9.97, pricePerUnit: 0.00997, isOrganic: false, isLocal: false, tags: ['huile', 'huile olive', 'gras'] },
  { id: 'oliveoil-superc-1', storeId: 'superc', name: 'Huile d\'olive extra vierge', brand: 'Selection', packageSize: '750ml', packageQty: 750, packageUnit: 'ml', price: 10.49, pricePerUnit: 0.01399, isOrganic: false, isLocal: false, tags: ['huile', 'huile olive', 'gras'] },

  // ── Tomates / Tomatoes ──────────────────────────────────────────────────────
  { id: 'tomato-metro-1', storeId: 'metro', name: 'Tomates en dés 28oz', brand: 'Del Monte', packageSize: '796ml', packageQty: 796, packageUnit: 'ml', price: 2.49, pricePerUnit: 0.00313, isOrganic: false, isLocal: false, tags: ['tomates', 'conserve', 'légumes'] },
  { id: 'tomato-iga-1', storeId: 'iga', name: 'Tomates broyées', brand: 'Irresistibles', packageSize: '796ml', packageQty: 796, packageUnit: 'ml', price: 2.29, pricePerUnit: 0.00288, isOrganic: false, isLocal: false, tags: ['tomates', 'conserve', 'légumes'] },
  { id: 'tomato-walmart-1', storeId: 'walmart', name: 'Diced Tomatoes', brand: 'Great Value', packageSize: '796ml', packageQty: 796, packageUnit: 'ml', price: 1.47, pricePerUnit: 0.00185, isOrganic: false, isLocal: false, tags: ['tomates', 'conserve', 'légumes'] },
  { id: 'tomato-cherry-metro-1', storeId: 'metro', name: 'Tomates cerises', brand: 'Generic', packageSize: '454g', packageQty: 454, packageUnit: 'g', price: 3.99, pricePerUnit: 0.00879, isOrganic: false, isLocal: true, tags: ['tomates', 'cerises', 'légumes'] },

  // ── Pois chiches / Chickpeas ────────────────────────────────────────────────
  { id: 'chickpeas-metro-1', storeId: 'metro', name: 'Pois chiches en conserve', brand: 'Unico', packageSize: '540ml', packageQty: 540, packageUnit: 'ml', price: 1.99, pricePerUnit: 0.00369, isOrganic: false, isLocal: false, tags: ['pois chiches', 'légumineuses', 'protéines'] },
  { id: 'chickpeas-walmart-1', storeId: 'walmart', name: 'Chickpeas Canned', brand: 'Great Value', packageSize: '540ml', packageQty: 540, packageUnit: 'ml', price: 1.27, pricePerUnit: 0.00235, isOrganic: false, isLocal: false, tags: ['pois chiches', 'légumineuses', 'protéines'] },
  { id: 'chickpeas-iga-1', storeId: 'iga', name: 'Pois chiches cuits', brand: 'Compliments', packageSize: '540ml', packageQty: 540, packageUnit: 'ml', price: 1.79, pricePerUnit: 0.00331, isOrganic: false, isLocal: false, tags: ['pois chiches', 'légumineuses', 'protéines'] },

  // ── Saumon / Salmon ─────────────────────────────────────────────────────────
  { id: 'salmon-metro-1', storeId: 'metro', name: 'Filets de saumon Atlantique', brand: 'Generic', packageSize: '400g', packageQty: 400, packageUnit: 'g', price: 12.99, pricePerUnit: 0.03248, isOrganic: false, isLocal: false, tags: ['saumon', 'poisson', 'protéines'] },
  { id: 'salmon-iga-1', storeId: 'iga', name: 'Saumon Atlantique frais', brand: 'Clearwater', packageSize: '400g', packageQty: 400, packageUnit: 'g', price: 13.49, pricePerUnit: 0.03373, isOrganic: false, isLocal: false, tags: ['saumon', 'poisson', 'protéines'] },
  { id: 'salmon-walmart-1', storeId: 'walmart', name: 'Atlantic Salmon Fillet', brand: 'Generic', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 11.97, pricePerUnit: 0.02394, isOrganic: false, isLocal: false, tags: ['saumon', 'poisson', 'protéines'] },
  { id: 'salmon-can-metro-1', storeId: 'metro', name: 'Saumon rose en conserve', brand: 'Clover Leaf', packageSize: '213g', packageQty: 213, packageUnit: 'g', price: 3.99, pricePerUnit: 0.01873, isOrganic: false, isLocal: false, tags: ['saumon', 'conserve', 'protéines'] },

  // ── Légumes génériques ──────────────────────────────────────────────────────
  { id: 'broccoli-metro-1', storeId: 'metro', name: 'Brocoli', brand: 'Generic', packageSize: '1 tête (~500g)', packageQty: 500, packageUnit: 'g', price: 3.49, pricePerUnit: 0.00698, isOrganic: false, isLocal: true, tags: ['brocoli', 'légumes'] },
  { id: 'broccoli-walmart-1', storeId: 'walmart', name: 'Broccoli Crown', brand: 'Generic', packageSize: '1 tête (~500g)', packageQty: 500, packageUnit: 'g', price: 2.97, pricePerUnit: 0.00594, isOrganic: false, isLocal: false, tags: ['brocoli', 'légumes'] },
  { id: 'broccoli-frozen-1', storeId: 'superc', name: 'Brocoli surgelé en bouquets', brand: 'Selection', packageSize: '750g', packageQty: 750, packageUnit: 'g', price: 4.49, pricePerUnit: 0.00599, isOrganic: false, isLocal: false, tags: ['brocoli', 'surgelé', 'légumes'] },

  { id: 'carrot-metro-1', storeId: 'metro', name: 'Carottes', brand: 'Generic', packageSize: '2lb (~900g)', packageQty: 900, packageUnit: 'g', price: 2.99, pricePerUnit: 0.00332, isOrganic: false, isLocal: true, tags: ['carottes', 'légumes'] },
  { id: 'carrot-walmart-1', storeId: 'walmart', name: 'Baby Carrots', brand: 'Great Value', packageSize: '1kg', packageQty: 1000, packageUnit: 'g', price: 2.47, pricePerUnit: 0.00247, isOrganic: false, isLocal: false, tags: ['carottes', 'légumes'] },

  { id: 'onion-metro-1', storeId: 'metro', name: 'Oignons jaunes', brand: 'Generic', packageSize: '3lb (~1.36kg)', packageQty: 1360, packageUnit: 'g', price: 3.99, pricePerUnit: 0.00293, isOrganic: false, isLocal: true, tags: ['oignons', 'légumes'] },
  { id: 'onion-walmart-1', storeId: 'walmart', name: 'Yellow Onions', brand: 'Generic', packageSize: '3lb (~1.36kg)', packageQty: 1360, packageUnit: 'g', price: 2.97, pricePerUnit: 0.00218, isOrganic: false, isLocal: false, tags: ['oignons', 'légumes'] },

  { id: 'garlic-metro-1', storeId: 'metro', name: 'Ail frais', brand: 'Generic', packageSize: '3 têtes', packageQty: 3, packageUnit: 'têtes', price: 2.49, pricePerUnit: 0.83, isOrganic: false, isLocal: true, tags: ['ail', 'légumes'] },
  { id: 'garlic-walmart-1', storeId: 'walmart', name: 'Garlic bulbs', brand: 'Generic', packageSize: '3 bulbes', packageQty: 3, packageUnit: 'têtes', price: 1.97, pricePerUnit: 0.657, isOrganic: false, isLocal: false, tags: ['ail', 'légumes'] },

  // ── Fromage cottage ─────────────────────────────────────────────────────────
  { id: 'cottage-metro-1', storeId: 'metro', name: 'Fromage cottage 1%', brand: 'Nordica', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 4.99, pricePerUnit: 0.00998, isOrganic: false, isLocal: false, tags: ['fromage cottage', 'protéines', 'dairy'] },
  { id: 'cottage-walmart-1', storeId: 'walmart', name: 'Cottage Cheese 2%', brand: 'Great Value', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 3.97, pricePerUnit: 0.00794, isOrganic: false, isLocal: false, tags: ['fromage cottage', 'protéines', 'dairy'] },
  { id: 'cottage-iga-1', storeId: 'iga', name: 'Fromage cottage légère', brand: 'Quebon', packageSize: '500g', packageQty: 500, packageUnit: 'g', price: 4.69, pricePerUnit: 0.00938, isOrganic: false, isLocal: true, tags: ['fromage cottage', 'protéines', 'dairy'] },
];

// ─── Ingredient Category Mapping ────────────────────────────────────────────────
// Maps keyword fragments (lowercase) found in ingredient strings to catalog tags

const KEYWORD_TO_TAG: [RegExp, string[]][] = [
  [/skyr/i, ['skyr']],
  [/yogourt grec|greek yogurt|yaourt grec/i, ['grec']],
  [/yogourt|yaourt|yogurt/i, ['yogourt']],
  [/œufs?|oeufs?|eggs?/i, ['oeufs']],
  [/blanc(s)? d'œuf|egg white/i, ['oeufs']],
  [/flocons? d'avoine|gruau|avoine|oats?/i, ['avoine']],
  [/poulet|chicken/i, ['poulet']],
  [/saumon|salmon/i, ['saumon']],
  [/baies?|berries|bleuets?|framboises?|fraises?|mûres?/i, ['baies']],
  [/banane|banana/i, ['banane']],
  [/protéine(s)? (en poudre|whey)|whey|protein powder/i, ['protéine', 'whey']],
  [/lait|milk/i, ['lait']],
  [/beurre d'amandes?|almond butter/i, ['beurre amandes']],
  [/beurre d'arachide|peanut butter/i, ['beurre arachide']],
  [/riz|rice/i, ['riz']],
  [/épinards?|spinach/i, ['épinards']],
  [/patate(s)? douce(s)?|sweet potato|yam/i, ['patate douce']],
  [/huile d'olive|olive oil/i, ['huile olive']],
  [/tomates?|tomato|tomatoes/i, ['tomates']],
  [/pois chiches?|chickpeas?/i, ['pois chiches']],
  [/brocoli|broccoli/i, ['brocoli']],
  [/carottes?|carrots?/i, ['carottes']],
  [/oignons?|onions?|échalotes?/i, ['oignons']],
  [/ail|garlic/i, ['ail']],
  [/fromage cottage|cottage cheese/i, ['fromage cottage']],
];

// ─── Parsing ──────────────────────────────────────────────────────────────────

const UNIT_PATTERNS: [RegExp, string, number][] = [
  [/(\d+(?:[.,]\d+)?)\s*kg\b/i, 'g', 1000],
  [/(\d+(?:[.,]\d+)?)\s*g\b/i, 'g', 1],
  [/(\d+(?:[.,]\d+)?)\s*L\b/i, 'ml', 1000],
  [/(\d+(?:[.,]\d+)?)\s*ml\b/i, 'ml', 1],
  [/(\d+(?:[.,]\d+)?)\s*c\.?à\.?s\.?/i, 'ml', 15],    // tablespoon ≈ 15ml
  [/(\d+(?:[.,]\d+)?)\s*c\.?à\.?c\.?/i, 'ml', 5],     // teaspoon ≈ 5ml
  [/(\d+(?:[.,]\d+)?)\s*tasse(s)?/i, 'ml', 250],       // cup ≈ 250ml
  [/(\d+(?:[.,]\d+)?)\s*portion(s)?/i, 'unités', 1],
  [/(\d+(?:[.,]\d+)?)/, 'unités', 1],                  // bare number fallback
];

export function parseIngredient(raw: string): RecipeIngredient {
  let qty = 1;
  let unit = 'unités';

  for (const [re, u, mult] of UNIT_PATTERNS) {
    const m = raw.match(re);
    if (m) {
      qty = parseFloat(m[1].replace(',', '.')) * mult;
      unit = u;
      break;
    }
  }

  // find category
  let category = 'other';
  for (const [re, tags] of KEYWORD_TO_TAG) {
    if (re.test(raw)) { category = tags[0]; break; }
  }

  const name = raw
    .replace(/^\d+(?:[.,]\d+)?\s*(kg|g|L|ml|c\.?à\.?[sc]\.?|tasse[s]?|unités?|portion[s]?)?\s*/i, '')
    .replace(/^de\s+|^d'\s*/i, '')
    .trim()
    .toLowerCase();

  return { raw, qty, unit, name, category };
}

// ─── Matching ─────────────────────────────────────────────────────────────────

function scoreProduct(product: StoreProduct, ingredient: RecipeIngredient, mode: OptimizationMode): number {
  const tagMatch = product.tags.includes(ingredient.category);
  if (!tagMatch) return -Infinity;

  let score = 0;

  switch (mode) {
    case 'cheapest':
      score = -product.pricePerUnit;
      break;
    case 'organic':
      score = (product.isOrganic ? 1000 : 0) - product.pricePerUnit;
      break;
    case 'local':
      score = (product.isLocal ? 1000 : 0) - product.pricePerUnit;
      break;
    case 'best_value':
      // Ratio of name-brand bonus vs price
      score = (product.isOrganic ? 200 : 0) + (product.isLocal ? 100 : 0) - product.pricePerUnit * 50;
      break;
    case 'fewest_stores':
      score = -product.pricePerUnit;
      break;
  }

  return score;
}

export function matchIngredient(
  ingredient: RecipeIngredient,
  preferredStores: StoreId[],
  mode: OptimizationMode,
): MatchedProduct[] {
  // filter by tag match
  const candidates = catalog.filter(p => {
    if (preferredStores.length > 0 && !preferredStores.includes(p.storeId)) return false;
    // check category tag present in product
    const catTags = KEYWORD_TO_TAG.find(([re]) => re.test(ingredient.raw));
    if (!catTags) return false;
    return catTags[1].some(t => p.tags.includes(t));
  });

  if (candidates.length === 0) return [];

  // score and sort
  const scored = candidates
    .map(p => ({ product: p, score: scoreProduct(p, ingredient, mode) }))
    .filter(x => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ product }) => {
    const packagesNeeded = Math.ceil(ingredient.qty / product.packageQty);
    const totalCost = packagesNeeded * product.price;
    return {
      ...product,
      quantityNeeded: ingredient.qty,
      packagesNeeded,
      totalCost,
    };
  });
}

// ─── Cart Builder ─────────────────────────────────────────────────────────────

export function buildGroceryCart(
  ingredients: string[],
  preferredStores: StoreId[],
  mode: OptimizationMode,
  servings: number,
): GroceryCart {
  const parsed = ingredients.map(parseIngredient);

  const items: GroceryLineItem[] = parsed.map(ingredient => {
    const candidates = matchIngredient(ingredient, preferredStores, mode);
    return {
      ingredient,
      candidates,
      selected: candidates[0] ?? null,
    };
  });

  // For fewest_stores: group by store and pick the store covering most items cheaply
  if (mode === 'fewest_stores' && preferredStores.length > 1) {
    const storeCount: Record<string, number> = {};
    for (const item of items) {
      if (item.selected) {
        storeCount[item.selected.storeId] = (storeCount[item.selected.storeId] ?? 0) + 1;
      }
    }
    const dominantStore = Object.entries(storeCount).sort((a, b) => b[1] - a[1])[0]?.[0] as StoreId | undefined;
    if (dominantStore) {
      for (const item of items) {
        const storeCandidate = item.candidates.find(c => c.storeId === dominantStore);
        if (storeCandidate) item.selected = storeCandidate;
      }
    }
  }

  const totalCost = items.reduce((sum, i) => sum + (i.selected?.totalCost ?? 0), 0);
  const usedStores = new Set(items.map(i => i.selected?.storeId).filter(Boolean));

  return {
    items,
    totalCost,
    costPerServing: servings > 0 ? totalCost / servings : totalCost,
    servings,
    store: usedStores.size === 1 ? ([...usedStores][0] as StoreId) : 'mixed',
  };
}

export function exportCartAsText(cart: GroceryCart, recipeName: string): string {
  const lines = [
    `Liste de courses — ${recipeName}`,
    `${cart.servings} portions · ${cart.totalCost.toFixed(2)} $ CAD · ${(cart.costPerServing).toFixed(2)} $/portion`,
    '',
  ];
  for (const item of cart.items) {
    if (item.selected) {
      lines.push(`• ${item.ingredient.raw}`);
      lines.push(`  → ${item.selected.name} (${item.selected.brand}) ${item.selected.packageSize} × ${item.selected.packagesNeeded} — ${item.selected.totalCost.toFixed(2)} $`);
    } else {
      lines.push(`• ${item.ingredient.raw}  [non trouvé]`);
    }
  }
  lines.push('', `Généré par Morphiq le ${new Date().toLocaleDateString('fr-CA')}`);
  return lines.join('\n');
}
