// ─── Types ────────────────────────────────────────────────────────────────────

export type StoreId = 'metro' | 'iga' | 'walmart' | 'superc' | 'maxi';

export type OptimizationMode =
  | 'cheapest'
  | 'organic'
  | 'local'
  | 'fewest_stores'
  | 'best_value';

export interface RecipeIngredient {
  raw: string;
  qty: number;
  unit: string;
  name: string;
  category: string; // matched tag key, e.g. 'saumon', 'oeufs'
}

export interface StoreProduct {
  id: string;
  storeId: StoreId;
  name: string;
  brand: string;
  packageSize: string;
  packageQty: number;
  packageUnit: string;
  price: number;
  pricePerUnit: number;
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
  candidates: MatchedProduct[];
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
  metro:   { name: 'Metro',   color: '#E31837', searchUrl: 'https://www.metro.ca/epicerie-en-ligne/recherche?filter=' },
  iga:     { name: 'IGA',     color: '#D41F26', searchUrl: 'https://www.iga.net/fr/recherche?k=' },
  walmart: { name: 'Walmart', color: '#0071CE', searchUrl: 'https://www.walmart.ca/search?q=' },
  superc:  { name: 'Super C', color: '#F5821F', searchUrl: 'https://www.superc.ca/epicerie-en-ligne/recherche?filter=' },
  maxi:    { name: 'Maxi',    color: '#FFD200', searchUrl: 'https://www.maxi.ca/epicerie-en-ligne/recherche?filter=' },
};

// ─── Ingredient → Catalog Tag Mapping ─────────────────────────────────────────
// Order matters — first match wins. Each entry: [regex, [primaryTag, ...extraTags]]

export const KEYWORD_TO_TAG: [RegExp, string[]][] = [
  // ── Dairy / protein ───────────────────────────────────────────────────────
  [/skyr/i,                                                       ['skyr']],
  [/yogourt grec|greek yogurt|yaourt grec/i,                      ['grec']],
  [/fromage blanc|fromage frais|quark|faisselle/i,                ['fromage blanc']],
  [/cottage cheese|fromage cottage/i,                             ['fromage cottage']],
  [/yogourt|yaourt|yogurt/i,                                      ['yogourt']],
  [/feta/i,                                                       ['feta']],
  [/parmesan/i,                                                   ['parmesan']],
  [/fromage|cheese|gruyère|emmental|comté|cheddar/i,              ['fromage']],
  [/crème fraîche|sour cream/i,                                   ['crème fraîche']],
  [/beurre(?!\s*d[''e])/i,                                        ['beurre']],
  // ── Œufs ──────────────────────────────────────────────────────────────────
  [/œufs?|oeufs?|eggs?|blanc(s)? d[''e]œuf/i,                    ['oeufs']],
  // ── Céréales / féculents ──────────────────────────────────────────────────
  [/flocons? d[''e]avoine|gruau|avoine|oats?/i,                   ['avoine']],
  [/granola|muesli/i,                                             ['granola']],
  [/quinoa/i,                                                     ['quinoa']],
  [/boulgour|bulgur|blé|blé concassé/i,                           ['boulgour']],
  [/lentilles?|lentil/i,                                          ['lentilles']],
  [/pois chich[ae]s?|chickpeas?|pois cassés/i,                    ['pois chiches']],
  [/haricots? rouges?|kidney beans?/i,                            ['haricots rouges']],
  [/pâtes|pasta|spaghetti|linguine|fusilli/i,                     ['pâtes']],
  [/riz|rice/i,                                                   ['riz']],
  [/pain|wrap|tortilla|seigle|complet|brioche|baguette/i,         ['pain']],
  [/crackers?|galettes?/i,                                        ['crackers']],
  // ── Viandes / poissons ────────────────────────────────────────────────────
  [/poulet|chicken|blanc de volaille/i,                           ['poulet']],
  [/dinde|turkey|blanc de dinde/i,                                ['dinde']],
  [/bœuf|boeuf|beef|steak|haché|ground beef/i,                   ['bœuf']],
  [/porc|pork|côtelette/i,                                        ['porc']],
  [/thon|tuna/i,                                                  ['thon']],
  [/saumon fumé/i,                                                ['saumon fumé']],
  [/saumon|salmon/i,                                              ['saumon']],
  [/cabillaud|morue|cod|colin/i,                                  ['cabillaud']],
  [/crevettes?|shrimp|gambas/i,                                   ['crevettes']],
  [/poisson|fish/i,                                               ['poisson']],
  // ── Fruits ────────────────────────────────────────────────────────────────
  [/fruits? rouges?|small red berries/i,                          ['baies']],
  [/baies?|berries|bleuets?|framboises?|fraises?|mûres?/i,        ['baies']],
  [/mangue|mango/i,                                               ['mangue']],
  [/banane|banana/i,                                              ['banane']],
  [/pomme(?!s? de terre)|apple/i,                                 ['pomme']],
  [/citron|lemon|lime/i,                                          ['citron']],
  [/avocat|avocado/i,                                             ['avocat']],
  // ── Légumes ───────────────────────────────────────────────────────────────
  [/patate(s)? douce(s)?|sweet potato|yam/i,                      ['patate douce']],
  [/pommes? de terre|potatoes?|grelots/i,                         ['pomme de terre']],
  [/épinards?|spinach|jeunes pousses/i,                           ['épinards']],
  [/courgette|zucchini/i,                                         ['courgette']],
  [/poivron|bell pepper|capsicum/i,                               ['poivron']],
  [/brocoli|broccoli/i,                                           ['brocoli']],
  [/carottes?|carrots?/i,                                         ['carottes']],
  [/concombre|cucumber/i,                                         ['concombre']],
  [/betterave|beet/i,                                             ['betterave']],
  [/poireaux?|leek/i,                                             ['poireaux']],
  [/tomates? cerises?|cherry tomatoes?/i,                         ['tomates cerises']],
  [/tomates?|tomato|tomatoes|coulis|passata/i,                    ['tomates']],
  [/oignons?|onions?|échalotes?|shallots?/i,                      ['oignons']],
  [/ail|garlic/i,                                                 ['ail']],
  [/champignons?|mushrooms?/i,                                    ['champignons']],
  // ── Graisses / condiments ─────────────────────────────────────────────────
  [/huile d[''e]olive|olive oil/i,                                ['huile olive']],
  [/huile de coco|coconut oil/i,                                  ['huile coco']],
  [/huile|oil/i,                                                  ['huile']],
  [/beurre d[''e]amandes?|almond butter/i,                        ['beurre amandes']],
  [/beurre d[''e]arachide|peanut butter/i,                        ['beurre arachide']],
  // ── Boissons / laits ──────────────────────────────────────────────────────
  [/lait d[''e]amande|lait végétal|lait de soja|boisson végétale|lait de noix de coco/i, ['lait végétal']],
  [/lait|milk/i,                                                  ['lait']],
  // ── Divers ────────────────────────────────────────────────────────────────
  [/protéine(s)?.*poudre|whey|protein powder/i,                   ['whey']],
  [/graines? de chia|chia seeds?/i,                               ['chia']],
  [/graines? de lin|flax seeds?/i,                                ['lin']],
  [/noix(?! de coco)(?! d[''e]amandes?)|walnuts?|cerneaux?/i,     ['noix']],
  [/amandes?(?! butter)/i,                                        ['amandes']],
  [/miel|honey/i,                                                 ['miel']],
  [/sauce soja|soy sauce|tamari/i,                                ['sauce soja']],
  [/hummus|houmous/i,                                             ['hummus']],
  [/tahin|tahini|sésame/i,                                        ['tahin']],
];

