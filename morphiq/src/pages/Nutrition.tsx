import { useState } from 'react';
import { Sparkles, Loader, Clock, Users, Heart, ChefHat, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMealSuggestions, generateRecipeFromIngredients } from '../utils/gemini';
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
}

const RECIPES: Recipe[] = [
  // ── Breakfast ──
  {
    name: 'Bowl de Skyr Fruité', emoji: '🫙', time: 5, servings: 1,
    cal: 360, protein: 26, carbs: 38, fat: 10,
    tags: ['breakfast', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['200g de Skyr nature', '30g de flocons d\'avoine', '15g d\'amandes ou noix concassées', '1 cuillère à café de miel', '50g de fruits rouges'],
    steps: ['Mettre le skyr au fond du bol.', 'Ajouter l\'avoine et les oléagineux pour le croquant.', 'Napper avec le miel et les fruits frais.'],
    tips: 'Remplacez par du fromage blanc 0% pour plus d\'économies.',
  },
  {
    name: 'Omelette Fondante au Fromage', emoji: '🍳', time: 7, servings: 1,
    cal: 340, protein: 26, carbs: 2, fat: 25,
    tags: ['breakfast', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['3 gros œufs extra-frais', '30g de Comté ou gruyère râpé', '1 noisette de beurre', 'Sel, poivre, ciboulette'],
    steps: ['Battre vigoureusement les œufs jusqu\'à ce qu\'ils soient mousseux.', 'Chauffer la poêle à feu moyen-doux avec le beurre.', 'Ramener continuellement les bords cuits vers le centre.', 'Quand le fond est pris mais le dessus encore humide, parsemer le fromage.', 'Plier et faire glisser dans l\'assiette. La chaleur résiduelle fond le fromage.'],
    tips: 'La clé d\'une bonne omelette : ne jamais dépasser le feu moyen-doux.',
  },
  {
    name: 'Overnight Oats Pomme et Noix', emoji: '🍎', time: 5, servings: 1,
    cal: 290, protein: 8, carbs: 35, fat: 14,
    tags: ['breakfast', 'lose_weight', 'maintain'],
    ingredients: ['40g de flocons d\'avoine', '120ml de lait d\'amande sans sucre', '1/2 pomme coupée en petits dés', '15g de cerneaux de noix concassés', '1 cuillère à café de cannelle'],
    steps: ['La veille, mélanger l\'avoine, la cannelle et le lait dans un récipient.', 'Ajouter les dés de pomme et les noix.', 'Fermer et laisser au réfrigérateur toute la nuit.', 'Déguster frais le lendemain matin.'],
    tips: 'Préparez 3 pots le dimanche pour toute la semaine !',
  },
  {
    name: 'Pudding de Chia Mangue', emoji: '🥭', time: 5, servings: 1,
    cal: 310, protein: 20, carbs: 24, fat: 12,
    tags: ['breakfast', 'lose_weight', 'maintain'],
    ingredients: ['25g de graines de chia', '180ml de lait de soja nature', '100g de fromage blanc 0%', '50g de dés de mangue fraîche'],
    steps: ['Mélanger vigoureusement les graines de chia, le lait de soja et le fromage blanc.', 'Laisser reposer au réfrigérateur au moins 4 heures (ou toute la nuit).', 'Au moment de servir, ajouter les dés de mangue.'],
    tips: 'Les graines de chia gonflent et épaississent — plus c\'est long en repos, mieux c\'est.',
  },
  {
    name: 'Œufs Brouillés Crémeux Toast', emoji: '🍞', time: 10, servings: 1,
    cal: 390, protein: 24, carbs: 18, fat: 22,
    tags: ['breakfast', 'build_muscle', 'maintain'],
    ingredients: ['3 gros œufs', '20g de fromage frais (chèvre ou fromage blanc)', '1 tranche de pain de seigle ou complet', 'Ciboulette fraîche'],
    steps: ['Battre les œufs.', 'Cuire à feu doux en remuant constamment pour garder le côté moelleux.', 'Hors du feu, incorporer le fromage frais et la ciboulette.', 'Servir sur le toast grillé.'],
  },
  {
    name: 'Overnight Oats aux Fruits Rouges', emoji: '🫙', time: 10, servings: 1,
    cal: 420, protein: 20, carbs: 58, fat: 10,
    tags: ['breakfast', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['80g de flocons d\'avoine', '200ml de lait d\'amande non sucré', '100g de fruits rouges (frais ou surgelés)', '1 cuillère à soupe de graines de chia', '1 cuillère à café de miel', 'Cannelle'],
    steps: ['Mélanger l\'avoine, le lait, les graines de chia et la cannelle.', 'Couvrir et réfrigérer toute la nuit.', 'Le matin, garnir avec les fruits rouges et le miel.', 'Remuer avant de manger et ajuster la consistance avec un peu de lait.'],
    tips: 'Ajouter une cuillère à soupe de beurre d\'amande pour plus de protéines.',
  },

  // ── Lunch ──
  {
    name: 'Salade Quinoa Thon Pois Chiches', emoji: '🌾', time: 15, servings: 1,
    cal: 490, protein: 42, carbs: 48, fat: 12,
    tags: ['lunch', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['150g de thon au naturel égoutté', '100g de quinoa cuit', '100g de pois chiches rincés', 'Tomates cerises', 'Concombre', '1 cuillère à café d\'huile d\'olive', 'Jus de citron'],
    steps: ['Cuire le quinoa si nécessaire.', 'Égoutter et rincer les pois chiches et le thon.', 'Couper les tomates et le concombre.', 'Mélanger tous les ingrédients dans un grand bol.', 'Assaisonner avec l\'huile d\'olive et le jus de citron.'],
    tips: 'Cette salade se conserve 3-4 jours au frais — parfaite en meal prep !',
  },
  {
    name: 'Wrap Poulet Hummus Épinards', emoji: '🌯', time: 5, servings: 1,
    cal: 420, protein: 38, carbs: 34, fat: 12,
    tags: ['lunch', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['1 grand wrap de blé complet', '120g de blanc de poulet cuit et effiloché', '30g de hummus nature', '1 poignée de jeunes pousses d\'épinards', '1/4 de poivron rouge en lanières'],
    steps: ['Étaler le hummus uniformément sur le wrap.', 'Disposer les épinards, le poivron et le poulet au centre.', 'Plier les bords et rouler le wrap serré.', 'Couper en deux pour servir.'],
    tips: 'Utilisez des restes de poulet rôti — zéro cuisson !',
  },
  {
    name: 'Dinde Patate Douce Avocat', emoji: '🍠', time: 20, servings: 1,
    cal: 440, protein: 38, carbs: 35, fat: 14,
    tags: ['lunch', 'dinner', 'build_muscle', 'maintain'],
    ingredients: ['150g de filet de dinde', '150g de patate douce en dés', '1/4 d\'avocat', 'Herbes de Provence', 'Sel, poivre'],
    steps: ['Couper la patate douce en dés, cuire au four 20 min à 200°C (ou 8 min micro-ondes).', 'Saisir la dinde à la poêle avec les épices.', 'Servir avec les dés de patate douce chauds et les lamelles d\'avocat frais.'],
  },
  {
    name: 'Bowl Méditerranéen Poulet & Feta', emoji: '🫒', time: 20, servings: 1,
    cal: 470, protein: 42, carbs: 40, fat: 16,
    tags: ['lunch', 'build_muscle', 'maintain'],
    ingredients: ['150g de filet de poulet en dés', '100g de boulgour cuit', '1/2 concombre en dés', '5 tomates cerises', '30g de vraie feta émiettée', '5 olives kalamata', 'Origan, paprika'],
    steps: ['Saisir les dés de poulet avec l\'origan et le paprika.', 'Disposer le boulgour dans une assiette creuse.', 'Ajouter le poulet chaud, le concombre, les tomates et les olives.', 'Parsemer de feta et servir.'],
  },
  {
    name: 'Patate Douce Farcie Pois Chiches', emoji: '🌱', time: 50, servings: 1,
    cal: 360, protein: 12, carbs: 60, fat: 5,
    tags: ['lunch', 'dinner', 'lose_weight', 'maintain'],
    ingredients: ['1 patate douce moyenne (~200g)', '100g de pois chiches', '2 cuillères à soupe de yaourt grec', '1 cuillère à café de cumin et paprika fumé', 'Jus d\'un demi-citron vert'],
    steps: ['Cuire la patate douce au four 45 min à 200°C (ou 8-10 min micro-ondes).', 'Mélanger les pois chiches avec les épices.', 'Fendre la patate douce en deux, garnir des pois chiches.', 'Napper avec le yaourt mélangé au jus de citron vert.'],
  },
  {
    name: 'Grilled Chicken Power Bowl', emoji: '🥗', time: 25, servings: 1,
    cal: 510, protein: 48, carbs: 38, fat: 14,
    tags: ['lunch', 'dinner', 'build_muscle', 'maintain', 'lose_weight'],
    ingredients: ['200g de filet de poulet', '100g de quinoa cuit', '80g de jeunes pousses', '1/2 avocat tranché', '100g de tomates cerises', '2 cuillères à soupe d\'huile d\'olive', 'Jus de citron, ail, sel'],
    steps: ['Assaisonner le poulet et cuire à la poêle 6-7 min de chaque côté.', 'Préparer la vinaigrette huile d\'olive + citron + ail.', 'Assembler le bol : quinoa, salade, tomates, avocat, poulet tranché.', 'Arroser de vinaigrette et servir.'],
    tips: 'Mariner le poulet 30 min dans le citron et l\'ail pour plus de saveur.',
  },

  // ── Dinner ──
  {
    name: 'Papillote de Cabillaud & Lentilles', emoji: '🐟', time: 25, servings: 1,
    cal: 340, protein: 36, carbs: 28, fat: 8,
    tags: ['dinner', 'lose_weight', 'build_muscle', 'maintain'],
    ingredients: ['150g de dos de cabillaud', '120g de lentilles vertes cuites', '1 courgette en rondelles', 'Jus de citron', 'Huile d\'olive', 'Sel, poivre'],
    steps: ['Préchauffer le four à 180°C.', 'Placer le poisson et les courgettes dans du papier cuisson avec le citron et l\'huile.', 'Fermer la papillote et enfourner 15 min.', 'Réchauffer les lentilles et servir le poisson dessus.'],
  },
  {
    name: 'Chili Bœuf & Haricots Rouges', emoji: '🌶️', time: 25, servings: 1,
    cal: 410, protein: 38, carbs: 32, fat: 12,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['130g de bœuf haché 5% MG', '100g de haricots rouges cuits', '150ml de coulis de tomate', 'Oignons, poivrons', 'Épices chili, cumin'],
    steps: ['Faire revenir l\'oignon et le poivron.', 'Ajouter la viande et dorer.', 'Ajouter les haricots rouges et le coulis de tomate.', 'Laisser mijoter 10-15 minutes. Assaisonner.'],
    tips: 'Encore meilleur le lendemain — parfait en meal prep !',
  },
  {
    name: 'Frittata Thon & Courgettes', emoji: '🥚', time: 25, servings: 1,
    cal: 380, protein: 41, carbs: 8, fat: 19,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['3 œufs entiers', '1 boîte de thon au naturel (130g égoutté)', '1 courgette moyenne râpée', '1/2 oignon émincé', '1 cuillère à café d\'huile d\'olive'],
    steps: ['Faire revenir l\'oignon et la courgette 5 min.', 'Battre les œufs avec le thon émietté, sel et poivre.', 'Verser sur les légumes, couvrir et cuire à feu doux 8-10 min.'],
  },
  {
    name: 'Salade Lentilles & Saumon Fumé', emoji: '🐠', time: 5, servings: 1,
    cal: 340, protein: 27, carbs: 30, fat: 9,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['150g de lentilles vertes cuites', '80g de saumon fumé en lanières', '1/4 de concombre en dés', 'Aneth fraîche', '1 cuillère à café de moutarde + jus de citron'],
    steps: ['Réchauffer légèrement les lentilles si désirées.', 'Mélanger avec le concombre et la sauce citron-moutarde.', 'Disposer les lanières de saumon fumé et parsemer d\'aneth.'],
  },
  {
    name: 'Zoodles Crevettes & Ail', emoji: '🦐', time: 15, servings: 1,
    cal: 260, protein: 30, carbs: 8, fat: 12,
    tags: ['dinner', 'lose_weight', 'maintain'],
    ingredients: ['1 belle courgette spiralisée ou en julienne', '150g de crevettes décortiquées', '2 gousses d\'ail hachées', '1 cuillère à soupe d\'huile d\'olive', 'Persil frais'],
    steps: ['Chauffer l\'huile, faire dorer l\'ail et les crevettes 3 min.', 'Ajouter les zoodles, sauter 2 min (ne pas trop cuire).', 'Saupoudrer de persil et servir.'],
    tips: 'Ne pas trop cuire les zoodles — ils doivent rester croquants.',
  },
  {
    name: 'Fondue de Poireaux & Saumon', emoji: '🫳', time: 30, servings: 1,
    cal: 380, protein: 30, carbs: 10, fat: 24,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['1 pavé de saumon frais (~130g)', '2 blancs de poireaux émincés finement', '1 cuillère à soupe de crème fraîche 15%', 'Sel, poivre, jus de citron'],
    steps: ['Faire suer les poireaux à couvert à feu doux 15 min avec un fond d\'eau.', 'En fin de cuisson, ajouter la crème, saler et poivrer.', 'Cuire le saumon à la poêle (côté peau en premier) ou à la vapeur.', 'Dresser le saumon sur les poireaux avec un filet de citron.'],
  },
  {
    name: 'Baked Salmon & Sweet Potato', emoji: '🐟', time: 30, servings: 1,
    cal: 540, protein: 40, carbs: 42, fat: 18,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['180g filet de saumon', '250g patate douce en cubes', '200g brocoli', '2 cuillères à soupe huile d\'olive', '1 cuillère à soupe sauce soja', '1 cuillère à café miel', 'Ail, gingembre'],
    steps: ['Préchauffer le four à 200°C.', 'Rôtir la patate douce 15 min.', 'Préparer la marinade soja-miel-ail-gingembre.', 'Ajouter le brocoli et badigeonner le saumon. Cuire 12-15 min.', 'Servir avec le jus de marinade restant.'],
    tips: 'Ne pas trop cuire le saumon — l\'intérieur doit rester légèrement opaque.',
  },

  // ── Snack ──
  {
    name: 'Tartines Cottage Cheese Seigle', emoji: '🧀', time: 3, servings: 1,
    cal: 160, protein: 11, carbs: 18, fat: 3,
    tags: ['snack', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['2 crackers de seigle complet (type Wasa)', '60g de cottage cheese', '1/2 concombre tranché finement', 'Sel, poivre, graines de sésame'],
    steps: ['Tartiner généreusement les crackers avec le cottage cheese.', 'Disposer les tranches de concombre.', 'Assaisonner et saupoudrer de graines de sésame.'],
  },
  {
    name: 'Houmous Betterave & Carottes', emoji: '🥕', time: 5, servings: 1,
    cal: 140, protein: 5, carbs: 16, fat: 5,
    tags: ['snack', 'lose_weight', 'maintain'],
    ingredients: ['50g de pois chiches en conserve', '50g de betterave rouge cuite', '1/2 cuillère à café de tahin', '1 carotte coupée en bâtonnets'],
    steps: ['Mixer les pois chiches, la betterave et le tahin avec un filet d\'eau.', 'Mixer jusqu\'à obtenir un houmous lisse et rose vif.', 'Servir avec les bâtonnets de carotte.'],
  },
  {
    name: 'Yaourt Grec & Fruits Rouges', emoji: '🍯', time: 8, servings: 1,
    cal: 320, protein: 24, carbs: 35, fat: 7,
    tags: ['breakfast', 'snack', 'lose_weight', 'maintain'],
    ingredients: ['200g de yaourt grec 2%', '80g de granola faible en sucre', '100g de fruits rouges', '1 cuillère à café de miel', '1 cuillère à soupe de graines de lin'],
    steps: ['Mélanger l\'extrait de vanille au yaourt.', 'Dans un verre, alterner couches de yaourt, granola et fruits rouges.', 'Arroser de miel et saupoudrer de graines de lin.', 'Servir immédiatement pour garder le granola croquant.'],
  },
];

const SUGGESTION_COLORS = ['bg-card-orange', 'bg-card-mint', 'bg-card-blue', 'bg-card-yellow', 'bg-card-pink'];
const SUGGESTION_TEXT = ['text-orange', 'text-green', 'text-blue', 'text-amber-700', 'text-pink-700'];

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
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
          <div className="bg-card-yellow rounded-2xl p-3">
            <p className="text-amber-800 text-xs leading-relaxed">💡 {recipe.tips}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Nutrition() {
  const { state } = useApp();
  const [tab, setTab] = useState<'recipes' | 'ai'>('recipes');
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [servingsMap, setServingsMap] = useState<Record<string, number>>({});
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs());
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(() => loadSavedIdeas());

  // AI state
  const [aiMode, setAiMode] = useState<'suggestions' | 'from_ingredients'>('suggestions');
  const [aiMealType, setAiMealType] = useState<MealType>('lunch');
  const [aiResult, setAiResult] = useState<AiSuggestion[]>([]);
  const [ingredientsText, setIngredientsText] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);

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

  function saveIdea(idea: AiSuggestion) {
    addSavedIdea(idea);
    setSavedIdeas(loadSavedIdeas());
  }

  return (
    <>
      {generatedRecipe && (
        <GeneratedRecipeCard recipe={generatedRecipe} onClose={() => setGeneratedRecipe(null)} />
      )}

      <div className="page bg-bg">
        <div className="px-5 pt-14 pb-4">
          <h1 className="text-2xl font-black text-text tracking-tight">Nutrition</h1>
          <p className="text-dim text-sm mt-1">
            {remaining > 0 ? `${Math.round(remaining)} kcal restantes` : '🎯 Objectif journalier atteint !'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 mb-5">
          <div className="flex bg-white shadow-card rounded-2xl p-1 gap-1">
            <button onClick={() => setTab('recipes')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'recipes' ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}>
              Recettes
            </button>
            <button onClick={() => setTab('ai')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'ai' ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}>
              <Sparkles size={14} /> AI Chef
            </button>
          </div>
        </div>

        {tab === 'recipes' && (
          <>
            {/* Filter chips */}
            <div className="px-5 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'favorites', label: '❤️ Favoris' },
                  { id: 'all', label: 'Tout' },
                  { id: 'breakfast', label: '🌅 Petit-dej' },
                  { id: 'lunch', label: '☀️ Déjeuner' },
                  { id: 'dinner', label: '🌙 Dîner' },
                  { id: 'snack', label: '🍎 Collation' },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all whitespace-nowrap ${
                      filter === f.id ? 'border-purple bg-purple-bg text-purple' : 'border-border text-muted bg-white'
                    }`}
                  >{f.label}</button>
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

            <div className="px-5 space-y-3">
              {filtered.length === 0 && (
                <div className="text-center py-10 text-muted text-sm">Aucune recette trouvée.</div>
              )}
              {filtered.map((r) => {
                const isExpanded = expanded === r.name;
                const servings = servingsMap[r.name] ?? r.servings;
                const scale = servings / r.servings;
                return (
                  <div key={r.name} className="bg-white shadow-card rounded-3xl overflow-hidden">
                    <button onClick={() => setExpanded(isExpanded ? null : r.name)} className="w-full text-left p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-bg flex items-center justify-center text-3xl flex-shrink-0">{r.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-text font-bold text-sm leading-tight">{r.name}</h3>
                            <button
                              onClick={e => { e.stopPropagation(); toggleFav(r.name); }}
                              className="flex-shrink-0 w-7 h-7 flex items-center justify-center"
                            >
                              <Heart size={16} className={favs.has(r.name) ? 'fill-pink-500 text-pink-500' : 'text-muted'} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                            <span className="flex items-center gap-1"><Clock size={10} /> {r.time}min</span>
                            <span className="flex items-center gap-1"><Users size={10} /> {servings} pers.</span>
                          </div>
                          <div className="flex gap-3 mt-1.5 text-xs">
                            <span className="text-orange font-semibold">{Math.round(r.cal * scale)} kcal</span>
                            <span className="text-green">P {Math.round(r.protein * scale)}g</span>
                            <span className="text-blue">G {Math.round(r.carbs * scale)}g</span>
                            <span className="text-dim">L {Math.round(r.fat * scale)}g</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Serving adjuster */}
                        <div className="px-5 py-3 flex items-center justify-between bg-section">
                          <span className="text-text text-xs font-bold flex items-center gap-2"><Users size={13} /> Portions</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setServingsMap(m => ({ ...m, [r.name]: Math.max(1, (m[r.name] ?? r.servings) - 1) }))} className="w-8 h-8 rounded-xl bg-white border border-border text-text font-bold text-lg flex items-center justify-center">−</button>
                            <span className="text-text font-black w-5 text-center">{servings}</span>
                            <button onClick={() => setServingsMap(m => ({ ...m, [r.name]: Math.min(12, (m[r.name] ?? r.servings) + 1) }))} className="w-8 h-8 rounded-xl bg-white border border-border text-text font-bold text-lg flex items-center justify-center">+</button>
                          </div>
                        </div>

                        {/* Ingredients */}
                        <div className="px-5 pt-4 pb-3">
                          <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Ingrédients</p>
                          <ul className="space-y-1.5">
                            {r.ingredients.map((ing, ii) => (
                              <li key={ii} className="flex items-start gap-2 text-sm">
                                <span className="text-purple mt-0.5 flex-shrink-0">·</span>
                                <span className="text-dim">{scaleIngredient(ing, scale)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Steps */}
                        <div className="px-5 pb-4 border-t border-border pt-4">
                          <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Préparation</p>
                          <ol className="space-y-3">
                            {r.steps.map((step, si) => (
                              <li key={si} className="flex gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-purple-bg text-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{si + 1}</span>
                                <span className="text-dim leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {r.tips && (
                          <div className="mx-5 mb-4 bg-card-yellow rounded-2xl p-3">
                            <p className="text-amber-800 text-xs leading-relaxed">💡 {r.tips}</p>
                          </div>
                        )}
                      </div>
                    )}
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
                {/* Mode selector */}
                <div className="flex bg-section rounded-2xl p-1 gap-1 mb-5">
                  <button
                    onClick={() => setAiMode('suggestions')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${aiMode === 'suggestions' ? 'bg-white shadow-sm text-text' : 'text-muted'}`}
                  >
                    <Sparkles size={13} /> Idées repas
                  </button>
                  <button
                    onClick={() => setAiMode('from_ingredients')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${aiMode === 'from_ingredients' ? 'bg-white shadow-sm text-text' : 'text-muted'}`}
                  >
                    <ChefHat size={13} /> Ce que j'ai
                  </button>
                </div>

                {aiMode === 'suggestions' && (
                  <>
                    <p className="text-dim text-sm mb-4">Idées personnalisées selon votre objectif et vos calories restantes.</p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {MEAL_TYPES.map(t => (
                        <button key={t.value} onClick={() => setAiMealType(t.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${aiMealType === t.value ? 'border-purple bg-purple-bg text-purple' : 'border-border text-muted bg-white'}`}
                        >{t.emoji} {t.label}</button>
                      ))}
                    </div>
                    <button onClick={getSuggestions} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2 text-sm">
                      {loading ? <><Loader size={16} className="animate-spin" /> En train de réfléchir...</> : <><Sparkles size={16} /> Obtenir des suggestions</>}
                    </button>

                    {/* Pretty suggestion cards */}
                    {aiResult.length > 0 && (
                      <div className="space-y-3">
                        {aiResult.map((s, i) => (
                          <div key={i} className={`${SUGGESTION_COLORS[i % SUGGESTION_COLORS.length]} rounded-3xl p-4`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`font-black text-base ${SUGGESTION_TEXT[i % SUGGESTION_TEXT.length]}`}>{s.name}</p>
                                <p className="text-text/70 text-xs mt-1 leading-relaxed">{s.description}</p>
                                {s.calories && (
                                  <span className="inline-block mt-2 bg-white/60 rounded-xl px-2.5 py-1 text-xs font-bold text-text">~{s.calories} kcal</span>
                                )}
                              </div>
                              <button
                                onClick={() => saveIdea(s)}
                                className="flex-shrink-0 w-9 h-9 rounded-2xl bg-white/60 flex items-center justify-center"
                                title="Sauvegarder l'idée"
                              >
                                <Heart size={16} className={savedIdeas.find(id => id.name === s.name) ? 'fill-pink-500 text-pink-500' : 'text-text/50'} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {aiMode === 'from_ingredients' && (
                  <>
                    <p className="text-dim text-sm mb-4">Dites-moi ce que vous avez dans votre frigo et je vous crée une recette sur mesure !</p>
                    <div className="mb-4">
                      <p className="text-dim text-xs font-bold uppercase tracking-widest mb-2">Vos ingrédients disponibles</p>
                      <textarea
                        className="w-full bg-white shadow-card rounded-2xl px-4 py-3 text-text text-sm resize-none border border-border focus:outline-none focus:border-purple transition-colors"
                        rows={4}
                        placeholder={'ex: poulet, courgettes, tomates cerises, ail, huile d\'olive, citron\nou: riz, thon en conserve, œufs, persil'}
                        value={ingredientsText}
                        onChange={e => setIngredientsText(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={generateFromIngredients}
                      disabled={loading || !ingredientsText.trim()}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
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
