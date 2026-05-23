#!/usr/bin/env node
/**
 * scrape-prices.js — Scraper de prix d'épicerie pour Morphiq
 *
 * ── Setup (une seule fois) ────────────────────────────────────────────────────
 *   cd scripts
 *   npm install playwright
 *   npx playwright install chromium
 *
 * ── Utilisation ───────────────────────────────────────────────────────────────
 *   node scripts/scrape-prices.js
 *
 * ── Fichiers générés ──────────────────────────────────────────────────────────
 *   scripts/scrape-results.json   ← sauvegarde après chaque produit (reprise auto si interrompu)
 *   scripts/price-updates.sql     ← SQL à coller dans le SQL Editor de Supabase
 *
 * ── Notes ─────────────────────────────────────────────────────────────────────
 *   - Le navigateur s'ouvre en mode VISIBLE. Si un CAPTCHA apparaît, résous-le
 *     à la main dans le navigateur — le script attend automatiquement.
 *   - Si tu interromps avec Ctrl+C, relance : le script reprend là où il s'est arrêté.
 *   - Durée estimée : ~20-40 min pour les 153 produits (délais polis entre requêtes).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ── Supabase (anon key — lecture seule avec RLS, sûr à inclure) ───────────────
const SUPABASE_URL = 'https://wjkdgggtmhnkstsgtbou.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JXbzpyQvtPAzX4XBxxIerQ_eDUE9Vc8';

// ── URL de recherche par magasin ───────────────────────────────────────────────
const SEARCH_URL = {
  metro:   q => `https://www.metro.ca/epicerie-en-ligne/recherche?filter=${encodeURIComponent(q)}`,
  iga:     q => `https://www.iga.net/fr/recherche?k=${encodeURIComponent(q)}`,
  walmart: q => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}&lang=fr`,
  superc:  q => `https://www.superc.ca/epicerie-en-ligne/recherche?filter=${encodeURIComponent(q)}`,
  maxi:    q => `https://www.maxi.ca/epicerie-en-ligne/recherche?filter=${encodeURIComponent(q)}`,
};

// ── Extraction du premier prix trouvé sur la page ─────────────────────────────
async function extractFirstPrice(page, storeId) {
  // Attendre que les prix aient le temps de charger
  await page.waitForTimeout(3500 + Math.random() * 1500);

  return page.evaluate((store) => {
    function parsePrice(text) {
      if (!text) return null;
      const m = text.match(/(\d{1,3})[.,](\d{2})/);
      if (!m) return null;
      const v = parseFloat(`${m[1]}.${m[2]}`);
      return v > 0.25 && v < 500 ? v : null;
    }

    // Sélecteurs par groupe de magasin
    const selectors = {
      walmart: [
        '[data-automation="buybox-price"]',
        '.price-characteristic',
        '[itemprop="price"]',
        '.Price-group',
        '[class*="price-group"]',
        '[class*="PriceGroup"]',
      ],
      iga: [
        '.price-update__current-price',
        '.item-product__price',
        '.pi-price',
        '.price__main-value',
        '[class*="price"]',
      ],
      // Metro, Super C, Maxi — même moteur (Groupe Metro / Loblaw)
      _default: [
        '.pi-price-display',
        '.price-update__current-price',
        '[data-main-price]',
        '.pricing__sale-price',
        '.regular-price',
        '[class*="price-regular"]',
        '[class*="product-price"]',
      ],
    };

    const list = selectors[store] ?? selectors._default;

    // 1. Sélecteurs spécifiques
    for (const sel of list) {
      for (const el of document.querySelectorAll(sel)) {
        const price = parsePrice(el.textContent || el.getAttribute('content') || '');
        if (price) return price;
      }
    }

    // 2. JSON-LD schema.org Product
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || '');
        const items = Array.isArray(data) ? data : [data];
        for (const d of items) {
          const raw = d?.offers?.price ?? d?.offers?.[0]?.price ?? d?.price;
          if (raw) {
            const v = parseFloat(String(raw).replace(',', '.'));
            if (v > 0.25 && v < 500) return v;
          }
        }
      } catch { /* ignore */ }
    }

    // 3. Fallback : première occurrence "X,XX $" ou "$ X.XX" dans le texte de la page
    const bodyText = document.body?.innerText ?? '';
    for (const m of bodyText.matchAll(/(?:^|\s)(\d{1,3}[.,]\d{2})\s*\$/gm)) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (v > 0.25 && v < 500) return v;
    }
    // Aussi format "$X.XX"
    for (const m of bodyText.matchAll(/\$\s*(\d{1,3}[.,]\d{2})/g)) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (v > 0.25 && v < 500) return v;
    }

    return null;
  }, storeId);
}

