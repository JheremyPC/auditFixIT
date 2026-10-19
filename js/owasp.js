"use strict";
/* FIXIT — Security Audit · Catálogo OWASP Top 10:2025 y referencias complementarias.
 *
 * Criterio de referencias:
 *  - Nombres y URL de OWASP Top 10:2025 tomados de https://top10.owasp.org/2025/es/.
 *  - ASVS 5.0.0: solo se citan CAPÍTULOS (V1–V17), verificados en el repositorio oficial
 *    (rama v5.0.0, carpeta 5.0/en). No se citan requisitos individuales porque su
 *    correspondencia no fue comprobada para este prototipo.
 *  - WSTG: identificadores y títulos verificados en la versión estable v4.2
 *    (https://wstg.owasp.org/v4.2/). La relación prueba ↔ categoría es un criterio
 *    orientativo del prototipo y debe contrastarla el auditor.
 */

const OWASP_BASE = "https://top10.owasp.org/2025/es/";
const WSTG_BASE = "https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/";
const ASVS_RELEASES = "https://github.com/OWASP/ASVS/releases";
const ASVS_TREE = "https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en/";

const ASVS_CHAPTERS = {
  V1: { title: "Encoding and Sanitization", es: "Codificación y saneamiento", file: "0x10-V1-Encoding-and-Sanitization.md" },
  V2: { title: "Validation and Business Logic", es: "Validación y lógica de negocio", file: "0x11-V2-Validation-and-Business-Logic.md" },
  V3: { title: "Web Frontend Security", es: "Seguridad del frontend web", file: "0x12-V3-Web-Frontend-Security.md" },
  V6: { title: "Authentication", es: "Autenticación", file: "0x15-V6-Authentication.md" },
  V7: { title: "Session Management", es: "Gestión de sesiones", file: "0x16-V7-Session-Management.md" },
  V8: { title: "Authorization", es: "Autorización", file: "0x17-V8-Authorization.md" },
  V9: { title: "Self-contained Tokens", es: "Tokens autocontenidos", file: "0x18-V9-Self-contained-Tokens.md" },
  V11: { title: "Cryptography", es: "Criptografía", file: "0x20-V11-Cryptography.md" },
  V12: { title: "Secure Communication", es: "Comunicación segura", file: "0x21-V12-Secure-Communication.md" },
  V13: { title: "Configuration", es: "Configuración", file: "0x22-V13-Configuration.md" },
  V14: { title: "Data Protection", es: "Protección de datos", file: "0x23-V14-Data-Protection.md" },
  V15: { title: "Secure Coding and Architecture", es: "Codificación y arquitectura seguras", file: "0x24-V15-Secure-Coding-and-Architecture.md" },
  V16: { title: "Security Logging and Error Handling", es: "Registro de seguridad y manejo de errores", file: "0x25-V16-Security-Logging-and-Error-Handling.md" },
};

