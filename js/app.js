"use strict";
/* FIXIT — Security Audit · enrutado, acciones e inicio. Todo se ejecuta en el navegador. */

const NAV = [
  { group: "Auditoría" },
  { route: "dashboard", label: "Dashboard de auditoría", icon: "dashboard" },
  { route: "registro", label: "Registro de evidencias", icon: "add" },
  { route: "analisis", label: "Clasificación y análisis", icon: "analyze" },
  { route: "revision", label: "Revisión del auditor", icon: "review", count: () => Store.all().filter((r) => r.status === "en_revision").length },
  { route: "matriz", label: "Matriz de clasificación", icon: "matrix" },
  { group: "Referencias" },
  { route: "reglas", label: "Reglas de clasificación", icon: "rules" },
  { route: "marco", label: "Marco de referencia", icon: "book" },
];
const TITLES = { dashboard: "Panel de auditoría", registro: "Registro de evidencias", analisis: "Clasificación y análisis", revision: "Revisión del auditor o docente",
  matriz: "Matriz de clasificación", evidencia: "Expediente de evaluación", reglas: "Reglas de clasificación", marco: "Marco de referencia" };

const App = {
  route: null,
  parse() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const [page = "dashboard", id = null] = path.split("/").filter(Boolean).map(decodeURIComponent);
    return { page: TITLES[page] ? page : "dashboard", id, query: new URLSearchParams(qs || "") };
  },
  render({ keepScroll = false } = {}) {
    const route = App.parse();
    const changed = !App.route || App.route.page !== route.page || App.route.id !== route.id;
    App.route = route;
    const { page, id, query } = route;

    if (page === "matriz" && [...query.keys()].length) {
      if (query.has("reset")) Store.settings.matrix = Matrix.defaults();
      else Store.settings.matrix = { ...Matrix.defaults(), ...Object.fromEntries([...query].filter(([k]) => ["q", "cat", "status", "result", "module"].includes(k))) };
      Store.save();
      history.replaceState(null, "", "#/matriz");
    }

    const html = {
      dashboard: () => Pages.dashboard(),
      registro: () => Pages.register(id),
      analisis: () => id ? Pages.analysis(id) : Pages.analysisIndex(),
      revision: () => id ? Pages.review(id) : Pages.reviewList(),
      matriz: () => Pages.matrix(),
      evidencia: () => Pages.detail(id),
      reglas: () => Pages.rules(),
      marco: () => Pages.framework(),
    }[page]();

    const content = $("#content");
    content.innerHTML = html;
    $("#page-title").textContent = TITLES[page];
    document.title = `${TITLES[page]} · FIXIT — Security Audit`;
    App.renderNav();
    App.renderChrome();
    if (page === "matriz") Matrix.renderBody();
    if (page === "registro") updateCounters();
    Tooltip.hide();
    closeMenu();
    if (changed && !keepScroll) { window.scrollTo(0, 0); content.focus({ preventScroll: true }); }

    if (page === "analisis" && id && query.get("run") === "1") {
      history.replaceState(null, "", `#/analisis/${encodeURIComponent(id)}`);
      const btn = $('[data-action="run-analysis"]');
      if (btn) Actions["run-analysis"](btn);
    }
  },
  renderNav() {
    const cur = App.route.page === "evidencia" ? "matriz" : App.route.page;
    $("#nav").innerHTML = NAV.map((n) => n.group ? `<div class="nav-group">${esc(n.group)}</div>`
      : `<a href="#/${n.route}" class="${n.route === cur ? "active" : ""}" ${n.route === cur ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${esc(n.label)}</span>${n.count && n.count() ? `<span class="nav-count" title="Pendientes">${n.count()}</span>` : ""}</a>`).join("");
  },
  renderChrome() {
    $("#role-select").value = Store.settings.role;
    $("#role-chip").innerHTML = `${icon(Store.settings.role === "auditor" ? "review" : "student")}${esc(ROLES[Store.settings.role].label)} · demo`;
    const warn = $("#storage-warning");
    warn.hidden = Store.persistent;
    if (!Store.persistent) warn.innerHTML = `${icon("alert")}<div><b>El almacenamiento local no está disponible.</b> Los cambios se mantendrán solo hasta cerrar o recargar la página.</div>`;
  },
};

