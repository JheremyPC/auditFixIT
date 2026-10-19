"use strict";
/* FIXIT — Security Audit · utilidades de interfaz y bloques reutilizables. */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const isoToDateInput = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* ---------- Iconos (trazo de 24 px, coherentes en toda la interfaz) ---------- */
const ICONS = {
  dashboard: "M4 4h7v8H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  add: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M12 11v6M9 14h6",
  analyze: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8M8 10.5h5M10.5 8v5",
  review: "M12 3l8 3v6c0 4.8-3.4 8.1-8 9-4.6-.9-8-4.2-8-9V6zM8.6 12.2l2.4 2.4 4.6-4.8",
  matrix: "M3.5 5h17v14h-17zM3.5 10h17M3.5 14.5h17M9 5v14",
  rules: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  book: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6",
  shield: "M12 3l8 3v6c0 4.8-3.4 8.1-8 9-4.6-.9-8-4.2-8-9V6z",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  download: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14",
  restore: "M4 12a8 8 0 1 0 2.4-5.7L4 8.6M4 4v4.6h4.6",
  alert: "M12 4l9 16H3zM12 10v4.5M12 17.5v.01",
  info: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5.5M12 7.8v.01",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
  edit: "M4 20h4L18.5 9.5l-4-4L4 16zM13 7l4 4",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  help: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17v.01",
  calendar: "M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0",
  external: "M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  play: "M8 5l11 7-11 7z",
  send: "M4 12l16-8-6 16-2.5-6.5z",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8",
  trash: "M4.5 7h15M10 11v6M14 11v6M6 7l1 13h10l1-13M9.5 7V4h5v3",
  back: "M15 5l-7 7 7 7",
  chevron: "M9 6l6 6-6 6",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  history: "M4 12a8 8 0 1 0 2.4-5.7L4 8.6M4 4v4.6h4.6M12 8v4l3 2",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  student: "M12 4L2.5 9 12 14l9.5-5zM6 11v5c3.5 2.7 8.5 2.7 12 0v-5",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
};
const icon = (name, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[name] || ICONS.info}"/></svg>`;
function hydrateIcons(root = document) {
  $$("[data-icon]", root).forEach((el) => { if (el.className) el.innerHTML = icon(el.dataset.icon); else el.outerHTML = icon(el.dataset.icon); });
}

/* ---------- Etiquetas ---------- */
const catLabel = (id) => OWASP_BY_ID[id] ? `${OWASP_BY_ID[id].code} — ${OWASP_BY_ID[id].name}` : "";
function catBadge(id, withName = false) {
  const c = OWASP_BY_ID[id];
  if (!c) return '<span class="muted">—</span>';
  return `<span class="cat" title="${esc(c.code + " — " + c.name)}">${esc(c.code)}</span>${withName ? ` <span class="cat-name">${esc(c.name)}</span>` : ""}`;
}
const statusPill = (s) => { const x = STATUS[s] || STATUS.borrador; return `<span class="pill tone-${x.tone}">${icon(x.icon)}${esc(x.label)}</span>`; };
function resultPill(r, rec) {
  const x = RESULT[r];
  if (!x) return '<span class="muted small">Sin resultado</span>';
  const proposed = rec && rec.status !== "validada" && !(rec.status === "requiere_correcciones" && r === "no_concluyente");
  return `<span class="pill tone-${x.tone}${proposed ? " proposed" : ""}" title="${esc(proposed ? "Propuesto; pendiente de validación por el revisor" : x.help)}">${icon(x.icon)}${esc(x.label)}${proposed ? " · propuesto" : ""}</span>`;
}
function levelBadge(level) {
  const l = LEVEL[level];
  if (!l) return '<span class="muted small">No concluyente</span>';
  return `<span class="level" title="Correspondencia cualitativa ${esc(l.label.toLowerCase())}"><span class="level-bars" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= l.bars ? "on" : ""}"></i>`).join("")}</span>${esc(l.label)}</span>`;
}
const effectiveCategory = (r) => r.finalCategory || r.studentCategory || r.analysis?.candidate || null;
const demoTag = (r) => r.demo ? '<span class="demo-tag" title="Registro ficticio de demostración">Demo</span>' : "";
const banner = (tone, ico, title, body, extra = "") => `<div class="banner banner-${tone}">${icon(ico)}<div>${title ? `<b>${title}</b>` : ""}${body ? `<span>${body}</span>` : ""}</div>${extra}</div>`;

/* ---------- Notificaciones, diálogo y tooltip ---------- */
function toast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `${icon(type === "good" ? "check" : type === "error" ? "alert" : type === "warn" ? "alert" : "info")}<span>${esc(message)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 320); }, type === "error" ? 6500 : 4200);
}

