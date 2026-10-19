"use strict";
/* FIXIT — Security Audit · Reglas locales de clasificación (versión editable).
 *
 * Cada regla vincula una categoría OWASP Top 10:2025 con:
 *  - terms: expresiones que se buscan en el texto normalizado (sin tildes, en minúsculas).
 *      "*" al final = cualquier terminación (p. ej. "autoriz*" → autorización, autorizado…).
 *      weight 3 = término específico de la categoría · 2 = moderado · 1 = de apoyo.
 *  - criterion: por qué esos términos apuntan a la categoría.
 *  - supports: señales que reforzarían la clasificación.
 *  - ambiguity: señales que podrían llevar a otra categoría.
 *  - alternatives: categorías relacionadas y el motivo de la relación.
 *  - missing: información de contexto que conviene aportar para confirmar.
 *
 * Las reglas son deliberadamente sencillas y pueden equivocarse. Su salida es una
 * hipótesis para contraste humano, no un diagnóstico.
 */

const RULES_VERSION = "2026.10-demo";

const RULES = [
  {
    category: "A01",
    criterion: "La evidencia trata sobre qué puede hacer un usuario ya identificado: permisos, roles, separación de privilegios o acceso a recursos ajenos.",
    terms: [
      { t: "control de acceso", w: 3 }, { t: "control* de acceso", w: 3 }, { t: "autorizacion", w: 3 }, { t: "no autorizad*", w: 2 },
      { t: "escalada de privilegios", w: 3 }, { t: "escalamiento de privilegios", w: 3 }, { t: "elevacion de privilegios", w: 3 },
      { t: "separacion de privilegios", w: 3 }, { t: "menor privilegio", w: 3 }, { t: "privilegio*", w: 2 },
      { t: "idor", w: 3 }, { t: "referencia directa insegura", w: 3 }, { t: "recurso* de otro usuario", w: 3 }, { t: "ticket* de otro usuario", w: 3 },
      { t: "permiso*", w: 2 }, { t: "rol", w: 2 }, { t: "roles", w: 2 }, { t: "operacion administrativa", w: 2 },
      { t: "exclusiva de administracion", w: 2 }, { t: "solo administrador*", w: 2 }, { t: "403", w: 2 }, { t: "forbidden", w: 2 },
      { t: "acceso denegado", w: 2 }, { t: "denegar por defecto", w: 3 }, { t: "path traversal", w: 3 }, { t: "recorrido de directorios", w: 3 },
    ],
    supports: [
      "Pruebas con distintos roles de FIXIT (ADMIN, JEFE_TI, TECNICO, USUARIO) sobre la misma operación.",
      "Respuesta de denegación (HTTP 403) o acceso indebido ante una operación no permitida.",
      "Acceso a tickets o adjuntos de otro usuario modificando identificadores.",
    ],
    ambiguity: [
      "Una respuesta 401 o la ausencia de sesión válida apuntan a autenticación (A07), no a autorización.",
      "Si la restricción nunca se previó en el diseño del flujo, considerar A06.",
      "Si el acceso depende de una configuración del servidor o de CORS, considerar A02.",
    ],
    alternatives: [
      { cat: "A07", why: "Si el fallo está en verificar la identidad del usuario y no en sus permisos." },
      { cat: "A06", why: "Si el control de permisos no fue contemplado en el diseño del flujo de negocio." },
      { cat: "A02", why: "Si la restricción depende de la configuración del servidor o del despliegue." },
    ],
    missing: [
      "¿La comprobación de permisos se realiza en el servidor o solo se oculta en la interfaz?",
      "¿Se probaron todos los roles y operaciones equivalentes, no solo un caso?",
      "¿Se intentó acceder a recursos de otro usuario modificando identificadores (IDOR)?",
    ],
  },
  {
    category: "A02",
    criterion: "La evidencia describe cómo está configurada la aplicación o su plataforma: cabeceras, modos de depuración, valores por defecto, CORS o atributos de cookies.",
    terms: [
      { t: "cabecera* de seguridad", w: 3 }, { t: "encabezado* de seguridad", w: 3 }, { t: "content security policy", w: 3 }, { t: "csp", w: 3 },
      { t: "strict transport security", w: 3 }, { t: "hsts", w: 3 }, { t: "x frame options", w: 3 }, { t: "x content type options", w: 3 },
      { t: "referrer policy", w: 2 }, { t: "configuracion insegura", w: 3 }, { t: "configuracion de seguridad", w: 3 }, { t: "configuracion por defecto", w: 3 },
      { t: "valores por defecto", w: 2 }, { t: "modo debug", w: 3 }, { t: "modo de depuracion", w: 3 }, { t: "debug", w: 2 },
      { t: "listado de directorios", w: 3 }, { t: "cors", w: 2 }, { t: "hardening", w: 3 }, { t: "endurecimiento", w: 3 },
      { t: "servicios innecesarios", w: 2 }, { t: "metodos http", w: 2 }, { t: "httponly", w: 2 }, { t: "samesite", w: 2 },
      { t: "cabecera*", w: 1 }, { t: "configuracion", w: 1 }, { t: "variables de entorno", w: 1 },
    ],
    supports: [
      "Lista de cabeceras HTTP observadas y sus valores en un entorno concreto.",
      "Revisión de archivos de configuración del despliegue (sin incluir secretos).",
      "Comparación entre la configuración esperada y la observada.",
    ],
    ambiguity: [
      "Si el hallazgo se refiere a TLS o a algoritmos de cifrado, considerar A04.",
      "Si el problema es un mensaje de error con detalles internos, considerar A10.",
      "Si trata de versiones de componentes, considerar A03.",
    ],
    alternatives: [
      { cat: "A04", why: "Si la configuración afecta al cifrado del canal (TLS) o al almacenamiento de datos." },
      { cat: "A10", why: "Si la configuración provoca mensajes de error con información interna." },
      { cat: "A03", why: "Si se trata de componentes o imágenes base desactualizadas." },
    ],
    missing: [
      "¿En qué entorno se observó la configuración (local, pruebas, producción)?",
      "¿La configuración es la misma en todos los despliegues?",
      "Valores exactos de las cabeceras o parámetros revisados.",
    ],
  },
  {
    category: "A03",
    criterion: "La evidencia trata sobre componentes de terceros, dependencias, versiones fijadas o la canalización que construye y despliega el software.",
    terms: [
      { t: "cadena de suministro", w: 3 }, { t: "dependencia*", w: 3 }, { t: "archivo de bloqueo", w: 3 }, { t: "lockfile", w: 3 }, { t: "lock file", w: 3 },
      { t: "package lock", w: 3 }, { t: "poetry lock", w: 3 }, { t: "requirements txt", w: 3 }, { t: "sbom", w: 3 },
      { t: "lista de materiales de software", w: 3 }, { t: "componente* de terceros", w: 3 }, { t: "fijacion de versiones", w: 3 },
      { t: "versiones fijadas", w: 3 }, { t: "pip audit", w: 3 }, { t: "npm audit", w: 3 }, { t: "dependabot", w: 3 },
      { t: "biblioteca*", w: 2 }, { t: "libreria*", w: 2 }, { t: "paquete*", w: 2 }, { t: "desactualizad*", w: 2 }, { t: "cve", w: 2 },
      { t: "imagen base", w: 2 }, { t: "version*", w: 1 }, { t: "integracion continua", w: 1 }, { t: "pipeline", w: 1 },
    ],
    supports: [
      "Inventario de dependencias directas y transitivas con sus versiones.",
      "Uso de un archivo de bloqueo o de versiones fijadas.",
      "Resultado de una herramienta de análisis de dependencias, con fecha y alcance.",
    ],
    ambiguity: [
      "Si el foco es verificar firmas o la integridad de artefactos, considerar A08.",
      "Si se trata solo de configuración del despliegue, considerar A02.",
    ],
    alternatives: [
      { cat: "A08", why: "Si el riesgo principal es aceptar artefactos o actualizaciones sin verificar su integridad." },
      { cat: "A02", why: "Si el problema está en la configuración del entorno más que en los componentes." },
    ],
    missing: [
      "Fecha y herramienta utilizadas en la revisión de dependencias.",
      "¿Se revisaron también las dependencias transitivas, la imagen Docker y el frontend?",
      "¿Cómo se verifica el origen de los paquetes instalados?",
    ],
  },
  {
    category: "A04",
    criterion: "La evidencia trata sobre la protección criptográfica de datos: cifrado del canal, algoritmos, gestión de claves o almacenamiento de contraseñas.",
    terms: [
      { t: "criptografi*", w: 3 }, { t: "cifrado", w: 3 }, { t: "cifrad*", w: 2 }, { t: "encriptad*", w: 2 }, { t: "tls", w: 3 }, { t: "https", w: 2 },
      { t: "ssl", w: 2 }, { t: "certificado*", w: 2 }, { t: "bcrypt", w: 3 }, { t: "argon2", w: 3 }, { t: "pbkdf2", w: 3 }, { t: "scrypt", w: 3 },
      { t: "hash", w: 2 }, { t: "hashes", w: 2 }, { t: "salt", w: 2 }, { t: "texto plano", w: 3 }, { t: "en claro", w: 2 }, { t: "md5", w: 3 },
      { t: "sha1", w: 3 }, { t: "gestion de claves", w: 3 }, { t: "algoritmo* debil*", w: 3 }, { t: "almacenamiento de contrasenas", w: 3 },
      { t: "canal protegido", w: 3 }, { t: "canal cifrado", w: 3 }, { t: "datos sensibles", w: 1 }, { t: "contrasena*", w: 1 },
    ],
    supports: [
      "Algoritmo de almacenamiento de contraseñas identificado en el código.",
      "Comprobación del uso de HTTPS/TLS en el entorno evaluado.",
      "Ubicación y protección de claves criptográficas (sin revelarlas).",
    ],
    ambiguity: [
      "Si el problema es la configuración del servidor TLS, también encaja en A02.",
      "Si la evidencia se centra en el proceso de inicio de sesión, considerar A07.",
    ],
    alternatives: [
      { cat: "A02", why: "Si la debilidad está en la configuración del servidor más que en el algoritmo." },
      { cat: "A07", why: "Si el foco es el proceso de autenticación y no la protección criptográfica." },
      { cat: "A08", why: "Si se usa criptografía para verificar integridad (firmas) y esa verificación falla." },
    ],
    missing: [
      "Algoritmo y parámetros usados (p. ej., factor de coste), según el código revisado.",
      "¿HTTPS se aplica en todos los entornos y redirecciones?",
      "¿Dónde se gestionan las claves y secretos, y quién tiene acceso?",
    ],
  },
  {
    category: "A05",
    criterion: "La evidencia trata sobre datos de entrada que podrían interpretarse como código o consulta: SQL, comandos, scripts o plantillas.",
    terms: [
      { t: "inyeccion", w: 3 }, { t: "inyeccion sql", w: 3 }, { t: "sql injection", w: 3 }, { t: "sqli", w: 3 }, { t: "inyect*", w: 2 },
      { t: "xss", w: 3 }, { t: "cross site scripting", w: 3 }, { t: "consulta* parametrizad*", w: 3 }, { t: "sentencia* preparad*", w: 3 },
      { t: "entrada manipulad*", w: 3 }, { t: "carga maliciosa", w: 3 }, { t: "payload", w: 2 }, { t: "validacion de entrada*", w: 2 },
      { t: "sanitiz*", w: 2 }, { t: "saneamiento", w: 2 }, { t: "codificacion de salida", w: 3 }, { t: "escapad*", w: 2 },
      { t: "comando* del sistema", w: 3 }, { t: "command injection", w: 3 }, { t: "nosql", w: 2 }, { t: "ldap", w: 2 },
      { t: "etiqueta script", w: 2 }, { t: "orm", w: 1 }, { t: "comilla*", w: 1 }, { t: "sql", w: 1 },
    ],
    supports: [
      "Campos o parámetros concretos en los que se probó una entrada manipulada.",
      "Respuesta de la aplicación ante la entrada (rechazo, error, ejecución).",
      "Revisión del código de acceso a datos (consultas parametrizadas u ORM).",
    ],
    ambiguity: [
      "Si la entrada provoca un error mal gestionado sin llegar a interpretarse, considerar A10.",
      "Si el problema es que el flujo de negocio acepta datos ilógicos, considerar A06.",
    ],
    alternatives: [
      { cat: "A10", why: "Si la entrada solo provoca un error no controlado, sin interpretarse como código." },
      { cat: "A06", why: "Si la falta de validación es un problema de reglas de negocio más que de interpretación." },
    ],
    missing: [
      "Campos y parámetros concretos probados.",
      "Tipos de carga probados (SQL, XSS, comandos) y respuesta obtenida.",
      "¿Se revisó el código además de la prueba manual?",
    ],
  },
  {
    category: "A06",
    criterion: "La evidencia trata sobre la lógica o el diseño de un flujo: reglas de negocio que se pueden eludir, límites de uso o confianza indebida en el cliente.",
    terms: [
      { t: "diseno inseguro", w: 3 }, { t: "modelado de amenazas", w: 3 }, { t: "modelo de amenazas", w: 3 }, { t: "logica de negocio", w: 3 },
      { t: "regla* de negocio", w: 3 }, { t: "caso* de abuso", w: 3 }, { t: "limite de uso", w: 3 }, { t: "limite* de frecuencia", w: 3 },
      { t: "rate limit*", w: 3 }, { t: "eludir el flujo", w: 3 }, { t: "omitir paso*", w: 3 }, { t: "transicion* de estado*", w: 2 },
      { t: "flujo de trabajo", w: 2 }, { t: "requisito* de seguridad", w: 2 }, { t: "solo en el frontend", w: 2 }, { t: "lado del cliente", w: 2 },
      { t: "doble extension", w: 3 }, { t: "tipo de contenido", w: 2 }, { t: "extension*", w: 1 }, { t: "tipo de archivo", w: 2 }, { t: "abuso", w: 2 }, { t: "flujo*", w: 1 },
    ],
    supports: [
      "Descripción del flujo esperado y del paso que se pudo omitir o abusar.",
      "Ausencia de un control que debería estar previsto en el diseño.",
    ],
    ambiguity: [
      "Si el control existe pero está mal implementado, puede corresponder a la categoría del control concreto (A01, A05, A07).",
    ],
    alternatives: [
      { cat: "A01", why: "Si el flujo omitido es en realidad una comprobación de permisos." },
      { cat: "A05", why: "Si la entrada aceptada llega a interpretarse como código o consulta." },
      { cat: "A07", why: "Si el flujo afectado es el de autenticación o recuperación de cuenta." },
    ],
    missing: [
      "¿Existe documentación del flujo esperado o un modelo de amenazas?",
      "¿El control falla por implementación o porque no fue previsto en el diseño?",
    ],
  },
  {
    category: "A07",
    criterion: "La evidencia trata sobre cómo se confirma la identidad del usuario y se gestiona su sesión: inicio de sesión, credenciales, expiración o cierre de sesión.",
    terms: [
      { t: "autenticacion", w: 3 }, { t: "autentic*", w: 2 }, { t: "reautentic*", w: 3 }, { t: "volver a autenticarse", w: 3 },
      { t: "inicio de sesion", w: 2 }, { t: "iniciar sesion", w: 2 }, { t: "login", w: 2 }, { t: "credencial*", w: 2 },
      { t: "expiracion de la sesion", w: 3 }, { t: "expiracion de sesion", w: 3 }, { t: "sesion expir*", w: 3 }, { t: "expiracion del token", w: 3 }, { t: "token expirad*", w: 3 },
      { t: "tiempo de expiracion", w: 3 }, { t: "tiempo de inactividad", w: 2 }, { t: "cierre de sesion", w: 2 }, { t: "logout", w: 2 }, { t: "fijacion de sesion", w: 3 },
      { t: "fuerza bruta", w: 3 }, { t: "bloqueo de cuenta", w: 3 }, { t: "politica de contrasenas", w: 3 }, { t: "contrasena* debil*", w: 3 },
      { t: "doble factor", w: 3 }, { t: "segundo factor", w: 3 }, { t: "mfa", w: 3 }, { t: "recuperacion de contrasena", w: 3 },
      { t: "restablecimiento de contrasena", w: 3 }, { t: "enumeracion de usuarios", w: 3 }, { t: "relleno de credenciales", w: 3 },
      { t: "jwt", w: 2 }, { t: "token de acceso", w: 2 }, { t: "token de actualizacion", w: 2 }, { t: "refresh token", w: 2 },
      { t: "intentos fallidos", w: 2 }, { t: "401", w: 2 }, { t: "unauthorized", w: 2 }, { t: "sesion", w: 1 },
    ],
    supports: [
      "Pasos de la prueba de inicio de sesión, expiración o cierre de sesión.",
      "Tiempo de expiración configurado frente al observado.",
      "Comportamiento ante credenciales incorrectas repetidas.",
    ],
    ambiguity: [
      "Si el usuario está correctamente identificado pero accede a algo que no le corresponde, es A01.",
      "Si la evidencia trata de cómo se registran los intentos fallidos, considerar A09.",
      "Si trata del algoritmo de almacenamiento de contraseñas, considerar A04.",
    ],
    alternatives: [
      { cat: "A01", why: "Si el problema son los permisos de un usuario ya autenticado." },
      { cat: "A09", why: "Si el foco es el registro o la alerta de los eventos de autenticación." },
      { cat: "A04", why: "Si el foco es la protección criptográfica de las credenciales." },
    ],
    missing: [
      "Tiempo de expiración configurado y tiempo medido en la prueba.",
      "¿El token o la sesión se invalidan en el servidor al cerrar sesión?",
      "¿Se probó también el token de actualización, si existe?",
    ],
  },
  {
    category: "A08",
    criterion: "La evidencia trata sobre la verificación de integridad de código o datos: firmas, sumas de verificación, deserialización o datos alterados.",
    terms: [
      { t: "integridad", w: 3 }, { t: "firma digital", w: 3 }, { t: "verificacion de firma", w: 3 }, { t: "firmad*", w: 2 },
      { t: "deserializ*", w: 3 }, { t: "serializacion insegura", w: 3 }, { t: "suma de verificacion", w: 3 }, { t: "checksum", w: 3 },
      { t: "subresource integrity", w: 3 }, { t: "sri", w: 2 }, { t: "actualizacion* automatica*", w: 2 }, { t: "datos alterados", w: 3 },
      { t: "manipulacion de datos", w: 3 }, { t: "alterad*", w: 2 }, { t: "origen no confiable", w: 2 }, { t: "fuente no confiable", w: 2 },
      { t: "artefacto*", w: 2 }, { t: "webhook*", w: 2 }, { t: "cdn", w: 1 },
    ],
    supports: [
      "Mecanismo de verificación (firma, suma de verificación) identificado y probado.",
      "Prueba con datos o artefactos alterados y respuesta del sistema.",
    ],
    ambiguity: [
      "Si el foco es el origen de las dependencias, considerar A03.",
      "Si la alteración consiste en inyectar código interpretado, considerar A05.",
    ],
    alternatives: [
      { cat: "A03", why: "Si el riesgo procede de componentes o de la canalización de construcción." },
      { cat: "A04", why: "Si el problema es el algoritmo criptográfico de la firma." },
      { cat: "A05", why: "Si los datos alterados se interpretan como código o consulta." },
    ],
    missing: [
      "¿Qué datos o artefactos se verifican y con qué mecanismo?",
      "¿Qué ocurre cuando la verificación falla?",
    ],
  },
  {
    category: "A09",
    criterion: "La evidencia trata sobre el registro, la protección y la alerta de eventos de seguridad que permiten detectar y responder.",
    terms: [
      { t: "registro de eventos", w: 3 }, { t: "registro* de auditoria", w: 3 }, { t: "registro* de seguridad", w: 3 }, { t: "evento* de seguridad", w: 3 },
      { t: "bitacora*", w: 3 }, { t: "log", w: 2 }, { t: "logs", w: 2 }, { t: "logging", w: 3 }, { t: "alerta*", w: 2 }, { t: "monitoreo", w: 3 },
      { t: "monitorizacion", w: 3 }, { t: "siem", w: 3 }, { t: "trazabilidad", w: 2 }, { t: "auditoria", w: 1 },
      { t: "se registr*", w: 2 }, { t: "queda* registrad*", w: 2 }, { t: "retencion de registros", w: 3 },
    ],
    supports: [
      "Campos que se registran en cada evento (fecha, usuario, acción, resultado).",
      "Ausencia de datos sensibles en los registros.",
      "Existencia de alertas y responsables de su atención.",
    ],
    ambiguity: [
      "Si la evidencia se centra en el control de autenticación y solo menciona el registro de paso, considerar A07.",
      "Si trata del mensaje que ve el usuario al producirse un error, considerar A10.",
    ],
    alternatives: [
      { cat: "A07", why: "Si el evento registrado es un intento de autenticación y el foco es ese control." },
      { cat: "A10", why: "Si el foco es el tratamiento del error y no su registro." },
    ],
    missing: [
      "Campos registrados en cada evento y ejemplo anonimizado.",
      "¿Existen alertas configuradas y quién las recibe?",
      "Retención y protección de los registros frente a modificación.",
    ],
  },
  {
    category: "A10",
    criterion: "La evidencia trata sobre cómo la aplicación responde ante errores, excepciones y situaciones anómalas, y qué información expone al hacerlo.",
    terms: [
      { t: "condicion* excepcional*", w: 3 }, { t: "excepcion*", w: 3 }, { t: "manejo de errores", w: 3 }, { t: "gestion de errores", w: 3 },
      { t: "tratamiento controlado de* error*", w: 3 }, { t: "tratamiento de* error*", w: 3 }, { t: "error controlado", w: 3 }, { t: "mensaje* de error", w: 3 }, { t: "detalles internos", w: 3 },
      { t: "stack trace", w: 3 }, { t: "traza de pila", w: 3 }, { t: "error interno", w: 2 }, { t: "rutas internas", w: 2 }, { t: "informacion interna", w: 2 }, { t: "detalle* tecnico*", w: 2 }, { t: "500", w: 2 }, { t: "mensaje* generico*", w: 2 },
      { t: "fallo controlado", w: 3 }, { t: "falla segura", w: 3 }, { t: "fail open", w: 3 }, { t: "fail closed", w: 3 },
      { t: "estado inconsistente", w: 2 }, { t: "valor nulo", w: 2 }, { t: "timeout", w: 1 }, { t: "tiempo de espera", w: 1 }, { t: "error*", w: 1 },
    ],
    supports: [
      "Acción que provocó el error y respuesta mostrada al usuario.",
      "Ausencia de trazas, rutas o versiones internas en la respuesta.",
      "Estado de la operación tras el error (sin cambios parciales).",
    ],
    ambiguity: [
      "Si los detalles internos aparecen por un modo de depuración activo, también encaja en A02.",
      "Si el foco es si el error queda registrado, considerar A09.",
    ],
    alternatives: [
      { cat: "A02", why: "Si la exposición de detalles se debe a la configuración (modo de depuración)." },
      { cat: "A09", why: "Si la evidencia trata sobre el registro del error y no sobre su tratamiento." },
      { cat: "A05", why: "Si el error lo provoca una entrada que llega a interpretarse." },
    ],
    missing: [
      "Acción exacta que provocó la condición excepcional.",
      "¿El error queda registrado en el servidor sin datos sensibles?",
      "¿La operación quedó en un estado consistente tras el error?",
    ],
  },
];

