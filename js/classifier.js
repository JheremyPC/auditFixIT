"use strict";
/* FIXIT — Security Audit · Clasificador determinista basado en reglas locales.
 *
 * Proceso:
 *  1. Normaliza el texto (minúsculas, sin tildes, signos → espacios) conservando un mapa
 *     de posiciones para poder citar el fragmento original que activó cada regla.
 *  2. Para cada regla busca sus términos, del más largo al más corto. Un fragmento ya
 *     usado por un término de la misma regla no vuelve a contar (evita duplicar
 *     «control de acceso» y «acceso»). Cada término cuenta una sola vez.
 *  3. Suma los pesos por categoría y compara la candidata con las alternativas.
 *  4. Devuelve un nivel cualitativo (alto, medio, bajo) con su explicación.
 *
 * No hay modelos estadísticos ni IA: la misma entrada produce siempre la misma salida.
 * Los «puntos de regla» son una suma de pesos, no una probabilidad.
 */

const Classifier = (() => {
  const R = typeof RULES !== "undefined" ? { RULES, RULES_VERSION, MODULE_HINTS, OUTCOME_SIGNALS } : require("./rules.js");

  const MIN_SCORE = 4;          // por debajo: clasificación no concluyente
  const MIN_TEXT = 40;          // caracteres mínimos de descripción
  const EXCERPT = 48;           // caracteres de contexto a cada lado del término

  function normalize(text) {
    let norm = "";
    const map = [];
    const src = String(text ?? "");
    for (let i = 0; i < src.length; i++) {
      const n = src[i].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      for (const c of n) {
        norm += /[a-z0-9]/.test(c) ? c : " ";
        map.push(i);
      }
    }
    return { norm, map };
  }

  const plain = (s) => normalize(s).norm.replace(/\s+/g, " ").trim();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const reCache = new Map();
  function termRegex(term) {
    if (reCache.has(term)) return reCache.get(term);
    const tokens = term.split(/\s+/).filter(Boolean).map((tok) => {
      const star = tok.endsWith("*");
      return escapeRe(plain(tok.replace(/\*$/, ""))) + (star ? "[a-z0-9]*" : "");
    });
    const re = new RegExp(`(?<![a-z0-9])${tokens.join(" +")}(?![a-z0-9])`, "g");
    reCache.set(term, re);
    return re;
  }

  function excerpt(src, map, start, end) {
    const a = map[start], b = map[end - 1] + 1;
    let from = Math.max(0, a - EXCERPT), to = Math.min(src.length, b + EXCERPT);
    if (from > 0) { const sp = src.indexOf(" ", from); if (sp > -1 && sp < a) from = sp + 1; }
    if (to < src.length) { const sp = src.lastIndexOf(" ", to); if (sp > b) to = sp; }
    return {
      before: (from > 0 ? "…" : "") + src.slice(from, a).replace(/\s+/g, " "),
      match: src.slice(a, b),
      after: src.slice(b, to).replace(/\s+/g, " ") + (to < src.length ? "…" : ""),
    };
  }

  /* Busca una lista de términos sobre un texto normalizado, enmascarando lo ya usado. */
  function findTerms(items, src, prepared) {
    let work = prepared.norm;
    const found = [];
    const ordered = [...items].sort((x, y) => y.t.length - x.t.length);
    for (const item of ordered) {
      const re = termRegex(item.t);
      re.lastIndex = 0;
      let m, first = null;
      while ((m = re.exec(work))) {
        if (!first) first = { start: m.index, end: m.index + m[0].length };
        work = work.slice(0, m.index) + "#".repeat(m[0].length) + work.slice(m.index + m[0].length);
        re.lastIndex = m.index + m[0].length;
      }
      if (first) {
        const ex = excerpt(src, prepared.map, first.start, first.end);
        found.push({ term: item.t, weight: item.w ?? 0, group: item.g, matched: ex.match, excerpt: ex, pos: first.start });
      }
    }
    return found.sort((x, y) => x.pos - y.pos);
  }

  function evidenceText(rec) {
    return [rec.title, rec.description, rec.context].filter((s) => s && String(s).trim()).join(".\n");
  }

  function outcomeOf(src, prepared) {
    const items = [
      ...R.OUTCOME_SIGNALS.favorable.map((t) => ({ t, g: "favorable" })),
      ...R.OUTCOME_SIGNALS.unfavorable.map((t) => ({ t, g: "unfavorable" })),
    ];
    const hits = findTerms(items, src, prepared);
    const fav = hits.filter((h) => h.group === "favorable").map((h) => h.matched);
    const unfav = hits.filter((h) => h.group === "unfavorable").map((h) => h.matched);
    let orientation = "indeterminada", note = "El texto no indica con claridad si el control funcionó o falló.";
    if (fav.length && !unfav.length) {
      orientation = "favorable";
      note = "El texto sugiere que el control respondió como se esperaba. La categoría indica el riesgo evaluado, no la existencia de una vulnerabilidad.";
    } else if (unfav.length && !fav.length) {
      orientation = "desfavorable";
      note = "El texto sugiere un posible fallo del control. Debe confirmarse con la evidencia antes de registrarlo como hallazgo.";
    } else if (fav.length && unfav.length) {
      orientation = "mixta";
      note = "El texto contiene expresiones de resultado favorable y desfavorable. Precisa qué ocurrió en cada caso.";
    }
    return { orientation, favorable: fav, unfavorable: unfav, note };
  }

  const list = (arr) => arr.map((x) => `«${x}»`).join(", ");

  function analyze(rec, opts = {}) {
    const rules = opts.rules || R.RULES;
    const src = evidenceText(rec);
    const prepared = normalize(src);
    const descLen = String(rec.description || "").trim().length;
    const hint = R.MODULE_HINTS[rec.module] || null;

    const ranking = rules.map((rule) => {
      const terms = findTerms(rule.terms, src, prepared);
      let score = terms.reduce((s, t) => s + t.weight, 0);
      const moduleHint = hint === rule.category && score > 0;
      if (moduleHint) score += 1;
      return { cat: rule.category, score, strong: terms.filter((t) => t.weight >= 3).length, terms, moduleHint };
    }).filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.strong - a.strong || b.terms.length - a.terms.length || a.cat.localeCompare(b.cat));

    const top = ranking[0], second = ranking[1];
    const outcome = outcomeOf(src, prepared);
    const result = {
      at: opts.at || new Date().toISOString(),
      rulesVersion: R.RULES_VERSION,
      input: { title: rec.title || "", module: rec.module || "", type: rec.type || "", environment: rec.environment || "",
        words: prepared.norm.split(/\s+/).filter(Boolean).length },
      ranking: ranking.map(({ cat, score, strong, terms, moduleHint }) => ({ cat, score, strong, moduleHint,
        terms: terms.map(({ term, weight, matched, excerpt: ex }) => ({ term, weight, matched, excerpt: ex })) })),
      outcome,
      conclusive: false, candidate: null, level: null, levelReason: "", reasons: [], alternatives: [], ambiguity: [], missing: [],
      tie: false, recommendHuman: true,
    };

    const generalMissing = [];
    if (!String(rec.context || "").trim()) generalMissing.push("Describe las condiciones en que se obtuvo la evidencia: rol utilizado, pasos y entorno.");
    if (!String(rec.environment || "").trim()) generalMissing.push("Indica el entorno de referencia de la evidencia.");
    if (outcome.orientation === "indeterminada") generalMissing.push("Indica explícitamente si el control respondió como se esperaba o no.");
    if (outcome.orientation === "mixta") generalMissing.push("Separa los casos en que el control funcionó de aquellos en que no.");

    if (!top || top.score < MIN_SCORE || descLen < MIN_TEXT) {
      result.reasons.push(descLen < MIN_TEXT
        ? `La descripción tiene ${descLen} caracteres; se necesitan al menos ${MIN_TEXT} para aplicar las reglas con un mínimo de contexto.`
        : top
          ? `El mayor peso acumulado (${top.score} puntos de regla, ${top.cat}) no alcanza el mínimo de ${MIN_SCORE} establecido para proponer una categoría.`
          : "No se identificaron términos asociados a ninguna regla.");
      result.levelReason = "Sin indicadores suficientes no se asigna nivel de correspondencia.";
      result.alternatives = ranking.slice(0, 3).map((r) => ({ cat: r.cat, score: r.score, related: false,
        why: rules.find((x) => x.category === r.cat).criterion,
        lower: `Indicadores encontrados: ${list(r.terms.map((t) => t.matched))}. Son insuficientes por sí solos.` }));
      result.missing = [
        "Describe qué control se evaluó, qué acción se realizó y qué respuesta se obtuvo.",
        ...generalMissing,
      ];
      result.ambiguity.push("Clasificación no concluyente: selecciona la categoría manualmente o amplía la evidencia y vuelve a analizarla.");
      return result;
    }

    const rule = rules.find((x) => x.category === top.cat);
    const ratio = second ? second.score / top.score : 0;
    result.conclusive = true;
    result.candidate = top.cat;
    result.tie = !!second && second.score === top.score;

    if (top.score >= 8 && top.terms.length >= 3 && top.strong >= 1 && ratio <= 0.5) {
      result.level = "alto";
      result.levelReason = `Se identificaron ${top.terms.length} indicadores de la categoría (${top.strong} específicos) y ninguna alternativa supera la mitad de su peso.`;
    } else if (top.score >= 5 && ratio <= 0.75 && !result.tie) {
      result.level = "medio";
      result.levelReason = top.strong
        ? `Hay indicadores suficientes, pero ${second ? `la alternativa ${second.cat} tiene un peso relevante` : "su número es limitado"}.`
        : "Hay indicadores suficientes, pero ninguno es específico de la categoría.";
    } else {
      result.level = "bajo";
      result.levelReason = result.tie
        ? `${top.cat} y ${second.cat} tienen el mismo peso acumulado. Se propone ${top.cat} por desempate (más términos específicos y, en su defecto, orden de la lista), lo que exige contraste humano.`
        : "Los indicadores son escasos o hay alternativas con peso cercano; la propuesta requiere contraste humano.";
    }
    result.recommendHuman = result.level !== "alto" || ratio >= 0.5;

    result.reasons.push(rule.criterion);
    const strong = top.terms.filter((t) => t.weight >= 3), other = top.terms.filter((t) => t.weight < 3);
    if (strong.length) result.reasons.push(`Términos específicos de la regla encontrados en la evidencia: ${list(strong.map((t) => t.matched))}.`);
    if (other.length) result.reasons.push(`Términos de apoyo: ${list(other.map((t) => t.matched))}.`);
    if (top.moduleHint) result.reasons.push(`Indicador contextual: el módulo evaluado («${rec.module}») se asocia habitualmente con esta categoría (+1 punto).`);
    result.reasons.push(second
      ? `Peso acumulado: ${top.score} puntos de regla frente a ${second.score} de la siguiente categoría (${second.cat}).`
      : `Peso acumulado: ${top.score} puntos de regla; ninguna otra regla se activó.`);

    const alts = ranking.slice(1, 4).map((r) => {
      const rel = rule.alternatives.find((a) => a.cat === r.cat);
      const lower = r.score === top.score
        ? `Tiene el mismo peso (${r.score} puntos) con ${list(r.terms.map((t) => t.matched))}; no se puede descartar sin contraste humano.`
        : `Se activó con ${list(r.terms.map((t) => t.matched))} (${r.score} puntos frente a ${top.score})${r.strong ? "" : "; ninguno de esos términos es específico de la categoría"}.`;
      return { cat: r.cat, score: r.score, related: !!rel, why: rel ? rel.why : rules.find((x) => x.category === r.cat).criterion, lower };
    });
    for (const a of rule.alternatives) {
      if (alts.length >= 4) break;
      if (!alts.some((x) => x.cat === a.cat)) {
        alts.push({ cat: a.cat, score: 0, related: true, why: a.why,
          lower: "No se encontraron términos de esta categoría en el texto; se muestra por su relación con el criterio de la candidata." });
      }
    }
    result.alternatives = alts;
    result.ambiguity = [...rule.ambiguity];
    if (result.tie) result.ambiguity.unshift("Empate entre categorías: la propuesta no debe aceptarse sin revisión.");
    result.missing = [...rule.missing, ...generalMissing];
    return result;
  }

  return { analyze, normalize, plain, termRegex, MIN_SCORE, MIN_TEXT };
})();

if (typeof module !== "undefined") module.exports = Classifier;