function confirmDialog({ title, body, ok = "Confirmar", okClass = "btn-primary", cancel = "Cancelar" }) {
  const dlg = $("#dialog");
  $("#dialog-title").textContent = title;
  $("#dialog-body").innerHTML = body;
  const okBtn = $("#dialog-ok");
  okBtn.textContent = ok;
  okBtn.className = `btn ${okClass}`;
  $("#dialog-cancel").textContent = cancel;
  return new Promise((resolve) => {
    const done = () => { dlg.removeEventListener("close", done); resolve(dlg.returnValue === "ok"); };
    dlg.returnValue = "cancel";
    dlg.addEventListener("close", done);
    dlg.showModal();
    $("#dialog-cancel").focus();
  });
}

const Tooltip = (() => {
  let el;
  const show = (target, x, y) => {
    el = el || $("#tooltip");
    el.innerHTML = target.dataset.tip;
    el.hidden = false;
    const r = el.getBoundingClientRect();
    const left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 12));
    const top = y + r.height + 20 > window.innerHeight ? y - r.height - 12 : y + 16;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  };
  const hide = () => { if (el) el.hidden = true; };
  document.addEventListener("mousemove", (e) => { const t = e.target.closest?.("[data-tip]"); t ? show(t, e.clientX, e.clientY) : hide(); });
  document.addEventListener("focusin", (e) => { const t = e.target.closest?.("[data-tip]"); if (t) { const r = t.getBoundingClientRect(); show(t, r.left, r.bottom - 8); } });
  document.addEventListener("focusout", hide);
  window.addEventListener("scroll", hide, { passive: true });
  return { hide };
})();

/* ---------- Gráficos sencillos derivados de los datos locales ---------- */
function categoryBars(records) {
  const rows = OWASP.map((c) => {
    const items = records.filter((r) => effectiveCategory(r) === c.id);
    return { c, valid: items.filter((r) => r.status === "validada").length, open: items.filter((r) => r.status !== "validada").length };
  });
  const max = Math.max(1, ...rows.map((r) => r.valid + r.open));
  return `<div class="bars" role="list">${rows.map(({ c, valid, open }) => {
    const total = valid + open;
    const tip = `<b>${esc(c.code)}</b> ${esc(c.name)}<br>${plural(valid, "validada", "validadas")} · ${plural(open, "en proceso", "en proceso")}<br><span class="muted">Clic para filtrar la matriz</span>`;
    return `<button type="button" class="bar-row" role="listitem" data-action="go-matrix" data-cat="${c.id}" data-tip="${esc(tip)}" aria-label="${esc(`${c.code} ${c.name}: ${total} evidencias, ${valid} validadas`)}">
      <span class="bar-label"><b>${esc(c.id)}</b><span>${esc(c.name)}</span></span>
      <span class="bar-track">${valid ? `<span class="bar-seg s-valid" style="width:${(valid / max) * 100}%"></span>` : ""}${open ? `<span class="bar-seg s-open" style="width:${(open / max) * 100}%"></span>` : ""}</span>
      <span class="bar-val num ${total ? "" : "zero"}">${total}</span></button>`;
  }).join("")}</div>
  <div class="legend"><span><i style="background:var(--accent)"></i>Validadas</span><span><i style="background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 45%,transparent) 0 3px,color-mix(in srgb,var(--accent) 22%,transparent) 3px 6px)"></i>En proceso (borrador, revisión o corrección)</span></div>`;
}