/* Indicadores contextuales por módulo de FIXIT: aportan poco peso y siempre se muestran como tales. */
const MODULE_HINTS = {
  "Autenticación y sesiones": "A07",
  "Roles y permisos": "A01",
  "Configuración y despliegue": "A02",
  "Dependencias y componentes": "A03",
  "Registro y auditoría": "A09",
};

/* Orientación del resultado observado. No decide el resultado del control: solo señala
 * expresiones que sugieren que el control funcionó o que falló. Las favorables se evalúan
 * primero para que "no revela" no cuente como "revela". */
const OUTCOME_SIGNALS = {
  favorable: [
    "rechaz*", "deneg*", "bloquead*", "se bloque*", "impid*", "403", "forbidden", "no permit*", "no se permit*", "sin exponer", "no expon*", "no revel*", "no muestra*",
    "no se mostr*", "no mostro*", "nunca en texto plano", "sin traza* de pila", "sin stack trace", "no se ejecut*", "no incluy*", "sin almacenar", "no se almacen*", "correctamente", "segun lo esperado", "como se esperaba",
    "esperad*", "se exige", "exigio", "sin detalles internos", "parametrizad*", "invalida*", "presente*",
  ],
  unfavorable: [
    "se pudo acceder", "permitio acceder", "logro acceder", "acceso indebido", "expone", "expuso", "revela", "revelo", "filtr*",
    "sin validar", "texto plano", "en claro", "stack trace", "traza de pila", "no se registr*", "es vulnerable", "resulto vulnerable", "vulnerabilidad confirmad*", "bypass", "eludi*",
    "se ejecut*", "acepto", "fue aceptad*", "ausente*", "no expira", "no se invalid*",
  ],
};

if (typeof module !== "undefined") module.exports = { RULES, RULES_VERSION, MODULE_HINTS, OUTCOME_SIGNALS };
