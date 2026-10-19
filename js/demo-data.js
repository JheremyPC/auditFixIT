"use strict";
/* FIXIT — Security Audit · Datos de demostración.
 *
 * Todas las evaluaciones son FICTICIAS y se identifican con demo: true. Sirven para probar
 * la interfaz; no representan pruebas ejecutadas contra FIXIT ni acreditan su seguridad.
 * El análisis automático de cada registro se calcula con el clasificador al sembrar los
 * datos, de modo que siempre es coherente con la versión vigente de las reglas.
 */

const DEMO_STUDENT = "Estudiante (demo)";
const DEMO_REVIEWER = "Docente revisor (demo)";
const DEMO_SOURCE = "Escenario redactado para la demostración del prototipo. No procede de una prueba real sobre FIXIT.";

const DEMO_SEED = [
  {
    id: "EV-001", title: "Operación administrativa solicitada con rol USUARIO",
    module: "Roles y permisos", type: "Prueba manual", environment: "Entorno local de desarrollo",
    description: "Con una cuenta de demostración con rol USUARIO se intentó ejecutar una operación exclusiva de administración (cambiar el rol de otra cuenta). El servidor respondió HTTP 403 y la operación fue rechazada. La opción no aparece en la interfaz, por lo que la petición se envió directamente para comprobar que la autorización se valida en el servidor.",
    context: "Sesión iniciada con la cuenta de demostración. Se repitió la misma petición con rol TECNICO y se obtuvo igualmente acceso denegado.",
    scope: "Una operación administrativa, probada con los roles USUARIO y TECNICO.",
    limitations: "No cubre referencias directas a tickets de otros usuarios ni el resto de operaciones administrativas.",
    registeredAt: "2026-10-01T09:12:00-05:00",
    studentCategory: "A01", controlResult: "conforme",
    justification: {
      why: "La prueba comprueba si un usuario sin privilegios puede ejecutar una función reservada a administración, que es el núcleo de A01.",
      support: "La respuesta HTTP 403 ante la petición directa, sin depender de que la interfaz oculte la opción.",
      alternatives: "Consideré A07, pero la sesión era válida: el usuario estaba autenticado y lo que se evaluó fueron sus permisos.",
      missing: "Repetir la prueba con IDOR sobre tickets ajenos y con el resto de operaciones administrativas.",
    },
    review: { decision: "aprobada", finalCategory: "A01", controlResult: "conforme",
      comment: "Evidencia clara y bien acotada.",
      rationale: "La evidencia describe una comprobación de separación de privilegios en el servidor. El resultado es favorable dentro del alcance indicado.",
      at: "2026-10-02T16:40:00-05:00" },
  },
  {
    id: "EV-002", title: "Cabeceras de seguridad en las respuestas HTTP",
    module: "Configuración y despliegue", type: "Configuración", environment: "Entorno local de desarrollo",
    description: "Revisión de las cabeceras de seguridad devueltas por la aplicación. Se observaron presentes Content-Security-Policy, X-Content-Type-Options: nosniff, X-Frame-Options: DENY y Referrer-Policy, de acuerdo con la configuración de seguridad esperada para el escenario.",
    context: "Inspección con las herramientas de desarrollo del navegador sobre la página de inicio y una respuesta de la API, sin modificar la configuración.",
    scope: "Página de inicio y una respuesta de la API.",
    limitations: "No incluye HSTS porque el entorno local no usa HTTPS; debe verificarse en un entorno desplegado. No se evaluó la calidad de la directiva CSP.",
    registeredAt: "2026-10-02T10:05:00-05:00",
    studentCategory: "A02", controlResult: "conforme",
    justification: {
      why: "La evidencia trata sobre la configuración de la aplicación y sus cabeceras de seguridad, que corresponde a A02.",
      support: "La lista de cabeceras observadas y sus valores.",
      alternatives: "A04 si se tratara de TLS, pero la evidencia no aborda el cifrado del canal.",
      missing: "Verificar HSTS y la directiva CSP completa en el entorno desplegado.",
    },
    review: { decision: "aprobada", finalCategory: "A02", controlResult: "conforme",
      comment: "Registrar en una evidencia aparte la verificación de HSTS en el entorno desplegado.",
      rationale: "Las cabeceras esperadas están presentes en el alcance revisado. La limitación sobre HSTS está correctamente declarada.",
      at: "2026-10-03T11:20:00-05:00" },
  },
  {
    id: "EV-003", title: "Revisión de dependencias y versiones fijadas",
    module: "Dependencias y componentes", type: "Revisión de código", environment: "Entorno local de desarrollo",
    description: "Se revisó el archivo de dependencias del backend (requirements.txt) del escenario de demostración: todas las dependencias tienen versiones fijadas y se elaboró un inventario. También se comprobó el uso de un archivo de bloqueo para reproducir la instalación.",
    context: "Revisión estática del repositorio de demostración, sin ejecutar herramientas de análisis de vulnerabilidades conocidas.",
    scope: "Dependencias directas del backend.",
    limitations: "No se analizaron CVE ni dependencias transitivas. El resultado conforme se limita al uso de versiones fijadas.",
    registeredAt: "2026-10-03T08:45:00-05:00",
    studentCategory: "A03", controlResult: "conforme",
    justification: {
      why: "Fijar versiones y mantener un inventario son controles de la cadena de suministro de software (A03).",
      support: "La revisión del archivo de dependencias y del archivo de bloqueo.",
      alternatives: "A08 trata la verificación de integridad de artefactos, que esta evidencia no cubre.",
      missing: "Ejecutar un análisis de dependencias con herramienta y fecha documentadas.",
    },
    review: { decision: "aprobada", finalCategory: "A03", controlResult: "conforme",
      comment: "Conforme solo en el alcance indicado; no extrapolar a la ausencia de vulnerabilidades conocidas.",
      rationale: "La clasificación es correcta y la limitación de alcance está declarada.",
      at: "2026-10-04T09:30:00-05:00" },
  },
  {
    id: "EV-004", title: "Almacenamiento de contraseñas y canal protegido",
    module: "Autenticación y sesiones", type: "Revisión de código", environment: "Entorno de pruebas",
    description: "La revisión de código del escenario muestra que las contraseñas se guardan como hash con bcrypt y un salt por usuario, nunca en texto plano. El acceso al entorno de pruebas se realiza mediante HTTPS con TLS, lo que proporciona un canal protegido para las credenciales.",
    context: "Lectura del módulo de seguridad del backend de demostración y verificación del certificado en el navegador.",
    scope: "Almacenamiento de contraseñas y transporte en el entorno de pruebas.",
    limitations: "No se revisó la configuración TLS del servidor (versiones y suites) ni la gestión de claves de firma de tokens.",
    registeredAt: "2026-10-05T15:10:00-05:00",
    studentCategory: "A04", controlResult: "conforme",
    justification: {
      why: "La evidencia evalúa la protección criptográfica de las contraseñas en reposo y en tránsito.",
      support: "El uso de bcrypt con salt y el acceso mediante HTTPS.",
      alternatives: "A07, porque el módulo es de autenticación; pero lo evaluado es el mecanismo criptográfico.",
      missing: "Factor de coste de bcrypt y configuración TLS del servidor.",
    },
    review: { decision: "aprobada", finalCategory: "A04", controlResult: "conforme",
      comment: "Documentar el factor de coste en una próxima evidencia.",
      rationale: "El criterio aplicado es criptográfico, no de flujo de autenticación. Clasificación correcta.",
      at: "2026-10-06T10:00:00-05:00" },
  },
  {
    id: "EV-005", title: "Rechazo de entrada manipulada en la búsqueda de tickets",
    module: "Gestión de tickets", type: "Prueba manual", environment: "Entorno local de desarrollo",
    description: "En el buscador de tickets se introdujo una entrada manipulada con comillas y operadores SQL. La aplicación la trató como texto literal, devolvió cero resultados y no mostró errores. La revisión de código confirma el uso de consultas parametrizadas mediante el ORM.",
    context: "Prueba con cuenta de demostración de rol USUARIO sobre datos sintéticos.",
    scope: "Campo de búsqueda de tickets.",
    limitations: "No se probaron otros campos ni cargas de XSS. Conforme únicamente según las pruebas registradas.",
    registeredAt: "2026-10-07T11:25:00-05:00",
    studentCategory: "A05", controlResult: "conforme",
    justification: {
      why: "La prueba busca que una entrada se interprete como parte de una consulta SQL, lo que corresponde a inyección.",
      support: "La entrada con comillas tratada como texto literal y el uso de consultas parametrizadas.",
      alternatives: "A10 si la entrada hubiera producido un error mal gestionado; no ocurrió.",
      missing: "Ampliar la prueba a otros campos y a XSS almacenado en comentarios.",
    },
    review: { decision: "aprobada", finalCategory: "A05", controlResult: "conforme",
      comment: "Ampliar la cobertura a comentarios de tickets.",
      rationale: "Prueba y revisión de código consistentes entre sí. Resultado favorable limitado al campo probado.",
      at: "2026-10-08T12:10:00-05:00" },
  },
  {
    id: "EV-006", title: "Expiración de sesión por inactividad",
    module: "Autenticación y sesiones", type: "Prueba manual", environment: "Entorno local de desarrollo",
    description: "Tras iniciar sesión con una cuenta de demostración se dejó la sesión inactiva hasta superar el tiempo de expiración configurado. Al intentar abrir un ticket, la API respondió 401 y la interfaz exigió volver a autenticarse. El token anterior no permitió continuar.",
    context: "Navegador con una sola pestaña abierta; tiempo de expiración tomado de la configuración del entorno local.",
    scope: "Expiración del token de acceso.",
    limitations: "No se evaluó el token de actualización ni la invalidación al cerrar sesión.",
    registeredAt: "2026-10-09T09:40:00-05:00",
    studentCategory: "A07", controlResult: "conforme",
    justification: {
      why: "La expiración de la sesión y la exigencia de autenticarse de nuevo son controles de autenticación (A07).",
      support: "La respuesta 401 y la solicitud de volver a autenticarse.",
      alternatives: "A01 descartada: no se evaluaron permisos, sino la validez de la sesión.",
      missing: "Probar el token de actualización y el cierre de sesión.",
    },
    review: { decision: "aprobada", finalCategory: "A07", controlResult: "conforme",
      comment: "",
      rationale: "Evidencia y justificación coherentes con A07.",
      at: "2026-10-10T08:50:00-05:00" },
  },
  {
    id: "EV-007", title: "Registro de intentos fallidos de inicio de sesión",
    module: "Registro y auditoría", type: "Registro de eventos", environment: "Entorno local de desarrollo",
    description: "Se provocaron tres intentos fallidos de inicio de sesión con una cuenta de demostración. Cada intento quedó registrado en la bitácora de auditoría con fecha, cuenta y resultado. Se comprobó que el registro de eventos no incluye la contraseña introducida.",
    context: "Consulta de la bitácora desde el panel de auditoría con rol ADMIN de demostración.",
    scope: "Eventos de inicio de sesión fallido.",
    limitations: "No se verificó la existencia de alertas ni la retención de los registros.",
    registeredAt: "2026-10-10T14:00:00-05:00",
    studentCategory: "A09", controlResult: "conforme",
    justification: {
      why: "Se evalúa si los eventos de seguridad quedan registrados y sin datos sensibles, que corresponde a A09.",
      support: "Cada intento aparece en la bitácora con sus campos y sin la contraseña.",
      alternatives: "A07, porque el evento es de autenticación; pero el control evaluado es el registro.",
      missing: "Confirmar si existen alertas ante intentos repetidos.",
    },
    review: { decision: "aprobada", finalCategory: "A09", controlResult: "conforme",
      comment: "La parte de alertas queda pendiente para otra evidencia.",
      rationale: "La clasificación en A09 es correcta: el foco es el registro del evento, no el control de autenticación.",
      at: "2026-10-11T10:15:00-05:00" },
  },
  {
    id: "EV-008", title: "Tratamiento controlado de error al adjuntar un archivo",
    module: "Archivos adjuntos", type: "Prueba manual", environment: "Entorno local de desarrollo",
    description: "Se adjuntó a un ticket un archivo que supera el tamaño máximo permitido. La aplicación mostró un mensaje de error genérico («No se pudo adjuntar el archivo») sin detalles internos, sin traza de pila ni rutas del servidor, y el ticket quedó sin cambios.",
    context: "Cuenta de demostración con rol USUARIO; archivo de prueba sin contenido sensible.",
    scope: "Límite de tamaño de adjuntos.",
    limitations: "No se comprobó si el error queda registrado en el servidor.",
    registeredAt: "2026-10-14T10:30:00-05:00",
    studentCategory: "A10", controlResult: "conforme",
    justification: {
      why: "La prueba evalúa cómo responde la aplicación ante una condición excepcional y qué información expone.",
      support: "El mensaje genérico, la ausencia de detalles internos y que el ticket no quedó en un estado parcial.",
      alternatives: "A02 si los detalles se mostraran por un modo de depuración; A09 si el foco fuera el registro del error.",
      missing: "Comprobar el registro del error en el servidor.",
    },
    submittedAt: "2026-10-15T09:00:00-05:00",
  },
  {
    id: "EV-009", title: "Adjunto con doble extensión aceptado",
    module: "Archivos adjuntos", type: "Prueba manual", environment: "Entorno local de desarrollo",
    description: "Se intentó adjuntar a un ticket un archivo con doble extensión (un ejecutable renombrado como informe.pdf). El sistema aceptó el archivo comprobando solo la extensión declarada, sin validar el tipo de contenido. No se ejecutó el archivo ni se probó su descarga por otros usuarios.",
    context: "Escenario de demostración con un archivo inofensivo renombrado. Cuenta de rol USUARIO.",
    scope: "Validación del tipo de archivo en la carga de adjuntos.",
    limitations: "No se evaluó el almacenamiento ni la descarga del archivo.",
    registeredAt: "2026-10-15T16:20:00-05:00",
    studentCategory: "A05", decisionMode: "manual", controlResult: "observacion",
    justification: {
      why: "Elegí inyección porque el sistema acepta un archivo sin validar su contenido.",
      support: "El archivo con doble extensión fue aceptado.",
      alternatives: "A06.",
      missing: "",
    },
    submittedAt: "2026-10-16T08:30:00-05:00",
    review: { decision: "correcciones", finalCategory: "A06", controlResult: "observacion",
      comment: "La evidencia no muestra que el archivo se interprete como código o consulta. Revisa A06 (validación de tipos de archivo prevista en el diseño) y completa qué información adicional necesitarías.",
      rationale: "La justificación no explica por qué se descarta A06, que la regla local propone con mayor correspondencia.",
      at: "2026-10-17T11:45:00-05:00" },
  },
  {
    id: "EV-010", title: "Enlace al ticket en notificaciones",
    module: "Notificaciones", type: "Otro", environment: "Entorno de demostración académica",
    description: "Las notificaciones enviadas al cambiar el estado de un ticket incluyen un enlace directo al ticket y el título de la solicitud.",
    context: "",
    scope: "Contenido de las notificaciones.",
    limitations: "Evidencia incompleta: no indica qué control se evaluó.",
    registeredAt: "2026-10-18T12:00:00-05:00",
  },
];