// ── Fetch du catalogue depuis Supabase ────────────────────────────────────────
async function fetchCatalog() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/grocery_products?select=id,store_id,name,package_qty,package_unit&order=store_id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Génération du SQL ─────────────────────────────────────────────────────────
function generateSQL(results) {
  const sqlFile = path.join(__dirname, 'price-updates.sql');
  const found = Object.values(results).filter(Boolean).length;
  const lines = [
    `-- Prix scrapés le ${new Date().toLocaleDateString('fr-CA')}`,
    `-- ${found} produits mis à jour sur ${Object.keys(results).length} tentés`,
    '',
  ];
  for (const [id, result] of Object.entries(results)) {
    if (!result) continue;
    const safeId = id.replace(/'/g, "''");
    lines.push(
      `UPDATE grocery_products SET price = ${result.price.toFixed(2)}, price_per_unit = ${result.pricePerUnit.toFixed(6)}, updated_at = now() WHERE id = '${safeId}';`
    );
  }
  fs.writeFileSync(sqlFile, lines.join('\n'));
  return sqlFile;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const resultsFile = path.join(__dirname, 'scrape-results.json');

  console.log('\n🛒  Morphiq — Scraper de prix\n');
  console.log('Récupération du catalogue depuis Supabase...');
  const catalog = await fetchCatalog();
  console.log(`${catalog.length} produits trouvés.\n`);

  // Reprise automatique
  let results = {};
  if (fs.existsSync(resultsFile)) {
    try { results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')); } catch { /* ignore */ }
    const done = Object.values(results).filter(r => r !== undefined).length;
    if (done > 0) console.log(`↩️  Reprise — ${done} produits déjà traités.\n`);
  }

  const browser = await chromium.launch({
    headless: false, // VISIBLE — résous les CAPTCHAs manuellement si besoin
    slowMo: 30,
    args: ['--window-size=1280,800'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'fr-CA',
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8' },
  });

  // Grouper par magasin
  const byStore = {};
  for (const product of catalog) {
    (byStore[product.store_id] ??= []).push(product);
  }

  let updated = 0;
  let failed = 0;

  for (const [storeId, products] of Object.entries(byStore)) {
    const todo = products.filter(p => results[p.id] === undefined);
    if (todo.length === 0) {
      console.log(`✅ ${storeId.toUpperCase()} — déjà terminé.`);
      continue;
    }

    console.log(`\n── ${storeId.toUpperCase()} (${todo.length} produits à scraper) ──`);
    const page = await context.newPage();

    // Première visite pour initialiser les cookies / session
    try {
      await page.goto(SEARCH_URL[storeId]?.('poulet') ?? 'about:blank', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(4000);
    } catch { /* ignore */ }

    for (const product of todo) {
      if (!SEARCH_URL[storeId]) {
        results[product.id] = null;
        continue;
      }

      const query = product.name;
      const url = SEARCH_URL[storeId](query);

      try {
        process.stdout.write(`  ${product.id} "${query}"... `);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
        const price = await extractFirstPrice(page, storeId);

        if (price) {
          const pricePerUnit = price / product.package_qty;
          results[product.id] = { price, pricePerUnit };
          console.log(`${price.toFixed(2)} $ ✓`);
          updated++;
        } else {
          results[product.id] = null;
          console.log('introuvable ✗');
          failed++;
        }
      } catch (err) {
        results[product.id] = null;
        console.log(`erreur: ${err.message.slice(0, 60)} ✗`);
        failed++;
      }

      // Sauvegarde après chaque produit
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

      // Délai poli : 2-3 secondes entre chaque requête
      await page.waitForTimeout(2000 + Math.random() * 1000);
    }

    await page.close();
  }

  await browser.close();

  const sqlFile = generateSQL(results);

  console.log(`
╔══════════════════════════════════════════════════╗
║              Scraping terminé !                  ║
╠══════════════════════════════════════════════════╣
║  ✅ Prix récupérés : ${String(updated).padEnd(28)}║
║  ❌ Introuvables   : ${String(failed).padEnd(28)}║
╚══════════════════════════════════════════════════╝

→ SQL généré : ${sqlFile}

Colle le contenu dans :
https://supabase.com/dashboard/project/wjkdgggtmhnkstsgtbou/sql
`);
}

main().catch(err => {
  console.error('\n❌ Erreur fatale:', err.message);
  process.exit(1);
});