/* ---------- Utilidades de formularios ---------- */
const formData = (form) => Object.fromEntries(new FormData(form).entries());
function showFieldErrors(form, fields = {}) {
  $$("[aria-invalid]", form).forEach((el) => el.removeAttribute("aria-invalid"));
  $$(".field-error", form).forEach((el) => { el.hidden = true; el.textContent = ""; });
  let first = null;
  for (const [name, msg] of Object.entries(fields)) {
    const input = form.querySelector(`[name="${name}"]`);
    const err = $(`#err-${name}`, form);
    if (input) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", `err-${name}`); first = first || input; }
    if (err) { err.textContent = msg; err.hidden = false; }
  }
  if (first) first.focus();
}
function showFormError(id, message) {
  const el = $(`#${id}`);
  if (!el) return toast(message, "error");
  el.textContent = message;
  el.hidden = !message;
}
function updateCounters() {
  $$("[data-counter]").forEach((ta) => {
    const out = $(`#${ta.dataset.counter}`);
    if (!out) return;
    const n = ta.value.trim().length;
    out.textContent = `${n} / ${ta.maxLength} caracteres${n < Classifier.MIN_TEXT ? ` · faltan ${Classifier.MIN_TEXT - n}` : ""}`;
  });
}
function setLoading(btn, label) {
  btn.dataset.html = btn.innerHTML;
  btn.classList.add("loading");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${esc(label)}`;
}
const handle = (fn, { silent = false } = {}) => { try { return fn(); } catch (e) { if (e instanceof WorkflowError) { if (!silent) toast(e.message, "error"); return e; } throw e; } };

/* ---------- Acciones ---------- */
const Actions = {
  "toggle-menu"() {
    const open = !$("#sidebar").classList.contains("open");
    $("#sidebar").classList.toggle("open", open);
    $(".scrim").hidden = !open;
    $(".menu-btn").setAttribute("aria-expanded", String(open));
  },
  async "reset-demo"() {
    const ok = await confirmDialog({ title: "Restaurar datos de demostración",
      body: "<p>Se eliminarán todas las evidencias, justificaciones y revisiones guardadas en este navegador y se cargarán de nuevo las evaluaciones iniciales de demostración.</p><p>Esta acción no se puede deshacer.</p>",
      ok: "Restaurar", okClass: "btn-warn" });
    if (!ok) return;
    Store.reset();
    location.hash = "#/dashboard";
    App.render();
    toast("Datos de demostración restaurados.", "good");
  },
  "open-record": (el) => { location.hash = `#/evidencia/${encodeURIComponent(el.dataset.id)}`; },
  "open-analysis": (el) => { location.hash = `#/analisis/${encodeURIComponent(el.dataset.id)}`; },
  "open-review": (el) => { location.hash = `#/revision/${encodeURIComponent(el.dataset.id)}`; },
  "go-matrix"(el) {
    Store.settings.matrix = { ...Matrix.defaults(), cat: el.dataset.cat };
    Store.save();
    location.hash = "#/matriz";
  },
  "run-analysis"(btn) {
    const rec = Store.get(btn.dataset.id);
    if (!rec) return;
    $$('[data-action="run-analysis"]').forEach((b) => setLoading(b, "Aplicando reglas locales…"));
    setTimeout(() => {
      const res = handle(() => Workflow.analyze(rec));
      App.render({ keepScroll: true });
      if (res instanceof Error) return;
      $("#analysis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast(res.conclusive ? `Análisis completado: candidata ${res.candidate} (correspondencia ${LEVEL[res.level].label.toLowerCase()}).` : "Análisis completado: clasificación no concluyente. Amplía el contexto o selecciona la categoría manualmente.", res.conclusive ? "good" : "warn");
    }, 650);
  },
  async "clear-form"() {
    const ok = await confirmDialog({ title: "Limpiar formulario", body: "<p>Se borrarán los datos escritos y el borrador guardado.</p>", ok: "Limpiar", okClass: "btn-warn" });
    if (!ok) return;
    Store.settings.draft = null;
    Store.save();
    App.render({ keepScroll: true });
    toast("Formulario limpio.");
  },
  async "submit-review"(btn) {
    const form = $('[data-form="justification"]');
    const rec = Store.get(btn.dataset.id);
    if (!form || !rec) return;
    showFormError("j-error", "");
    const saved = handle(() => Workflow.saveJustification(rec, formData(form)), { silent: true });
    if (saved instanceof Error) return showFormError("j-error", saved.message);
    const blocker = Workflow.submitBlocker(rec);
    if (blocker) {
      App.render({ keepScroll: true });
      showFormError("j-error", `Justificación guardada como borrador, pero aún no puede enviarse: ${blocker}`);
      return $("#j-error").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const ok = await confirmDialog({ title: "Enviar a revisión",
      body: `<p>Se enviará <b>${esc(rec.id)}</b> con la categoría <b>${esc(catLabel(rec.studentCategory))}</b> y el resultado propuesto <b>${esc(RESULT[rec.controlResult]?.label || "sin indicar")}</b>.</p><p>Mientras esté en revisión no podrás editar la evidencia ni la justificación.</p>`,
      ok: "Enviar a revisión" });
    if (!ok) { App.render({ keepScroll: true }); return toast("Justificación guardada. La evidencia sigue sin enviar.", "good"); }
    const res = handle(() => Workflow.submit(rec), { silent: true });
    App.render({ keepScroll: true });
    if (res instanceof Error) return showFormError("j-error", res.message);
    toast(`${rec.id} enviada a revisión.`, "good");
  },
  async "review-decision"(btn) {
    const form = $('[data-form="review"]');
    const rec = Store.get(btn.dataset.id);
    if (!form || !rec) return;
    const d = { ...formData(form), decision: btn.dataset.decision };
    showFormError("rv-error", "");
    const summary = {
      aprobada: `<p>Se validará la evaluación con la categoría final <b>${esc(catLabel(d.finalCategory) || "sin categoría")}</b> y el resultado <b>${esc(RESULT[d.controlResult]?.label || "sin indicar")}</b>.</p>`,
      correcciones: "<p>La evidencia volverá al estudiante con tus observaciones y quedará en estado «Requiere correcciones».</p>",
      no_concluyente: "<p>El resultado del control quedará como «No concluyente», no se asignará categoría final y la evidencia volverá al estudiante para aportar más contexto.</p>",
    }[d.decision];
    const ok = await confirmDialog({ title: DECISION_LABEL[d.decision].replace("Clasificación aprobada", "Aprobar clasificación"), body: summary,
      ok: { aprobada: "Aprobar", correcciones: "Solicitar correcciones", no_concluyente: "Marcar no concluyente" }[d.decision],
      okClass: { aprobada: "btn-good", correcciones: "btn-warn", no_concluyente: "btn-secondary" }[d.decision] });
    if (!ok) return;
    const res = handle(() => Workflow.review(rec, d), { silent: true });
    if (res instanceof Error) return showFormError("rv-error", res.message);
    App.render({ keepScroll: true });
    toast({ aprobada: `${rec.id} validada.`, correcciones: `Correcciones solicitadas para ${rec.id}.`, no_concluyente: `${rec.id} marcada como no concluyente.` }[d.decision], "good");
  },
  async reopen(btn) {
    const rec = Store.get(btn.dataset.id);
    const ok = await confirmDialog({ title: "Reabrir revisión", body: "<p>La evaluación volverá a «En revisión» y dejará de contar como validada hasta una nueva decisión.</p>", ok: "Reabrir", okClass: "btn-warn" });
    if (!ok || handle(() => Workflow.reopen(rec)) instanceof Error) return;
    App.render({ keepScroll: true });
    toast(`Revisión de ${rec.id} reabierta.`, "good");
  },
  async "delete-record"(btn) {
    const rec = Store.get(btn.dataset.id);
    const ok = await confirmDialog({ title: `Eliminar ${rec.id}`, body: "<p>Se eliminará este borrador y su historial. Esta acción no se puede deshacer.</p>", ok: "Eliminar", okClass: "btn-danger" });
    if (!ok || handle(() => Workflow.remove(rec)) instanceof Error) return;
    location.hash = "#/matriz";
    toast(`${rec.id} eliminada.`, "good");
  },
  sort(btn) {
    const s = Matrix.state, k = btn.dataset.key;
    if (s.sort === k) s.dir = s.dir === "asc" ? "desc" : "asc"; else { s.sort = k; s.dir = ["date", "level", "result"].includes(k) ? "desc" : "asc"; }
    Store.save();
    Matrix.renderBody();
  },
  "clear-filters"() {
    const { sort, dir } = Matrix.state;
    Store.settings.matrix = { ...Matrix.defaults(), sort, dir };
    Store.save();
    App.render({ keepScroll: true });
    toast("Filtros restablecidos.");
  },
  "export-csv"() {
    const rows = Matrix.rows();
    if (!rows.length) return toast("No hay registros que exportar con los filtros activos.", "warn");
    const sep = Store.settings.csvSep === ";" ? ";" : ",";
    Csv.download(`fixit-security-audit-matriz-${todayISO()}.csv`, Csv.build(CSV_COLUMNS, rows, sep));
    const filters = Matrix.activeFilters();
    toast(`Matriz exportada: ${plural(rows.length, "registro", "registros")}${filters.length ? ` (filtros: ${filters.join(", ")})` : " (sin filtros)"}.`, "good");
  },
  async "clear-policy"() {
    const ok = await confirmDialog({ title: "Vaciar criterio institucional", body: "<p>Se eliminará el texto del criterio contextual guardado en este navegador.</p>", ok: "Vaciar", okClass: "btn-warn" });
    if (!ok) return;
    Store.settings.policy = "";
    Store.save();
    App.render({ keepScroll: true });
    toast("Criterio contextual eliminado.");
  },
};

/* ---------- Formularios ---------- */
const Forms = {
  evidence(form, submitter) {
    const id = form.dataset.id;
    const d = formData(form);
    showFormError("form-error", "");
    showFieldErrors(form, {});
    let rec;
    try {
      if (id) { rec = Store.get(id); Workflow.updateEvidence(rec, d); }
      else { rec = Workflow.register(d); Store.settings.draft = null; Store.save(); }
    } catch (e) {
      if (!(e instanceof WorkflowError)) throw e;
      showFieldErrors(form, e.fields || {});
      showFormError("form-error", e.message);
      return toast(e.message, "error");
    }
    if (submitter?.dataset.intent === "analyze") {
      location.hash = `#/analisis/${encodeURIComponent(rec.id)}?run=1`;
      return toast(id ? `Cambios guardados en ${rec.id}.` : `Evidencia ${rec.id} registrada.`, "good");
    }
    if (id) {
      location.hash = `#/evidencia/${encodeURIComponent(rec.id)}`;
      return toast(`Cambios guardados en ${rec.id}${rec.analysisStale ? ". El análisis quedó desactualizado: vuelve a analizarla" : ""}.`, rec.analysisStale ? "warn" : "good");
    }
    form.closest("article").outerHTML = Pages.registered(rec);
    App.renderNav();
    $("#content").scrollIntoView({ behavior: "smooth" });
    toast(`Evidencia ${rec.id} registrada en estado Borrador.`, "good");
  },
  justification(form) {
    const rec = Store.get(form.dataset.id);
    showFormError("j-error", "");
    const res = handle(() => Workflow.saveJustification(rec, formData(form)), { silent: true });
    if (res instanceof Error) return showFormError("j-error", res.message);
    App.render({ keepScroll: true });
    toast("Justificación guardada. Puedes editarla o enviarla a revisión.", "good");
  },
  review(form) { toast("Elige una de las tres decisiones: aprobar, solicitar correcciones o marcar como no concluyente.", "warn"); },
  sandbox(form) {
    const d = formData(form);
    const out = $("#sandbox-result");
    if (!d.description.trim()) { out.innerHTML = ""; return toast("Escribe un texto para analizar.", "warn"); }
    const a = Classifier.analyze({ title: "Texto de prueba", description: d.description, context: "", module: d.module, type: "Prueba de reglas", environment: "" });
    out.innerHTML = `<article class="card auto-panel"><div class="card-head"><div><h3>${icon("play")}Resultado de la prueba</h3><p>No se guarda ni se añade a la matriz.</p></div></div>${analysisBlock(a, null)}</article>`;
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  policy(form) {
    Store.settings.policy = formData(form).policy.trim();
    Store.save();
    App.render({ keepScroll: true });
    toast(Store.settings.policy ? "Criterio contextual guardado en este navegador." : "Criterio vacío: la política queda pendiente de incorporar.", "good");
  },
};

/* ---------- Eventos globales ---------- */
const INTERACTIVE = "a,button,input,select,textarea,label,summary";
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const inner = e.target.closest(INTERACTIVE);
  if (inner && inner !== el && el.contains(inner)) return;   // un enlace o botón dentro de una fila clicable
  const fn = Actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-action]")) { e.preventDefault(); Actions[e.target.dataset.action]?.(e.target, e); }
  if (e.key === "Escape" && $("#sidebar").classList.contains("open")) Actions["toggle-menu"]();
});
document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  Forms[form.dataset.form]?.(form, e.submitter);
});

