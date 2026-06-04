/**
 * build.js — Pre-render SEO para Amanda Gráficos
 *
 * Lee productos.json y trabajos.json, y escribe el HTML de todas las cards
 * directamente en catalogo.html y trabajos.html, entre los marcadores
 * <!-- SEO:START --> y <!-- SEO:END -->.
 *
 * Google rastrea el HTML inicial antes de ejecutar JS. Con este script,
 * el contenido (nombres, categorías, tags, descripciones) queda visible
 * desde el primer byte — sin depender de que el bot corra app.js.
 *
 * El JS sigue siendo el responsable de toda la interactividad: filtros,
 * búsqueda, modal y carrito. Al cargar, app.js reemplaza el grid con el
 * mismo contenido renderizado dinámicamente, sin conflicto.
 *
 * Primera vez: reemplaza el placeholder "Cargando..." con los marcadores
 *              y el contenido pre-renderizado.
 * Siguientes:  reemplaza solo lo que hay entre los marcadores existentes.
 * Es seguro correrlo N veces — nunca duplica ni appendea.
 *
 * Uso: node build.js  (o: npm run build)
 * Flujo normal: editá el JSON → node build.js → git push
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const SEO_START = '<!-- SEO:START -->';
const SEO_END   = '<!-- SEO:END -->';

// Escapa caracteres especiales de HTML para uso seguro en atributos y texto
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Inyecta newContent en html.
 * - Si ya existen marcadores SEO:START / SEO:END, reemplaza entre ellos.
 * - Si no existen, reemplaza el string placeholder (primera ejecución).
 */
function inject(html, placeholder, newContent) {
  const si = html.indexOf(SEO_START);
  const ei = html.indexOf(SEO_END);

  if (si !== -1 && ei !== -1) {
    return (
      html.slice(0, si) +
      SEO_START + '\n' + newContent + '\n' + SEO_END +
      html.slice(ei + SEO_END.length)
    );
  }

  if (html.includes(placeholder)) {
    return html.replace(placeholder, SEO_START + '\n' + newContent + '\n' + SEO_END);
  }

  console.warn('⚠️  No se encontró marcador ni placeholder. El archivo no fue modificado.');
  return html;
}

// ─── CATÁLOGO ────────────────────────────────────────────────────────────────

const CAT_BG = {
  futbol:        'linear-gradient(145deg,#d8ecff,#f2f8ff)',
  simpsons:      'linear-gradient(145deg,#fff0b6,#fff8de)',
  'cine-series': 'linear-gradient(145deg,#e7dcff,#f6f1ff)',
  autos:         'linear-gradient(145deg,#ffdbe5,#fff0f5)',
  argentina:     'linear-gradient(145deg,#dcead8,#f4fbf2)',
};

function catBg(cat) {
  return CAT_BG[cat] || '#f5f5f5';
}

function buildCatalog() {
  const productos = JSON.parse(fs.readFileSync(path.join(ROOT, 'productos.json'), 'utf8'));

  const cardsHtml = productos.map((item, idx) => {
    const tags   = item.tags.map(t => `<span>${esc(t)}</span>`).join('');
    const imgSrc = encodeURI('images/' + item.file);
    return `<article class="shop-card" data-cat="${esc(item.category)}" data-idx="${idx}" tabindex="0" role="button" aria-label="Ver ${esc(item.title)}">
  <div class="shop-visual" style="background:${catBg(item.category)}">
    <span class="shop-badge">${esc(item.badge)}</span>
    <img class="shop-photo" src="${imgSrc}" alt="${esc(item.title)}" loading="lazy">
  </div>
  <div class="shop-body">
    <div class="shop-meta">
      <strong>${esc(item.title)}</strong>
      <span>${esc(item.meta)}</span>
    </div>
    <p>${esc(item.desc)}</p>
    <div class="shop-tags">${tags}</div>
  </div>
  <button class="shop-add-btn" data-idx="${idx}" type="button">+ Agregar al pedido</button>
</article>`;
  }).join('\n');

  const placeholder = '<div class="shop-empty">Cargando catálogo...</div>';
  let html = fs.readFileSync(path.join(ROOT, 'catalogo.html'), 'utf8');
  html = inject(html, placeholder, cardsHtml);
  fs.writeFileSync(path.join(ROOT, 'catalogo.html'), html, 'utf8');
  console.log(`✓ catalogo.html — ${productos.length} productos pre-renderizados`);
}

// ─── TRABAJOS ────────────────────────────────────────────────────────────────

// Replica la lógica de buildDisplayList de trabajos.html:
// agrupa los items que comparten el mismo campo `group`.
function buildDisplayList(items) {
  const groupMap   = {};
  const result     = [];
  items.forEach(item => {
    if (item.group) {
      if (!groupMap[item.group]) {
        groupMap[item.group] = {
          isGroup: true,
          title:   item.groupTitle || item.badge,
          badge:   item.badge,
          items:   [],
        };
        result.push(groupMap[item.group]);
      }
      groupMap[item.group].items.push(item);
    } else {
      result.push(item);
    }
  });
  return result;
}

function buildWorks() {
  const trabajos    = JSON.parse(fs.readFileSync(path.join(ROOT, 'trabajos.json'), 'utf8'));
  const displayItems = buildDisplayList(trabajos);

  const cardsHtml = displayItems.map((d, idx) => {
    if (d.isGroup) {
      return `<article class="work-card work-card-group" style="cursor:pointer" data-idx="${idx}" tabindex="0" role="button" aria-label="Ver ${esc(d.title)}">
  <div class="work-visual">
    <img src="images/trabajos/${esc(d.items[0].file)}" alt="${esc(d.title)}" loading="lazy">
    <span class="work-group-count">${d.items.length} fotos</span>
  </div>
  <div class="work-body">
    <span class="work-badge">${esc(d.badge)}</span>
    <h3 class="work-title">${esc(d.title)}</h3>
  </div>
</article>`;
    }
    return `<article class="work-card" style="cursor:pointer" data-idx="${idx}" tabindex="0" role="button" aria-label="Ver ${esc(d.title)}">
  <div class="work-visual"><img src="images/trabajos/${esc(d.file)}" alt="${esc(d.title)}" loading="lazy"></div>
  <div class="work-body">
    <span class="work-badge">${esc(d.badge)}</span>
    <h3 class="work-title">${esc(d.title)}</h3>
    <p class="work-desc">${esc(d.desc || '')}</p>
  </div>
</article>`;
  }).join('\n');

  const placeholder = '<div class="works-empty"><span class="icon">⏳</span><p>Cargando trabajos...</p></div>';
  let html = fs.readFileSync(path.join(ROOT, 'trabajos.html'), 'utf8');
  html = inject(html, placeholder, cardsHtml);
  fs.writeFileSync(path.join(ROOT, 'trabajos.html'), html, 'utf8');
  console.log(`✓ trabajos.html  — ${displayItems.length} trabajos pre-renderizados`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

try {
  buildCatalog();
  buildWorks();
  console.log('\n✅ Build completo. Podés hacer git push.');
} catch (err) {
  console.error('\n❌ Error durante el build:', err.message);
  process.exit(1);
}