function resultStack(records) {
  const keys = [...Object.keys(RESULT), "none"];
  const color = { conforme: "var(--good)", observacion: "var(--warn)", hallazgo: "var(--crit)", no_concluyente: "var(--neutral)", none: "var(--surface-4)" };
  const label = (k) => k === "none" ? "Sin resultado registrado" : RESULT[k].label;
  const counts = keys.map((k) => {
    const items = records.filter((r) => (r.controlResult || "none") === k);
    return { k, n: items.length, valid: items.filter((r) => r.status === "validada").length };
  });
  const total = Math.max(1, records.length);
  return `<div class="stackbar" role="img" aria-label="${esc(counts.map((c) => `${label(c.k)}: ${c.n}`).join(", "))}">
    ${counts.filter((c) => c.n).map((c) => `<div style="flex:${c.n};background:${color[c.k]}" data-tip="${esc(`<b>${label(c.k)}</b><br>${c.n} de ${records.length} evidencias${c.k !== "none" ? `<br>${c.valid} con revisión validada` : ""}`)}"></div>`).join("")}</div>
    <div class="res-list">${counts.map((c) => `<div class="res-item">${c.k === "none" ? `<span class="pill tone-neutral">${icon("help")}${label(c.k)}</span>` : `<span class="pill tone-${RESULT[c.k].tone}">${icon(RESULT[c.k].icon)}${label(c.k)}</span>`}
      <small>${c.k === "none" ? "Borradores sin decisión" : `${c.valid} validadas · ${c.n - c.valid} propuestas o pendientes`}</small><b class="num">${c.n}</b></div>`).join("")}</div>
    <p class="hint" style="margin-top:10px">Proporción sobre ${plural(records.length, "evidencia registrada", "evidencias registradas")}. Un resultado solo es definitivo cuando la revisión está validada.</p>`;
}

/* ---------- Bloques del expediente ---------- */
function evidenceBlock(r, { meta = true } = {}) {
  return `<div class="stack">
    ${meta ? `<dl class="kv">
      <div><dt>Identificador</dt><dd class="mono">${esc(r.id)} ${demoTag(r)}</dd></div>
      <div><dt>Módulo de FIXIT</dt><dd>${esc(r.module)}</dd></div>
      <div><dt>Tipo de evidencia</dt><dd>${esc(r.type)}</dd></div>
      <div><dt>Entorno de referencia</dt><dd>${esc(r.environment)}</dd></div>
      <div><dt>Fecha de registro</dt><dd>${fmtDate(r.registeredAt)}</dd></div>
      <div><dt>Registrada por</dt><dd>${esc(r.registeredBy)}</dd></div>
    </dl>` : ""}
    <div><p class="block-title">${icon("file")}Evidencia original</p><div class="quote prose">${esc(r.description)}</div></div>
    <div><p class="block-title">Contexto y condiciones de obtención</p><p class="prose ${r.context ? "" : "muted"}">${esc(r.context || "No se indicó el contexto.")}</p></div>
    ${r.source || r.scope || r.limitations ? `<dl class="kv">
      ${r.source ? `<div><dt>Fuente</dt><dd>${esc(r.source)}</dd></div>` : ""}
      ${r.scope ? `<div><dt>Alcance</dt><dd>${esc(r.scope)}</dd></div>` : ""}
      ${r.limitations ? `<div><dt>Limitaciones</dt><dd>${esc(r.limitations)}</dd></div>` : ""}
    </dl>` : ""}
  </div>`;
}

