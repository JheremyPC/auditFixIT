"use strict";
/* FIXIT — Security Audit · pantallas. Cada página devuelve HTML; app.js la monta y enlaza. */

const isStudent = () => Store.settings.role === "estudiante";
const isAuditor = () => Store.settings.role === "auditor";
const byDateDesc = (k) => (a, b) => String(b[k] || "").localeCompare(String(a[k] || ""));
const roleLock = (role, what) => banner("info", "lock", `${what} corresponde al rol «${ROLES[role].label}».`,
  " Cámbialo en el selector de demostración del menú lateral. El selector solo adapta la interfaz; no es un control de acceso.");

const Pages = {};

/* ============================== A. Dashboard ============================== */
Pages.dashboard = () => {
  const recs = Store.all();
  const n = (f) => recs.filter(f).length;
  const total = recs.length;
  const validated = n((r) => r.status === "validada");
  const conformes = n((r) => r.status === "validada" && r.controlResult === "conforme");
  const pending = n((r) => r.status === "en_revision");
  const corrections = n((r) => r.status === "requiere_correcciones");
  const drafts = n((r) => r.status === "borrador");

  const kpi = (tone, ico, label, value, sub, href) => `<a class="kpi tone-${tone}" href="${href}"><span>${icon(ico)}${label}</span><strong class="num">${value}</strong><small>${sub}</small></a>`;
  const activity = recs.flatMap((r) => r.history.map((h) => ({ ...h, rec: r }))).sort(byDateDesc("at")).slice(0, 8);
  const toneFor = (a) => /aprobada/i.test(a) ? "good" : /correcci|no concluyente/i.test(a) ? "serious" : /revisi/i.test(a) ? "warn" : "";
  const iconFor = (a) => /aprobada/i.test(a) ? "check" : /correcci|no concluyente/i.test(a) ? "undo" : /revisi/i.test(a) ? "send" : /análisis/i.test(a) ? "analyze" : /justific/i.test(a) ? "student" : "file";
  const latest = [...recs].sort(byDateDesc("updatedAt")).slice(0, 6);

  return `<div class="view">
    <div class="page-head"><div><p class="eyebrow">Sistema de clasificación y revisión de evidencias de seguridad web</p><h2>Panel de auditoría</h2>
      <p>Visión general de las evidencias registradas, su clasificación según OWASP Top 10:2025 y el estado de la revisión humana.</p></div>
      <div class="row"><a class="btn btn-primary" href="#/registro">${icon("add")}Registrar evidencia</a><a class="btn btn-secondary" href="#/matriz">${icon("matrix")}Ver matriz de clasificación</a></div></div>

    ${banner("info", "info", "Prototipo académico de apoyo a la auditoría.", " Las clasificaciones son orientativas y deben contrastarse con la evidencia y el contexto. La evaluación y validación final corresponden al auditor humano. Los registros marcados como «Demo» son ficticios y no representan pruebas reales sobre FIXIT.")}

    <section class="kpis" aria-label="Indicadores">
      ${kpi("accent", "layers", "Evidencias registradas", total, `${plural(drafts, "borrador", "borradores")} sin enviar`, "#/matriz?reset=1")}
      ${kpi("good", "check", "Evaluaciones validadas", validated, "Con decisión del revisor", "#/matriz?status=validada")}
      ${kpi("good", "review", "Controles conformes", conformes, "Solo evaluaciones validadas", "#/matriz?status=validada&result=conforme")}
      ${kpi("warn", "clock", "Revisiones pendientes", pending, "En espera del auditor", "#/revision")}
      ${kpi("serious", "undo", "Requieren correcciones", corrections, "Devueltas al estudiante", "#/matriz?status=requiere_correcciones")}
    </section>

    <div class="grid grid-2">
      <article class="card"><div class="card-head"><div><h3>${icon("matrix")}Distribución por categoría OWASP</h3>
        <p>Categoría vigente de cada evidencia: final si existe; si no, la elegida por el estudiante o la candidata.</p></div></div>
        ${categoryBars(recs)}</article>
      <article class="card"><div class="card-head"><div><h3>${icon("review")}Resultado del control</h3>
        <p>Independiente del estado de revisión.</p></div></div>
        ${resultStack(recs)}</article>
    </div>

    <div class="grid grid-main">
      <article class="card"><div class="card-head"><div><h3>${icon("file")}Últimas evaluaciones</h3><p>Ordenadas por la última actividad.</p></div>
        <a class="btn btn-secondary btn-sm" href="#/matriz">Ver todas</a></div>
        <div class="table-wrap"><table class="compact"><thead><tr><th>ID</th><th>Título</th><th>Categoría</th><th>Resultado</th><th>Estado</th></tr></thead><tbody>
        ${latest.map((r) => `<tr class="clickable" data-action="open-record" data-id="${esc(r.id)}" tabindex="0"><td class="mono nowrap">${esc(r.id)}</td>
          <td><span class="title-cell">${esc(r.title)}</span><span class="small muted">${esc(r.module)}</span></td><td>${catBadge(effectiveCategory(r))}</td>
          <td>${resultPill(r.controlResult, r)}</td><td>${statusPill(r.status)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Sin evaluaciones.</td></tr>`}
        </tbody></table></div></article>
      <article class="card"><div class="card-head"><div><h3>${icon("history")}Actividad reciente de revisión</h3><p>Últimos cambios registrados en el historial.</p></div></div>
        <ul class="feed">${activity.map((h) => `<li><span class="feed-ico tone-${toneFor(h.action)}">${icon(iconFor(h.action))}</span><div>
          <p><a href="#/evidencia/${esc(h.rec.id)}">${esc(h.rec.id)}</a> · ${esc(h.action)}</p><small>${esc(h.actor)} · ${fmtDateTime(h.at)}</small></div></li>`).join("") || '<li class="empty">Sin actividad.</li>'}</ul></article>
    </div>
  </div>`;
};

/* ============================== B. Registro ============================== */
Pages.register = (id) => {
  const rec = id ? Store.get(id) : null;
  if (id && !rec) return Pages.notFound(id);
  const editing = !!rec;
  const d = rec ? { ...rec, date: isoToDateInput(rec.registeredAt) } : { date: todayISO(), ...(Store.settings.draft || {}) };
  const locked = !isStudent() || (editing && !Workflow.editable(rec));
  const dis = locked ? "disabled" : "";
  const field = (name, label, control, hint = "", cls = "") => `<label class="${cls}" for="f-${name}"><span>${label}</span>${control}${hint ? `<span class="hint">${hint}</span>` : ""}<span class="field-error" id="err-${name}" hidden></span></label>`;
  const req = '<span class="req" aria-hidden="true"> *</span>';
  const v = (k) => esc(d[k] || "");

  return `<div class="view">
    <div class="page-head"><div><div class="crumbs"><a href="#/dashboard">Panel</a><span>/</span><span>${editing ? `Editar ${esc(rec.id)}` : "Registro de evidencias"}</span></div>
      <h2>${editing ? "Editar evidencia" : "Registrar evidencia"}</h2><p>Describe una evidencia textual relacionada con la seguridad de FIXIT. Después podrás analizarla con las reglas locales.</p></div></div>
    ${!isStudent() ? roleLock("estudiante", "El registro de evidencias") : ""}
    ${editing && !Workflow.editable(rec) ? banner("info", "lock", "Esta evidencia no se puede editar.", ` Su estado es «${STATUS[rec.status].label}».`) : ""}
    ${banner("warn", "alert", "No introduzcas información sensible.", " Evita contraseñas, tokens, secretos, datos personales o información confidencial. Sustitúyelos por marcadores como [REDACTADO]. El prototipo bloquea algunos patrones evidentes, pero no detecta todos.")}
    <article class="card">
      <form data-form="evidence" data-id="${editing ? esc(rec.id) : ""}" novalidate>
        <div class="form-grid">
          ${field("id", "Identificador", `<input id="f-id" value="${esc(editing ? rec.id : Store.nextId())}" readonly aria-readonly="true">`, "Generado automáticamente.")}
          ${field("date", `Fecha de registro${req}`, `<input id="f-date" name="date" type="date" value="${v("date")}" required ${dis}>`)}
          ${field("title", `Título de la evidencia${req}`, `<input id="f-title" name="title" maxlength="140" value="${v("title")}" placeholder="Ej.: Operación administrativa solicitada con rol USUARIO" required ${dis}>`, "", "full")}
          ${field("module", `Módulo de FIXIT evaluado${req}`, `<select id="f-module" name="module" required ${dis}>${optionList(MODULES, d.module, "Selecciona un módulo")}</select>`)}
          ${field("type", `Tipo de evidencia${req}`, `<select id="f-type" name="type" required ${dis}>${optionList(EVIDENCE_TYPES, d.type, "Selecciona un tipo")}</select>`)}
          ${field("environment", `Entorno de referencia${req}`, `<select id="f-environment" name="environment" required ${dis}>${optionList(ENVIRONMENTS, d.environment, "Selecciona un entorno")}</select>`, "", "full")}
          ${field("description", `Descripción textual de la evidencia${req}`, `<textarea id="f-description" name="description" class="tall" maxlength="3000" data-counter="c-description" placeholder="Qué control se evaluó, qué acción se realizó y qué respuesta se obtuvo." required ${dis}>${v("description")}</textarea><span class="counter" id="c-description"></span>`, `Mínimo ${Classifier.MIN_TEXT} caracteres. Es el texto principal que analizan las reglas.`, "full")}
          ${field("context", `Contexto o condiciones de obtención${req}`, `<textarea id="f-context" name="context" maxlength="1500" placeholder="Rol utilizado, pasos seguidos, herramientas y condiciones de la prueba." required ${dis}>${v("context")}</textarea>`, "", "full")}
          ${field("source", "Fuente", `<input id="f-source" name="source" maxlength="300" value="${v("source")}" placeholder="Ej.: Prueba manual del equipo, revisión de código" ${dis}>`)}
          ${field("scope", "Alcance", `<input id="f-scope" name="scope" maxlength="300" value="${v("scope")}" placeholder="Qué cubre la evidencia" ${dis}>`)}
          ${field("limitations", "Limitaciones", `<textarea id="f-limitations" name="limitations" maxlength="800" placeholder="Qué no se evaluó o qué condiciones limitan la evidencia." style="min-height:80px" ${dis}>${v("limitations")}</textarea>`, "", "full")}
        </div>
        <div id="form-error" class="form-error" role="alert" hidden></div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-intent="save" ${dis}>${icon("check")}${editing ? "Guardar cambios" : "Guardar evidencia"}</button>
          <button type="submit" class="btn btn-secondary" data-intent="analyze" ${dis}>${icon("play")}${editing ? "Guardar y volver a analizar" : "Guardar y analizar"}</button>
          ${editing ? `<a class="btn btn-ghost" href="#/evidencia/${esc(rec.id)}">Cancelar</a>` : `<button type="button" class="btn btn-ghost" data-action="clear-form" ${dis}>Limpiar formulario</button>`}
          <span class="hint">${editing ? "" : "El borrador del formulario se conserva en este navegador mientras escribes."}</span>
        </div>
      </form>
    </article>
    <div id="register-result"></div>
  </div>`;
};

Pages.registered = (rec) => `<article class="card"><div class="stack">
  ${banner("good", "check", `Evidencia ${esc(rec.id)} guardada.`, " Queda en estado Borrador. El siguiente paso es analizarla con las reglas locales.")}
  <div class="row"><a class="btn btn-primary" href="#/analisis/${esc(rec.id)}?run=1">${icon("play")}Analizar evidencia</a>
  <a class="btn btn-secondary" href="#/evidencia/${esc(rec.id)}">Ver expediente</a><a class="btn btn-ghost" href="#/registro?new=1">Registrar otra</a></div></div></article>`;

/* ============================== C. Clasificación y análisis ============================== */
Pages.analysisIndex = () => {
  const recs = [...Store.all()].sort((a, b) => (Workflow.editable(b) - Workflow.editable(a)) || byDateDesc("updatedAt")(a, b));
  return `<div class="view">
    <div class="page-head"><div><h2>Clasificación y análisis</h2><p>Selecciona una evidencia para aplicar las reglas locales, revisar la explicación y registrar tu decisión. Primero aparecen las evidencias que admiten cambios.</p></div>
      <a class="btn btn-primary" href="#/registro">${icon("add")}Registrar evidencia</a></div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>Evidencia</th><th>Propuesta automática</th><th>Elegida por el estudiante</th><th>Estado</th><th></th></tr></thead><tbody>
    ${recs.map((r) => `<tr class="clickable" data-action="open-analysis" data-id="${esc(r.id)}" tabindex="0"><td class="mono nowrap">${esc(r.id)} ${demoTag(r)}</td>
      <td><span class="title-cell">${esc(r.title)}</span><span class="small muted">${esc(r.module)}</span></td>
      <td>${r.analysis ? (r.analysis.candidate ? `<div class="stack-sm">${catBadge(r.analysis.candidate)}${levelBadge(r.analysis.level)}</div>` : '<span class="pill tone-warn">No concluyente</span>') : '<span class="muted small">Sin analizar</span>'}${r.analysisStale ? '<br><span class="mismatch">Desactualizado</span>' : ""}</td>
      <td>${catBadge(r.studentCategory)}</td><td>${statusPill(r.status)}</td>
      <td><a class="btn btn-secondary btn-sm" href="#/analisis/${esc(r.id)}">${Workflow.editable(r) && isStudent() ? (r.analysis ? "Continuar" : "Analizar") : "Consultar"}</a></td></tr>`).join("")}
    </tbody></table></div></div>`;
};

Pages.analysis = (id) => {
  const r = Store.get(id);
  if (!r) return Pages.notFound(id);
  const a = r.analysis;
  const canEdit = isStudent() && Workflow.editable(r);
  const lastReview = r.reviews[r.reviews.length - 1];

  return `<div class="view">
    <div class="page-head"><div><div class="crumbs"><a href="#/analisis">Clasificación y análisis</a><span>/</span><span class="mono">${esc(r.id)}</span></div>
      <h2>${esc(r.title)}</h2><div class="row" style="margin-top:8px">${statusPill(r.status)}${demoTag(r)}<span class="small muted">${esc(r.module)}</span></div></div>
      <div class="row"><a class="btn btn-secondary" href="#/evidencia/${esc(r.id)}">${icon("file")}Ver expediente</a>
      ${canEdit ? `<a class="btn btn-ghost" href="#/registro/${esc(r.id)}">${icon("edit")}Editar evidencia</a>` : ""}</div></div>

    ${r.status === "requiere_correcciones" && lastReview ? banner("serious", "undo", "El revisor solicitó correcciones.", ` ${esc(lastReview.comment || lastReview.rationale)}`) : ""}
    ${!isStudent() ? roleLock("estudiante", "Analizar y justificar") : ""}

    <article class="card"><div class="card-head"><div><h3>${icon("file")}Evidencia recibida</h3><p>Texto que se somete a las reglas: título, descripción y contexto.</p></div>
      ${canEdit ? `<button type="button" class="btn btn-primary" data-action="run-analysis" data-id="${esc(r.id)}">${icon("play")}${a ? "Volver a analizar" : "Analizar evidencia"}</button>` : ""}</div>
      ${evidenceBlock(r)}</article>

    <article class="card auto-panel" id="analysis-panel"><div class="card-head"><div><h3>${icon("rules")}Análisis de clasificación</h3>
      <p>Proceso determinista con reglas locales y palabras clave. No usa IA ni servicios externos y puede equivocarse.</p></div><a class="btn btn-ghost btn-sm" href="#/reglas">Inspeccionar reglas</a></div>
      ${a ? analysisBlock(a, r) : `<div class="empty stack" style="justify-items:center">${icon("analyze")}<p>Esta evidencia aún no se ha analizado.</p>
        ${canEdit ? `<button type="button" class="btn btn-primary" data-action="run-analysis" data-id="${esc(r.id)}">${icon("play")}Analizar evidencia</button>` : ""}</div>`}</article>

    ${a ? `<article class="card student-panel" id="justification"><div class="card-head"><div><span class="student-tag">${icon("student")}Redactada por el estudiante</span>
      <h3 style="margin-top:8px">Justificación del estudiante</h3><p>Tu decisión se guarda separada de la explicación automática del prototipo.</p></div></div>
      ${canEdit ? justificationForm(r) : justificationView(r)}</article>` : ""}
  </div>`;
};

function justificationForm(r) {
  const a = r.analysis, j = r.justification || {};
  const selected = r.studentCategory || a.candidate || "";
  const ta = (name, label, placeholder) => `<label for="j-${name}">${label}<textarea id="j-${name}" name="${name}" maxlength="2000" placeholder="${esc(placeholder)}">${esc(j[name] || "")}</textarea></label>`;
  return `<form data-form="justification" data-id="${esc(r.id)}" novalidate>
    <div class="form-grid">
      <label for="j-category"><span>Categoría OWASP Top 10:2025 elegida<span class="req" aria-hidden="true"> *</span></span>
        <select id="j-category" name="category" required>${catOptions(selected, "Selecciona una categoría", a.candidate)}</select>
        <span class="hint">${a.candidate ? `La propuesta automática es ${esc(a.candidate)}. Puedes aceptarla o elegir cualquier otra categoría.` : "La clasificación no fue concluyente: selecciona la categoría manualmente."}</span></label>
      <label for="j-result"><span>Resultado del control que propones<span class="req" aria-hidden="true"> *</span></span>
        <select id="j-result" name="controlResult">${resultOptions(r.controlResult)}</select>
        <span class="hint">Es independiente del estado de revisión y de la categoría: una categoría de riesgo no implica un fallo.</span></label>
      <div class="full hint">${Object.values(RESULT).map((x) => `<b>${esc(x.label)}:</b> ${esc(x.help)}`).join(" · ")}</div>
      <div class="full">${ta("why", "¿Por qué consideras que esta es la categoría correcta?", "Relaciona la evidencia con el criterio de la categoría.")}</div>
      <div class="full">${ta("support", "¿Qué parte de la evidencia respalda tu decisión?", "Cita el fragmento o el dato concreto.")}</div>
      <div>${ta("alternatives", "¿Qué otras categorías consideraste?", "Indica cuáles y por qué las descartaste.")}</div>
      <div>${ta("missing", "¿Qué información adicional necesitarías para confirmar la clasificación?", "Pruebas, datos de contexto o revisiones pendientes.")}</div>
    </div>
    ${j.updatedAt ? `<p class="hint">Última edición guardada: ${fmtDateTime(j.updatedAt)}</p>` : ""}
    <div id="j-error" class="form-error" role="alert" hidden></div>
    <div class="form-actions">
      <button type="submit" class="btn btn-secondary">${icon("check")}Guardar justificación</button>
      <button type="button" class="btn btn-primary" data-action="submit-review" data-id="${esc(r.id)}">${icon("send")}${r.reviews.length ? "Reenviar a revisión" : "Enviar a revisión"}</button>
      <span class="hint">Guardar mantiene la evidencia en ${esc(STATUS[r.status].label)}. Enviarla la deja «En revisión» y bloquea la edición.</span>
    </div></form>`;
}

/* ============================== E. Revisión ============================== */
Pages.reviewList = () => {
  const recs = Store.all();
  const table = (items, emptyText, actionLabel) => `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Evidencia</th><th>Propuesta automática</th><th>Elegida por el estudiante</th><th>Resultado</th><th>Fecha</th><th></th></tr></thead><tbody>
    ${items.map((r) => `<tr class="clickable" data-action="open-review" data-id="${esc(r.id)}" tabindex="0"><td class="mono nowrap">${esc(r.id)} ${demoTag(r)}</td>
      <td><span class="title-cell">${esc(r.title)}</span><span class="small muted">${esc(r.module)}</span></td>
      <td>${r.analysis?.candidate ? `<div class="stack-sm">${catBadge(r.analysis.candidate)}${levelBadge(r.analysis.level)}</div>` : '<span class="pill tone-warn">No concluyente</span>'}</td>
      <td>${catBadge(r.studentCategory)}${r.analysis?.candidate && r.studentCategory && r.studentCategory !== r.analysis.candidate ? `<br><span class="mismatch">${icon("alert")}Difiere</span>` : ""}</td>
      <td>${resultPill(r.controlResult, r)}</td><td class="nowrap small">${fmtDate(r.submittedAt || r.updatedAt)}</td>
      <td><a class="btn ${actionLabel === "Revisar" ? "btn-primary" : "btn-secondary"} btn-sm" href="#/revision/${esc(r.id)}">${actionLabel}</a></td></tr>`).join("") || `<tr><td colspan="7" class="empty">${emptyText}</td></tr>`}
  </tbody></table></div>`;
  const pending = recs.filter((r) => r.status === "en_revision").sort(byDateDesc("submittedAt"));
  const returned = recs.filter((r) => r.status === "requiere_correcciones").sort(byDateDesc("updatedAt"));
  const done = recs.filter((r) => r.status === "validada").sort(byDateDesc("updatedAt"));
  return `<div class="view">
    <div class="page-head"><div><h2>Revisión del auditor o docente</h2><p>Contraste humano de la propuesta automática y de la justificación del estudiante. Ninguna evidencia se valida por el simple hecho de estar clasificada.</p></div></div>
    ${!isAuditor() ? roleLock("auditor", "Aprobar o devolver evaluaciones") : ""}
    <article class="card"><div class="card-head"><div><h3>${icon("clock")}Pendientes de revisión <span class="pill tone-warn">${pending.length}</span></h3><p>Evidencias enviadas por el estudiante.</p></div></div>
      ${table(pending, "No hay evidencias pendientes de revisión.", isAuditor() ? "Revisar" : "Consultar")}</article>
    <article class="card"><div class="card-head"><div><h3>${icon("undo")}Devueltas para corrección <span class="pill tone-serious">${returned.length}</span></h3><p>A la espera de que el estudiante las corrija y reenvíe.</p></div></div>
      ${table(returned, "No hay evidencias devueltas.", "Consultar")}</article>
    <article class="card"><div class="card-head"><div><h3>${icon("check")}Validadas <span class="pill tone-good">${done.length}</span></h3></div></div>
      ${table(done, "Aún no hay evaluaciones validadas.", "Consultar")}</article>
  </div>`;
};

Pages.review = (id) => {
  const r = Store.get(id);
  if (!r) return Pages.notFound(id);
  const can = isAuditor() && r.status === "en_revision";
  const defaultFinal = r.studentCategory || r.analysis?.candidate || "";
  const decisionCard = can ? `<article class="card review-panel"><div class="card-head"><div><span class="review-tag">${icon("review")}Decisión del revisor</span>
      <h3 style="margin-top:8px">Registrar revisión</h3><p>La decisión, el comentario y la fecha quedan en el historial.</p></div></div>
    <form data-form="review" data-id="${esc(r.id)}" novalidate>
      <label for="rv-final">Categoría final
        <select id="rv-final" name="finalCategory">${catOptions(defaultFinal, "Sin categoría final", r.analysis?.candidate)}</select>
        <span class="hint">Por defecto, la elegida por el estudiante. Puedes cambiarla.</span></label>
      <label for="rv-result">Resultado del control
        <select id="rv-result" name="controlResult">${resultOptions(r.controlResult, ["conforme", "observacion", "hallazgo"])}</select>
        <span class="hint">Independiente del estado de revisión.</span></label>
      <label for="rv-comment">Observaciones<textarea id="rv-comment" name="comment" maxlength="2000" placeholder="Comentarios para el estudiante. Obligatorias al solicitar correcciones."></textarea></label>
      <label for="rv-rationale"><span>Justificación de la decisión<span class="req" aria-hidden="true"> *</span></span><textarea id="rv-rationale" name="rationale" maxlength="2000" placeholder="Por qué apruebas, devuelves o marcas como no concluyente."></textarea></label>
      <div id="rv-error" class="form-error" role="alert" hidden></div>
      <div class="stack-sm">
        <button type="button" class="btn btn-good btn-block" data-action="review-decision" data-decision="aprobada" data-id="${esc(r.id)}">${icon("check")}Aprobar clasificación</button>
        <button type="button" class="btn btn-warn btn-block" data-action="review-decision" data-decision="correcciones" data-id="${esc(r.id)}">${icon("undo")}Solicitar correcciones</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="review-decision" data-decision="no_concluyente" data-id="${esc(r.id)}">${icon("help")}Marcar como no concluyente</button>
      </div></form></article>`
    : `<article class="card"><div class="card-head"><div><h3>${icon("review")}Estado de la revisión</h3></div></div><div class="stack">
      <div class="row">${statusPill(r.status)}${resultPill(r.controlResult, r)}</div>
      ${r.status !== "en_revision" ? `<p class="small muted">${r.status === "validada" ? "La evaluación ya fue validada." : "La evidencia no está pendiente de revisión."}</p>` : ""}
      ${!isAuditor() ? roleLock("auditor", "Registrar la decisión") : ""}
      ${isAuditor() && r.status === "validada" ? `<button type="button" class="btn btn-secondary" data-action="reopen" data-id="${esc(r.id)}">${icon("restore")}Reabrir revisión</button>` : ""}
      </div></article>`;

  return `<div class="view">
    <div class="page-head"><div><div class="crumbs"><a href="#/revision">Revisión</a><span>/</span><span class="mono">${esc(r.id)}</span></div>
      <h2>${esc(r.title)}</h2><div class="row" style="margin-top:8px">${statusPill(r.status)}${demoTag(r)}<span class="small muted">${esc(r.module)}</span></div></div>
      <a class="btn btn-secondary" href="#/evidencia/${esc(r.id)}">${icon("file")}Ver expediente</a></div>
    <div class="grid grid-main">
      <div class="stack" style="gap:18px">
        <article class="card"><div class="card-head"><h3>${icon("file")}Evidencia original y contexto del registro</h3></div>${evidenceBlock(r)}</article>
        <article class="card"><div class="card-head"><h3>${icon("layers")}Comparación de categorías</h3></div>
          <dl class="kv"><div><dt>Propuesta automática</dt><dd>${r.analysis?.candidate ? `${catBadge(r.analysis.candidate, true)}<br>${levelBadge(r.analysis.level)}` : "No concluyente"}</dd></div>
          <div><dt>Elegida por el estudiante</dt><dd>${catBadge(r.studentCategory, true)}</dd></div>
          <div><dt>Categoría final</dt><dd>${catBadge(r.finalCategory, true)}</dd></div></dl></article>
        <article class="card auto-panel"><div class="card-head"><h3>${icon("rules")}Explicación de los criterios utilizados</h3></div>${analysisBlock(r.analysis, r)}</article>
        <article class="card student-panel"><div class="card-head"><div><span class="student-tag">${icon("student")}Redactada por el estudiante</span><h3 style="margin-top:8px">Justificación del estudiante</h3></div></div>${justificationView(r)}</article>
        ${r.reviews.length ? `<article class="card"><div class="card-head"><h3>${icon("review")}Revisiones anteriores</h3></div>${reviewView(r)}</article>` : ""}
        <article class="card"><div class="card-head"><h3>${icon("history")}Historial de cambios relevantes</h3></div>${historyBlock(r)}</article>
      </div>
      <div class="sticky stack" style="gap:18px">${decisionCard}</div>
    </div></div>`;
};

/* ============================== Expediente ============================== */
Pages.detail = (id) => {
  const r = Store.get(id);
  if (!r) return Pages.notFound(id);
  const a = r.analysis;
  return `<div class="view">
    <div class="page-head"><div><div class="crumbs"><a href="#/matriz">Matriz</a><span>/</span><span class="mono">${esc(r.id)}</span></div>
      <h2>${esc(r.title)}</h2><div class="row" style="margin-top:8px">${statusPill(r.status)}${resultPill(r.controlResult, r)}${demoTag(r)}</div></div>
      <div class="row">
        <a class="btn ${isStudent() && Workflow.editable(r) ? "btn-primary" : "btn-secondary"}" href="#/analisis/${esc(r.id)}">${icon("analyze")}${isStudent() && Workflow.editable(r) ? "Analizar y justificar" : "Ver análisis"}</a>
        <a class="btn ${isAuditor() && r.status === "en_revision" ? "btn-primary" : "btn-secondary"}" href="#/revision/${esc(r.id)}">${icon("review")}${isAuditor() && r.status === "en_revision" ? "Revisar" : "Ver revisión"}</a>
        ${isStudent() && Workflow.editable(r) ? `<a class="btn btn-ghost" href="#/registro/${esc(r.id)}">${icon("edit")}Editar</a>` : ""}
        ${isStudent() && r.status === "borrador" ? `<button type="button" class="btn btn-danger" data-action="delete-record" data-id="${esc(r.id)}">${icon("trash")}Eliminar borrador</button>` : ""}
      </div></div>
    <div class="grid grid-main">
      <div class="stack" style="gap:18px">
        <article class="card"><div class="card-head"><h3>${icon("file")}Evidencia</h3></div>${evidenceBlock(r)}</article>
        <article class="card auto-panel"><div class="card-head"><h3>${icon("rules")}Propuesta de clasificación</h3></div>${analysisBlock(a, r)}</article>
        <article class="card student-panel"><div class="card-head"><div><span class="student-tag">${icon("student")}Redactada por el estudiante</span><h3 style="margin-top:8px">Justificación del estudiante</h3></div></div>${justificationView(r)}</article>
        <article class="card review-panel"><div class="card-head"><div><span class="review-tag">${icon("review")}Revisión humana</span><h3 style="margin-top:8px">Decisión del revisor</h3></div></div>${reviewView(r)}</article>
      </div>
      <div class="sticky stack" style="gap:18px">
        <article class="card"><div class="card-head"><h3>${icon("layers")}Resumen de trazabilidad</h3></div>
          <dl class="kv" style="grid-template-columns:1fr">
            <div><dt>Categoría candidata</dt><dd>${a ? (a.candidate ? catBadge(a.candidate, true) : "No concluyente") : "Sin analizar"}</dd></div>
            <div><dt>Correspondencia</dt><dd>${a ? levelBadge(a.level) : "—"}</dd></div>
            <div><dt>Reglas activadas</dt><dd>${a && a.ranking.length ? a.ranking.map((x) => `<span class="chip">${esc(x.cat)} · ${x.score} pts</span>`).join(" ") : "—"}</dd></div>
            <div><dt>Elegida por el estudiante</dt><dd>${catBadge(r.studentCategory, true)}</dd></div>
            <div><dt>Categoría final</dt><dd>${catBadge(r.finalCategory, true)}</dd></div>
            <div><dt>Responsable de revisión</dt><dd>${esc(r.reviewer || "Sin asignar")}</dd></div>
            <div><dt>Última actualización</dt><dd>${fmtDateTime(r.updatedAt)}</dd></div>
          </dl></article>
        <article class="card"><div class="card-head"><h3>${icon("history")}Historial</h3></div>${historyBlock(r)}</article>
      </div>
    </div></div>`;
};

/* ============================== F. Matriz ============================== */
const MATRIX_COLUMNS = [
  { key: "id", label: "ID" }, { key: "title", label: "Título" }, { key: "module", label: "Módulo evaluado" },
  { key: "candidate", label: "Categoría candidata" }, { key: "final", label: "Categoría final" }, { key: "result", label: "Resultado del control" },
  { key: "status", label: "Estado de revisión" }, { key: "level", label: "Correspondencia" }, { key: "reviewer", label: "Responsable de revisión" },
  { key: "date", label: "Fecha" },
];
const ORDER = {
  level: { alto: 3, medio: 2, bajo: 1 },
  status: { borrador: 1, en_revision: 2, requiere_correcciones: 3, validada: 4 },
  result: { conforme: 1, observacion: 2, hallazgo: 3, no_concluyente: 4 },
};
const sortValue = (r, key) => ({
  id: r.id, title: r.title.toLowerCase(), module: r.module, candidate: r.analysis?.candidate || "Z", final: r.finalCategory || "Z",
  result: ORDER.result[r.controlResult] || 9, status: ORDER.status[r.status], level: ORDER.level[r.analysis?.level] || 0,
  reviewer: r.reviewer || "", date: r.registeredAt,
}[key]);

const Matrix = {
  defaults: () => ({ q: "", cat: "", status: "", result: "", module: "", sort: "date", dir: "desc" }),
  get state() { return Store.settings.matrix || (Store.settings.matrix = Matrix.defaults()); },
  rows() {
    const f = Matrix.state;
    const q = Classifier.plain(f.q);
    const rows = Store.all().filter((r) => {
      if (f.cat && (f.cat === "none" ? effectiveCategory(r) : effectiveCategory(r) !== f.cat)) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.result && (f.result === "none" ? r.controlResult : r.controlResult !== f.result)) return false;
      if (f.module && r.module !== f.module) return false;
      if (q && !Classifier.plain([r.id, r.title, r.module, r.description, r.context, catLabel(effectiveCategory(r))].join(" ")).includes(q)) return false;
      return true;
    });
    const dir = f.dir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      const x = sortValue(a, f.sort), y = sortValue(b, f.sort);
      return (x < y ? -1 : x > y ? 1 : 0) * dir || a.id.localeCompare(b.id);
    });
  },
  activeFilters() {
    const f = Matrix.state, out = [];
    if (f.q) out.push(`texto «${f.q}»`);
    if (f.cat) out.push(`categoría ${f.cat === "none" ? "sin categoría" : f.cat}`);
    if (f.status) out.push(`estado ${STATUS[f.status].label}`);
    if (f.result) out.push(`resultado ${f.result === "none" ? "sin resultado" : RESULT[f.result].label}`);
    if (f.module) out.push(`módulo ${f.module}`);
    return out;
  },
  rowHtml(r) {
    const a = r.analysis;
    const action = isAuditor() && r.status === "en_revision" ? `<a class="btn btn-primary btn-sm" href="#/revision/${esc(r.id)}">Revisar</a>`
      : isStudent() && Workflow.editable(r) ? `<a class="btn btn-secondary btn-sm" href="#/analisis/${esc(r.id)}">${a ? "Continuar" : "Analizar"}</a>` : "";
    return `<tr class="clickable" data-action="open-record" data-id="${esc(r.id)}" tabindex="0" aria-label="Abrir ${esc(r.id)}">
      <td class="mono nowrap">${esc(r.id)}<br>${demoTag(r)}</td><td><span class="title-cell">${esc(r.title)}</span></td><td class="small">${esc(r.module)}</td>
      <td>${a ? (a.candidate ? catBadge(a.candidate) : '<span class="small muted">No concluyente</span>') : '<span class="small muted">Sin analizar</span>'}</td>
      <td>${catBadge(r.finalCategory)}</td><td>${resultPill(r.controlResult, r)}</td><td>${statusPill(r.status)}</td>
      <td>${a ? levelBadge(a.level) : "—"}</td><td class="small">${esc(r.reviewer || (r.status === "en_revision" ? "Pendiente" : "—"))}</td>
      <td class="nowrap small">${fmtDate(r.registeredAt)}</td>
      <td><div class="table-actions"><a class="btn btn-ghost btn-sm" href="#/evidencia/${esc(r.id)}">Ver</a>${action}</div></td></tr>`;
  },
  renderBody() {
    const rows = Matrix.rows();
    $("#matrix-body").innerHTML = rows.map(Matrix.rowHtml).join("") || `<tr><td colspan="11" class="empty">Ningún registro coincide con los filtros.</td></tr>`;
    $("#matrix-count").textContent = `${rows.length} de ${plural(Store.all().length, "registro", "registros")}`;
    $$("th[data-sort]").forEach((th) => {
      const k = th.dataset.sort, on = Matrix.state.sort === k;
      if (on) th.setAttribute("aria-sort", Matrix.state.dir === "asc" ? "ascending" : "descending"); else th.removeAttribute("aria-sort");
      th.querySelector(".sort-ind").textContent = on ? (Matrix.state.dir === "asc" ? "▲" : "▼") : "↕";
    });
  },
};