/* id → [título oficial, ruta relativa a WSTG_BASE] */
const WSTG_TESTS = {
  "WSTG-IDNT-01": ["Test Role Definitions", "03-Identity_Management_Testing/01-Test_Role_Definitions"],
  "WSTG-ATHZ-01": ["Testing Directory Traversal File Include", "05-Authorization_Testing/01-Testing_Directory_Traversal_File_Include"],
  "WSTG-ATHZ-02": ["Testing for Bypassing Authorization Schema", "05-Authorization_Testing/02-Testing_for_Bypassing_Authorization_Schema"],
  "WSTG-ATHZ-03": ["Testing for Privilege Escalation", "05-Authorization_Testing/03-Testing_for_Privilege_Escalation"],
  "WSTG-ATHZ-04": ["Testing for Insecure Direct Object References", "05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References"],
  "WSTG-CONF-02": ["Test Application Platform Configuration", "02-Configuration_and_Deployment_Management_Testing/02-Test_Application_Platform_Configuration"],
  "WSTG-CONF-05": ["Enumerate Infrastructure and Application Admin Interfaces", "02-Configuration_and_Deployment_Management_Testing/05-Enumerate_Infrastructure_and_Application_Admin_Interfaces"],
  "WSTG-CONF-06": ["Test HTTP Methods", "02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods"],
  "WSTG-CONF-07": ["Test HTTP Strict Transport Security", "02-Configuration_and_Deployment_Management_Testing/07-Test_HTTP_Strict_Transport_Security"],
  "WSTG-CRYP-01": ["Testing for Weak Transport Layer Security", "09-Testing_for_Weak_Cryptography/01-Testing_for_Weak_Transport_Layer_Security"],
  "WSTG-CRYP-03": ["Testing for Sensitive Information Sent via Unencrypted Channels", "09-Testing_for_Weak_Cryptography/03-Testing_for_Sensitive_Information_Sent_via_Unencrypted_Channels"],
  "WSTG-CRYP-04": ["Testing for Weak Encryption", "09-Testing_for_Weak_Cryptography/04-Testing_for_Weak_Encryption"],
  "WSTG-ATHN-01": ["Testing for Credentials Transported over an Encrypted Channel", "04-Authentication_Testing/01-Testing_for_Credentials_Transported_over_an_Encrypted_Channel"],
  "WSTG-ATHN-03": ["Testing for Weak Lock Out Mechanism", "04-Authentication_Testing/03-Testing_for_Weak_Lock_Out_Mechanism"],
  "WSTG-ATHN-04": ["Testing for Bypassing Authentication Schema", "04-Authentication_Testing/04-Testing_for_Bypassing_Authentication_Schema"],
  "WSTG-ATHN-07": ["Testing for Weak Password Policy", "04-Authentication_Testing/07-Testing_for_Weak_Password_Policy"],
  "WSTG-SESS-02": ["Testing for Cookies Attributes", "06-Session_Management_Testing/02-Testing_for_Cookies_Attributes"],
  "WSTG-SESS-06": ["Testing for Logout Functionality", "06-Session_Management_Testing/06-Testing_for_Logout_Functionality"],
  "WSTG-SESS-07": ["Testing Session Timeout", "06-Session_Management_Testing/07-Testing_Session_Timeout"],
  "WSTG-INPV-01": ["Testing for Reflected Cross Site Scripting", "07-Input_Validation_Testing/01-Testing_for_Reflected_Cross_Site_Scripting"],
  "WSTG-INPV-02": ["Testing for Stored Cross Site Scripting", "07-Input_Validation_Testing/02-Testing_for_Stored_Cross_Site_Scripting"],
  "WSTG-INPV-05": ["Testing for SQL Injection", "07-Input_Validation_Testing/05-Testing_for_SQL_Injection"],
  "WSTG-INPV-12": ["Testing for Command Injection", "07-Input_Validation_Testing/12-Testing_for_Command_Injection"],
  "WSTG-BUSL-01": ["Test Business Logic Data Validation", "10-Business_Logic_Testing/01-Test_Business_Logic_Data_Validation"],
  "WSTG-BUSL-03": ["Test Integrity Checks", "10-Business_Logic_Testing/03-Test_Integrity_Checks"],
  "WSTG-BUSL-06": ["Testing for the Circumvention of Work Flows", "10-Business_Logic_Testing/06-Testing_for_the_Circumvention_of_Work_Flows"],
  "WSTG-BUSL-08": ["Test Upload of Unexpected File Types", "10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types"],
  "WSTG-ERRH-01": ["Testing for Improper Error Handling", "08-Testing_for_Error_Handling/01-Testing_For_Improper_Error_Handling"],
  "WSTG-ERRH-02": ["Testing for Stack Traces", "08-Testing_for_Error_Handling/02-Testing_for_Stack_Traces"],
};