/* Construye los registros completos a partir de la semilla. */
function buildDemoRecords() {
  const shift = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
  return DEMO_SEED.map((s) => {
    const rec = {
      id: s.id, demo: true, title: s.title, module: s.module, type: s.type, environment: s.environment,
      description: s.description, context: s.context, source: DEMO_SOURCE, scope: s.scope, limitations: s.limitations,
      registeredAt: new Date(s.registeredAt).toISOString(), registeredBy: DEMO_STUDENT, updatedAt: null,
      analysis: null, analysisStale: false, studentCategory: null, decisionMode: null, controlResult: null,
      justification: null, status: "borrador", finalCategory: null, reviewer: null, reviews: [], history: [],
    };
    const log = (at, actor, action, detail) => rec.history.push({ at, actor, action, detail });
    log(rec.registeredAt, DEMO_STUDENT, "Evidencia registrada", `Módulo: ${rec.module}.`);

    const analysisAt = shift(s.registeredAt, 15);
    rec.analysis = Classifier.analyze(rec, { at: analysisAt });
    log(analysisAt, DEMO_STUDENT, "Análisis por reglas locales",
      rec.analysis.conclusive ? `Candidata ${rec.analysis.candidate} · correspondencia ${rec.analysis.level}.` : "Clasificación no concluyente.");

    if (s.justification) {
      const jAt = shift(s.registeredAt, 50);
      rec.studentCategory = s.studentCategory;
      rec.decisionMode = s.decisionMode || (s.studentCategory === rec.analysis.candidate ? "propuesta" : "manual");
      rec.controlResult = s.controlResult;
      rec.justification = { ...s.justification, updatedAt: jAt };
      log(jAt, DEMO_STUDENT, "Justificación guardada", `Categoría elegida: ${rec.studentCategory} (${rec.decisionMode === "manual" ? "selección manual" : "acepta la propuesta"}).`);
      const sentAt = s.submittedAt ? new Date(s.submittedAt).toISOString() : shift(s.registeredAt, 60);
      rec.status = "en_revision";
      rec.submittedAt = sentAt;
      log(sentAt, DEMO_STUDENT, "Enviada a revisión", "");
    }

    if (s.review) {
      const at = new Date(s.review.at).toISOString();
      const r = { ...s.review, at, reviewer: DEMO_REVIEWER };
      rec.reviews.push(r);
      rec.reviewer = DEMO_REVIEWER;
      rec.controlResult = r.controlResult;
      if (r.decision === "aprobada") {
        rec.status = "validada";
        rec.finalCategory = r.finalCategory;
        log(at, DEMO_REVIEWER, "Clasificación aprobada", `Categoría final ${r.finalCategory}.`);
      } else {
        rec.status = "requiere_correcciones";
        log(at, DEMO_REVIEWER, "Correcciones solicitadas", r.comment);
      }
    }
    rec.updatedAt = rec.history[rec.history.length - 1].at;
    return rec;
  });
}

if (typeof module !== "undefined") module.exports = { buildDemoRecords, DEMO_SEED };
