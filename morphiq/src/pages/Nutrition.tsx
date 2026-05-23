import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader, Clock, Users, Heart, ChefHat, X, ShoppingCart, Coffee, Sun, Moon, Cookie, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMealSuggestions, generateRecipeFromIngredients, generateRecipeFromSuggestion } from '../utils/gemini';
import type { GeneratedRecipe } from '../utils/gemini';
import { calculateTargets } from '../utils/calculations';
import type { MealType } from '../types';

// ── Favorites ─────────────────────────────────────────────────────────────────
const FAV_KEY = 'morphiq_fav_recipes';
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]); }
  catch { return new Set(); }
}
function saveFavs(favs: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
}

// ── Saved AI ideas ─────────────────────────────────────────────────────────────
const IDEAS_KEY = 'morphiq_saved_ideas';
interface SavedIdea { name: string; description: string; calories?: string }
function loadSavedIdeas(): SavedIdea[] {
  try { return JSON.parse(localStorage.getItem(IDEAS_KEY) ?? '[]') as SavedIdea[]; }
  catch { return []; }
}
function addSavedIdea(idea: SavedIdea) {
  const all = loadSavedIdeas();
  if (!all.find(i => i.name === idea.name)) {
    all.unshift(idea);
    localStorage.setItem(IDEAS_KEY, JSON.stringify(all));
  }
}
function removeSavedIdea(name: string) {
  const all = loadSavedIdeas().filter(i => i.name !== name);
  localStorage.setItem(IDEAS_KEY, JSON.stringify(all));
}

// ── Meal color palette (FitPantry design) ─────────────────────────────────────
const MEAL_COLORS: Record<string, { accent: string; food: string }> = {
  breakfast: { accent: '#ffe3d3', food: '#ffd166' },
  lunch:     { accent: '#d7f7ea', food: '#f2a65a' },
  dinner:    { accent: '#dbeafe', food: '#f77f73' },
  snack:     { accent: '#eadcff', food: '#8c6ff7' },
};

function getRecipeMealType(tags: string[]): string {
  if (tags.includes('breakfast')) return 'breakfast';
  if (tags.includes('lunch')) return 'lunch';
  if (tags.includes('dinner')) return 'dinner';
  if (tags.includes('snack')) return 'snack';
  return 'lunch';
}

// ── Badge color per meal type ──────────────────────────────────────────────────
const BADGE_COLOR: Record<string, string> = {
  breakfast: '#F59E0B',
  lunch:     '#10B981',
  dinner:    '#3B82F6',
  snack:     '#8B5CF6',
};

// ── Derived descriptive tags ───────────────────────────────────────────────────
function getDisplayTags(r: Recipe): string[] {
  const tags: string[] = [];
  if (r.protein >= 30) tags.push('protéines');
  else if (r.protein >= 20) tags.push('protéiné');
  if (r.time <= 10) tags.push('rapide');
  if (r.costPerServing !== undefined && r.costPerServing <= 3) tags.push('budget');
  if (r.tips?.toLowerCase().includes('meal prep')) tags.push('meal prep');
  return tags.slice(0, 3);
}

// ── Ingredient line parser (splits "200g de Skyr" → qty:"200 g" name:"Skyr") ──
function parseIngLine(raw: string): { name: string; qty: string } {
  const m1 = raw.match(/^(\d+(?:[,.]\d+)?)\s*(g|kg|ml|L|cl)\s+(?:de\s+(?:la\s+|l['']\s*)?|d['']\s*|du\s+|des\s+)?(.+)/i);
  if (m1) return { qty: `${m1[1]} ${m1[2]}`, name: m1[3].trim() };

  const m2 = raw.match(/^(\d+(?:[,.]\d+)?)\s+(?:cuillères?\s+à\s+(soupe|café)|c\.à\.(s|c)\.?)\s+(?:de\s+(?:la\s+|l['']\s*)?|d['']\s*|du\s+|des\s+)?(.+)/i);
  if (m2) return { qty: `${m2[1]} c. ${(m2[2] === 'soupe' || m2[3] === 's') ? 'soupe' : 'café'}`, name: m2[4].trim() };

  const m3 = raw.match(/^(\d+(?:[,.]\d+)?)\s+(noix|noisette|pincées?|filet|poignée|boîte|gousses?|tranches?|portions?)\s+(?:de\s+(?:la\s+|l['']\s*)?|d['']\s*|du\s+|des\s+)?(.+)/i);
  if (m3) return { qty: `${m3[1]} ${m3[2]}`, name: m3[3].trim() };

  const m4 = raw.match(/^(\d+(?:[,.]\d+)?(?:\/\d+)?)\s+(.+)/);
  if (m4) return { qty: m4[1], name: m4[2].trim() };

  return { qty: '', name: raw.trim() };
}

// ── Ingredient scaler ─────────────────────────────────────────────────────────
function scaleIngredient(ing: string, scale: number): string {
  if (scale === 1) return ing;
  return ing.replace(/^(\d+(?:[,.]\d+)?(?:\/\d+)?)/, (_, n) => {
    const val = n.includes('/') ? n.split('/').reduce((a: number, b: string) => a / parseFloat(b)) : parseFloat(n.replace(',', '.'));
    if (isNaN(val)) return n;
    const s = Math.round(val * scale * 10) / 10;
    return s % 1 === 0 ? String(s) : String(s);
  });
}

// ── AI suggestion parser ─────────────────────────────────────────────────────
interface AiSuggestion { name: string; description: string; calories?: string }
function parseAiSuggestions(text: string): AiSuggestion[] {
  const results: AiSuggestion[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/^\d+\.\s+\*\*(.+?)\*\*[:\s]+(.+?)(?:~\s*(\d+)\s*cal)?\.?\s*$/i);
    if (m) {
      results.push({ name: m[1].replace(/:$/, ''), description: m[2].trim(), calories: m[3] });
    }
  }
  if (results.length === 0 && text.length > 10) {
    results.push({ name: 'Meal suggestion', description: text });
  }
  return results;
}

// ── Recipe data ───────────────────────────────────────────────────────────────
interface Recipe {
  name: string;
  emoji: string;
  time: number;
  servings: number;
  cal: number; protein: number; carbs: number; fat: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  tips?: string;
  costPerServing?: number;
}

