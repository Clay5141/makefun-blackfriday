// DealBeacon app logic: search, filter, sort and hash-routed detail pages.
// All data comes from deals.js, a file in this app. Nothing is fetched
// from the network at run time.
import { DEALS, CHECKED_ON, CATEGORIES, STORES, VERDICT_LABELS, discountPct, money } from "./deals.js";

const VERDICT_RANK = { "new-low": 0, "strong": 1, "routine": 2 };

const listEl = document.getElementById("deal-list");
const detailEl = document.getElementById("deal-detail");
const emptyEl = document.getElementById("empty");
const resultLine = document.getElementById("result-line");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const storeSelect = document.getElementById("store");
const minDiscountSelect = document.getElementById("min-discount");
const verdictSelect = document.getElementById("verdict");
const sortSelect = document.getElementById("sort");

for (const c of CATEGORIES) {
  const o = document.createElement("option");
  o.value = c; o.textContent = c;
  categorySelect.appendChild(o);
}
for (const s of STORES) {
  const o = document.createElement("option");
  o.value = s; o.textContent = s;
  storeSelect.appendChild(o);
}

function fillStats() {
  const total = DEALS.reduce((sum, d) => sum + (d.list - d.sale), 0);
  const best = Math.max(...DEALS.map(discountPct));
  document.getElementById("stat-count").textContent = String(DEALS.length);
  document.getElementById("stat-savings").textContent = money(total);
  document.getElementById("stat-best").textContent = best + "% off";
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function verdictHtml(d) {
  return '<p class="verdict verdict-' + d.verdict + '"><b>' + esc(VERDICT_LABELS[d.verdict]) + '</b>'
    + '<span class="why">' + esc(d.note) + '</span></p>';
}

function cardHtml(d) {
  const pct = discountPct(d);
  return '<article class="deal-card">'
    + '<div class="card-top"><span class="pill pill-cat">' + esc(d.cat) + '</span>'
    + '<span class="pill pill-store">' + esc(d.store) + '</span></div>'
    + '<h2><a href="#/deal/' + d.id + '">' + esc(d.name) + '</a></h2>'
    + '<div class="price-row"><span class="sale-price">' + money(d.sale) + '</span>'
    + '<span class="list-price">was ' + money(d.list) + '</span>'
    + '<span class="off-badge">' + pct + '% off</span></div>'
    + verdictHtml(d)
    + '<p class="meta">Checked ' + CHECKED_ON + '<span class="src">Source: ' + esc(d.source) + '</span></p>'
    + '<div class="card-actions"><a class="store-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">View at ' + esc(d.store) + ' &nearr;</a>'
    + '<a class="details-link" href="#/deal/' + d.id + '">Details</a></div>'
    + '</article>';
}

function currentFilters() {
  return {
    q: searchInput.value.trim().toLowerCase(),
    cat: categorySelect.value,
    store: storeSelect.value,
    min: Number(minDiscountSelect.value),
    verdict: verdictSelect.value,
    sort: sortSelect.value,
  };
}

function applyFilters(f) {
  let out = DEALS.filter((d) => {
    if (f.cat && d.cat !== f.cat) return false;
    if (f.store && d.store !== f.store) return false;
    if (f.verdict && d.verdict !== f.verdict) return false;
    if (discountPct(d) < f.min) return false;
    if (f.q) {
      const hay = (d.name + " " + d.store + " " + d.cat).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  const by = {
    "discount": (a, b) => discountPct(b) - discountPct(a) || a.sale - b.sale,
    "verdict": (a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || discountPct(b) - discountPct(a),
    "price-asc": (a, b) => a.sale - b.sale,
    "price-desc": (a, b) => b.sale - a.sale,
    "savings": (a, b) => (b.list - b.sale) - (a.list - a.sale),
  };
  out.sort(by[f.sort] || by.discount);
  return out;
}

function renderList() {
  const f = currentFilters();
  const rows = applyFilters(f);
  listEl.innerHTML = rows.map(cardHtml).join("");
  emptyEl.hidden = rows.length > 0;
  const saved = DEALS.reduce((sum, d) => sum + (d.list - d.sale), 0);
  const shownSaved = rows.reduce((sum, d) => sum + (d.list - d.sale), 0);
  resultLine.innerHTML = rows.length === DEALS.length
    ? 'Showing <strong>' + rows.length + ' deals</strong> &middot; combined savings ' + money(saved)
    : 'Showing <strong>' + rows.length + ' of ' + DEALS.length + ' deals</strong> &middot; these save ' + money(shownSaved);
}

function renderDetail(id) {
  const d = DEALS.find((x) => x.id === id);
  if (!d) { renderList(); return; }
  const pct = discountPct(d);
  listEl.innerHTML = "";
  emptyEl.hidden = true;
  resultLine.textContent = "";
  detailEl.hidden = false;
  detailEl.innerHTML = '<a class="back" href="#/">&larr; Back to all deals</a>'
    + '<h2>' + esc(d.name) + '</h2>'
    + '<div class="price-row"><span class="sale-price">' + money(d.sale) + '</span>'
    + '<span class="list-price">was ' + money(d.list) + '</span>'
    + '<span class="off-badge">' + pct + '% off &middot; save ' + money(d.list - d.sale) + '</span></div>'
    + verdictHtml(d)
    + '<dl>'
    + '<dt>Store</dt><dd>' + esc(d.store) + '</dd>'
    + '<dt>Category</dt><dd>' + esc(d.cat) + '</dd>'
    + '<dt>Price checked</dt><dd>' + CHECKED_ON + '</dd>'
    + '<dt>Price source</dt><dd>' + esc(d.source) + '</dd>'
    + '<dt>Why this verdict</dt><dd>' + esc(d.note) + '</dd>'
    + '</dl>'
    + '<div class="card-actions"><a class="store-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">View at ' + esc(d.store) + ' &nearr;</a>'
    + '<a class="details-link" href="#/">Back to all deals</a></div>';
  window.scrollTo(0, 0);
}

function route() {
  const m = location.hash.match(/^#\/deal\/([\w-]+)$/);
  if (m) { renderDetail(m[1]); }
  else { detailEl.hidden = true; detailEl.innerHTML = ""; renderList(); }
}

for (const el of [searchInput, categorySelect, storeSelect, minDiscountSelect, verdictSelect, sortSelect]) {
  el.addEventListener("input", () => { if (!location.hash.startsWith("#/deal/")) renderList(); });
}
window.addEventListener("hashchange", route);

fillStats();
route();