// ─── Mock Product Catalog ─────────────────────────────────────────────────────

const catalog: StoreProduct[] = [
  // ── Skyr ──────────────────────────────────────────────────────────────────
  { id:'skyr-metro', storeId:'metro', name:"Skyr nature", brand:"Siggi's", packageSize:'500g', packageQty:500, packageUnit:'g', price:6.49, pricePerUnit:0.01298, isOrganic:false, isLocal:false, tags:['skyr','yogourt','protéines'] },
  { id:'skyr-iga', storeId:'iga', name:"Skyr nature 0%", brand:'Skyr.is', packageSize:'500g', packageQty:500, packageUnit:'g', price:5.99, pricePerUnit:0.01198, isOrganic:false, isLocal:false, tags:['skyr','yogourt','protéines'] },
  { id:'skyr-walmart', storeId:'walmart', name:"Skyr Icelandic", brand:"President's Choice", packageSize:'650g', packageQty:650, packageUnit:'g', price:5.47, pricePerUnit:0.00842, isOrganic:false, isLocal:false, tags:['skyr','yogourt','protéines'] },
  { id:'skyr-superc', storeId:'superc', name:"Skyr nature", brand:'Compliments', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.99, pricePerUnit:0.00998, isOrganic:false, isLocal:false, tags:['skyr','yogourt','protéines'] },
  { id:'skyr-maxi', storeId:'maxi', name:"Skyr nature", brand:'Skyr.is', packageSize:'500g', packageQty:500, packageUnit:'g', price:5.79, pricePerUnit:0.01158, isOrganic:false, isLocal:false, tags:['skyr','yogourt','protéines'] },
  // ── Yogourt grec ──────────────────────────────────────────────────────────
  { id:'greek-metro', storeId:'metro', name:'Yogourt grec nature 0%', brand:'Fage', packageSize:'750g', packageQty:750, packageUnit:'g', price:7.99, pricePerUnit:0.01065, isOrganic:false, isLocal:false, tags:['yogourt','grec','protéines'] },
  { id:'greek-iga', storeId:'iga', name:'Yogourt grec nature', brand:'Liberté', packageSize:'750g', packageQty:750, packageUnit:'g', price:7.49, pricePerUnit:0.00999, isOrganic:false, isLocal:true, tags:['yogourt','grec','protéines'] },
  { id:'greek-walmart', storeId:'walmart', name:'Greek Yogurt Plain', brand:'Great Value', packageSize:'750g', packageQty:750, packageUnit:'g', price:5.97, pricePerUnit:0.00796, isOrganic:false, isLocal:false, tags:['yogourt','grec','protéines'] },
  { id:'greek-superc', storeId:'superc', name:'Yogourt grec 2%', brand:'Oikos', packageSize:'750g', packageQty:750, packageUnit:'g', price:7.29, pricePerUnit:0.00972, isOrganic:false, isLocal:false, tags:['yogourt','grec','protéines'] },
  { id:'greek-maxi', storeId:'maxi', name:'Yogourt grec nature', brand:'Oikos', packageSize:'750g', packageQty:750, packageUnit:'g', price:6.99, pricePerUnit:0.00932, isOrganic:false, isLocal:false, tags:['yogourt','grec','protéines'] },
  // ── Fromage blanc ─────────────────────────────────────────────────────────
  { id:'fb-metro', storeId:'metro', name:'Fromage blanc 0%', brand:'Liberté', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.99, pricePerUnit:0.00998, isOrganic:false, isLocal:true, tags:['fromage blanc','protéines','dairy'] },
  { id:'fb-iga', storeId:'iga', name:'Fromage blanc nature', brand:'Riviera', packageSize:'450g', packageQty:450, packageUnit:'g', price:4.79, pricePerUnit:0.01064, isOrganic:false, isLocal:true, tags:['fromage blanc','protéines','dairy'] },
  { id:'fb-walmart', storeId:'walmart', name:'Quark Fromage Frais', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:3.97, pricePerUnit:0.00794, isOrganic:false, isLocal:false, tags:['fromage blanc','protéines','dairy'] },
  // ── Fromage cottage ───────────────────────────────────────────────────────
  { id:'cottage-metro', storeId:'metro', name:'Fromage cottage 1%', brand:'Nordica', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.99, pricePerUnit:0.00998, isOrganic:false, isLocal:false, tags:['fromage cottage','protéines','dairy'] },
  { id:'cottage-walmart', storeId:'walmart', name:'Cottage Cheese 2%', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:3.97, pricePerUnit:0.00794, isOrganic:false, isLocal:false, tags:['fromage cottage','protéines','dairy'] },
  { id:'cottage-iga', storeId:'iga', name:'Fromage cottage légère', brand:'Quebon', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.69, pricePerUnit:0.00938, isOrganic:false, isLocal:true, tags:['fromage cottage','protéines','dairy'] },
  // ── Feta ──────────────────────────────────────────────────────────────────
  { id:'feta-metro', storeId:'metro', name:'Feta grecque', brand:'Krinos', packageSize:'200g', packageQty:200, packageUnit:'g', price:5.49, pricePerUnit:0.02745, isOrganic:false, isLocal:false, tags:['feta','fromage'] },
  { id:'feta-walmart', storeId:'walmart', name:'Feta Cheese', brand:'Great Value', packageSize:'200g', packageQty:200, packageUnit:'g', price:3.97, pricePerUnit:0.01985, isOrganic:false, isLocal:false, tags:['feta','fromage'] },
  { id:'feta-iga', storeId:'iga', name:'Feta AOP grecque', brand:'Dodoni', packageSize:'200g', packageQty:200, packageUnit:'g', price:6.29, pricePerUnit:0.03145, isOrganic:false, isLocal:false, tags:['feta','fromage'] },
  // ── Oeufs ─────────────────────────────────────────────────────────────────
  { id:'eggs-metro', storeId:'metro', name:'Œufs extra-gros', brand:'Burnbrae', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:5.49, pricePerUnit:0.4575, isOrganic:false, isLocal:true, tags:['oeufs','protéines'] },
  { id:'eggs-iga', storeId:'iga', name:'Œufs gros blancs', brand:'Ferme Bertrand', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:4.99, pricePerUnit:0.4158, isOrganic:false, isLocal:true, tags:['oeufs','protéines'] },
  { id:'eggs-walmart', storeId:'walmart', name:'Large White Eggs', brand:'Great Value', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:3.97, pricePerUnit:0.3308, isOrganic:false, isLocal:false, tags:['oeufs','protéines'] },
  { id:'eggs-superc', storeId:'superc', name:'Œufs extra-gros', brand:'Selection', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:4.49, pricePerUnit:0.3742, isOrganic:false, isLocal:false, tags:['oeufs','protéines'] },
  { id:'eggs-maxi', storeId:'maxi', name:'Œufs gros', brand:'Compliments', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:4.29, pricePerUnit:0.3575, isOrganic:false, isLocal:false, tags:['oeufs','protéines'] },
  { id:'eggs-org-metro', storeId:'metro', name:'Œufs biologiques', brand:'Natura', packageSize:'12 unités', packageQty:12, packageUnit:'unités', price:8.49, pricePerUnit:0.7075, isOrganic:true, isLocal:true, tags:['oeufs','bio','protéines'] },
  // ── Avoine / Granola ──────────────────────────────────────────────────────
  { id:'oats-metro', storeId:'metro', name:"Flocons d'avoine à l'ancienne", brand:'Quaker', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:5.49, pricePerUnit:0.00549, isOrganic:false, isLocal:false, tags:['avoine','flocons','céréales'] },
  { id:'oats-iga', storeId:'iga', name:"Gruau à l'ancienne", brand:'Robin Hood', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:4.99, pricePerUnit:0.00499, isOrganic:false, isLocal:false, tags:['avoine','flocons','céréales'] },
  { id:'oats-walmart', storeId:'walmart', name:'Old-fashioned Oats', brand:'Great Value', packageSize:'1.36kg', packageQty:1360, packageUnit:'g', price:4.27, pricePerUnit:0.00314, isOrganic:false, isLocal:false, tags:['avoine','flocons','céréales'] },
  { id:'oats-superc', storeId:'superc', name:"Flocons d'avoine", brand:'Selection', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:4.49, pricePerUnit:0.00449, isOrganic:false, isLocal:false, tags:['avoine','flocons','céréales'] },
  { id:'oats-maxi', storeId:'maxi', name:"Gruau à l'ancienne", brand:'Quaker', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:5.19, pricePerUnit:0.00519, isOrganic:false, isLocal:false, tags:['avoine','flocons','céréales'] },
  { id:'granola-metro', storeId:'metro', name:'Granola faible en sucre', brand:'Nature Valley', packageSize:'450g', packageQty:450, packageUnit:'g', price:6.99, pricePerUnit:0.01553, isOrganic:false, isLocal:false, tags:['granola','céréales'] },
  { id:'granola-iga', storeId:'iga', name:'Granola aux fruits', brand:'Quaker', packageSize:'400g', packageQty:400, packageUnit:'g', price:6.49, pricePerUnit:0.01623, isOrganic:false, isLocal:false, tags:['granola','céréales'] },
  { id:'granola-walmart', storeId:'walmart', name:'Granola Original', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.97, pricePerUnit:0.00994, isOrganic:false, isLocal:false, tags:['granola','céréales'] },
  // ── Quinoa ────────────────────────────────────────────────────────────────
  { id:'quinoa-metro', storeId:'metro', name:'Quinoa blanc', brand:'Alter Eco', packageSize:'340g', packageQty:340, packageUnit:'g', price:7.99, pricePerUnit:0.02350, isOrganic:true, isLocal:false, tags:['quinoa','céréales','glucides'] },
  { id:'quinoa-walmart', storeId:'walmart', name:'Quinoa White', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:5.97, pricePerUnit:0.01194, isOrganic:false, isLocal:false, tags:['quinoa','céréales','glucides'] },
  { id:'quinoa-iga', storeId:'iga', name:'Quinoa biologique', brand:'Irresistibles', packageSize:'340g', packageQty:340, packageUnit:'g', price:8.49, pricePerUnit:0.02497, isOrganic:true, isLocal:false, tags:['quinoa','bio','céréales','glucides'] },
  { id:'quinoa-superc', storeId:'superc', name:'Quinoa', brand:'Selection', packageSize:'500g', packageQty:500, packageUnit:'g', price:5.49, pricePerUnit:0.01098, isOrganic:false, isLocal:false, tags:['quinoa','céréales','glucides'] },
  // ── Lentilles ─────────────────────────────────────────────────────────────
  { id:'lentil-metro', storeId:'metro', name:'Lentilles vertes du Puy', brand:'Unico', packageSize:'400g', packageQty:400, packageUnit:'g', price:2.99, pricePerUnit:0.00748, isOrganic:false, isLocal:false, tags:['lentilles','légumineuses','protéines'] },
  { id:'lentil-walmart', storeId:'walmart', name:'Green Lentils', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:1.97, pricePerUnit:0.00394, isOrganic:false, isLocal:false, tags:['lentilles','légumineuses','protéines'] },
  { id:'lentil-iga', storeId:'iga', name:'Lentilles rouges', brand:'Irresistibles', packageSize:'400g', packageQty:400, packageUnit:'g', price:2.79, pricePerUnit:0.00698, isOrganic:false, isLocal:false, tags:['lentilles','légumineuses','protéines'] },
  { id:'lentil-can-metro', storeId:'metro', name:'Lentilles cuites en conserve', brand:'Unico', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.99, pricePerUnit:0.00369, isOrganic:false, isLocal:false, tags:['lentilles','légumineuses','conserve'] },
  // ── Pois chiches ──────────────────────────────────────────────────────────
  { id:'chickpeas-metro', storeId:'metro', name:'Pois chiches en conserve', brand:'Unico', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.99, pricePerUnit:0.00369, isOrganic:false, isLocal:false, tags:['pois chiches','légumineuses','protéines'] },
  { id:'chickpeas-walmart', storeId:'walmart', name:'Chickpeas Canned', brand:'Great Value', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.27, pricePerUnit:0.00235, isOrganic:false, isLocal:false, tags:['pois chiches','légumineuses','protéines'] },
  { id:'chickpeas-iga', storeId:'iga', name:'Pois chiches cuits', brand:'Compliments', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.79, pricePerUnit:0.00331, isOrganic:false, isLocal:false, tags:['pois chiches','légumineuses','protéines'] },
  { id:'chickpeas-superc', storeId:'superc', name:'Pois chiches', brand:'Selection', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.69, pricePerUnit:0.00313, isOrganic:false, isLocal:false, tags:['pois chiches','légumineuses','protéines'] },
  // ── Haricots rouges ───────────────────────────────────────────────────────
  { id:'kidney-metro', storeId:'metro', name:'Haricots rouges en conserve', brand:'Unico', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.99, pricePerUnit:0.00369, isOrganic:false, isLocal:false, tags:['haricots rouges','légumineuses'] },
  { id:'kidney-walmart', storeId:'walmart', name:'Red Kidney Beans', brand:'Great Value', packageSize:'540ml', packageQty:540, packageUnit:'ml', price:1.27, pricePerUnit:0.00235, isOrganic:false, isLocal:false, tags:['haricots rouges','légumineuses'] },
  // ── Riz ───────────────────────────────────────────────────────────────────
  { id:'rice-metro', storeId:'metro', name:'Riz basmati blanc', brand:'Riviana', packageSize:'2kg', packageQty:2000, packageUnit:'g', price:8.49, pricePerUnit:0.00425, isOrganic:false, isLocal:false, tags:['riz','céréales','glucides'] },
  { id:'rice-walmart', storeId:'walmart', name:'Long Grain White Rice', brand:'Great Value', packageSize:'2kg', packageQty:2000, packageUnit:'g', price:5.47, pricePerUnit:0.00274, isOrganic:false, isLocal:false, tags:['riz','céréales','glucides'] },
  { id:'rice-iga', storeId:'iga', name:'Riz à grain long', brand:"Uncle Ben's", packageSize:'1.8kg', packageQty:1800, packageUnit:'g', price:7.99, pricePerUnit:0.00444, isOrganic:false, isLocal:false, tags:['riz','céréales','glucides'] },
  { id:'rice-superc', storeId:'superc', name:'Riz blanc à grain long', brand:'Selection', packageSize:'2kg', packageQty:2000, packageUnit:'g', price:6.49, pricePerUnit:0.00325, isOrganic:false, isLocal:false, tags:['riz','céréales','glucides'] },
  { id:'rice-maxi', storeId:'maxi', name:'Riz basmati', brand:'Elephant', packageSize:'2kg', packageQty:2000, packageUnit:'g', price:7.29, pricePerUnit:0.00365, isOrganic:false, isLocal:false, tags:['riz','céréales','glucides'] },
  // ── Boulgour / pâtes ──────────────────────────────────────────────────────
  { id:'bulgur-metro', storeId:'metro', name:'Boulgour', brand:'Unico', packageSize:'500g', packageQty:500, packageUnit:'g', price:3.99, pricePerUnit:0.00798, isOrganic:false, isLocal:false, tags:['boulgour','céréales','glucides'] },
  { id:'bulgur-walmart', storeId:'walmart', name:'Bulgur Wheat', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:2.97, pricePerUnit:0.00594, isOrganic:false, isLocal:false, tags:['boulgour','céréales','glucides'] },
  { id:'pasta-metro', storeId:'metro', name:'Spaghetti no. 7', brand:'Barilla', packageSize:'500g', packageQty:500, packageUnit:'g', price:2.49, pricePerUnit:0.00498, isOrganic:false, isLocal:false, tags:['pâtes','céréales','glucides'] },
  { id:'pasta-walmart', storeId:'walmart', name:'Spaghetti', brand:'Great Value', packageSize:'900g', packageQty:900, packageUnit:'g', price:1.97, pricePerUnit:0.00219, isOrganic:false, isLocal:false, tags:['pâtes','céréales','glucides'] },
  // ── Pain / Crackers ───────────────────────────────────────────────────────
  { id:'bread-metro', storeId:'metro', name:'Pain complet tranche', brand:'Villaggio', packageSize:'570g', packageQty:570, packageUnit:'g', price:4.99, pricePerUnit:0.00876, isOrganic:false, isLocal:false, tags:['pain','céréales'] },
  { id:'bread-walmart', storeId:'walmart', name:'Whole Wheat Bread', brand:'Great Value', packageSize:'675g', packageQty:675, packageUnit:'g', price:2.97, pricePerUnit:0.00440, isOrganic:false, isLocal:false, tags:['pain','céréales'] },
  { id:'wrap-metro', storeId:'metro', name:'Wraps de blé complet', brand:'Mission', packageSize:'8 unités', packageQty:8, packageUnit:'unités', price:4.99, pricePerUnit:0.624, isOrganic:false, isLocal:false, tags:['wrap','pain','céréales'] },
  { id:'cracker-metro', storeId:'metro', name:'Galettes de seigle', brand:'Wasa', packageSize:'270g', packageQty:270, packageUnit:'g', price:4.29, pricePerUnit:0.01589, isOrganic:false, isLocal:false, tags:['crackers','pain','céréales'] },
  { id:'cracker-walmart', storeId:'walmart', name:'Rye Crispbread', brand:'Finn Crisp', packageSize:'200g', packageQty:200, packageUnit:'g', price:3.47, pricePerUnit:0.01735, isOrganic:false, isLocal:false, tags:['crackers','pain','céréales'] },
  // ── Poulet ────────────────────────────────────────────────────────────────
  { id:'chicken-metro', storeId:'metro', name:'Poitrines de poulet sans os', brand:'Maple Leaf', packageSize:'900g', packageQty:900, packageUnit:'g', price:13.99, pricePerUnit:0.01554, isOrganic:false, isLocal:false, tags:['poulet','viande','protéines'] },
  { id:'chicken-iga', storeId:'iga', name:'Poitrines de poulet', brand:'Ferme Famille Goulet', packageSize:'800g', packageQty:800, packageUnit:'g', price:12.99, pricePerUnit:0.01624, isOrganic:false, isLocal:true, tags:['poulet','viande','protéines'] },
  { id:'chicken-walmart', storeId:'walmart', name:'Chicken Breast Boneless', brand:'Great Value', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:10.97, pricePerUnit:0.01097, isOrganic:false, isLocal:false, tags:['poulet','viande','protéines'] },
  { id:'chicken-superc', storeId:'superc', name:'Poitrines de poulet', brand:'Selection', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:11.49, pricePerUnit:0.01149, isOrganic:false, isLocal:false, tags:['poulet','viande','protéines'] },
  { id:'chicken-maxi', storeId:'maxi', name:'Poitrines poulet sans os', brand:'Olymel', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:11.99, pricePerUnit:0.01199, isOrganic:false, isLocal:false, tags:['poulet','viande','protéines'] },
  // ── Dinde ─────────────────────────────────────────────────────────────────
  { id:'turkey-metro', storeId:'metro', name:'Filet de dinde', brand:'Maple Leaf', packageSize:'600g', packageQty:600, packageUnit:'g', price:10.99, pricePerUnit:0.01832, isOrganic:false, isLocal:false, tags:['dinde','viande','protéines'] },
  { id:'turkey-walmart', storeId:'walmart', name:'Turkey Breast', brand:'Great Value', packageSize:'800g', packageQty:800, packageUnit:'g', price:9.97, pricePerUnit:0.01246, isOrganic:false, isLocal:false, tags:['dinde','viande','protéines'] },
  { id:'turkey-iga', storeId:'iga', name:'Blanc de dinde', brand:'Olymel', packageSize:'600g', packageQty:600, packageUnit:'g', price:10.49, pricePerUnit:0.01748, isOrganic:false, isLocal:false, tags:['dinde','viande','protéines'] },
  // ── Bœuf haché ────────────────────────────────────────────────────────────
  { id:'beef-metro', storeId:'metro', name:'Bœuf haché extra-maigre', brand:'Maple Leaf', packageSize:'500g', packageQty:500, packageUnit:'g', price:9.99, pricePerUnit:0.01998, isOrganic:false, isLocal:false, tags:['bœuf','viande','protéines'] },
  { id:'beef-walmart', storeId:'walmart', name:'Lean Ground Beef', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:7.97, pricePerUnit:0.01594, isOrganic:false, isLocal:false, tags:['bœuf','viande','protéines'] },
  { id:'beef-iga', storeId:'iga', name:'Bœuf haché maigre', brand:'Local', packageSize:'500g', packageQty:500, packageUnit:'g', price:9.49, pricePerUnit:0.01898, isOrganic:false, isLocal:true, tags:['bœuf','viande','protéines'] },
  // ── Thon ──────────────────────────────────────────────────────────────────
  { id:'tuna-metro', storeId:'metro', name:'Thon au naturel', brand:'Clover Leaf', packageSize:'170g', packageQty:170, packageUnit:'g', price:2.49, pricePerUnit:0.01465, isOrganic:false, isLocal:false, tags:['thon','poisson','conserve','protéines'] },
  { id:'tuna-walmart', storeId:'walmart', name:'Tuna in Water', brand:'Great Value', packageSize:'170g', packageQty:170, packageUnit:'g', price:1.47, pricePerUnit:0.00865, isOrganic:false, isLocal:false, tags:['thon','poisson','conserve','protéines'] },
  { id:'tuna-iga', storeId:'iga', name:'Thon albacore au naturel', brand:'Compliments', packageSize:'170g', packageQty:170, packageUnit:'g', price:2.29, pricePerUnit:0.01347, isOrganic:false, isLocal:false, tags:['thon','poisson','conserve','protéines'] },
  { id:'tuna-superc', storeId:'superc', name:'Thon au naturel', brand:'Selection', packageSize:'170g', packageQty:170, packageUnit:'g', price:1.99, pricePerUnit:0.01171, isOrganic:false, isLocal:false, tags:['thon','poisson','conserve','protéines'] },
  { id:'tuna-maxi', storeId:'maxi', name:'Thon au naturel', brand:'Clover Leaf', packageSize:'170g', packageQty:170, packageUnit:'g', price:2.39, pricePerUnit:0.01406, isOrganic:false, isLocal:false, tags:['thon','poisson','conserve','protéines'] },
  // ── Saumon ────────────────────────────────────────────────────────────────
  { id:'salmon-metro', storeId:'metro', name:'Filets de saumon Atlantique', brand:'Generic', packageSize:'400g', packageQty:400, packageUnit:'g', price:12.99, pricePerUnit:0.03248, isOrganic:false, isLocal:false, tags:['saumon','poisson','protéines'] },
  { id:'salmon-iga', storeId:'iga', name:'Saumon Atlantique frais', brand:'Clearwater', packageSize:'400g', packageQty:400, packageUnit:'g', price:13.49, pricePerUnit:0.03373, isOrganic:false, isLocal:false, tags:['saumon','poisson','protéines'] },
  { id:'salmon-walmart', storeId:'walmart', name:'Atlantic Salmon Fillet', brand:'Generic', packageSize:'500g', packageQty:500, packageUnit:'g', price:11.97, pricePerUnit:0.02394, isOrganic:false, isLocal:false, tags:['saumon','poisson','protéines'] },
  { id:'salmon-superc', storeId:'superc', name:'Filet de saumon', brand:'Generic', packageSize:'400g', packageQty:400, packageUnit:'g', price:11.99, pricePerUnit:0.02998, isOrganic:false, isLocal:false, tags:['saumon','poisson','protéines'] },
  { id:'salmon-fume-metro', storeId:'metro', name:'Saumon fumé tranché', brand:'Clearwater', packageSize:'150g', packageQty:150, packageUnit:'g', price:8.99, pricePerUnit:0.05993, isOrganic:false, isLocal:false, tags:['saumon fumé','saumon','poisson'] },
  { id:'salmon-fume-iga', storeId:'iga', name:'Saumon fumé du Pacifique', brand:'Irresistibles', packageSize:'150g', packageQty:150, packageUnit:'g', price:8.49, pricePerUnit:0.05660, isOrganic:false, isLocal:false, tags:['saumon fumé','saumon','poisson'] },
  // ── Cabillaud ─────────────────────────────────────────────────────────────
  { id:'cod-metro', storeId:'metro', name:'Filet de cabillaud', brand:'Generic', packageSize:'400g', packageQty:400, packageUnit:'g', price:9.99, pricePerUnit:0.02498, isOrganic:false, isLocal:false, tags:['cabillaud','poisson','protéines'] },
  { id:'cod-walmart', storeId:'walmart', name:'Cod Fillet', brand:'Highliner', packageSize:'500g', packageQty:500, packageUnit:'g', price:9.47, pricePerUnit:0.01894, isOrganic:false, isLocal:false, tags:['cabillaud','poisson','protéines'] },
  // ── Crevettes ─────────────────────────────────────────────────────────────
  { id:'shrimp-metro', storeId:'metro', name:'Crevettes nordiques cuites', brand:'Clearwater', packageSize:'400g', packageQty:400, packageUnit:'g', price:11.99, pricePerUnit:0.02998, isOrganic:false, isLocal:false, tags:['crevettes','poisson','protéines'] },
  { id:'shrimp-walmart', storeId:'walmart', name:'Cooked Shrimp Peeled', brand:'Great Value', packageSize:'454g', packageQty:454, packageUnit:'g', price:8.97, pricePerUnit:0.01976, isOrganic:false, isLocal:false, tags:['crevettes','poisson','protéines'] },
  // ── Baies / Fruits rouges ─────────────────────────────────────────────────
  { id:'berries-metro', storeId:'metro', name:'Mélange baies surgelées', brand:"M'Lord", packageSize:'600g', packageQty:600, packageUnit:'g', price:7.49, pricePerUnit:0.01248, isOrganic:false, isLocal:false, tags:['baies','fruits','surgelé'] },
  { id:'berries-iga', storeId:'iga', name:'Baies mélangées surgelées', brand:'Irresistibles', packageSize:'600g', packageQty:600, packageUnit:'g', price:7.29, pricePerUnit:0.01215, isOrganic:false, isLocal:false, tags:['baies','fruits','surgelé'] },
  { id:'berries-walmart', storeId:'walmart', name:'Mixed Berries Frozen', brand:'Great Value', packageSize:'750g', packageQty:750, packageUnit:'g', price:6.47, pricePerUnit:0.00863, isOrganic:false, isLocal:false, tags:['baies','fruits','surgelé'] },
  { id:'berries-superc', storeId:'superc', name:'Mélange 3 fruits surgelés', brand:'Selection', packageSize:'600g', packageQty:600, packageUnit:'g', price:6.99, pricePerUnit:0.01165, isOrganic:false, isLocal:false, tags:['baies','fruits','surgelé'] },
  { id:'berries-maxi', storeId:'maxi', name:'Baies sauvages surgelées', brand:'Compliments', packageSize:'600g', packageQty:600, packageUnit:'g', price:6.79, pricePerUnit:0.01132, isOrganic:false, isLocal:false, tags:['baies','fruits','surgelé'] },
  { id:'blueberries-org', storeId:'metro', name:'Bleuets biologiques surgelés', brand:"Nature's Touch", packageSize:'600g', packageQty:600, packageUnit:'g', price:9.99, pricePerUnit:0.01665, isOrganic:true, isLocal:true, tags:['baies','bleuets','bio','surgelé'] },
  // ── Mangue ────────────────────────────────────────────────────────────────
  { id:'mango-metro', storeId:'metro', name:'Dés de mangue surgelés', brand:'Generic', packageSize:'400g', packageQty:400, packageUnit:'g', price:4.99, pricePerUnit:0.01248, isOrganic:false, isLocal:false, tags:['mangue','fruits','surgelé'] },
  { id:'mango-walmart', storeId:'walmart', name:'Mango Chunks Frozen', brand:'Great Value', packageSize:'400g', packageQty:400, packageUnit:'g', price:3.97, pricePerUnit:0.00993, isOrganic:false, isLocal:false, tags:['mangue','fruits','surgelé'] },
  // ── Banane ────────────────────────────────────────────────────────────────
  { id:'banana-metro', storeId:'metro', name:'Bananes', brand:'Dole', packageSize:'1 régime (~6)', packageQty:6, packageUnit:'unités', price:1.99, pricePerUnit:0.332, isOrganic:false, isLocal:false, tags:['banane','fruits'] },
  { id:'banana-walmart', storeId:'walmart', name:'Bananas', brand:'Generic', packageSize:'1.36kg', packageQty:1360, packageUnit:'g', price:1.57, pricePerUnit:0.00115, isOrganic:false, isLocal:false, tags:['banane','fruits'] },
  { id:'banana-superc', storeId:'superc', name:'Bananes', brand:'Generic', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:1.29, pricePerUnit:0.00129, isOrganic:false, isLocal:false, tags:['banane','fruits'] },
  // ── Avocat ────────────────────────────────────────────────────────────────
  { id:'avocado-metro', storeId:'metro', name:'Avocats Hass', brand:'Generic', packageSize:'3 unités', packageQty:3, packageUnit:'unités', price:4.99, pricePerUnit:1.663, isOrganic:false, isLocal:false, tags:['avocat','fruits','légumes'] },
  { id:'avocado-walmart', storeId:'walmart', name:'Avocados', brand:'Generic', packageSize:'4 unités', packageQty:4, packageUnit:'unités', price:4.97, pricePerUnit:1.243, isOrganic:false, isLocal:false, tags:['avocat','fruits','légumes'] },
  { id:'avocado-iga', storeId:'iga', name:'Avocats mûrs', brand:'Generic', packageSize:'2 unités', packageQty:2, packageUnit:'unités', price:3.49, pricePerUnit:1.745, isOrganic:false, isLocal:false, tags:['avocat','fruits','légumes'] },
  // ── Légumes ───────────────────────────────────────────────────────────────
  { id:'sweetpotato-metro', storeId:'metro', name:'Patates douces', brand:'Generic', packageSize:'1.5kg', packageQty:1500, packageUnit:'g', price:5.99, pricePerUnit:0.00399, isOrganic:false, isLocal:false, tags:['patate douce','légumes','glucides'] },
  { id:'sweetpotato-walmart', storeId:'walmart', name:'Sweet Potatoes', brand:'Generic', packageSize:'2kg', packageQty:2000, packageUnit:'g', price:5.97, pricePerUnit:0.00299, isOrganic:false, isLocal:false, tags:['patate douce','légumes','glucides'] },
  { id:'sweetpotato-iga', storeId:'iga', name:'Patates douces orange', brand:'Generic', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:4.49, pricePerUnit:0.00449, isOrganic:false, isLocal:false, tags:['patate douce','légumes','glucides'] },
  { id:'spinach-metro', storeId:'metro', name:'Épinards frais', brand:'Earthbound Farm', packageSize:'142g', packageQty:142, packageUnit:'g', price:4.99, pricePerUnit:0.03514, isOrganic:false, isLocal:false, tags:['épinards','légumes','salade'] },
  { id:'spinach-walmart', storeId:'walmart', name:'Baby Spinach', brand:'Great Value', packageSize:'340g', packageQty:340, packageUnit:'g', price:4.97, pricePerUnit:0.01462, isOrganic:false, isLocal:false, tags:['épinards','légumes','salade'] },
  { id:'spinach-iga', storeId:'iga', name:'Bébés épinards', brand:'Attitude Fraîche', packageSize:'142g', packageQty:142, packageUnit:'g', price:4.79, pricePerUnit:0.03373, isOrganic:false, isLocal:true, tags:['épinards','légumes','salade'] },
  { id:'spinach-superc', storeId:'superc', name:'Épinards bébé', brand:'Selection', packageSize:'142g', packageQty:142, packageUnit:'g', price:3.99, pricePerUnit:0.02810, isOrganic:false, isLocal:false, tags:['épinards','légumes','salade'] },
  { id:'courgette-metro', storeId:'metro', name:'Courgettes vertes', brand:'Generic', packageSize:'3 unités (~600g)', packageQty:600, packageUnit:'g', price:3.99, pricePerUnit:0.00665, isOrganic:false, isLocal:true, tags:['courgette','légumes'] },
  { id:'courgette-walmart', storeId:'walmart', name:'Zucchini', brand:'Generic', packageSize:'~500g', packageQty:500, packageUnit:'g', price:2.97, pricePerUnit:0.00594, isOrganic:false, isLocal:false, tags:['courgette','légumes'] },
  { id:'courgette-iga', storeId:'iga', name:'Courgettes', brand:'Generic', packageSize:'2 unités (~400g)', packageQty:400, packageUnit:'g', price:3.49, pricePerUnit:0.00873, isOrganic:false, isLocal:true, tags:['courgette','légumes'] },
  { id:'pepper-metro', storeId:'metro', name:'Poivrons tricolores', brand:'Generic', packageSize:'3 unités', packageQty:3, packageUnit:'unités', price:5.99, pricePerUnit:1.997, isOrganic:false, isLocal:true, tags:['poivron','légumes'] },
  { id:'pepper-walmart', storeId:'walmart', name:'Bell Peppers', brand:'Generic', packageSize:'3 unités', packageQty:3, packageUnit:'unités', price:4.97, pricePerUnit:1.657, isOrganic:false, isLocal:false, tags:['poivron','légumes'] },
  { id:'broccoli-metro', storeId:'metro', name:'Brocoli', brand:'Generic', packageSize:'1 tête (~500g)', packageQty:500, packageUnit:'g', price:3.49, pricePerUnit:0.00698, isOrganic:false, isLocal:true, tags:['brocoli','légumes'] },
  { id:'broccoli-walmart', storeId:'walmart', name:'Broccoli Crown', brand:'Generic', packageSize:'1 tête (~500g)', packageQty:500, packageUnit:'g', price:2.97, pricePerUnit:0.00594, isOrganic:false, isLocal:false, tags:['brocoli','légumes'] },
  { id:'tomato-metro', storeId:'metro', name:'Tomates en dés', brand:'Del Monte', packageSize:'796ml', packageQty:796, packageUnit:'ml', price:2.49, pricePerUnit:0.00313, isOrganic:false, isLocal:false, tags:['tomates','conserve','légumes'] },
  { id:'tomato-walmart', storeId:'walmart', name:'Diced Tomatoes', brand:'Great Value', packageSize:'796ml', packageQty:796, packageUnit:'ml', price:1.47, pricePerUnit:0.00185, isOrganic:false, isLocal:false, tags:['tomates','conserve','légumes'] },
  { id:'tomato-cherry-metro', storeId:'metro', name:'Tomates cerises', brand:'Generic', packageSize:'454g', packageQty:454, packageUnit:'g', price:3.99, pricePerUnit:0.00879, isOrganic:false, isLocal:true, tags:['tomates cerises','tomates','légumes'] },
  { id:'tomato-cherry-iga', storeId:'iga', name:'Tomates raisins', brand:'Generic', packageSize:'454g', packageQty:454, packageUnit:'g', price:4.29, pricePerUnit:0.00945, isOrganic:false, isLocal:true, tags:['tomates cerises','tomates','légumes'] },
  { id:'cucumber-metro', storeId:'metro', name:'Concombre anglais', brand:'Generic', packageSize:'1 unité', packageQty:1, packageUnit:'unités', price:1.99, pricePerUnit:1.990, isOrganic:false, isLocal:true, tags:['concombre','légumes'] },
  { id:'cucumber-walmart', storeId:'walmart', name:'English Cucumber', brand:'Generic', packageSize:'1 unité', packageQty:1, packageUnit:'unités', price:1.47, pricePerUnit:1.470, isOrganic:false, isLocal:false, tags:['concombre','légumes'] },
  { id:'onion-metro', storeId:'metro', name:'Oignons jaunes', brand:'Generic', packageSize:'3lb (~1.36kg)', packageQty:1360, packageUnit:'g', price:3.99, pricePerUnit:0.00293, isOrganic:false, isLocal:true, tags:['oignons','légumes'] },
  { id:'onion-walmart', storeId:'walmart', name:'Yellow Onions', brand:'Generic', packageSize:'3lb (~1.36kg)', packageQty:1360, packageUnit:'g', price:2.97, pricePerUnit:0.00218, isOrganic:false, isLocal:false, tags:['oignons','légumes'] },
  { id:'garlic-metro', storeId:'metro', name:'Ail frais', brand:'Generic', packageSize:'3 têtes', packageQty:3, packageUnit:'têtes', price:2.49, pricePerUnit:0.830, isOrganic:false, isLocal:true, tags:['ail','légumes'] },
  { id:'garlic-walmart', storeId:'walmart', name:'Garlic bulbs', brand:'Generic', packageSize:'3 bulbes', packageQty:3, packageUnit:'têtes', price:1.97, pricePerUnit:0.657, isOrganic:false, isLocal:false, tags:['ail','légumes'] },
  { id:'beet-metro', storeId:'metro', name:'Betteraves cuites sous vide', brand:'Generic', packageSize:'500g', packageQty:500, packageUnit:'g', price:4.49, pricePerUnit:0.00898, isOrganic:false, isLocal:true, tags:['betterave','légumes'] },
  { id:'beet-walmart', storeId:'walmart', name:'Cooked Beets', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:3.47, pricePerUnit:0.00694, isOrganic:false, isLocal:false, tags:['betterave','légumes'] },
  // ── Huile d'olive ─────────────────────────────────────────────────────────
  { id:'oliveoil-metro', storeId:'metro', name:"Huile d'olive extra vierge", brand:'Bertolli', packageSize:'750ml', packageQty:750, packageUnit:'ml', price:12.99, pricePerUnit:0.01732, isOrganic:false, isLocal:false, tags:['huile olive','huile','gras'] },
  { id:'oliveoil-walmart', storeId:'walmart', name:'Extra Virgin Olive Oil', brand:'Great Value', packageSize:'1L', packageQty:1000, packageUnit:'ml', price:9.97, pricePerUnit:0.00997, isOrganic:false, isLocal:false, tags:['huile olive','huile','gras'] },
  { id:'oliveoil-iga', storeId:'iga', name:"Huile d'olive vierge extra", brand:'Carbonell', packageSize:'750ml', packageQty:750, packageUnit:'ml', price:11.99, pricePerUnit:0.01599, isOrganic:false, isLocal:false, tags:['huile olive','huile','gras'] },
  { id:'oliveoil-superc', storeId:'superc', name:"Huile d'olive extra vierge", brand:'Selection', packageSize:'750ml', packageQty:750, packageUnit:'ml', price:10.49, pricePerUnit:0.01399, isOrganic:false, isLocal:false, tags:['huile olive','huile','gras'] },
  // ── Lait végétal ──────────────────────────────────────────────────────────
  { id:'almond-milk-metro', storeId:'metro', name:"Boisson d'amande non sucrée", brand:'Silk', packageSize:'1.89L', packageQty:1890, packageUnit:'ml', price:4.99, pricePerUnit:0.00264, isOrganic:false, isLocal:false, tags:['lait végétal','lait','dairy-free'] },
  { id:'almond-milk-walmart', storeId:'walmart', name:'Unsweetened Almond Milk', brand:'Great Value', packageSize:'1.89L', packageQty:1890, packageUnit:'ml', price:3.97, pricePerUnit:0.00210, isOrganic:false, isLocal:false, tags:['lait végétal','lait','dairy-free'] },
  { id:'soy-milk-metro', storeId:'metro', name:'Boisson de soja nature', brand:'Natrel', packageSize:'1L', packageQty:1000, packageUnit:'ml', price:2.99, pricePerUnit:0.00299, isOrganic:false, isLocal:false, tags:['lait végétal','lait','dairy-free'] },
  { id:'oat-milk-metro', storeId:'metro', name:"Boisson d'avoine", brand:'Oatly', packageSize:'1L', packageQty:1000, packageUnit:'ml', price:4.49, pricePerUnit:0.00449, isOrganic:false, isLocal:false, tags:['lait végétal','lait','dairy-free'] },
  // ── Lait ──────────────────────────────────────────────────────────────────
  { id:'milk-metro', storeId:'metro', name:'Lait 2%', brand:'Lactantia', packageSize:'2L', packageQty:2000, packageUnit:'ml', price:4.99, pricePerUnit:0.00250, isOrganic:false, isLocal:true, tags:['lait','dairy'] },
  { id:'milk-walmart', storeId:'walmart', name:'2% Partly Skimmed Milk', brand:'Great Value', packageSize:'2L', packageQty:2000, packageUnit:'ml', price:3.97, pricePerUnit:0.00199, isOrganic:false, isLocal:false, tags:['lait','dairy'] },
  // ── Noix / graines ────────────────────────────────────────────────────────
  { id:'walnuts-metro', storeId:'metro', name:'Cerneaux de noix', brand:'Generic', packageSize:'200g', packageQty:200, packageUnit:'g', price:5.99, pricePerUnit:0.02995, isOrganic:false, isLocal:false, tags:['noix','oléagineux'] },
  { id:'almonds-metro', storeId:'metro', name:'Amandes entières', brand:'Blue Diamond', packageSize:'200g', packageQty:200, packageUnit:'g', price:5.49, pricePerUnit:0.02745, isOrganic:false, isLocal:false, tags:['amandes','oléagineux'] },
  { id:'chia-metro', storeId:'metro', name:'Graines de chia', brand:'Genuine Health', packageSize:'300g', packageQty:300, packageUnit:'g', price:7.99, pricePerUnit:0.02663, isOrganic:true, isLocal:false, tags:['chia','graines'] },
  { id:'chia-walmart', storeId:'walmart', name:'Chia Seeds', brand:'Great Value', packageSize:'300g', packageQty:300, packageUnit:'g', price:5.97, pricePerUnit:0.01990, isOrganic:false, isLocal:false, tags:['chia','graines'] },
  { id:'flax-metro', storeId:'metro', name:'Graines de lin moulues', brand:'Omega', packageSize:'400g', packageQty:400, packageUnit:'g', price:4.99, pricePerUnit:0.01248, isOrganic:false, isLocal:false, tags:['lin','graines'] },
  { id:'almond-butter-metro', storeId:'metro', name:"Beurre d'amandes naturel", brand:'Krema', packageSize:'500g', packageQty:500, packageUnit:'g', price:10.99, pricePerUnit:0.02198, isOrganic:false, isLocal:false, tags:['beurre amandes','noix','protéines'] },
  { id:'peanut-butter-metro', storeId:'metro', name:"Beurre d'arachide naturel", brand:'Kraft', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:8.99, pricePerUnit:0.00899, isOrganic:false, isLocal:false, tags:['beurre arachide','noix','protéines'] },
  { id:'peanut-butter-walmart', storeId:'walmart', name:'Peanut Butter Natural', brand:'Great Value', packageSize:'1kg', packageQty:1000, packageUnit:'g', price:6.97, pricePerUnit:0.00697, isOrganic:false, isLocal:false, tags:['beurre arachide','noix','protéines'] },
  // ── Miel ──────────────────────────────────────────────────────────────────
  { id:'honey-metro', storeId:'metro', name:'Miel pur blanc', brand:'Billy Bee', packageSize:'500g', packageQty:500, packageUnit:'g', price:7.99, pricePerUnit:0.01598, isOrganic:false, isLocal:true, tags:['miel'] },
  { id:'honey-walmart', storeId:'walmart', name:'Pure Honey', brand:'Great Value', packageSize:'500g', packageQty:500, packageUnit:'g', price:5.97, pricePerUnit:0.01194, isOrganic:false, isLocal:false, tags:['miel'] },
  // ── Hummus ────────────────────────────────────────────────────────────────
  { id:'hummus-metro', storeId:'metro', name:'Hummus nature', brand:'Fontaine Santé', packageSize:'340g', packageQty:340, packageUnit:'g', price:4.99, pricePerUnit:0.01468, isOrganic:false, isLocal:true, tags:['hummus'] },
  { id:'hummus-walmart', storeId:'walmart', name:'Classic Hummus', brand:'Sabra', packageSize:'340g', packageQty:340, packageUnit:'g', price:4.47, pricePerUnit:0.01315, isOrganic:false, isLocal:false, tags:['hummus'] },
  // ── Sauce soja ────────────────────────────────────────────────────────────
  { id:'soy-sauce-metro', storeId:'metro', name:'Sauce soja légère', brand:'Kikkoman', packageSize:'250ml', packageQty:250, packageUnit:'ml', price:3.99, pricePerUnit:0.01596, isOrganic:false, isLocal:false, tags:['sauce soja','condiments'] },
  { id:'soy-sauce-walmart', storeId:'walmart', name:'Soy Sauce Less Sodium', brand:'Great Value', packageSize:'500ml', packageQty:500, packageUnit:'ml', price:2.97, pricePerUnit:0.00594, isOrganic:false, isLocal:false, tags:['sauce soja','condiments'] },
  // ── Whey ──────────────────────────────────────────────────────────────────
  { id:'whey-metro', storeId:'metro', name:'Protéines whey vanille', brand:'Optimum Nutrition', packageSize:'908g', packageQty:908, packageUnit:'g', price:44.99, pricePerUnit:0.04955, isOrganic:false, isLocal:false, tags:['whey','protéine','supplément'] },
  { id:'whey-walmart', storeId:'walmart', name:'Whey Protein Vanilla', brand:'Kirkland', packageSize:'1.13kg', packageQty:1130, packageUnit:'g', price:34.97, pricePerUnit:0.03094, isOrganic:false, isLocal:false, tags:['whey','protéine','supplément'] },
];