const OWASP = [
  { id: "A01", code: "A01:2025", name: "Pérdida de Control de Acceso", path: "A01_2025-Broken_Access_Control/",
    summary: "Usuarios que actúan fuera de los permisos previstos: acceso a funciones o datos de otros, escalada de privilegios, referencias directas inseguras.",
    asvs: ["V8"], wstg: ["WSTG-IDNT-01", "WSTG-ATHZ-01", "WSTG-ATHZ-02", "WSTG-ATHZ-03", "WSTG-ATHZ-04"] },
  { id: "A02", code: "A02:2025", name: "Configuración de Seguridad Incorrecta", path: "A02_2025-Security_Misconfiguration/",
    summary: "Configuraciones por defecto, incompletas o permisivas; cabeceras de seguridad ausentes; funciones de depuración expuestas.",
    asvs: ["V13", "V3"], wstg: ["WSTG-CONF-02", "WSTG-CONF-05", "WSTG-CONF-06", "WSTG-CONF-07", "WSTG-SESS-02"] },
  { id: "A03", code: "A03:2025", name: "Fallas en la Cadena de Suministro de Software", path: "A03_2025-Software_Supply_Chain_Failures/",
    summary: "Riesgos en dependencias, componentes de terceros, herramientas de construcción y canalizaciones de despliegue.",
    asvs: ["V15"], wstg: [],
    noWstg: "No se identificó una prueba WSTG v4.2 con correspondencia precisa para la revisión de dependencias." },
  { id: "A04", code: "A04:2025", name: "Fallas Criptográficas", path: "A04_2025-Cryptographic_Failures/",
    summary: "Protección criptográfica ausente o débil de datos en tránsito o en reposo, incluido el almacenamiento de contraseñas.",
    asvs: ["V11", "V12", "V14"], wstg: ["WSTG-CRYP-01", "WSTG-CRYP-03", "WSTG-CRYP-04", "WSTG-ATHN-01"] },
  { id: "A05", code: "A05:2025", name: "Inyección", path: "A05_2025-Injection/",
    summary: "Datos no confiables interpretados como parte de una consulta o comando: SQL, NoSQL, comandos del sistema, XSS.",
    asvs: ["V1", "V2"], wstg: ["WSTG-INPV-01", "WSTG-INPV-02", "WSTG-INPV-05", "WSTG-INPV-12"] },
  { id: "A06", code: "A06:2025", name: "Diseño Inseguro", path: "A06_2025-Insecure_Design/",
    summary: "Controles ausentes o ineficaces desde el diseño: flujos de negocio que se pueden eludir, falta de modelado de amenazas.",
    asvs: ["V2", "V15"], wstg: ["WSTG-BUSL-01", "WSTG-BUSL-06", "WSTG-BUSL-08"] },
  { id: "A07", code: "A07:2025", name: "Fallas de Autenticación", path: "A07_2025-Authentication_Failures/",
    summary: "Debilidades al confirmar la identidad del usuario y gestionar su sesión: fuerza bruta, contraseñas débiles, sesiones sin expiración.",
    asvs: ["V6", "V7"], wstg: ["WSTG-ATHN-03", "WSTG-ATHN-04", "WSTG-ATHN-07", "WSTG-SESS-06", "WSTG-SESS-07"] },
  { id: "A08", code: "A08:2025", name: "Fallas en la Integridad del Software o de los Datos", path: "A08_2025-Software_or_Data_Integrity_Failures/",
    summary: "Código o datos aceptados sin verificar su integridad: actualizaciones sin firma, deserialización insegura, datos alterados en tránsito.",
    asvs: ["V15", "V9"], wstg: ["WSTG-BUSL-03"],
    asvsNote: "Correspondencia ASVS solo a nivel de capítulo; no se determinó un requisito específico." },
  { id: "A09", code: "A09:2025", name: "Fallas en el Registro, Alerta y Monitoreo de Seguridad", path: "A09_2025-Security_Logging_and_Alerting_Failures/",
    summary: "Eventos de seguridad que no se registran, no se protegen o no generan alertas que permitan detectar y responder.",
    asvs: ["V16"], wstg: [],
    noWstg: "WSTG v4.2 no incluye una prueba específica de registro y alertas; se recomienda revisión de configuración y código." },
  { id: "A10", code: "A10:2025", name: "Manejo Inadecuado de Condiciones Excepcionales", path: "A10_2025-Mishandling_of_Exceptional_Conditions/",
    summary: "Errores y situaciones anómalas que se gestionan mal: fallos abiertos, mensajes con detalles internos, estados inconsistentes.",
    asvs: ["V16"], wstg: ["WSTG-ERRH-01", "WSTG-ERRH-02"] },
];

const OWASP_BY_ID = Object.fromEntries(OWASP.map((c) => [c.id, c]));

const References = {
  owaspUrl: (id) => OWASP_BASE + (OWASP_BY_ID[id]?.path || ""),
  wstgUrl: (testId) => WSTG_BASE + (WSTG_TESTS[testId]?.[1] || ""),
  asvsUrl: (ch) => ASVS_TREE + (ASVS_CHAPTERS[ch]?.file || ""),
  forCategory(id) {
    const c = OWASP_BY_ID[id];
    if (!c) return null;
    return {
      owasp: { code: c.code, name: c.name, url: References.owaspUrl(id) },
      asvs: c.asvs.map((ch) => ({ id: ch, title: ASVS_CHAPTERS[ch].title, es: ASVS_CHAPTERS[ch].es, url: References.asvsUrl(ch) })),
      asvsNote: c.asvsNote || "Referencia a nivel de capítulo ASVS 5.0.0; no se asignan requisitos individuales.",
      wstg: c.wstg.map((t) => ({ id: t, title: WSTG_TESTS[t][0], url: References.wstgUrl(t) })),
      noWstg: c.noWstg || "",
    };
  },
  frameworks: [
    { key: "owasp", name: "OWASP Top 10:2025", role: "Referencia primaria", url: OWASP_BASE,
      text: "Clasificación de riesgos. Las diez categorías del prototipo corresponden exactamente a esta edición, en su versión en español." },
    { key: "asvs", name: "OWASP ASVS 5.0.0", role: "Referencia complementaria", url: ASVS_RELEASES,
      text: "Estándar de verificación de seguridad de aplicaciones. Sirve para contrastar qué controles deberían existir. El prototipo lo cita a nivel de capítulo." },
    { key: "wstg", name: "OWASP Web Security Testing Guide", role: "Guía metodológica", url: "https://owasp.org/www-project-web-security-testing-guide/",
      text: "Ayuda a seleccionar y entender pruebas de seguridad web. Los identificadores citados provienen de la versión estable v4.2." },
  ],
};

if (typeof module !== "undefined") module.exports = { OWASP, OWASP_BY_ID, References, WSTG_TESTS, ASVS_CHAPTERS };