function referencesBlock(catId) {
  const ref = References.forCategory(catId);
  if (!ref) return '<p class="muted">Sin categoría propuesta: no se muestran referencias específicas. Consulta el <a href="#/marco">Marco de referencia</a>.</p>';
  const link = (url, code, title) => `<a class="ref-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span class="mono">${esc(code)}</span> ${esc(title)} ${icon("external")}</a>`;
  return `<div class="refs">
    <div class="ref-group"><span class="k">OWASP Top 10:2025 · referencia primaria</span>${link(ref.owasp.url, ref.owasp.code, ref.owasp.name)}</div>
    <div class="ref-group"><span class="k">ASVS 5.0.0 · capítulos relacionados</span>${ref.asvs.map((a) => link(a.url, a.id, `${a.title} (${a.es})`)).join("")}<span class="hint">${esc(ref.asvsNote)}</span></div>
    <div class="ref-group"><span class="k">WSTG v4.2 · pruebas relacionadas</span>${ref.wstg.length ? ref.wstg.map((w) => link(w.url, w.id, w.title)).join("") : `<span class="hint">${esc(ref.noWstg)}</span>`}</div>
    <p class="hint">Las referencias apoyan la decisión; no acreditan el cumplimiento de ningún requisito. La relación con la categoría es un criterio orientativo del prototipo.</p>
  </div>`;
}

