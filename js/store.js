"use strict";
/* FIXIT — Security Audit · Persistencia local, flujo de revisión y exportación CSV.
 *
 * Los datos se guardan en localStorage de ESTE navegador. No es un almacenamiento seguro:
 * no deben introducirse contraseñas, tokens, secretos ni datos personales.
 */

const STATUS = {
  borrador: { label: "Borrador", tone: "neutral", icon: "edit" },
  en_revision: { label: "En revisión", tone: "warn", icon: "clock" },
  validada: { label: "Validada", tone: "good", icon: "check" },
  requiere_correcciones: { label: "Requiere correcciones", tone: "serious", icon: "undo" },
};
const RESULT = {
  conforme: { label: "Conforme", tone: "good", icon: "check", help: "El control respondió como se esperaba dentro del alcance de la evidencia." },
  observacion: { label: "Observación", tone: "warn", icon: "eye", help: "Aspecto mejorable o incompleto que no constituye un fallo confirmado." },
  hallazgo: { label: "Hallazgo", tone: "crit", icon: "alert", help: "Fallo del control respaldado por la evidencia, que requiere atención." },
  no_concluyente: { label: "No concluyente", tone: "neutral", icon: "help", help: "La evidencia no permite determinar el resultado del control." },
};
const LEVEL = {
  alto: { label: "Alta", bars: 3 },
  medio: { label: "Media", bars: 2 },
  bajo: { label: "Baja", bars: 1 },
};
const MODULES = ["Autenticación y sesiones", "Gestión de tickets", "Roles y permisos", "Asignación de técnicos", "Archivos adjuntos",
  "Notificaciones", "Informes y exportaciones", "Configuración y despliegue", "Dependencias y componentes", "Registro y auditoría", "Otro"];
const EVIDENCE_TYPES = ["Prueba manual", "Revisión de código", "Configuración", "Registro de eventos", "Otro"];
const ENVIRONMENTS = ["Entorno local de desarrollo", "Entorno de pruebas", "Entorno de demostración académica", "Otro"];
const ROLES = {
  estudiante: { label: "Estudiante", actor: "Estudiante (demo)" },
  auditor: { label: "Auditor / Docente", actor: "Docente revisor (demo)" },
};

const Store = (() => {
  const KEY = "fixit-security-audit:v1";
  const defaultSettings = () => ({ role: "estudiante", policy: "", csvSep: ",", draft: null, matrix: null });
  const defaults = () => ({ version: 1, records: buildDemoRecords(), settings: defaultSettings() });
  let state = null;
  let persistent = true;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.records)) {
          state = { version: 1, records: parsed.records, settings: { ...defaultSettings(), ...parsed.settings } };
          return state;
        }
      }
    } catch { persistent = false; }
    state = defaults();
    save();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); persistent = true; } catch { persistent = false; }
    return persistent;
  }

  function reset() {
    const role = state?.settings.role || "estudiante";
    state = defaults();
    state.settings.role = role;
    save();
  }

  function nextId() {
    const max = state.records.reduce((m, r) => Math.max(m, Number(String(r.id).replace(/\D/g, "")) || 0), 0);
    return `EV-${String(max + 1).padStart(3, "0")}`;
  }

  return {
    load, save, reset, nextId,
    get state() { return state; },
    get persistent() { return persistent; },
    get settings() { return state.settings; },
    all: () => state.records,
    get: (id) => state.records.find((r) => r.id === id) || null,
    add(rec) { state.records.push(rec); save(); },
    remove(id) { state.records = state.records.filter((r) => r.id !== id); save(); },
  };
})();

/* ---------- Flujo de trabajo: cada función valida, actualiza el registro y deja traza ---------- */
class WorkflowError extends Error {}