// ─── Parsing ──────────────────────────────────────────────────────────────────

const UNIT_PATTERNS: [RegExp, string, number][] = [
  [/(\d+(?:[.,]\d+)?)\s*kg\b/i,               'g',      1000],
  [/(\d+(?:[.,]\d+)?)\s*g\b/i,                'g',      1],
  [/(\d+(?:[.,]\d+)?)\s*L\b/i,                'ml',     1000],
  [/(\d+(?:[.,]\d+)?)\s*ml\b/i,               'ml',     1],
  [/(\d+(?:[.,]\d+)?)\s*c\.?à\.?s\.?/i,       'ml',     15],
  [/(\d+(?:[.,]\d+)?)\s*c\.?à\.?c\.?/i,       'ml',     5],
  [/(\d+(?:[.,]\d+)?)\s*tasses?/i,             'ml',     250],
  [/(\d+(?:[.,]\d+)?)\s*portion[s]?/i,         'unités', 1],
  [/(\d+(?:[.,]\d+)?)/,                        'unités', 1],
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

  let category = 'other';
  for (const [re, tags] of KEYWORD_TO_TAG) {
    if (re.test(raw)) { category = tags[0]; break; }
  }

  const name = raw
    .replace(/^\d+(?:[.,]\d+)?\s*(kg|g|L|ml|c\.?à\.?[sc]\.?|tasses?|unités?|portions?)?[.,\s]*/i, '')
    .replace(/^(de\s+|d['']\s*|du\s+|des\s+|une?\s+)/i, '')
    .trim()
    .toLowerCase();

  return { raw, qty, unit, name, category };
}