function termsTable(terms) {
  const wl = { 3: ["w3", "Específico"], 2: ["w2", "Moderado"], 1: ["w1", "De apoyo"] };
  return `<div class="table-wrap"><table class="terms compact"><thead><tr><th>Término encontrado</th><th>Patrón de la regla</th><th>Peso</th><th>Fragmento de la evidencia</th></tr></thead><tbody>
    ${terms.map((t) => `<tr><td><b>${esc(t.matched)}</b></td><td class="mono small">${esc(t.term)}</td><td><span class="weight ${wl[t.weight][0]}">${wl[t.weight][1]} · ${t.weight}</span></td>
      <td class="excerpt">${esc(t.excerpt.before)}<mark>${esc(t.excerpt.match)}</mark>${esc(t.excerpt.after)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function analysisBlock(a, rec) {
  if (!a) return `<div class="empty">${icon("analyze")}<p>La evidencia aún no se ha analizado.</p></div>`;
  const cand = a.candidate ? OWASP_BY_ID[a.candidate] : null;
  const top = a.ranking[0];
  const maxScore = Math.max(1, ...a.ranking.map((r) => r.score));
  const orientTone = { favorable: "good", desfavorable: "crit", mixta: "warn", indeterminada: "neutral" }[a.outcome.orientation];
  const orientLabel = { favorable: "Favorable", desfavorable: "Posible fallo", mixta: "Mixta", indeterminada: "Indeterminada" }[a.outcome.orientation];
  const num = (n) => `<span class="section-num">${n}</span>`;

  return `<div class="sections">
    <div class="row-between"><span class="auto-tag">${icon("rules")}Explicación automática del prototipo · reglas locales ${esc(a.rulesVersion)}</span><span class="muted small">Analizada el ${fmtDateTime(a.at)}</span></div>
    ${rec?.analysisStale ? banner("warn", "alert", "La evidencia cambió después de este análisis.", " Vuelve a analizarla para actualizar la propuesta.") : ""}

    <section class="sec"><h4>${num(1)}Resumen de la evidencia recibida</h4>
      <p class="small">«${esc(a.input.title)}» · ${esc(a.input.module)} · ${esc(a.input.type)} · ${esc(a.input.environment || "entorno no indicado")}. Se analizaron ${a.input.words} palabras del título, la descripción y el contexto.</p></section>

    <section class="sec"><h4>${num(2)}Categoría OWASP candidata principal</h4>
      ${cand ? `<div class="candidate"><span class="candidate-code">${esc(cand.id)}</span><div class="stack-sm"><h3>${esc(cand.code)} — ${esc(cand.name)}</h3>
          <div class="row">${levelBadge(a.level)}<span class="muted small">Correspondencia cualitativa con las reglas</span></div></div></div>`
        : `<div class="candidate inconclusive"><span class="candidate-code">?</span><div class="stack-sm"><h3>Clasificación no concluyente</h3>
          <p class="small muted">La evidencia no contiene indicadores suficientes. Amplía el contexto o selecciona la categoría manualmente.</p></div></div>`}
      <div class="orient"><span class="pill tone-${orientTone}">${icon(a.outcome.orientation === "favorable" ? "check" : a.outcome.orientation === "indeterminada" ? "help" : "alert")}${orientLabel}</span>
        <div class="stack-sm"><p class="small"><b>Orientación del resultado observado.</b> ${esc(a.outcome.note)}</p>
        ${a.outcome.favorable.length || a.outcome.unfavorable.length ? `<p class="small muted">${a.outcome.favorable.length ? `Expresiones favorables: ${a.outcome.favorable.map((x) => `«${esc(x)}»`).join(", ")}. ` : ""}${a.outcome.unfavorable.length ? `Expresiones de posible fallo: ${a.outcome.unfavorable.map((x) => `«${esc(x)}»`).join(", ")}.` : ""}</p>` : ""}
        <p class="small muted">La categoría indica el riesgo con el que se relaciona la evidencia; no significa que exista una vulnerabilidad.</p></div></div>
      ${a.recommendHuman ? banner("warn", "user", "Se recomienda contraste humano.", a.tie ? " Hay un empate entre categorías." : a.conclusive ? " Existen alternativas o la correspondencia no es alta." : " La propuesta no es concluyente.") : ""}
    </section>

    <section class="sec"><h4>${num(3)}Motivos de la propuesta</h4><ul>${a.reasons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>

    <section class="sec"><h4>${num(4)}Términos y criterios identificados</h4>
      ${top ? termsTable((a.candidate ? a.ranking.find((r) => r.cat === a.candidate) : top).terms) : '<p class="muted small">No se encontró ningún término de las reglas.</p>'}
      ${a.ranking.length ? `<div class="stack-sm" style="margin-top:6px"><p class="block-title">Reglas activadas · puntos de regla (suma de pesos, no es una probabilidad)</p>
        ${a.ranking.map((r) => `<div class="pts ${r.cat === a.candidate ? "" : "alt"}"><span>${catBadge(r.cat)} <span class="small muted">${plural(r.terms.length, "término", "términos")}${r.moduleHint ? " + módulo" : ""}</span></span>
          <span class="bar-track"><span class="bar-seg" style="width:${(r.score / maxScore) * 100}%"></span></span><span class="num small">${r.score} pts</span></div>`).join("")}</div>` : ""}
    </section>

    <section class="sec"><h4>${num(5)}Categorías cercanas o alternativas</h4>
      ${a.alternatives.length ? `<div class="grid grid-2" style="gap:10px">${a.alternatives.map((x) => `<div class="alt-card"><div class="row-between"><span>${catBadge(x.cat, true)}</span><span class="small muted">${x.score ? `${x.score} pts` : "sin términos"}</span></div>
        <p><b>Relación con la evidencia:</b> ${esc(x.why)}</p></div>`).join("")}</div>` : '<p class="muted small">No se identificaron alternativas.</p>'}
      ${a.ambiguity.length ? `<div class="stack-sm"><p class="block-title">Señales que pueden generar ambigüedad</p><ul class="small">${a.ambiguity.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    </section>

    <section class="sec"><h4>${num(6)}Por qué las alternativas tienen menor correspondencia</h4>
      ${a.alternatives.length ? `<ul class="small">${a.alternatives.map((x) => `<li><span class="mono">${esc(x.cat)}</span>: ${esc(x.lower)}</li>`).join("")}</ul>`
        : '<p class="muted small">No hay alternativas que comparar.</p>'}
      ${!a.conclusive ? '<p class="hint">Sin categoría candidata, ninguna alternativa alcanza el mínimo de indicadores.</p>' : ""}</section>

    <section class="sec"><h4>${num(7)}Información contextual que falta para confirmar</h4>
      <ul class="checklist">${a.missing.map((x) => `<li>${icon("help")}<span>${esc(x)}</span></li>`).join("")}</ul></section>

    <section class="sec"><h4>${num(8)}Referencias complementarias</h4>${referencesBlock(a.candidate)}</section>

    <section class="sec"><h4>${num(9)}Nivel cualitativo de correspondencia</h4>
      <p class="small"><b>${a.level ? `${LEVEL[a.level].label}.` : "Sin nivel."}</b> ${esc(a.levelReason)}</p>
      <p class="hint">Alta: al menos 3 términos (uno específico), 8 o más puntos y ninguna alternativa por encima de la mitad. Media: 5 o más puntos y alternativas por debajo del 75 %. Baja: el resto, o empate. Por debajo de ${Classifier.MIN_SCORE} puntos la clasificación no es concluyente.</p></section>
  </div>`;
}

function justificationView(r) {
  const j = r.justification;
  if (!j) return '<p class="muted">El estudiante aún no ha registrado su justificación.</p>';
  const q = (t, v) => `<div><p class="block-title">${t}</p><p class="prose ${v ? "" : "muted"}">${esc(v || "Sin respuesta.")}</p></div>`;
  return `<div class="stack">
    <div class="row">${catBadge(r.studentCategory, true)}<span class="small muted">${r.decisionMode === "manual" ? "Selección manual" : "Acepta la categoría propuesta"}</span>
      ${r.analysis?.candidate && r.studentCategory !== r.analysis.candidate ? `<span class="mismatch">${icon("alert")}Difiere de la propuesta automática (${esc(r.analysis.candidate || "no concluyente")})</span>` : ""}</div>
    <div class="row"><span class="small muted">Resultado del control propuesto:</span>${resultPill(r.controlResult, { status: "borrador" })}</div>
    ${q("¿Por qué consideras que esta es la categoría correcta?", j.why)}
    ${q("¿Qué parte de la evidencia respalda tu decisión?", j.support)}
    ${q("¿Qué otras categorías consideraste?", j.alternatives)}
    ${q("¿Qué información adicional necesitarías para confirmar la clasificación?", j.missing)}
    <p class="hint">Última edición: ${fmtDateTime(j.updatedAt)}</p></div>`;
}

const DECISION_LABEL = { aprobada: "Clasificación aprobada", correcciones: "Correcciones solicitadas", no_concluyente: "Marcada como no concluyente" };
function reviewView(r) {
  if (!r.reviews.length) return '<p class="muted">Sin revisiones registradas.</p>';
  return `<div class="stack">${[...r.reviews].reverse().map((v, i) => `<div class="stack-sm ${i ? "muted" : ""}" style="${i ? "padding-top:12px;border-top:1px solid var(--line)" : ""}">
      <div class="row-between"><b>${esc(DECISION_LABEL[v.decision])}</b><span class="small muted">${esc(v.reviewer)} · ${fmtDateTime(v.at)}</span></div>
      <div class="row"><span class="small muted">Categoría final:</span>${catBadge(v.finalCategory, true)}<span class="small muted">Resultado:</span>${v.controlResult ? `<span class="pill tone-${RESULT[v.controlResult].tone}">${icon(RESULT[v.controlResult].icon)}${RESULT[v.controlResult].label}</span>` : "—"}</div>
      ${v.comment ? `<p class="small"><b>Observaciones:</b> ${esc(v.comment)}</p>` : ""}
      <p class="small"><b>Justificación de la decisión:</b> ${esc(v.rationale)}</p></div>`).join("")}</div>`;
}

function historyBlock(r) {
  return `<ol class="timeline">${[...r.history].reverse().map((h) => `<li><b>${esc(h.action)}</b>${h.detail ? `<p>${esc(h.detail)}</p>` : ""}<small>${esc(h.actor)} · ${fmtDateTime(h.at)}</small></li>`).join("")}</ol>`;
}

const optionList = (items, selected, placeholder) =>
  (placeholder ? `<option value="">${esc(placeholder)}</option>` : "") + items.map((v) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`).join("");
const catOptions = (selected, placeholder = "Selecciona una categoría", mark = null) =>
  `<option value="">${esc(placeholder)}</option>` + OWASP.map((c) => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${esc(c.code)} — ${esc(c.name)}${c.id === mark ? " (propuesta)" : ""}</option>`).join("");
const resultOptions = (selected, keys = Object.keys(RESULT), placeholder = "Selecciona un resultado") =>
  `<option value="">${esc(placeholder)}</option>` + keys.map((k) => `<option value="${k}" ${k === selected ? "selected" : ""}>${esc(RESULT[k].label)}</option>`).join("");