const RECIPES: Recipe[] = [
  // ── Breakfast ──
  {
    name: 'Bowl de Skyr Fruité', emoji: '🫙', time: 5, servings: 1,
    cal: 360, protein: 26, carbs: 38, fat: 10, costPerServing: 3.50,
    tags: ['breakfast', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['200g de Skyr nature', '30g de flocons d\'avoine', '15g d\'amandes ou noix concassées', '1 cuillère à café de miel', '50g de fruits rouges'],
    steps: ['Mettre le skyr au fond du bol.', 'Ajouter l\'avoine et les oléagineux pour le croquant.', 'Napper avec le miel et les fruits frais.'],
    tips: 'Remplacez par du fromage blanc 0% pour plus d\'économies.',
  },
  {
    name: 'Omelette Fondante au Fromage', emoji: '🍳', time: 7, servings: 1,
    cal: 340, protein: 26, carbs: 2, fat: 25, costPerServing: 2.80,
    tags: ['breakfast', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['3 gros œufs extra-frais', '30g de Comté ou gruyère râpé', '1 noisette de beurre', 'Sel, poivre, ciboulette'],
    steps: ['Battre vigoureusement les œufs jusqu\'à ce qu\'ils soient mousseux.', 'Chauffer la poêle à feu moyen-doux avec le beurre.', 'Ramener continuellement les bords cuits vers le centre.', 'Quand le fond est pris mais le dessus encore humide, parsemer le fromage.', 'Plier et faire glisser dans l\'assiette. La chaleur résiduelle fond le fromage.'],
    tips: 'La clé d\'une bonne omelette : ne jamais dépasser le feu moyen-doux.',
  },
  {
    name: 'Overnight Oats Pomme et Noix', emoji: '🍎', time: 5, servings: 1,
    cal: 290, protein: 8, carbs: 35, fat: 14, costPerServing: 1.50,
    tags: ['breakfast', 'lose_weight', 'maintain'],
    ingredients: ['40g de flocons d\'avoine', '120ml de lait d\'amande sans sucre', '1/2 pomme coupée en petits dés', '15g de cerneaux de noix concassés', '1 cuillère à café de cannelle'],
    steps: ['La veille, mélanger l\'avoine, la cannelle et le lait dans un récipient.', 'Ajouter les dés de pomme et les noix.', 'Fermer et laisser au réfrigérateur toute la nuit.', 'Déguster frais le lendemain matin.'],
    tips: 'Préparez 3 pots le dimanche pour toute la semaine !',
  },
  {
    name: 'Pudding de Chia Mangue', emoji: '🥭', time: 5, servings: 1,
    cal: 310, protein: 20, carbs: 24, fat: 12, costPerServing: 2.20,
    tags: ['breakfast', 'lose_weight', 'maintain'],
    ingredients: ['25g de graines de chia', '180ml de lait de soja nature', '100g de fromage blanc 0%', '50g de dés de mangue fraîche'],
    steps: ['Mélanger vigoureusement les graines de chia, le lait de soja et le fromage blanc.', 'Laisser reposer au réfrigérateur au moins 4 heures (ou toute la nuit).', 'Au moment de servir, ajouter les dés de mangue.'],
    tips: 'Les graines de chia gonflent et épaississent — plus c\'est long en repos, mieux c\'est.',
  },
  {
    name: 'Œufs Brouillés Crémeux Toast', emoji: '🍞', time: 10, servings: 1,
    cal: 390, protein: 24, carbs: 18, fat: 22, costPerServing: 2.50,
    tags: ['breakfast', 'build_muscle', 'maintain'],
    ingredients: ['3 gros œufs', '20g de fromage frais (chèvre ou fromage blanc)', '1 tranche de pain de seigle ou complet', 'Ciboulette fraîche'],
    steps: ['Battre les œufs.', 'Cuire à feu doux en remuant constamment pour garder le côté moelleux.', 'Hors du feu, incorporer le fromage frais et la ciboulette.', 'Servir sur le toast grillé.'],
  },
  {
    name: 'Overnight Oats aux Fruits Rouges', emoji: '🫙', time: 10, servings: 1,
    cal: 420, protein: 20, carbs: 58, fat: 10, costPerServing: 1.80,
    tags: ['breakfast', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['80g de flocons d\'avoine', '200ml de lait d\'amande non sucré', '100g de fruits rouges (frais ou surgelés)', '1 cuillère à soupe de graines de chia', '1 cuillère à café de miel', 'Cannelle'],
    steps: ['Mélanger l\'avoine, le lait, les graines de chia et la cannelle.', 'Couvrir et réfrigérer toute la nuit.', 'Le matin, garnir avec les fruits rouges et le miel.', 'Remuer avant de manger et ajuster la consistance avec un peu de lait.'],
    tips: 'Ajouter une cuillère à soupe de beurre d\'amande pour plus de protéines.',
  },

  // ── Lunch ──
  {
    name: 'Salade Quinoa Thon Pois Chiches', emoji: '🌾', time: 15, servings: 1,
    cal: 490, protein: 42, carbs: 48, fat: 12, costPerServing: 5.20,
    tags: ['lunch', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['150g de thon au naturel égoutté', '100g de quinoa cuit', '100g de pois chiches rincés', 'Tomates cerises', 'Concombre', '1 cuillère à café d\'huile d\'olive', 'Jus de citron'],
    steps: ['Cuire le quinoa si nécessaire.', 'Égoutter et rincer les pois chiches et le thon.', 'Couper les tomates et le concombre.', 'Mélanger tous les ingrédients dans un grand bol.', 'Assaisonner avec l\'huile d\'olive et le jus de citron.'],
    tips: 'Cette salade se conserve 3-4 jours au frais — parfaite en meal prep !',
  },
  {
    name: 'Wrap Poulet Hummus Épinards', emoji: '🌯', time: 5, servings: 1,
    cal: 420, protein: 38, carbs: 34, fat: 12, costPerServing: 4.80,
    tags: ['lunch', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['1 grand wrap de blé complet', '120g de blanc de poulet cuit et effiloché', '30g de hummus nature', '1 poignée de jeunes pousses d\'épinards', '1/4 de poivron rouge en lanières'],
    steps: ['Étaler le hummus uniformément sur le wrap.', 'Disposer les épinards, le poivron et le poulet au centre.', 'Plier les bords et rouler le wrap serré.', 'Couper en deux pour servir.'],
    tips: 'Utilisez des restes de poulet rôti — zéro cuisson !',
  },
  {
    name: 'Dinde Patate Douce Avocat', emoji: '🍠', time: 20, servings: 1,
    cal: 440, protein: 38, carbs: 35, fat: 14, costPerServing: 5.50,
    tags: ['lunch', 'dinner', 'build_muscle', 'maintain'],
    ingredients: ['150g de filet de dinde', '150g de patate douce en dés', '1/4 d\'avocat', 'Herbes de Provence', 'Sel, poivre'],
    steps: ['Couper la patate douce en dés, cuire au four 20 min à 200°C (ou 8 min micro-ondes).', 'Saisir la dinde à la poêle avec les épices.', 'Servir avec les dés de patate douce chauds et les lamelles d\'avocat frais.'],
  },
  {
    name: 'Bowl Méditerranéen Poulet & Feta', emoji: '🫒', time: 20, servings: 1,
    cal: 470, protein: 42, carbs: 40, fat: 16, costPerServing: 5.80,
    tags: ['lunch', 'build_muscle', 'maintain'],
    ingredients: ['150g de filet de poulet en dés', '100g de boulgour cuit', '1/2 concombre en dés', '5 tomates cerises', '30g de vraie feta émiettée', '5 olives kalamata', 'Origan, paprika'],
    steps: ['Saisir les dés de poulet avec l\'origan et le paprika.', 'Disposer le boulgour dans une assiette creuse.', 'Ajouter le poulet chaud, le concombre, les tomates et les olives.', 'Parsemer de feta et servir.'],
  },
  {
    name: 'Patate Douce Farcie Pois Chiches', emoji: '🌱', time: 50, servings: 1,
    cal: 360, protein: 12, carbs: 60, fat: 5, costPerServing: 2.50,
    tags: ['lunch', 'dinner', 'lose_weight', 'maintain'],
    ingredients: ['1 patate douce moyenne (~200g)', '100g de pois chiches', '2 cuillères à soupe de yaourt grec', '1 cuillère à café de cumin et paprika fumé', 'Jus d\'un demi-citron vert'],
    steps: ['Cuire la patate douce au four 45 min à 200°C (ou 8-10 min micro-ondes).', 'Mélanger les pois chiches avec les épices.', 'Fendre la patate douce en deux, garnir des pois chiches.', 'Napper avec le yaourt mélangé au jus de citron vert.'],
  },
  {
    name: 'Grilled Chicken Power Bowl', emoji: '🥗', time: 25, servings: 1,
    cal: 510, protein: 48, carbs: 38, fat: 14, costPerServing: 6.50,
    tags: ['lunch', 'dinner', 'build_muscle', 'maintain', 'lose_weight'],
    ingredients: ['200g de filet de poulet', '100g de quinoa cuit', '80g de jeunes pousses', '1/2 avocat tranché', '100g de tomates cerises', '2 cuillères à soupe d\'huile d\'olive', 'Jus de citron, ail, sel'],
    steps: ['Assaisonner le poulet et cuire à la poêle 6-7 min de chaque côté.', 'Préparer la vinaigrette huile d\'olive + citron + ail.', 'Assembler le bol : quinoa, salade, tomates, avocat, poulet tranché.', 'Arroser de vinaigrette et servir.'],
    tips: 'Mariner le poulet 30 min dans le citron et l\'ail pour plus de saveur.',
  },

  // ── Dinner ──
  {
    name: 'Papillote de Cabillaud & Lentilles', emoji: '🐟', time: 25, servings: 1,
    cal: 340, protein: 36, carbs: 28, fat: 8, costPerServing: 7.50,
    tags: ['dinner', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['150g de dos de cabillaud', '120g de lentilles vertes cuites', '1 courgette en rondelles', 'Jus de citron', 'Huile d\'olive', 'Sel, poivre'],
    steps: ['Préchauffer le four à 180°C.', 'Placer le poisson et les courgettes dans du papier cuisson avec le citron et l\'huile.', 'Fermer la papillote et enfourner 15 min.', 'Réchauffer les lentilles et servir le poisson dessus.'],
  },
  {
    name: 'Chili Bœuf & Haricots Rouges', emoji: '🌶️', time: 25, servings: 1,
    cal: 410, protein: 38, carbs: 32, fat: 12, costPerServing: 5.20,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['130g de bœuf haché 5% MG', '100g de haricots rouges cuits', '150ml de coulis de tomate', 'Oignons, poivrons', 'Épices chili, cumin'],
    steps: ['Faire revenir l\'oignon et le poivron.', 'Ajouter la viande et dorer.', 'Ajouter les haricots rouges et le coulis de tomate.', 'Laisser mijoter 10-15 minutes. Assaisonner.'],
    tips: 'Encore meilleur le lendemain — parfait en meal prep !',
  },
  {
    name: 'Frittata Thon & Courgettes', emoji: '🥚', time: 25, servings: 1,
    cal: 380, protein: 41, carbs: 8, fat: 19, costPerServing: 4.50,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['3 œufs entiers', '1 boîte de thon au naturel (130g égoutté)', '1 courgette moyenne râpée', '1/2 oignon émincé', '1 cuillère à café d\'huile d\'olive'],
    steps: ['Faire revenir l\'oignon et la courgette 5 min.', 'Battre les œufs avec le thon émietté, sel et poivre.', 'Verser sur les légumes, couvrir et cuire à feu doux 8-10 min.'],
  },
  {
    name: 'Salade Lentilles & Saumon Fumé', emoji: '🐠', time: 5, servings: 1,
    cal: 340, protein: 27, carbs: 30, fat: 9, costPerServing: 6.80,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['150g de lentilles vertes cuites', '80g de saumon fumé en lanières', '1/4 de concombre en dés', 'Aneth fraîche', '1 cuillère à café de moutarde + jus de citron'],
    steps: ['Réchauffer légèrement les lentilles si désirées.', 'Mélanger avec le concombre et la sauce citron-moutarde.', 'Disposer les lanières de saumon fumé et parsemer d\'aneth.'],
  },
  {
    name: 'Zoodles Crevettes & Ail', emoji: '🦐', time: 15, servings: 1,
    cal: 260, protein: 30, carbs: 8, fat: 12, costPerServing: 7.20,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['1 belle courgette spiralisée ou en julienne', '150g de crevettes décortiquées', '2 gousses d\'ail hachées', '1 cuillère à soupe d\'huile d\'olive', 'Persil frais'],
    steps: ['Chauffer l\'huile, faire dorer l\'ail et les crevettes 3 min.', 'Ajouter les zoodles, sauter 2 min (ne pas trop cuire).', 'Saupoudrer de persil et servir.'],
    tips: 'Ne pas trop cuire les zoodles — ils doivent rester croquants.',
  },
  {
    name: 'Fondue de Poireaux & Saumon', emoji: '🫳', time: 30, servings: 1,
    cal: 380, protein: 30, carbs: 10, fat: 24, costPerServing: 8.50,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['1 pavé de saumon frais (~130g)', '2 blancs de poireaux émincés finement', '1 cuillère à soupe de crème fraîche 15%', 'Sel, poivre, jus de citron'],
    steps: ['Faire suer les poireaux à couvert à feu doux 15 min avec un fond d\'eau.', 'En fin de cuisson, ajouter la crème, saler et poivrer.', 'Cuire le saumon à la poêle (côté peau en premier) ou à la vapeur.', 'Dresser le saumon sur les poireaux avec un filet de citron.'],
  },
  {
    name: 'Baked Salmon & Sweet Potato', emoji: '🐟', time: 30, servings: 1,
    cal: 540, protein: 40, carbs: 42, fat: 18, costPerServing: 9.50,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['180g filet de saumon', '250g patate douce en cubes', '200g brocoli', '2 cuillères à soupe huile d\'olive', '1 cuillère à soupe sauce soja', '1 cuillère à café miel', 'Ail, gingembre'],
    steps: ['Préchauffer le four à 200°C.', 'Rôtir la patate douce 15 min.', 'Préparer la marinade soja-miel-ail-gingembre.', 'Ajouter le brocoli et badigeonner le saumon. Cuire 12-15 min.', 'Servir avec le jus de marinade restant.'],
    tips: 'Ne pas trop cuire le saumon — l\'intérieur doit rester légèrement opaque.',
  },

  // ── Snack ──
  {
    name: 'Tartines Cottage Cheese Seigle', emoji: '🧀', time: 3, servings: 1,
    cal: 160, protein: 11, carbs: 18, fat: 3, costPerServing: 1.80,
    tags: ['snack', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['2 crackers de seigle complet (type Wasa)', '60g de cottage cheese', '1/2 concombre tranché finement', 'Sel, poivre, graines de sésame'],
    steps: ['Tartiner généreusement les crackers avec le cottage cheese.', 'Disposer les tranches de concombre.', 'Assaisonner et saupoudrer de graines de sésame.'],
  },
  {
    name: 'Houmous Betterave & Carottes', emoji: '🥕', time: 5, servings: 1,
    cal: 140, protein: 5, carbs: 16, fat: 5, costPerServing: 1.50,
    tags: ['snack', 'lose_weight', 'maintain'],
    ingredients: ['50g de pois chiches en conserve', '50g de betterave rouge cuite', '1/2 cuillère à café de tahin', '1 carotte coupée en bâtonnets'],
    steps: ['Mixer les pois chiches, la betterave et le tahin avec un filet d\'eau.', 'Mixer jusqu\'à obtenir un houmous lisse et rose vif.', 'Servir avec les bâtonnets de carotte.'],
  },
  {
    name: 'Yaourt Grec & Fruits Rouges', emoji: '🍯', time: 8, servings: 1,
    cal: 320, protein: 24, carbs: 35, fat: 7, costPerServing: 3.20,
    tags: ['breakfast', 'snack', 'lose_weight', 'maintain'],
    ingredients: ['200g de yaourt grec 2%', '80g de granola faible en sucre', '100g de fruits rouges', '1 cuillère à café de miel', '1 cuillère à soupe de graines de lin'],
    steps: ['Mélanger l\'extrait de vanille au yaourt.', 'Dans un verre, alterner couches de yaourt, granola et fruits rouges.', 'Arroser de miel et saupoudrer de graines de lin.', 'Servir immédiatement pour garder le granola croquant.'],
  },
];

// ── Detailed recipe steps ─────────────────────────────────────────────────────
const DETAILED_STEPS: Record<string, string[]> = {
  'Bowl de Skyr Fruité': [
    'Versez le skyr nature au fond d\'un grand bol — il doit recouvrir généreusement le fond en couche épaisse.',
    'Saupoudrez les flocons d\'avoine directement sur le skyr. Ils vont légèrement s\'hydrater au contact et offrir une texture entre le croquant et le fondant.',
    'Sur une planche, concassez grossièrement les amandes (ou noix) au couteau en morceaux irréguliers — évitez de les réduire en poudre, les gros morceaux apportent plus de croquant et de satisfaction.',
    'Disposez les fruits rouges en surface. S\'ils sont surgelés, laissez-les décongeler 5 min à température ambiante pour qu\'ils libèrent leur jus et colorent naturellement le bol.',
    'Terminez avec la cuillère à café de miel en filet en spirale. Servez immédiatement pour profiter du contraste textures croquant-crémeux.',
  ],
  'Omelette Fondante au Fromage': [
    'Sortez les œufs du réfrigérateur 10 min avant — à température ambiante, ils cuisent plus uniformément et la texture finale est plus soyeuse.',
    'Cassez les 3 œufs dans un bol, ajoutez une pincée de sel et de poivre, puis battez vigoureusement à la fourchette pendant 1 min jusqu\'à obtenir un mélange mousseux et d\'une couleur homogène.',
    'Râpez le Comté finement et posez-le à portée de main — vous devrez l\'ajouter rapidement au bon moment.',
    'Chauffez une poêle antiadhésive de 22-24 cm à feu moyen-doux. Ajoutez la noisette de beurre et attendez qu\'elle fonde et mousse légèrement, sans jamais grésiller fort.',
    'Versez les œufs battus d\'un coup. Avec une spatule souple, ramenez immédiatement les bords cuits vers le centre en faisant des petits cercles et en inclinant légèrement la poêle pour que l\'œuf liquide s\'écoule vers les bords libres.',
    'Quand le fond est bien pris (≈ 1 min 30) et que le dessus reste encore légèrement brillant et humide, parsemez le fromage râpé sur une seule moitié de l\'omelette.',
    'Pliez délicatement l\'omelette en deux sur elle-même à l\'aide de la spatule. Inclinez la poêle et faites glisser l\'omelette dans l\'assiette — la chaleur résiduelle terminera de fondre le fromage à cœur.',
    'Ciselez la ciboulette par-dessus et servez immédiatement : une omelette n\'attend pas !',
  ],
  'Overnight Oats Pomme et Noix': [
    'La veille au soir : dans un bocal hermétique ou un bol avec couvercle, versez les 40 g de flocons d\'avoine.',
    'Ajoutez la cuillère à café de cannelle et mélangez rapidement aux flocons pour bien les enrober d\'épices.',
    'Versez les 120 ml de lait d\'amande sur les flocons et remuez pour homogénéiser. Le liquide doit dépasser légèrement le niveau de l\'avoine.',
    'Pelez la demi-pomme et coupez-la en petits dés réguliers d\'environ 1 cm. Ajoutez les dés et les cerneaux de noix concassés dans le bocal. Mélangez une dernière fois.',
    'Fermez hermétiquement et placez au réfrigérateur pour la nuit (min 6 heures). Le matin, les flocons auront absorbé tout le liquide. Remuez avant de déguster — ajoutez un filet de lait si la consistance vous semble trop épaisse.',
  ],
  'Pudding de Chia Mangue': [
    'Dans un bocal ou un bol, versez le lait de soja et le fromage blanc 0%. Fouettez vigoureusement pour dissoudre le fromage blanc sans grumeaux.',
    'Ajoutez les graines de chia d\'un seul coup. Remuez énergiquement pendant 30 secondes, puis attendez 2 min et remuez à nouveau — cette deuxième fois empêche les graines de coller en bloc au fond.',
    'Couvrez et réfrigérez minimum 4 heures, idéalement toute la nuit. Les graines vont gonfler et former une texture gélatineuse et crémeuse.',
    'Le matin, coupez la mangue en petits dés réguliers. Si vous utilisez une mangue fraîche, pelez-la et découpez les deux joues, puis grillage en cubes.',
    'Sortez le pudding, remuez-le et vérifiez la consistance — si trop épais, ajoutez un peu de lait de soja. Disposez les dés de mangue fraîche sur le dessus et servez.',
  ],
  'Œufs Brouillés Crémeux Toast': [
    'Glissez la tranche de pain dans le grille-pain — il doit être bien doré et croustillant. Pendant ce temps, préparez les œufs.',
    'Cassez les 3 œufs dans un bol, battez-les brièvement avec une fourchette — juste assez pour mélanger le jaune et le blanc, sans trop incorporer d\'air.',
    'Chauffez une petite casserole à fond épais à feu TRÈS doux (c\'est le secret absolu des œufs brouillés parfaits). Versez les œufs battus et commencez à remuer en 8 avec une spatule souple, sans jamais arrêter.',
    'Remuez constamment en raclant bien le fond et les bords pendant 4-5 min. Les œufs doivent cuire très lentement en formant de petits flocons crémeux et soyeux.',
    'Dès que les œufs forment des plis mous mais sont encore légèrement sous-cuits, retirez du feu. Incorporez le fromage frais hors du feu — la chaleur résiduelle termine la cuisson à la perfection.',
    'Disposez les œufs brouillés sur le toast chaud et croquant. Ciselez la ciboulette par-dessus et servez sans attendre.',
  ],
  'Overnight Oats aux Fruits Rouges': [
    'La veille, dans un grand bocal, versez les 80 g de flocons d\'avoine, la cuillère de graines de chia et une bonne pincée de cannelle. Mélangez les ingrédients secs ensemble.',
    'Versez les 200 ml de lait d\'amande. Si vous utilisez des fruits rouges surgelés, ajoutez-les dès maintenant — ils décongèleront toute la nuit en parfumant le liquide. Remuez bien.',
    'Ajoutez la cuillère à café de miel et remuez une dernière fois. La texture sera assez liquide — c\'est normal, l\'avoine et les graines de chia absorberont tout.',
    'Fermez et réfrigérez au moins 6 heures. Le matin, sortez le bocal et laissez 2 min à température ambiante.',
    'Si les fruits rouges étaient frais, ajoutez-les maintenant. Remuez légèrement et ajustez la consistance avec un peu de lait d\'amande si besoin.',
  ],
  'Salade Quinoa Thon Pois Chiches': [
    'Rincez le quinoa sous l\'eau froide dans une passoire fine (enlève le goût amer). Mettez dans une casserole avec 2× son volume d\'eau froide et une pincée de sel. Portez à ébullition, couvrez, réduisez à feu doux 15 min jusqu\'à absorption complète.',
    'Pendant la cuisson du quinoa, ouvrez et égouttez la boîte de thon dans une passoire en pressant légèrement. Émiettez grossièrement. Rincez les pois chiches à l\'eau froide.',
    'Coupez les tomates cerises en deux et le concombre en petits dés. Dans un petit bol, préparez la vinaigrette : huile d\'olive + jus de citron + sel + poivre.',
    'Étalez le quinoa au fond d\'un grand bol. Disposez le thon, les pois chiches, les tomates et le concombre par-dessus en sections séparées pour une belle présentation.',
    'Versez la vinaigrette et mélangez délicatement. Goûtez et ajustez l\'assaisonnement. Se conserve 3-4 jours au frais en boîte hermétique.',
  ],
  'Wrap Poulet Hummus Épinards': [
    'Posez le wrap à plat sur une planche. Chauffez-le 20 sec dans une poêle sèche ou au micro-ondes pour le rendre plus souple et facile à rouler.',
    'Étalez le hummus au centre du wrap avec le dos d\'une cuillère, en laissant 3 cm libres sur les bords. Une couche généreuse évite que la garniture sèche.',
    'Disposez d\'abord les épinards sur le hummus pour former une base verte, puis les lanières de poivron rouge, et enfin le poulet effiloché au centre.',
    'Repliez les deux bords latéraux vers le centre (2-3 cm), puis roulez le wrap fermement en partant du bas, comme un burrito. Maintenez bien serré.',
    'Coupez le wrap en deux en diagonale d\'un seul mouvement net. Servez immédiatement ou emballez dans du film alimentaire pour emporter.',
  ],
  'Dinde Patate Douce Avocat': [
    'Préchauffez le four à 200°C. Pendant ce temps, pelez la patate douce et coupez-la en dés réguliers de 2 cm — taille uniforme pour une cuisson homogène.',
    'Disposez les dés sur une plaque avec papier cuisson. Arrosez d\'un filet d\'huile d\'olive, salez, poivrez et mélangez. Enfournez 20-25 min en retournant à mi-cuisson — ils doivent être tendres et légèrement caramélisés.',
    'Pendant la cuisson de la patate, préparez la dinde : saupoudrez généreusement d\'herbes de Provence des deux côtés, salez et poivrez.',
    '10 min avant la fin, chauffez une poêle antiadhésive à feu moyen-vif. Saisissez la dinde 4-5 min de chaque côté jusqu\'à belle coloration dorée. Elle est cuite quand il n\'y a plus de partie rosée visible.',
    'Laissez la dinde reposer 2 min sur une planche avant de la trancher — ce temps de repos redistribue les jus pour une viande plus moelleuse.',
    'Dressez dans l\'assiette : dés de patate douce rôtis, tranches de dinde dorées, et lamelles d\'avocat en éventail. Servez sans attendre.',
  ],
  'Bowl Méditerranéen Poulet & Feta': [
    'Découpez le filet de poulet en dés de 2-3 cm. Dans un bol, mélangez avec l\'origan, le paprika, sel et poivre pour bien les enrober. Laissez mariner 5 min.',
    'Pendant ce temps, coupez le concombre en petits dés, les tomates cerises en deux, dénoyautez et coupez les olives en deux.',
    'Chauffez un filet d\'huile d\'olive dans une poêle à feu moyen-vif. Faites sauter les dés de poulet 6-8 min en remuant régulièrement jusqu\'à belle coloration dorée sur toutes les faces et cuisson à cœur.',
    'Réchauffez le boulgour au micro-ondes 1 min avec une cuillère d\'eau, ou dans une petite casserole à feu doux avec un fond d\'eau.',
    'Montez le bowl : boulgour chaud au fond, dés de poulet d\'un côté, concombre et tomates de l\'autre, olives réparties.',
    'Émiettez généreusement la feta sur l\'ensemble. Terminez avec un filet d\'huile d\'olive et une pincée d\'origan supplémentaire.',
  ],
  'Patate Douce Farcie Pois Chiches': [
    'Préchauffez le four à 200°C. Lavez la patate douce, piquez-la 5-6 fois avec une fourchette (important pour éviter qu\'elle n\'éclate) et enveloppez-la dans du papier aluminium.',
    'Enfournez 45-50 min. Vérifiez la cuisson en plantant un couteau au centre — il doit s\'enfoncer sans résistance. En micro-ondes : 8-10 min à puissance maximale.',
    'Pendant la cuisson, égouttez et rincez les pois chiches. Dans un bol, mélangez-les avec le cumin, le paprika fumé, sel et poivre. Faites-les sauter à sec dans une poêle 3-4 min à feu moyen-vif jusqu\'à légère croustillance.',
    'Préparez la sauce : mélangez le yaourt grec avec le jus de citron vert et une pincée de sel. La sauce doit être lisse et légèrement acidulée.',
    'Sortez la patate du four (attention à la vapeur). Fendez-la en deux avec un couteau. Ouvrez-la délicatement en appuyant sur les côtés — la chair doit être fondante et orangée.',
    'Garnissez généreusement avec les pois chiches épicés et nappez de sauce yaourt-citron vert. Servez immédiatement.',
  ],
  'Grilled Chicken Power Bowl': [
    'Préparez la marinade : huile d\'olive + jus de citron + ail haché finement + sel + poivre. Plongez les filets de poulet et retournez-les. Laissez mariner au moins 15 min (ou 2 h au frais).',
    'Pendant la marinade, cuisez le quinoa : rincez-le, couvrez de 2× son volume d\'eau froide salée, portez à ébullition puis couvrez et laissez absorber 12-15 min à feu doux.',
    'Chauffez une poêle-gril à feu vif. Égouttez légèrement le poulet et cuisez 6-7 min de chaque côté sans le bouger — développez de belles traces de gril. Vérifiez la cuisson à cœur.',
    'Laissez le poulet reposer 3 min sur une planche puis tranchez en lamelles de biais — cette découpe met en valeur la chair.',
    'Coupez les tomates cerises en deux, tranchez l\'avocat et arrosez-le d\'un peu de citron pour éviter l\'oxydation.',
    'Assemblez : quinoa en base, jeunes pousses, tomates, avocat, puis poulet tranché par-dessus. Arrosez du reste de marinade et servez immédiatement.',
  ],
  'Papillote de Cabillaud & Lentilles': [
    'Préchauffez le four à 200°C. Découpez une grande feuille de papier cuisson (40 × 40 cm) — assez grande pour former un sachet hermétique.',
    'Lavez et coupez la courgette en rondelles de 5 mm. Disposez-les au centre de la feuille de papier cuisson en couche légèrement superposée.',
    'Posez le dos de cabillaud sur les courgettes. Arrosez d\'un filet d\'huile d\'olive et du jus de citron, salez et poivrez. Ajoutez une branche de thym ou aneth si disponible.',
    'Fermez hermétiquement la papillote en repliant les bords plusieurs fois pour créer une enveloppe étanche. Placez sur une plaque et enfournez 15-18 min selon l\'épaisseur du filet.',
    'Pendant la cuisson, réchauffez les lentilles dans une petite casserole avec un fond d\'eau, sel, poivre et une gousse d\'ail. Chauffez à feu doux en remuant.',
    'Sortez la papillote — attention à la vapeur en l\'ouvrant ! Vérifiez que le poisson s\'effiloche facilement. Versez les lentilles dans une assiette creuse et déposez le poisson par-dessus avec ses jus de cuisson.',
  ],
  'Chili Bœuf & Haricots Rouges': [
    'Émincez finement l\'oignon et coupez le poivron en petits dés réguliers de 1 cm. Ces deux légumes forment la base aromatique du chili.',
    'Chauffez un filet d\'huile dans une cocotte à feu moyen-vif. Faites revenir l\'oignon 3-4 min jusqu\'à transparence, puis ajoutez le poivron et continuez 2 min.',
    'Ajoutez la viande hachée et faites-la dorer en l\'émiettant avec une cuillère en bois. Elle doit être bien colorée, sans partie rosée — comptez 5-6 min.',
    'Incorporez le cumin et les épices chili, remuez 30 secondes pour les faire revenir dans la matière grasse et libérer leurs arômes. Ajoutez ensuite le coulis de tomate et les haricots rouges égouttés et rincés.',
    'Mélangez bien, portez à ébullition puis baissez à feu doux-moyen. Laissez mijoter à découvert 15-20 min en remuant de temps en temps — la sauce doit réduire et s\'épaissir.',
    'Goûtez et ajustez l\'assaisonnement. Servez chaud. Ce chili est encore meilleur réchauffé le lendemain !',
  ],
  'Frittata Thon & Courgettes': [
    'Émincez finement le demi-oignon. Lavez et râpez grossièrement la courgette. Pressez la courgette râpée dans vos mains au-dessus de l\'évier pour extraire le maximum d\'eau — sinon la frittata sera détrempée.',
    'Chauffez l\'huile d\'olive dans une poêle allant au four de 22-24 cm à feu moyen. Faites revenir l\'oignon 3 min, puis ajoutez la courgette essorée et poursuivez 3-4 min en remuant.',
    'Pendant ce temps, cassez les œufs dans un bol. Égouttez le thon et émiettez-le. Salez légèrement (le thon est déjà salé), poivrez et battez l\'ensemble.',
    'Réduisez le feu à moyen-doux. Versez le mélange œuf-thon sur les légumes sans mélanger. Avec une spatule, ramenez légèrement les bords vers le centre une seule fois.',
    'Couvrez la poêle et laissez cuire 8-10 min à feu doux — la frittata est prête quand les bords et le centre sont pris mais que la surface reste légèrement humide.',
    'Pour dorer la surface, passez 2-3 min sous le gril du four préchauffé en surveillant. Laissez tiédir 2 min avant de glisser sur une assiette de service.',
  ],
  'Salade Lentilles & Saumon Fumé': [
    'Si vous utilisez des lentilles en conserve, égouttez-les et rincez-les abondamment à l\'eau froide. Si fraîches, cuisez-les à l\'eau non salée 25-30 min jusqu\'à tendreté sans qu\'elles s\'écrasent.',
    'Préparez la vinaigrette dans un petit bol : mélangez la moutarde, le jus de citron, sel, poivre et un filet d\'huile d\'olive. Elle doit être légèrement acidulée pour contraster avec le gras du saumon.',
    'Pendant que les lentilles sont encore tièdes, versez la vinaigrette et mélangez. Laissez reposer 2 min pour qu\'elles s\'imprègnent bien.',
    'Coupez le concombre en petits dés réguliers. Détaillez le saumon fumé en lanières de 2-3 cm.',
    'Dressez dans une assiette creuse : les lentilles assaisonnées, les dés de concombre frais, puis les lanières de saumon fumé disposées avec soin. Parsemez d\'aneth fraîche ciselée et servez.',
  ],
  'Zoodles Crevettes & Ail': [
    'Préparez les zoodles avec un spiraliseur ou coupez la courgette en julienne au couteau. Réservez dans une passoire légèrement salée pendant 5 min pour dégorger l\'excès d\'eau, puis séchez avec du papier absorbant.',
    'Hachez finement les 2 gousses d\'ail. Décortiquez les crevettes si besoin et retirez le boyau noir en faisant une incision le long du dos.',
    'Chauffez l\'huile d\'olive dans une grande poêle à feu moyen-vif. Ajoutez l\'ail haché et faites-le dorer 30 secondes en remuant constamment — il ne doit pas brûler.',
    'Ajoutez immédiatement les crevettes en une seule couche. Cuisez 1 min 30 de chaque côté — dès qu\'elles sont roses de chaque côté, elles sont prêtes. Salez, poivrez.',
    'Ajoutez les zoodles séchés dans la poêle. Sautez 1-2 min maximum à feu vif en remuant — ils doivent rester al dente et légèrement croquants, jamais mous. Parsemez de persil frais et servez immédiatement.',
  ],
  'Fondue de Poireaux & Saumon': [
    'Coupez la base et le vert foncé des poireaux. Fendez-les en deux dans la longueur, lavez soigneusement entre les feuilles (le sable se cache entre les couches), puis émincez finement en demi-rondelles.',
    'Dans une sauteuse, versez 4-5 cm d\'eau, ajoutez les poireaux, couvrez hermétiquement et étuvez à feu très doux 15-20 min. Ils doivent devenir très tendres et translucides, sans coloration.',
    'Pendant la cuisson des poireaux, vérifiez que le saumon n\'a pas d\'arêtes (passez le doigt et retirez-les avec une pince). Salez et poivrez les deux faces.',
    'Quand les poireaux sont fondants et l\'eau presque évaporée, incorporez la crème fraîche. Remuez doucement, salez, poivrez et ajoutez un filet de jus de citron. Maintenez à feu très doux.',
    'Chauffez une poêle antiadhésive à feu moyen-vif. Déposez le saumon côté peau en premier et cuisez 4-5 min sans le toucher — la peau doit être bien croustillante. Retournez délicatement, cuisez encore 2-3 min. L\'intérieur doit rester légèrement nacré.',
    'Dressez la fondue de poireaux en base dans une assiette creuse. Posez le pavé de saumon par-dessus côté peau visible. Un trait de jus de citron sur le poisson et servez aussitôt.',
  ],
  'Baked Salmon & Sweet Potato': [
    'Préchauffez le four à 200°C. Pelez et coupez la patate douce en cubes de 2-3 cm. Disposez-les sur une plaque avec papier cuisson, arrosez d\'huile d\'olive, salez et poivrez. Enfournez pour 15 min.',
    'Pendant ce temps, détaillez le brocoli en fleurettes uniformes. Préparez la marinade : sauce soja + miel + ail haché + gingembre râpé. Fouettez pour bien mélanger.',
    'Au bout des 15 premières min, sortez la plaque. Ajoutez les fleurettes de brocoli autour des cubes de patate. Déposez le filet de saumon au centre.',
    'Badigeonnez généreusement le saumon de marinade avec un pinceau. Versez le reste de marinade sur les légumes. Réenfournez 12-15 min.',
    'Le saumon est cuit quand il s\'effiloche facilement à la fourchette mais que l\'intérieur reste légèrement nacré — ne jamais trop cuire le saumon.',
    'Sortez la plaque, laissez reposer 1-2 min. Dressez dans une assiette avec les légumes rôtis et arrosez du jus de cuisson caramélisé.',
  ],
  'Tartines Cottage Cheese Seigle': [
    'Posez les 2 crackers de seigle sur une planche. Avec le dos d\'une cuillère, étalez le cottage cheese généreusement en couvrant bien jusqu\'aux bords — une base épaisse est importante pour que les légumes tiennent.',
    'Lavez le concombre et tranchez-le très finement au couteau (2-3 mm) — des tranches fines et régulières sont plus jolies et faciles à croquer.',
    'Disposez les rondelles de concombre en les chevauchant légèrement sur le cottage cheese pour couvrir toute la surface.',
    'Assaisonnez avec sel, poivre fraîchement moulu et parsemez de graines de sésame. Servez immédiatement — les crackers restent croquants seulement quelques minutes après garnissage.',
  ],
  'Houmous Betterave & Carottes': [
    'Égouttez et rincez les pois chiches. Coupez la betterave cuite en petits morceaux pour faciliter le mixage.',
    'Dans un blender, combinez pois chiches, betterave, tahin et 2-3 cuillères à soupe d\'eau froide. Mixez à pleine puissance pendant 1 min.',
    'Ouvrez, raclez les parois et goûtez. Ajoutez sel, jus de citron et éventuellement un peu plus d\'eau pour la texture. Mixez encore 30 secondes. La couleur doit être rose-magenta intense et la texture très lisse.',
    'Épluchez la carotte et coupez-la en bâtonnets réguliers de 8-10 cm. Servez l\'houmous dans un bol avec un léger tourbillon décoratif et les bâtonnets disposés à côté.',
  ],
  'Yaourt Grec & Fruits Rouges': [
    'Versez le yaourt grec dans un grand bol. Travaillez-le légèrement à la cuillère pour l\'assouplir — il doit être ferme mais crémeux.',
    'Si vous utilisez des fruits rouges surgelés, laissez-les décongeler 15 min à température ambiante pour qu\'ils libèrent leur jus sans être trop mous.',
    'Dans un verre ou une coupe transparente, alternez les couches : yaourt, granola, fruits rouges. Les couches visibles à travers le verre sont un plus visuel appréciable.',
    'Parsemez les graines de lin sur le dessus. Terminez par un filet de miel en spirale.',
    'Servez immédiatement — le granola va ramollir rapidement au contact du yaourt. Si vous préparez à l\'avance, gardez le granola séparé et incorporez-le au dernier moment.',
  ],
};

const SUGGESTION_COLORS = ['bg-card-orange', 'bg-card-mint', 'bg-card-blue', 'bg-card-yellow', 'bg-card-pink'];
const SUGGESTION_TEXT = ['text-orange', 'text-green', 'text-blue', 'text-amber-700', 'text-pink-700'];

const MEAL_TYPES = [
  { value: 'breakfast' as MealType, label: 'Breakfast', icon: Coffee },
  { value: 'lunch' as MealType, label: 'Lunch', icon: Sun },
  { value: 'dinner' as MealType, label: 'Dinner', icon: Moon },
  { value: 'snack' as MealType, label: 'Snack', icon: Cookie },
];

// ── Generated Recipe Card ─────────────────────────────────────────────────────
function GeneratedRecipeCard({ recipe, onClose }: { recipe: GeneratedRecipe; onClose: () => void }) {
  const [servings, setServings] = useState(recipe.servings);
  const scale = servings / recipe.servings;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg overflow-y-auto">
      <div className="sticky top-0 bg-bg/90 backdrop-blur-sm flex items-center justify-between px-5 pt-12 pb-4">
        <h2 className="text-text font-black text-lg flex items-center gap-2">
          <span>{recipe.emoji}</span> {recipe.name}
        </h2>
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-section border border-border flex items-center justify-center">
          <X size={18} className="text-text" />
        </button>
      </div>

      <div className="px-5 pb-10 space-y-4">
        {/* Description */}
        <p className="text-dim text-sm leading-relaxed italic">{recipe.description}</p>

        {/* Macros */}
        <div className="bg-white shadow-card rounded-2xl p-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Calories', val: Math.round(recipe.macros.calories * scale), color: 'text-orange' },
            { label: 'Protein', val: `${Math.round(recipe.macros.protein * scale)}g`, color: 'text-green' },
            { label: 'Carbs', val: `${Math.round(recipe.macros.carbs * scale)}g`, color: 'text-blue' },
            { label: 'Fat', val: `${Math.round(recipe.macros.fat * scale)}g`, color: 'text-dim' },
          ].map(m => (
            <div key={m.label}>
              <p className={`font-black text-sm ${m.color}`}>{m.val}</p>
              <p className="text-muted text-[10px] mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Servings */}
        <div className="bg-white shadow-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted" />
            <span className="text-text text-sm font-bold">Portions</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 rounded-xl bg-section border border-border text-lg font-bold text-text flex items-center justify-center">−</button>
            <span className="text-text font-black text-lg w-6 text-center">{servings}</span>
            <button onClick={() => setServings(s => Math.min(10, s + 1))} className="w-8 h-8 rounded-xl bg-section border border-border text-lg font-bold text-text flex items-center justify-center">+</button>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white shadow-card rounded-2xl p-4">
          <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Ingrédients</p>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green mt-0.5 flex-shrink-0">·</span>
                <span className="text-dim">{scaleIngredient(ing, scale)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-white shadow-card rounded-2xl p-4">
          <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Préparation</p>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-purple-bg text-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-dim leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {recipe.tips && (
          <div className="bg-card-yellow rounded-2xl p-3 flex gap-2">
            <Lightbulb size={14} strokeWidth={1.5} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs leading-relaxed">{recipe.tips}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Nutrition() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'recipes' | 'ai'>('recipes');
  const [filter, setFilter] = useState<string>('all');
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs());
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(() => loadSavedIdeas());

  // Bottom sheet detail
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailServings, setDetailServings] = useState(1);

  function openDetail(r: Recipe) {
    setDetailRecipe(r);
    setDetailServings(r.servings);
    requestAnimationFrame(() => setSheetOpen(true));
  }

  function closeDetail() {
    setSheetOpen(false);
    setTimeout(() => setDetailRecipe(null), 300);
  }

  useEffect(() => {
    if (detailRecipe) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [detailRecipe]);
  // AI state
  const [aiMode, setAiMode] = useState<'suggestions' | 'from_ingredients'>('suggestions');
  const [aiMealType, setAiMealType] = useState<MealType>('lunch');
  const [aiResult, setAiResult] = useState<AiSuggestion[]>([]);
  const [ingredientsText, setIngredientsText] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);

  const goal = state.profile?.goal ?? 'maintain';
  const targets = state.profile ? calculateTargets(state.profile) : null;
  const consumed = state.todayLog.meals.reduce((s, m) => s + m.totalCalories, 0);
  const remaining = targets ? targets.calories - consumed : 0;

  const filtered = RECIPES.filter(r => {
    if (filter === 'favorites') return favs.has(r.name);
    return (filter === 'all' || r.tags.includes(filter)) && r.tags.includes(goal);
  });

  function toggleFav(name: string) {
    const next = new Set(favs);
    if (next.has(name)) next.delete(name); else next.add(name);
    saveFavs(next);
    setFavs(next);
  }

  function removeIdea(name: string) {
    removeSavedIdea(name);
    setSavedIdeas(loadSavedIdeas());
  }

  async function getSuggestions() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    setAiResult([]);
    try {
      const text = await getMealSuggestions(state.profile.geminiApiKey, goal, remaining, aiMealType);
      setAiResult(parseAiSuggestions(text));
    } catch { setAiResult([{ name: 'Erreur', description: 'Vérifiez votre clé API dans le Profil.' }]); }
    finally { setLoading(false); }
  }

  async function generateFromIngredients() {
    if (!state.profile?.geminiApiKey || !ingredientsText.trim()) return;
    setLoading(true);
    setGeneratedRecipe(null);
    try {
      const recipe = await generateRecipeFromIngredients(state.profile.geminiApiKey, ingredientsText.trim(), goal);
      setGeneratedRecipe(recipe);
    } catch { alert('Erreur de génération. Vérifiez votre clé API.'); }
    finally { setLoading(false); }
  }

  async function openSuggestionRecipe(suggestion: AiSuggestion) {
    if (!state.profile?.geminiApiKey) return;
    setLoadingSuggestion(suggestion.name);
    try {
      const recipe = await generateRecipeFromSuggestion(state.profile.geminiApiKey, suggestion.name, suggestion.description, goal);
      setGeneratedRecipe(recipe);
    } catch { /* silently fail */ }
    finally { setLoadingSuggestion(null); }
  }

  function saveIdea(idea: AiSuggestion) {
    addSavedIdea(idea);
    setSavedIdeas(loadSavedIdeas());
  }

  const scale = (r: Recipe) => detailServings / r.servings;

  return (
    <>
      {/* ── Detail full-page overlay ─────────────────────────────────────────── */}
      {detailRecipe && (
        <div
          className={`fixed inset-0 z-50 bg-bg overflow-y-auto transition-transform duration-300 ease-out ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Sticky header */}
          <div className="sticky top-0 bg-bg/95 backdrop-blur-sm z-10 px-5 pt-12 pb-3 flex items-center gap-3">
            <button
              onClick={closeDetail}
              className="w-10 h-10 rounded-2xl bg-white shadow-card border border-border flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <X size={16} className="text-text" />
            </button>
            <p className="text-text font-black text-lg truncate flex-1">{detailRecipe.name}</p>
          </div>

          {/* Hero */}
          {(() => {
            const mealType = getRecipeMealType(detailRecipe.tags);
            const colors = MEAL_COLORS[mealType] ?? MEAL_COLORS.lunch;
            const badge = BADGE_COLOR[mealType] ?? BADGE_COLOR.lunch;
            return (
              <div className="mx-5 mb-4 rounded-3xl overflow-hidden relative h-44" style={{ backgroundColor: colors.accent }}>
                <div className="absolute top-5 left-5">
                  <span className="px-3 py-1.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: badge }}>
                    {detailRecipe.cal} kcal
                  </span>
                  <p className="text-text/60 text-xs mt-2 font-medium">{detailRecipe.time} min · {detailRecipe.servings} portion{detailRecipe.servings > 1 ? 's' : ''}</p>
                </div>
                <div
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/60 flex items-center justify-center text-5xl"
                  style={{ boxShadow: `0 4px 24px ${colors.food}66` }}
                >
                  {detailRecipe.emoji}
                </div>
              </div>
            );
          })()}

          {/* Macro chips */}
          <div className="px-5 mb-4 flex gap-2 flex-wrap">
            {[`P ${detailRecipe.protein}g`, `G ${detailRecipe.carbs}g`, `L ${detailRecipe.fat}g`].map(label => (
              <span key={label} className="bg-white shadow-card border border-border text-text text-sm font-semibold px-3.5 py-2 rounded-2xl">{label}</span>
            ))}
          </div>

          {/* Ingredients */}
          <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-text font-black text-base">Ingrédients</p>
              <div className="flex items-center gap-3 bg-purple-bg rounded-full px-4 py-2">
                <button onClick={() => setDetailServings(s => Math.max(1, s - 1))} className="text-purple font-black text-base leading-none">−</button>
                <span className="text-purple font-bold text-sm">{detailServings} portion{detailServings > 1 ? 's' : ''}</span>
                <button onClick={() => setDetailServings(s => Math.min(12, s + 1))} className="text-purple font-black text-base leading-none">+</button>
              </div>
            </div>
            <div>
              {detailRecipe.ingredients.map((ing, i) => {
                const { qty, name } = parseIngLine(scaleIngredient(ing, scale(detailRecipe)));
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <p className="text-text font-semibold text-sm capitalize flex-1 min-w-0 pr-3">{name}</p>
                    {qty && (
                      <span className="bg-[#dbeafe] text-[#1e40af] text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">{qty}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preparation */}
          <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-text font-black text-base">Préparation</p>
              <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Clock size={11} /> {detailRecipe.time} min
              </span>
            </div>
            <ol className="space-y-5">
              {(DETAILED_STEPS[detailRecipe.name] ?? detailRecipe.steps).map((step, si) => (
                <li key={si} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-section text-text text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{si + 1}</span>
                  <p className="text-dim text-sm leading-relaxed flex-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {detailRecipe.tips && (
            <div className="mx-5 mb-4 bg-card-yellow rounded-2xl p-3 flex gap-2 items-start">
              <Lightbulb size={14} strokeWidth={1.5} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs leading-relaxed">{detailRecipe.tips}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mx-5 pb-12 pt-2">
            <button
              onClick={() => {
                closeDetail();
                navigate('/smart-grocery', { state: { recipe: detailRecipe, servings: detailServings } });
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-text rounded-2xl text-white text-sm font-bold active:scale-95 transition-all"
            >
              <ShoppingCart size={16} /> Panier moins cher
            </button>
          </div>
        </div>
      )}

      {generatedRecipe && (
        <GeneratedRecipeCard recipe={generatedRecipe} onClose={() => setGeneratedRecipe(null)} />
      )}

      <div className="page bg-bg">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="px-5 pt-14 pb-4 flex items-end justify-between">
          <div>
            <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">Recettes personnalisées</p>
            <h1 className="text-3xl font-black text-text tracking-tight">Nutrition</h1>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <div className="px-3 py-1.5 bg-purple-bg rounded-full">
              <span className="text-purple text-xs font-bold">{filtered.length}/{RECIPES.length}</span>
            </div>
            <button
              onClick={() => setTab(tab === 'ai' ? 'recipes' : 'ai')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${tab === 'ai' ? 'bg-purple text-white' : 'bg-text text-white'}`}
            >
              <Sparkles size={13} /> AI Chef
            </button>
          </div>
        </div>

        {tab === 'recipes' && (
          <>
            {/* Filter tabs */}
            <div className="px-5 mb-5">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all',       label: 'Toutes'    },
                  { id: 'breakfast', label: 'Matin'     },
                  { id: 'lunch',     label: 'Midi'      },
                  { id: 'dinner',    label: 'Soir'      },
                  { id: 'snack',     label: 'Collation' },
                  { id: 'favorites', label: '♡ Favoris' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      filter === f.id ? 'bg-text text-white' : 'bg-white text-text border border-border'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved AI ideas */}
            {filter !== 'favorites' && savedIdeas.length > 0 && (
              <div className="px-5 mb-4 space-y-2">
                <p className="text-muted text-xs font-bold uppercase tracking-widest">Idées sauvegardées</p>
                {savedIdeas.map((idea, i) => (
                  <div key={i} className={`${SUGGESTION_COLORS[i % SUGGESTION_COLORS.length]} rounded-2xl p-3 flex items-start justify-between gap-3`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${SUGGESTION_TEXT[i % SUGGESTION_TEXT.length]}`}>{idea.name}</p>
                      <p className="text-text/70 text-xs mt-0.5 leading-relaxed line-clamp-2">{idea.description}</p>
                    </div>
                    <button onClick={() => removeIdea(idea.name)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-text/40">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recipe cards */}
            <div className="px-5 space-y-4 pb-8">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-muted text-sm">Aucune recette trouvée.</div>
              )}
              {filtered.map(r => {
                const mealType = getRecipeMealType(r.tags);
                const colors = MEAL_COLORS[mealType] ?? MEAL_COLORS.lunch;
                const badge = BADGE_COLOR[mealType] ?? BADGE_COLOR.lunch;
                const displayTags = getDisplayTags(r);

                return (
                  <div key={r.name} className="bg-white shadow-card rounded-3xl overflow-hidden">
                    {/* Colored header */}
                    <div
                      className="relative h-36 overflow-hidden"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {/* Calorie badge */}
                      <div className="absolute top-4 left-4">
                        <span
                          className="px-3 py-1.5 rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: badge }}
                        >
                          {r.cal} kcal
                        </span>
                      </div>
                      {/* Food emoji circle */}
                      <div
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/60 flex items-center justify-center text-5xl shadow-sm"
                        style={{ boxShadow: `0 4px 24px ${colors.food}66` }}
                      >
                        {r.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 pt-4 pb-5">
                      {/* Title + heart */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-text font-black text-base leading-tight flex-1">{r.name}</h3>
                        <button
                          onClick={() => toggleFav(r.name)}
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0 -mt-0.5"
                        >
                          <Heart size={18} className={favs.has(r.name) ? 'fill-pink-500 text-pink-500' : 'text-muted'} />
                        </button>
                      </div>

                      {/* Macro pills */}
                      <div className="flex gap-1.5 flex-wrap mb-2.5">
                        {[`P ${r.protein}g`, `G ${r.carbs}g`, `L ${r.fat}g`].map(m => (
                          <span key={m} className="bg-section text-text text-xs font-semibold px-3 py-1 rounded-full">{m}</span>
                        ))}
                      </div>

                      {/* Descriptive tags */}
                      {displayTags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-4">
                          {displayTags.map(t => (
                            <span key={t} className="text-muted text-xs px-3 py-1 rounded-full bg-section">{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(r)}
                          className="flex-1 py-3 rounded-2xl border-2 border-border bg-white text-text text-sm font-bold active:scale-95 transition-all"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => navigate('/smart-grocery', { state: { recipe: r, servings: r.servings } })}
                          className="flex-[2] py-3 rounded-2xl bg-text text-white text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart size={14} /> Panier moins cher
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'ai' && (
          <div className="px-5">
            {!state.profile?.geminiApiKey ? (
              <div className="bg-white shadow-card rounded-2xl p-6 text-center">
                <Sparkles size={32} className="text-purple mx-auto mb-3" />
                <p className="text-text font-medium mb-1 text-sm">Clé Gemini API requise</p>
                <p className="text-muted text-xs">Ajouter dans Profil — c'est gratuit.</p>
              </div>
            ) : (
              <>
                <div className="flex bg-section rounded-2xl p-1 gap-1 mb-5">
                  <button onClick={() => setAiMode('suggestions')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${aiMode === 'suggestions' ? 'bg-white shadow-sm text-text' : 'text-muted'}`}>
                    <Sparkles size={13} /> Idées repas
                  </button>
                  <button onClick={() => setAiMode('from_ingredients')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${aiMode === 'from_ingredients' ? 'bg-white shadow-sm text-text' : 'text-muted'}`}>
                    <ChefHat size={13} /> Ce que j'ai
                  </button>
                </div>

                {aiMode === 'suggestions' && (
                  <>
                    <p className="text-dim text-sm mb-4">Idées personnalisées selon votre objectif et vos calories restantes.</p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {MEAL_TYPES.map(t => (
                        <button key={t.value} onClick={() => setAiMealType(t.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${aiMealType === t.value ? 'border-[#1C1C1E] bg-[#1C1C1E] text-white' : 'border-border text-muted bg-white'}`}
                        ><t.icon size={14} strokeWidth={1.5} />{t.label}</button>
                      ))}
                    </div>
                    <button onClick={getSuggestions} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2 text-sm">
                      {loading ? <><Loader size={16} className="animate-spin" /> En train de réfléchir...</> : <><Sparkles size={16} /> Obtenir des suggestions</>}
                    </button>
                    {aiResult.length > 0 && (
                      <div className="space-y-3">
                        {aiResult.map((s, i) => (
                          <div key={i} className={`${SUGGESTION_COLORS[i % SUGGESTION_COLORS.length]} rounded-3xl p-4`}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <p className={`font-black text-base ${SUGGESTION_TEXT[i % SUGGESTION_TEXT.length]}`}>{s.name}</p>
                                <p className="text-text/70 text-xs mt-1 leading-relaxed">{s.description}</p>
                                {s.calories && <span className="inline-block mt-2 bg-white/60 rounded-xl px-2.5 py-1 text-xs font-bold text-text">~{s.calories} kcal</span>}
                              </div>
                              <button onClick={() => saveIdea(s)} className="flex-shrink-0 w-9 h-9 rounded-2xl bg-white/60 flex items-center justify-center">
                                <Heart size={16} className={savedIdeas.find(id => id.name === s.name) ? 'fill-pink-500 text-pink-500' : 'text-text/50'} />
                              </button>
                            </div>
                            <button onClick={() => openSuggestionRecipe(s)} disabled={loadingSuggestion === s.name}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/70 rounded-2xl text-sm font-bold text-text active:scale-95 transition-all">
                              {loadingSuggestion === s.name ? <><Loader size={14} className="animate-spin" /> Génération...</> : <><ChefHat size={14} /> Voir la recette complète</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {aiMode === 'from_ingredients' && (
                  <>
                    <p className="text-dim text-sm mb-4">Dites-moi ce que vous avez dans votre frigo et je vous crée une recette sur mesure !</p>
                    <textarea
                      className="w-full bg-white shadow-card rounded-2xl px-4 py-3 text-text text-sm resize-none border border-border focus:outline-none focus:border-purple transition-colors mb-4"
                      rows={4}
                      placeholder={"ex: poulet, courgettes, tomates cerises, ail\nou: riz, thon en conserve, œufs, persil"}
                      value={ingredientsText}
                      onChange={e => setIngredientsText(e.target.value)}
                    />
                    <button onClick={generateFromIngredients} disabled={loading || !ingredientsText.trim()} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                      {loading ? <><Loader size={16} className="animate-spin" /> Création en cours...</> : <><ChefHat size={16} /> Créer ma recette</>}
                    </button>
                    <p className="text-muted text-xs text-center mt-3">La recette s'affichera en plein écran</p>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