// ─── Matching ─────────────────────────────────────────────────────────────────

function scoreProduct(product: StoreProduct, mode: OptimizationMode): number {
  // No tag re-check here — candidates are already filtered by matchIngredient.
  switch (mode) {
    case 'cheapest':      return -product.pricePerUnit;
    case 'organic':       return (product.isOrganic ? 1000 : 0) - product.pricePerUnit;
    case 'local':         return (product.isLocal   ? 1000 : 0) - product.pricePerUnit;
    case 'best_value':    return (product.isOrganic ? 200 : 0) + (product.isLocal ? 100 : 0) - product.pricePerUnit * 50;
    case 'fewest_stores': return -product.pricePerUnit;
  }
}

export function matchIngredient(
  ingredient: RecipeIngredient,
  preferredStores: StoreId[],
  mode: OptimizationMode,
): MatchedProduct[] {
  // Find matching tags for this ingredient
  const catTags = KEYWORD_TO_TAG.find(([re]) => re.test(ingredient.raw));
  if (!catTags) return [];

  const matchTags = catTags[1];

  const candidates = catalog.filter(p => {
    if (preferredStores.length > 0 && !preferredStores.includes(p.storeId)) return false;
    return matchTags.some(t => p.tags.includes(t));
  });

  if (candidates.length === 0) return [];

  return candidates
    .sort((a, b) => scoreProduct(b, mode) - scoreProduct(a, mode))
    .map(p => {
      const packagesNeeded = Math.max(1, Math.ceil(ingredient.qty / p.packageQty));
      return {
        ...p,
        quantityNeeded: ingredient.qty,
        packagesNeeded,
        totalCost: packagesNeeded * p.price,
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
  const items: GroceryLineItem[] = ingredients.map(raw => {
    const ingredient = parseIngredient(raw);
    const candidates = matchIngredient(ingredient, preferredStores, mode);
    return { ingredient, candidates, selected: candidates[0] ?? null };
  });

  // fewest_stores: consolidate to whichever store covers the most items
  if (mode === 'fewest_stores') {
    const storeCount: Record<string, number> = {};
    for (const item of items) {
      if (item.selected) storeCount[item.selected.storeId] = (storeCount[item.selected.storeId] ?? 0) + 1;
    }
    const best = Object.entries(storeCount).sort((a, b) => b[1] - a[1])[0]?.[0] as StoreId | undefined;
    if (best) {
      for (const item of items) {
        const alt = item.candidates.find(c => c.storeId === best);
        if (alt) item.selected = alt;
      }
    }
  }

  const totalCost = items.reduce((s, i) => s + (i.selected?.totalCost ?? 0), 0);
  const usedStores = [...new Set(items.map(i => i.selected?.storeId).filter(Boolean) as StoreId[])];

  return {
    items,
    totalCost,
    costPerServing: servings > 0 ? totalCost / servings : totalCost,
    servings,
    store: usedStores.length === 1 ? usedStores[0] : 'mixed',
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportCartAsText(cart: GroceryCart, recipeName: string): string {
  const lines = [
    `Liste de courses — ${recipeName}`,
    `${cart.servings} portion${cart.servings > 1 ? 's' : ''} · ${cart.totalCost.toFixed(2)} $ CAD · ${cart.costPerServing.toFixed(2)} $/portion`,
    '',
  ];
  for (const item of cart.items) {
    if (item.selected) {
      lines.push(`• ${item.ingredient.raw}`);
      lines.push(`  → ${item.selected.name} (${item.selected.brand}) ${item.selected.packageSize} × ${item.selected.packagesNeeded} — ${item.selected.totalCost.toFixed(2)} $`);
    } else {
      lines.push(`• ${item.ingredient.raw}  ← à ajouter manuellement`);
    }
  }
  lines.push('', `Généré par Morphiq le ${new Date().toLocaleDateString('fr-CA')}`);
  return lines.join('\n');
}