const Workflow = (() => {
  const now = () => new Date().toISOString();
  const actor = () => ROLES[Store.settings.role].actor;
  const requireRole = (role, what) => {
    if (Store.settings.role !== role) throw new WorkflowError(`${what} corresponde al rol «${ROLES[role].label}» del selector de demostración.`);
  };
  const log = (rec, action, detail = "") => {
    const at = now();
    rec.history.push({ at, actor: actor(), action, detail });
    rec.updatedAt = at;
  };
  const editable = (rec) => ["borrador", "requiere_correcciones"].includes(rec.status);
  const text = (v) => String(v ?? "").trim();

  /* Detección local y aproximada de datos que no deberían registrarse. */
  const SENSITIVE = [
    { re: /[\w.+-]+@[\w-]+\.[\w.-]+/, what: "una dirección de correo electrónico" },
    { re: /\beyJ[\w-]{8,}\.[\w-]{8,}/, what: "un posible token JWT" },
    { re: /\b(bearer|authorization)\s*[:=]?\s+[\w.~+/-]{12,}/i, what: "una posible cabecera de autorización con token" },
    { re: /\b(password|passwd|pwd|contrase(ñ|n)a|clave|secret|secreto|api[_-]?key|token)\s*[:=]\s*\S{4,}/i, what: "un posible valor de contraseña, clave o token" },
    { re: /\b(sk|pk|ghp|xox[bap])[-_][A-Za-z0-9]{12,}/, what: "una posible clave de API" },
    { re: /\b[A-Fa-f0-9]{32,}\b/, what: "una cadena hexadecimal larga (posible secreto o hash real)" },
    { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: "una clave privada" },
  ];
  function sensitiveCheck(values) {
    for (const v of values) for (const s of SENSITIVE) if (s.re.test(String(v || ""))) return s.what;
    return null;
  }

  function validateEvidence(d) {
    const errors = {};
    if (text(d.title).length < 6) errors.title = "Escribe un título de al menos 6 caracteres.";
    if (!MODULES.includes(d.module)) errors.module = "Selecciona el módulo de FIXIT evaluado.";
    if (!EVIDENCE_TYPES.includes(d.type)) errors.type = "Selecciona el tipo de evidencia.";
    if (!ENVIRONMENTS.includes(d.environment)) errors.environment = "Selecciona el entorno de referencia.";
    if (text(d.description).length < Classifier.MIN_TEXT) errors.description = `Describe la evidencia con al menos ${Classifier.MIN_TEXT} caracteres (llevas ${text(d.description).length}).`;
    if (text(d.context).length < 10) errors.context = "Indica el contexto o las condiciones en que se obtuvo (al menos 10 caracteres).";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || "")) errors.date = "Indica la fecha de registro.";
    const sens = sensitiveCheck([d.title, d.description, d.context, d.source, d.scope, d.limitations]);
    if (sens) errors.description = `El texto parece contener ${sens}. Elimínalo o sustitúyelo por un marcador como [REDACTADO].`;
    return errors;
  }

  function evidenceFields(d) {
    return {
      title: text(d.title), module: d.module, type: d.type, environment: d.environment,
      description: text(d.description), context: text(d.context),
      source: text(d.source), scope: text(d.scope), limitations: text(d.limitations),
      registeredAt: new Date(`${d.date}T12:00:00`).toISOString(),
    };
  }

  function register(d) {
    requireRole("estudiante", "Registrar evidencias");
    const errors = validateEvidence(d);
    if (Object.keys(errors).length) { const e = new WorkflowError("Revisa los campos marcados."); e.fields = errors; throw e; }
    const rec = {
      id: Store.nextId(), demo: false, ...evidenceFields(d), registeredBy: actor(), updatedAt: null,
      analysis: null, analysisStale: false, studentCategory: null, decisionMode: null, controlResult: null,
      justification: null, status: "borrador", finalCategory: null, reviewer: null, reviews: [], history: [],
    };
    log(rec, "Evidencia registrada", `Módulo: ${rec.module}.`);
    Store.add(rec);
    return rec;
  }

  function updateEvidence(rec, d) {
    requireRole("estudiante", "Editar evidencias");
    if (!editable(rec)) throw new WorkflowError("Solo se pueden editar evidencias en borrador o con correcciones solicitadas.");
    const errors = validateEvidence(d);
    if (Object.keys(errors).length) { const e = new WorkflowError("Revisa los campos marcados."); e.fields = errors; throw e; }
    const fields = evidenceFields(d);
    const changed = Object.keys(fields).filter((k) => k !== "registeredAt" && fields[k] !== (rec[k] ?? ""));
    Object.assign(rec, fields);
    if (rec.analysis && changed.some((k) => ["title", "description", "context", "module"].includes(k))) rec.analysisStale = true;
    log(rec, "Evidencia editada", changed.length ? `Campos modificados: ${changed.join(", ")}.` : "Sin cambios de contenido.");
    Store.save();
  }

  function analyze(rec) {
    requireRole("estudiante", "Ejecutar el análisis");
    if (!editable(rec)) throw new WorkflowError("La evidencia está en revisión o validada; su análisis no puede modificarse.");
    rec.analysis = Classifier.analyze(rec);
    rec.analysisStale = false;
    const a = rec.analysis;
    log(rec, "Análisis por reglas locales", a.conclusive ? `Candidata ${a.candidate} · correspondencia ${LEVEL[a.level].label.toLowerCase()}.` : "Clasificación no concluyente.");
    Store.save();
    return a;
  }

  function saveJustification(rec, d) {
    requireRole("estudiante", "Guardar la justificación");
    if (!editable(rec)) throw new WorkflowError("La justificación solo puede editarse en borrador o con correcciones solicitadas.");
    if (!rec.analysis) throw new WorkflowError("Analiza la evidencia antes de registrar tu decisión.");
    if (!OWASP_BY_ID[d.category]) throw new WorkflowError("Selecciona una categoría OWASP Top 10:2025.");
    const prevCat = rec.studentCategory;
    rec.studentCategory = d.category;
    rec.decisionMode = d.category === rec.analysis.candidate ? "propuesta" : "manual";
    rec.controlResult = RESULT[d.controlResult] ? d.controlResult : null;
    rec.justification = { why: text(d.why), support: text(d.support), alternatives: text(d.alternatives), missing: text(d.missing), updatedAt: now() };
    const detail = [`Categoría elegida: ${d.category} (${rec.decisionMode === "manual" ? "selección manual" : "acepta la propuesta"}).`];
    if (prevCat && prevCat !== d.category) detail.push(`Antes: ${prevCat}.`);
    if (rec.controlResult) detail.push(`Resultado propuesto: ${RESULT[rec.controlResult].label}.`);
    log(rec, prevCat ? "Justificación editada" : "Justificación guardada", detail.join(" "));
    Store.save();
  }

  /* Devuelve el motivo por el que aún no se puede enviar, o null si está lista. */
  function submitBlocker(rec) {
    if (!editable(rec)) return "La evidencia ya fue enviada o validada.";
    if (rec.analysisStale) return "La evidencia cambió después del análisis. Vuelve a analizarla antes de enviarla.";
    const j = rec.justification;
    if (!rec.studentCategory || !j) return "Guarda tu categoría y tu justificación antes de enviarla a revisión.";
    if (j.why.length < 20 || j.support.length < 10) return "Completa al menos «¿Por qué consideras que esta es la categoría correcta?» (20 caracteres) y «¿Qué parte de la evidencia respalda tu decisión?» (10 caracteres).";
    if (!rec.controlResult) return "Indica el resultado del control que propones.";
    return null;
  }

  function submit(rec) {
    requireRole("estudiante", "Enviar a revisión");
    const blocker = submitBlocker(rec);
    if (blocker) throw new WorkflowError(blocker);
    rec.status = "en_revision";
    rec.submittedAt = now();
    log(rec, rec.reviews.length ? "Reenviada a revisión" : "Enviada a revisión", "");
    Store.save();
  }

  function review(rec, d) {
    requireRole("auditor", "Revisar evaluaciones");
    if (rec.status !== "en_revision") throw new WorkflowError("Solo se pueden revisar evidencias en estado «En revisión».");
    const comment = text(d.comment), rationale = text(d.rationale);
    if (rationale.length < 10) throw new WorkflowError("Registra la justificación de tu decisión (al menos 10 caracteres).");
    let finalCategory = d.finalCategory || null, controlResult = d.controlResult || null, status, action;
    if (d.decision === "aprobada") {
      if (!OWASP_BY_ID[finalCategory]) throw new WorkflowError("Selecciona la categoría final antes de aprobar.");
      if (!["conforme", "observacion", "hallazgo"].includes(controlResult)) throw new WorkflowError("Para aprobar, el resultado del control debe ser Conforme, Observación o Hallazgo. Si no puede determinarse, marca la clasificación como no concluyente.");
      status = "validada"; action = "Clasificación aprobada";
    } else if (d.decision === "correcciones") {
      if (comment.length < 10) throw new WorkflowError("Añade observaciones que expliquen qué debe corregirse (al menos 10 caracteres).");
      status = "requiere_correcciones"; action = "Correcciones solicitadas";
    } else if (d.decision === "no_concluyente") {
      controlResult = "no_concluyente"; finalCategory = null;
      status = "requiere_correcciones"; action = "Marcada como no concluyente";
    } else throw new WorkflowError("Decisión no reconocida.");
    const r = { decision: d.decision, finalCategory, controlResult, comment, rationale, at: now(), reviewer: actor() };
    const prevFinal = rec.finalCategory;
    rec.reviews.push(r);
    rec.reviewer = r.reviewer;
    rec.controlResult = controlResult;
    rec.status = status;
    rec.finalCategory = status === "validada" ? finalCategory : null;
    const detail = [];
    if (finalCategory) detail.push(`Categoría final ${finalCategory}${rec.studentCategory && finalCategory !== rec.studentCategory ? ` (cambiada desde ${rec.studentCategory})` : ""}.`);
    if (prevFinal && prevFinal !== finalCategory) detail.push(`Categoría final anterior: ${prevFinal}.`);
    if (controlResult) detail.push(`Resultado: ${RESULT[controlResult].label}.`);
    if (comment) detail.push(comment);
    log(rec, action, detail.join(" "));
    Store.save();
  }

  function reopen(rec) {
    requireRole("auditor", "Reabrir la revisión");
    if (rec.status !== "validada") throw new WorkflowError("Solo se pueden reabrir evaluaciones validadas.");
    rec.status = "en_revision";
    log(rec, "Revisión reabierta", `Categoría final previa: ${rec.finalCategory}.`);
    Store.save();
  }

  function remove(rec) {
    requireRole("estudiante", "Eliminar borradores");
    if (rec.status !== "borrador") throw new WorkflowError("Solo se pueden eliminar evidencias en borrador.");
    Store.remove(rec.id);
  }

  return { register, updateEvidence, analyze, saveJustification, submit, submitBlocker, review, reopen, remove, editable, validateEvidence, sensitiveCheck };
})();

/* ---------- Exportación CSV generada en el navegador ---------- */
const Csv = (() => {
  function cell(v) {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;   // evita que una hoja de cálculo lo interprete como fórmula
    return `"${s.replace(/"/g, '""')}"`;
  }
  function build(columns, rows, sep = ",") {
    const lines = [columns.map((c) => cell(c.label)).join(sep)];
    for (const r of rows) lines.push(columns.map((c) => cell(c.value(r))).join(sep));
    return "﻿" + lines.join("\r\n") + "\r\n";
  }
  function download(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return { build, download, cell };
})();

if (typeof module !== "undefined") module.exports = { Store, Workflow, Csv, STATUS, RESULT, LEVEL };