let draftTimer, searchTimer;
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.matches("[data-counter]")) updateCounters();
  if (t.closest('[data-form="evidence"]') && !t.closest("[data-form]").dataset.id) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { const d = formData(t.closest("form")); delete d.date; Store.settings.draft = d; Store.save(); }, 350);
  }
  if (t.matches('[data-filter="q"]')) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { Matrix.state.q = t.value; Store.save(); Matrix.renderBody(); }, 150);
  }
  if (t.getAttribute("aria-invalid")) { t.removeAttribute("aria-invalid"); const err = $(`#err-${t.name}`); if (err) err.hidden = true; }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("select[data-filter]")) { Matrix.state[t.dataset.filter] = t.value; Store.save(); Matrix.renderBody(); }
  if (t.dataset.change === "csv-sep") { Store.settings.csvSep = t.value; Store.save(); }
  if (t.dataset.change === "role") {
    Store.settings.role = t.value;
    Store.save();
    App.render({ keepScroll: true });
    toast(`Rol de demostración: ${ROLES[t.value].label}. Solo adapta la interfaz; no es un control de acceso.`);
  }
});
function closeMenu() {
  $("#sidebar").classList.remove("open");
  $(".scrim").hidden = true;
  $(".menu-btn").setAttribute("aria-expanded", "false");
}
window.addEventListener("hashchange", () => App.render());
window.addEventListener("storage", (e) => { if (e.key === "fixit-security-audit:v1") { Store.load(); App.render({ keepScroll: true }); } });

/* ---------- Inicio ---------- */
Store.load();
hydrateIcons();
$("#demo-date").textContent = new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
App.render();