Pages.matrix = () => {
  const f = Matrix.state;
  const sel = (name, label, options) => `<label for="mf-${name}">${label}<select id="mf-${name}" data-filter="${name}">${options}</select></label>`;
  return `<div class="view">
    <div class="page-head"><div><h2>Matriz de clasificación</h2><p>Tabla de auditoría con todas las evidencias registradas. Selecciona una fila para abrir el detalle de la evaluación.</p></div>
      <button type="button" class="btn btn-primary" data-action="export-csv">${icon("download")}Exportar matriz CSV</button></div>
    <article class="card">
      <div class="filters">
        <label class="search-field" for="mf-q">Buscar<span class="search">${icon("search")}<input id="mf-q" type="search" data-filter="q" value="${esc(f.q)}" placeholder="ID, título, módulo, descripción…" autocomplete="off"></span></label>
        ${sel("cat", "Categoría OWASP", `<option value="">Todas</option>${OWASP.map((c) => `<option value="${c.id}" ${f.cat === c.id ? "selected" : ""}>${esc(c.code)} — ${esc(c.name)}</option>`).join("")}<option value="none" ${f.cat === "none" ? "selected" : ""}>Sin categoría</option>`)}
        ${sel("status", "Estado de revisión", `<option value="">Todos</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? "selected" : ""}>${esc(v.label)}</option>`).join("")}`)}
        ${sel("result", "Resultado", `<option value="">Todos</option>${Object.entries(RESULT).map(([k, v]) => `<option value="${k}" ${f.result === k ? "selected" : ""}>${esc(v.label)}</option>`).join("")}<option value="none" ${f.result === "none" ? "selected" : ""}>Sin resultado</option>`)}
        ${sel("module", "Módulo", optionList(MODULES, f.module, "Todos"))}
      </div>
      <div class="toolbar"><div class="row"><span class="small muted" id="matrix-count" aria-live="polite"></span><button type="button" class="btn btn-link btn-sm" data-action="clear-filters">Limpiar filtros</button></div>
        <div class="row"><label for="csv-sep" class="small">Separador CSV<select id="csv-sep" data-change="csv-sep">
          <option value="," ${Store.settings.csvSep === "," ? "selected" : ""}>Coma (estándar)</option><option value=";" ${Store.settings.csvSep === ";" ? "selected" : ""}>Punto y coma (Excel en español)</option></select></label></div></div>
      <p class="hint" style="margin-top:6px">El filtro de categoría usa la categoría vigente (final; si no existe, la elegida por el estudiante o la candidata). La exportación respeta los filtros y el orden activos.</p>
    </article>
    <div class="table-wrap"><table><thead><tr>
      ${MATRIX_COLUMNS.map((c) => `<th data-sort="${c.key}" scope="col"><button type="button" class="th-sort" data-action="sort" data-key="${c.key}">${esc(c.label)}<span class="sort-ind" aria-hidden="true">↕</span></button></th>`).join("")}<th scope="col">Acciones</th>
    </tr></thead><tbody id="matrix-body"></tbody></table></div>
  </div>`;
};

const CSV_COLUMNS = [
  { label: "ID", value: (r) => r.id },
  { label: "Título", value: (r) => r.title },
  { label: "Módulo evaluado", value: (r) => r.module },
  { label: "Tipo de evidencia", value: (r) => r.type },
  { label: "Entorno de referencia", value: (r) => r.environment },
  { label: "Fecha de registro", value: (r) => isoToDateInput(r.registeredAt) },
  { label: "Categoría OWASP candidata", value: (r) => r.analysis ? (r.analysis.candidate ? catLabel(r.analysis.candidate) : "No concluyente") : "Sin analizar" },
  { label: "Correspondencia cualitativa", value: (r) => r.analysis?.level ? LEVEL[r.analysis.level].label : "" },
  { label: "Reglas activadas (puntos)", value: (r) => (r.analysis?.ranking || []).map((x) => `${x.cat}: ${x.score}`).join("; ") },
  { label: "Términos identificados", value: (r) => (r.analysis?.ranking.find((x) => x.cat === r.analysis.candidate)?.terms || []).map((t) => t.matched).join("; ") },
  { label: "Categoría elegida por el estudiante", value: (r) => catLabel(r.studentCategory) },
  { label: "Categoría final", value: (r) => catLabel(r.finalCategory) },
  { label: "Resultado del control", value: (r) => r.controlResult ? RESULT[r.controlResult].label + (r.status === "validada" ? "" : " (propuesto)") : "" },
  { label: "Estado de revisión", value: (r) => STATUS[r.status].label },
  { label: "Responsable de revisión", value: (r) => r.reviewer || "" },
  { label: "Fecha de última revisión", value: (r) => r.reviews.length ? fmtDateTime(r.reviews[r.reviews.length - 1].at) : "" },
  { label: "Observaciones del revisor", value: (r) => r.reviews[r.reviews.length - 1]?.comment || "" },
  { label: "Justificación de la decisión del revisor", value: (r) => r.reviews[r.reviews.length - 1]?.rationale || "" },
  { label: "Justificación del estudiante", value: (r) => r.justification ? [
    `Por qué: ${r.justification.why}`, `Respaldo: ${r.justification.support}`, `Alternativas: ${r.justification.alternatives}`, `Información adicional: ${r.justification.missing}`].join("\n") : "" },
  { label: "Descripción de la evidencia", value: (r) => r.description },
  { label: "Contexto", value: (r) => r.context },
  { label: "Fuente", value: (r) => r.source },
  { label: "Alcance", value: (r) => r.scope },
  { label: "Limitaciones", value: (r) => r.limitations },
  { label: "Dato de demostración", value: (r) => r.demo ? "Sí" : "No" },
];

/* ============================== Reglas ============================== */
Pages.rules = () => {
  const wl = { 3: "Específicos (peso 3)", 2: "Moderados (peso 2)", 1: "De apoyo (peso 1)" };
  return `<div class="view">
    <div class="page-head"><div><h2>Reglas de clasificación</h2><p>Reglas locales versión <span class="mono">${esc(RULES_VERSION)}</span>, definidas en <span class="mono">js/rules.js</span>. Puedes inspeccionarlas y probarlas con cualquier texto sin guardarlo.</p></div></div>
    ${banner("warn", "alert", "Las reglas pueden equivocarse.", " No detectan todas las vulnerabilidades ni constituyen un diagnóstico. Identifican términos y proponen una hipótesis que siempre requiere contraste humano.")}
    <div class="grid grid-2">
      <article class="card"><div class="card-head"><h3>${icon("rules")}Cómo funciona</h3></div><ol class="small stack-sm">
        <li>Se unen título, descripción y contexto; se pasan a minúsculas y se eliminan tildes y signos.</li>
        <li>Cada regla busca sus términos, de más largo a más corto. Un fragmento usado por un término no vuelve a contar dentro de la misma regla, y cada término suma una sola vez.</li>
        <li>Los pesos se suman por categoría. El módulo de FIXIT añade 1 punto si coincide con la categoría y ya hay algún término.</li>
        <li>Si ninguna categoría alcanza ${Classifier.MIN_SCORE} puntos, o la descripción tiene menos de ${Classifier.MIN_TEXT} caracteres, la clasificación es <b>no concluyente</b>.</li>
        <li>El nivel cualitativo (alto, medio o bajo) compara la candidata con las alternativas. No se calculan porcentajes de confianza.</li>
        <li>Por separado se buscan expresiones de resultado («rechazada», «expone»…) para orientar, nunca para decidir, si el control funcionó.</li></ol></article>
      <article class="card"><div class="card-head"><div><h3>${icon("play")}Probar las reglas</h3><p>El texto no se guarda.</p></div></div>
        <form data-form="sandbox" novalidate>
          <label for="sb-text">Texto de prueba<textarea id="sb-text" name="description" placeholder="Ej.: Un usuario con rol USUARIO recibió una respuesta HTTP 403 al intentar acceder a una operación exclusiva de administración."></textarea></label>
          <label for="sb-module">Módulo (opcional)<select id="sb-module" name="module">${optionList(MODULES, "", "Sin módulo")}</select></label>
          <div class="form-actions"><button type="submit" class="btn btn-primary">${icon("play")}Analizar texto</button></div>
        </form></article>
    </div>
    <div id="sandbox-result"></div>
    <section><h3 style="font-size:16px;margin-bottom:12px">Reglas por categoría</h3>
    ${RULES.map((rule) => {
      const c = OWASP_BY_ID[rule.category];
      const groups = [3, 2, 1].map((w) => ({ w, terms: rule.terms.filter((t) => t.w === w) })).filter((g) => g.terms.length);
      return `<details class="rule"><summary>${catBadge(c.id)}<b>${esc(c.name)}</b><span class="small muted">${plural(rule.terms.length, "término", "términos")}</span>${icon("chevron", "chev")}</summary>
        <div class="rule-body"><p class="small"><b>Criterio:</b> ${esc(rule.criterion)}</p>
          ${groups.map((g) => `<div class="stack-sm"><p class="block-title">${wl[g.w]}</p><div class="chips">${g.terms.map((t) => `<span class="chip">${esc(t.t)}</span>`).join("")}</div></div>`).join("")}
          <div class="grid grid-2">
            <div class="stack-sm"><p class="block-title">Señales que apoyarían la clasificación</p><ul class="small">${rule.supports.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
            <div class="stack-sm"><p class="block-title">Señales que podrían generar ambigüedad</p><ul class="small">${rule.ambiguity.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
            <div class="stack-sm"><p class="block-title">Categorías alternativas relacionadas</p><ul class="small">${rule.alternatives.map((x) => `<li><span class="mono">${esc(x.cat)}</span>: ${esc(x.why)}</li>`).join("")}</ul></div>
            <div class="stack-sm"><p class="block-title">Contexto que conviene aportar</p><ul class="small">${rule.missing.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          </div></div></details>`;
    }).join("")}
    <details class="rule"><summary><span class="cat">Resultado</span><b>Expresiones de orientación del resultado</b>${icon("chevron", "chev")}</summary>
      <div class="rule-body"><div class="stack-sm"><p class="block-title">Sugieren que el control funcionó</p><div class="chips">${OUTCOME_SIGNALS.favorable.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div></div>
        <div class="stack-sm"><p class="block-title">Sugieren un posible fallo</p><div class="chips">${OUTCOME_SIGNALS.unfavorable.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div></div>
        <div class="stack-sm"><p class="block-title">Indicadores contextuales por módulo (+1 punto)</p><div class="chips">${Object.entries(MODULE_HINTS).map(([m, c]) => `<span class="chip">${esc(m)} → ${esc(c)}</span>`).join("")}</div></div></div></details>
    </section></div>`;
};

/* ============================== Marco de referencia ============================== */
Pages.framework = () => {
  const policy = Store.settings.policy || "";
  return `<div class="view">
    <div class="page-head"><div><h2>Marco de referencia</h2><p>Referencias que sustentan la clasificación y la revisión. Se muestran como apoyo a la decisión, no como prueba automática de cumplimiento normativo.</p></div></div>
    <div class="grid grid-2">
      ${References.frameworks.map((f) => `<article class="card fw-card"><span class="pill tone-accent" style="justify-self:start">${esc(f.role)}</span><h3>${esc(f.name)}</h3><p>${esc(f.text)}</p>
        <a class="ref-link" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.url)} ${icon("external")}</a></article>`).join("")}
      <article class="card fw-card"><span class="pill ${policy ? "tone-warn" : "tone-neutral"}" style="justify-self:start">${policy ? "Criterio contextual configurado" : "Pendiente de incorporar"}</span>
        <h3>Política institucional</h3>
        <p>Criterio contextual configurable. Aún no se ha proporcionado un documento institucional oficial, por lo que el prototipo no incluye ninguna política aprobada.</p>
        <form data-form="policy" novalidate><label for="policy-text">Criterio contextual local<textarea id="policy-text" name="policy" maxlength="3000" placeholder="Ej.: Pendiente de recibir el documento oficial. Mientras tanto, se aplicará el criterio acordado en clase…">${esc(policy)}</textarea>
          <span class="hint">Se guarda solo en este navegador. No sustituye ni representa una política aprobada por la universidad.</span></label>
          <div class="form-actions"><button type="submit" class="btn btn-secondary">${icon("check")}Guardar criterio</button>${policy ? `<button type="button" class="btn btn-ghost" data-action="clear-policy">Vaciar</button>` : ""}</div></form></article>
    </div>

    <article class="card"><div class="card-head"><div><h3>${icon("matrix")}Correspondencias por categoría OWASP Top 10:2025</h3>
      <p>Capítulos ASVS 5.0.0 y pruebas WSTG v4.2 cuyos identificadores se comprobaron en las fuentes oficiales. La relación con cada categoría es orientativa.</p></div></div>
      <div class="table-wrap"><table class="compact"><thead><tr><th>Categoría</th><th>ASVS 5.0.0 (capítulo)</th><th>WSTG v4.2</th></tr></thead><tbody>
      ${OWASP.map((c) => { const ref = References.forCategory(c.id); return `<tr><td><a class="ref-link" href="${esc(ref.owasp.url)}" target="_blank" rel="noopener noreferrer"><span class="mono">${esc(c.code)}</span> ${esc(c.name)}</a><p class="small muted" style="margin-top:4px">${esc(c.summary)}</p></td>
        <td>${ref.asvs.map((a) => `<a class="ref-link" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"><span class="mono">${esc(a.id)}</span> ${esc(a.title)}</a>`).join("<br>")}${c.asvsNote ? `<p class="hint">${esc(c.asvsNote)}</p>` : ""}</td>
        <td>${ref.wstg.length ? ref.wstg.map((w) => `<a class="ref-link" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer"><span class="mono">${esc(w.id)}</span> ${esc(w.title)}</a>`).join("<br>") : `<span class="hint">${esc(ref.noWstg)}</span>`}</td></tr>`; }).join("")}
      </tbody></table></div>
      <p class="hint" style="margin-top:10px">No se citan requisitos ASVS individuales porque su correspondencia no fue comprobada para este prototipo. Cuando no existe una prueba WSTG precisa, se indica expresamente.</p></article>

    <div class="grid grid-2">
      <article class="card"><div class="card-head"><h3>${icon("history")}Trazabilidad de cada registro</h3></div><ul class="small stack-sm">
        <li>Evidencia original, contexto, fuente, alcance y limitaciones.</li>
        <li>Propuesta de clasificación con la versión de reglas y la fecha del análisis.</li>
        <li>Reglas activadas, términos encontrados y fragmento del texto que los respalda.</li>
        <li>Categorías alternativas y motivo de su menor correspondencia.</li>
        <li>Justificación del estudiante, separada de la explicación automática.</li>
        <li>Decisiones del revisor con categoría final, resultado, observaciones, justificación y fecha.</li>
        <li>Historial cronológico de cambios con actor y fecha.</li></ul></article>
      <article class="card"><div class="card-head"><h3>${icon("lock")}Privacidad y límites</h3></div><div class="stack small">
        <p><b>Prototipo académico de apoyo a la auditoría.</b> Las clasificaciones son orientativas y deben contrastarse con la evidencia y el contexto. La evaluación y validación final corresponden al auditor humano.</p>
        <p>No introduzcas contraseñas, tokens, secretos, datos personales ni información confidencial en las evidencias.</p>
        <p>Los datos se guardan en el <b>localStorage</b> de este navegador. No es un almacenamiento seguro para información sensible: cualquier script de la misma página o cualquier persona con acceso al equipo puede leerlo.</p>
        <p>El prototipo no realiza escaneos de red, pruebas intrusivas, solicitudes al backend de FIXIT ni conexiones con servicios de terceros. Los únicos enlaces externos son las referencias oficiales, que se abren solo si haces clic.</p>
        <p>Estado del almacenamiento: <b>${Store.persistent ? "disponible" : "no disponible (los cambios se perderán al recargar)"}</b>.</p>
        <div><button type="button" class="btn btn-secondary" data-action="reset-demo">${icon("restore")}Restaurar datos de demostración</button></div></div></article>
    </div></div>`;
};

Pages.notFound = (id) => `<div class="view"><article class="card empty stack" style="justify-items:center">${icon("alert")}<h2>No se encontró la evidencia ${esc(id || "")}</h2>
  <p class="muted">Puede que se haya eliminado o que los datos se hayan restaurado.</p><a class="btn btn-primary" href="#/matriz">Ir a la matriz</a></article></div>`;
