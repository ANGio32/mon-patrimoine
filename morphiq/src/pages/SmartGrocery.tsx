import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, ChevronDown, ChevronUp,
  Check, Copy, ExternalLink, RefreshCw, Package, Sparkles,
  MapPin, Leaf, Star, Tag, X, Share2,
} from 'lucide-react';
import {
  STORES, buildGroceryCart, exportCartAsText, matchIngredient, parseIngredient,
  type StoreId, type OptimizationMode, type GroceryLineItem, type MatchedProduct,
} from '../utils/smartGrocery';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
  recipe: { name: string; ingredients: string[]; servings: number };
  servings: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_STORES: StoreId[] = ['metro', 'iga', 'walmart', 'superc', 'maxi'];

const OPTIMIZATION_MODES: { value: OptimizationMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'cheapest',
    label: 'Moins cher',
    desc: 'Prix le plus bas par unité',
    icon: <Tag size={14} strokeWidth={1.5} />,
  },
  {
    value: 'best_value',
    label: 'Meilleur rapport',
    desc: 'Qualité / prix équilibré',
    icon: <Star size={14} strokeWidth={1.5} />,
  },
  {
    value: 'organic',
    label: 'Biologique',
    desc: 'Privilégie les produits bio',
    icon: <Leaf size={14} strokeWidth={1.5} />,
  },
  {
    value: 'local',
    label: 'Local',
    desc: 'Produits locaux / québécois',
    icon: <MapPin size={14} strokeWidth={1.5} />,
  },
  {
    value: 'fewest_stores',
    label: 'Un seul magasin',
    desc: 'Minimise les déplacements',
    icon: <ShoppingCart size={14} strokeWidth={1.5} />,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StoreToggle({
  selected,
  onChange,
}: {
  selected: StoreId[];
  onChange: (s: StoreId[]) => void;
}) {
  function toggle(id: StoreId) {
    if (selected.includes(id)) {
      if (selected.length === 1) return; // keep at least one
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_STORES.map(id => {
        const store = STORES[id];
        const active = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              active
                ? 'text-white border-transparent shadow-sm'
                : 'bg-section border-border text-muted'
            }`}
            style={active ? { backgroundColor: store.color, borderColor: store.color } : {}}
          >
            {store.name}
          </button>
        );
      })}
    </div>
  );
}

function OptimizationPills({
  selected,
  onChange,
}: {
  selected: OptimizationMode;
  onChange: (m: OptimizationMode) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {OPTIMIZATION_MODES.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all active:scale-95 flex-shrink-0 ${
            selected === m.value
              ? 'bg-purple text-white border-purple shadow-sm'
              : 'bg-section border-border text-muted'
          }`}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ProductBadges({ product }: { product: MatchedProduct }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {product.isOrganic && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
          <Leaf size={9} /> Bio
        </span>
      )}
      {product.isLocal && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
          <MapPin size={9} /> Local
        </span>
      )}
    </div>
  );
}

// Bottom sheet for selecting a replacement product
function ReplacementSheet({
  item,
  onSelect,
  onClose,
}: {
  item: GroceryLineItem;
  onSelect: (product: MatchedProduct) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="px-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Choisir un produit pour</p>
            <p className="text-sm font-bold text-text truncate max-w-[240px]">{item.ingredient.raw}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-section">
            <X size={16} className="text-muted" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 flex flex-col gap-3">
          {item.candidates.length === 0 && (
            <p className="text-muted text-sm text-center py-8">Aucun produit trouvé dans les magasins sélectionnés.</p>
          )}
          {item.candidates.map(p => {
            const isSelected = item.selected?.id === p.id;
            const store = STORES[p.storeId];
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                  isSelected ? 'border-purple bg-purple-bg' : 'border-border bg-section'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text leading-tight">{p.name}</p>
                    <p className="text-xs text-muted mt-0.5">{p.brand} · {p.packageSize}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: store.color }}
                      >
                        {store.name}
                      </span>
                      <ProductBadges product={p} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-text">{p.totalCost.toFixed(2)} $</p>
                    <p className="text-[10px] text-muted">{p.packagesNeeded}× {p.price.toFixed(2)} $</p>
                    {isSelected && <Check size={14} className="text-purple ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Single ingredient row
function IngredientRow({
  item,
  onTap,
}: {
  item: GroceryLineItem;
  onTap: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const store = item.selected ? STORES[item.selected.storeId] : null;

  return (
    <div className="bg-section rounded-2xl border border-border overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Ingredient info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-tight truncate">
            {item.ingredient.raw}
          </p>
          {item.selected ? (
            <p className="text-xs text-muted mt-0.5 truncate">
              {item.selected.name} · {item.selected.brand}
            </p>
          ) : (
            <p className="text-xs text-red-400 mt-0.5">Non trouvé</p>
          )}
        </div>

        {/* Price + store badge */}
        {item.selected && store ? (
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <p className="text-base font-black text-text">{item.selected.totalCost.toFixed(2)} $</p>
            <div className="flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: store.color }}
              >
                {store.name}
              </span>
              <button
                onClick={onTap}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-border text-muted text-[10px] font-semibold active:scale-95"
              >
                <RefreshCw size={9} /> Changer
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onTap}
            className="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-semibold active:scale-95 flex-shrink-0"
          >
            Trouver
          </button>
        )}
      </div>

      {/* Expand details */}
      {item.selected && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-border text-[10px] text-muted"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Masquer' : 'Détails'}
          </button>

          {expanded && (
            <div className="px-4 pb-3 pt-1 bg-bg/40 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Format</span>
                <span className="font-semibold text-text">{item.selected.packageSize}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Paquets nécessaires</span>
                <span className="font-semibold text-text">{item.selected.packagesNeeded} × {item.selected.price.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Prix par unité</span>
                <span className="font-semibold text-text">{(item.selected.pricePerUnit * 100).toFixed(2)} ¢/{item.selected.packageUnit === 'g' ? 'g' : item.selected.packageUnit === 'ml' ? 'ml' : 'unité'}</span>
              </div>
              <ProductBadges product={item.selected} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartGrocery() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const recipe = state?.recipe;
  const initialServings = state?.servings ?? recipe?.servings ?? 2;

  const [servings, setServings]     = useState(initialServings);
  const [stores, setStores]         = useState<StoreId[]>(ALL_STORES);
  const [mode, setMode]             = useState<OptimizationMode>('cheapest');
  const [replacingItem, setReplacingItem] = useState<GroceryLineItem | null>(null);
  const [copied, setCopied]         = useState(false);
  const [shared, setShared]         = useState(false);

  // Build cart
  const cart = useMemo(() => {
    if (!recipe) return null;
    return buildGroceryCart(recipe.ingredients, stores, mode, servings);
  }, [recipe, stores, mode, servings]);

  // Allow overriding product selection
  const [overrides, setOverrides] = useState<Record<string, MatchedProduct>>({});

  const displayItems = useMemo(() => {
    if (!cart) return [];
    return cart.items.map(item => ({
      ...item,
      selected: overrides[item.ingredient.raw] ?? item.selected,
      candidates: item.candidates.length > 0 ? item.candidates : matchIngredient(
        parseIngredient(item.ingredient.raw),
        ALL_STORES, // show all stores in replacement sheet
        mode,
      ),
    }));
  }, [cart, overrides, mode]);

  const totalCost = displayItems.reduce((s, i) => s + (i.selected?.totalCost ?? 0), 0);
  const costPerServing = servings > 0 ? totalCost / servings : totalCost;

  const matchedCount = displayItems.filter(i => i.selected).length;
  const unmatchedCount = displayItems.length - matchedCount;

  // Stores used
  const storesUsed = [...new Set(displayItems.map(i => i.selected?.storeId).filter(Boolean) as StoreId[])];

  async function handleCopy() {
    if (!recipe || !cart) return;
    const text = exportCartAsText({ ...cart, items: displayItems, totalCost, costPerServing }, recipe.name);
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareToNotes() {
    if (!recipe || !cart) return;
    const text = exportCartAsText({ ...cart, items: displayItems, totalCost, costPerServing }, recipe.name);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Liste de courses — ${recipe.name}`, text });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (_) { /* user cancelled or not supported */ }
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function handleStoreLink(storeId: StoreId) {
    // Open first unmatched or first item in store search
    const store = STORES[storeId];
    const firstItem = displayItems.find(i => i.selected?.storeId === storeId);
    const query = firstItem?.ingredient.name ?? recipe?.name ?? '';
    window.open(store.searchUrl + encodeURIComponent(query), '_blank');
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6 pb-24">
        <Sparkles size={40} strokeWidth={1.5} className="text-muted" />
        <p className="text-text font-bold text-center">Aucune recette sélectionnée</p>
        <p className="text-muted text-sm text-center">Retourne à la page Nutrition et clique sur "Créer mon panier" depuis une recette.</p>
        <button
          onClick={() => navigate('/nutrition')}
          className="mt-2 px-5 py-3 rounded-2xl bg-purple text-white text-sm font-bold active:scale-95 transition-all"
        >
          Voir les recettes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-section active:scale-95 transition-all">
          <ArrowLeft size={18} className="text-text" strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted">Panier intelligent</p>
          <p className="text-sm font-bold text-text truncate">{recipe.name}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-text">{totalCost.toFixed(2)} $</p>
          <p className="text-[10px] text-muted">{costPerServing.toFixed(2)} $/portion</p>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* Servings selector */}
        <div className="bg-section rounded-2xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-text">Portions</p>
            <p className="text-xs text-muted mt-0.5">Ajuste les quantités</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings(s => Math.max(1, s - 1))}
              className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center text-text font-bold text-lg active:scale-95"
            >
              –
            </button>
            <span className="text-xl font-black text-text w-6 text-center">{servings}</span>
            <button
              onClick={() => setServings(s => s + 1)}
              className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center text-text font-bold text-lg active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Store selector */}
        <div className="bg-section rounded-2xl border border-border p-4 flex flex-col gap-3">
          <p className="text-sm font-bold text-text">Magasins</p>
          <StoreToggle selected={stores} onChange={setStores} />
        </div>

        {/* Optimization mode */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-text px-1">Optimisation</p>
          <OptimizationPills selected={mode} onChange={setMode} />
          <p className="text-xs text-muted px-1">
            {OPTIMIZATION_MODES.find(m => m.value === mode)?.desc}
          </p>
        </div>

        {/* Summary band */}
        <div className="bg-purple rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-white/80" strokeWidth={1.5} />
            <div>
              <p className="text-white font-black text-base">{totalCost.toFixed(2)} $</p>
              <p className="text-white/70 text-[10px]">{matchedCount}/{displayItems.length} articles · {servings} portions</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px]">par portion</p>
            <p className="text-white font-black text-lg">{costPerServing.toFixed(2)} $</p>
          </div>
        </div>

        {/* Articles */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-text">Articles ({displayItems.length})</p>
            {unmatchedCount > 0 && (
              <span className="text-xs text-red-400 font-semibold">{unmatchedCount} non trouvé{unmatchedCount > 1 ? 's' : ''}</span>
            )}
          </div>
          {displayItems.map((item, i) => (
            <IngredientRow
              key={i}
              item={item}
              onTap={() => setReplacingItem(item)}
            />
          ))}
        </div>

        {/* Stores used + open links */}
        {storesUsed.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-text px-1">Ouvrir dans le magasin</p>
            <div className="flex flex-wrap gap-2">
              {storesUsed.map(id => {
                const store = STORES[id];
                return (
                  <button
                    key={id}
                    onClick={() => handleStoreLink(id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
                    style={{ backgroundColor: store.color }}
                  >
                    <ExternalLink size={12} />
                    {store.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex gap-2 pb-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-section border border-border text-text text-sm font-bold active:scale-95 transition-all"
          >
            {copied ? <Check size={15} className="text-green" /> : <Copy size={15} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button
            onClick={handleShareToNotes}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-section border border-border text-text text-sm font-bold active:scale-95 transition-all"
          >
            {shared ? <Check size={15} className="text-green" /> : <Share2 size={15} />}
            {shared ? 'Partagé !' : 'Notes Apple'}
          </button>
          <button
            onClick={() => {
              if (!recipe || !cart) return;
              const text = exportCartAsText({ ...cart, items: displayItems, totalCost, costPerServing }, recipe.name);
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `panier-${recipe.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#1C1C1E] text-white text-sm font-bold active:scale-95 transition-all"
          >
            <Package size={15} />
            Exporter
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted text-center px-4 pb-2">
          Les prix sont indicatifs et peuvent varier selon la date et la région. Données mockées — intégration API à venir.
        </p>
      </div>

      {/* Replacement bottom sheet */}
      {replacingItem && (
        <ReplacementSheet
          item={{
            ...replacingItem,
            candidates: matchIngredient(
              parseIngredient(replacingItem.ingredient.raw),
              ALL_STORES,
              mode,
            ),
          }}
          onSelect={product => {
            setOverrides(o => ({ ...o, [replacingItem.ingredient.raw]: product }));
            setReplacingItem(null);
          }}
          onClose={() => setReplacingItem(null)}
        />
      )}
    </div>
  );
}
