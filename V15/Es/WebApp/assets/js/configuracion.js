/* ==========================================================
                    CONFIGURACIÓN.JS COMPLETO
       Incluye TODA la lógica del dashboard.js + tabs internas
       + MODAL WIZARD DE CONFIGURACIÓN
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  
  /* -----------------------------------------
  ELEMENTOS DEL DOM
  ----------------------------------------- */
  const loader    = document.getElementById("loader");
  const statusDot = document.getElementById("status");
  const logout    = document.getElementById("logout");
  const sidebar   = document.getElementById("sidebar");
  const menuBtn   = document.getElementById("menuBtn");
  const overlay   = document.getElementById("overlay");
  
  loader.classList.remove("hidden");
  /* -----------------------------------------
      VALIDAR SESIÓN
  ----------------------------------------- */
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  /* -----------------------------------------
      FUNCIÓN RESPONSIVE
  ----------------------------------------- */
  function isMobile() {
    return window.innerWidth <= 750;
  }

  /* -----------------------------------------
      NAVIGATION 
  ----------------------------------------- */
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    const url = link.getAttribute("href");
    if (!url || url === "#") return;

    link.addEventListener("click", e => {
      document.getElementById("loader").classList.remove("hidden");
      e.preventDefault();

      if (isMobile()) {
        sidebar.classList.remove("show");
        overlay.classList.remove("show");
      }

      setTimeout(() => window.location.href = url, 200);
    });
  });

  /* -----------------------------------------
      MENÚ HAMBURGUESA
  ----------------------------------------- */
  menuBtn.addEventListener("click", () => {
    if (isMobile()) {
      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
  });

  /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

  /* -----------------------------------------
      INDICADOR DE CONEXIÓN
  ----------------------------------------- */
  async function verificarConexion() {
    if (!statusDot) return;

    try {
      await fetch("/ping");
      statusDot.classList.replace("offline", "online");
    } catch {
      statusDot.classList.replace("online", "offline");
    }
  }

  setInterval(verificarConexion, 3000);
  verificarConexion();

  /* -----------------------------------------
      SSE (si aplica)
  ----------------------------------------- */
  let evt;
  try {
    evt = new EventSource("/events");

    evt.addEventListener("nuevaVenta", () => {
      console.log("Evento recibido: nuevaVenta");
    });

    evt.addEventListener("nfcTagAdded", e => {
      const uid = e.data;
      nfcStatusText.textContent = `Etiqueta detectada: ${uid}`;
      showToast("Tag agregado: " + uid, "success");
      cargarTagsNFC();
    });

  } catch (err) {
    console.warn("SSE no disponible.");
  }

  /* -----------------------------------------
      TABS INTERNAS (CONFIGURACIÓN)
  ----------------------------------------- */
  const tabButtons  = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", async () => {

      loader.classList.remove("hidden");

      const newTab = btn.dataset.tab;
      const oldTab = document.querySelector(".tab-content.active")?.id.replace("tab-", "");

      // 1️⃣ Si el usuario sale de CALIBRACIÓN → enviar exit al ESP
      if (oldTab === "calibracion" && newTab !== "calibracion") {
        console.log("Saliendo de calibración → /calibration/exit");
        try {
          await fetch("/calibration/exit");
        } catch (e) {
          console.warn("No se pudo notificar salida de calibración", e);
        }
      }

      // 2️⃣ Cambio normal de pestañas
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`tab-${newTab}`).classList.add("active");

      setTimeout(() => loader.classList.add("hidden"), 150);
    });
  });

});



/* ==========================================================
      WIZARD DE CONFIGURACION (MODAL)
========================================================== */


const wizardModal = document.getElementById("configWizardModal");
const wizardProgressBar = document.getElementById("wizardProgressBar");
const wizardStepContent = document.getElementById("wizardStepContent");
const wizardPrevBtn = document.getElementById("wizardPrevBtn");
const wizardNextBtn = document.getElementById("wizardNextBtn");

let wizardStep = 0;

let wizardData = {
  tipoMaquina: "",
  cantidadProductos: 0,
  billetero: false,
  nayax: false,
  audio: false,
  nfc: false
};

const wizardSteps = [
  // PASO 1 - Tipo de máquina
 // PASO 1 - Tipo de máquina
() => `
  <h2>Tipo de máquina</h2>
  <p>Selecciona una opción:</p>

  <select id="tipoMaquinaSelect" class="wizard-select">
    <option value="" disabled ${wizardData.tipoMaquina === "" ? "selected" : ""}>
      Seleccione...
    </option>
    <option value="Productos de limpieza" ${wizardData.tipoMaquina === "Productos de limpieza" ? "selected":""}>Productos de limpieza</option>
    <option value="Purificadora (solo agua)" ${wizardData.tipoMaquina === "Purificadora (solo agua)" ? "selected":""}>Purificadora (solo agua)</option>
    <option value="Purificadora (solo hielo)" ${wizardData.tipoMaquina === "Purificadora (solo hielo)" ? "selected":""}>Purificadora (solo hielo)</option>
    <option value="Purificadora DUO" ${wizardData.tipoMaquina === "Purificadora DUO" ? "selected":""}>Purificadora DUO</option>
    <option value="Croquetas para mascotas" ${wizardData.tipoMaquina === "Croquetas para mascotas" ? "selected":""}>Croquetas para mascotas</option>
    <option value="Granos y semillas" ${wizardData.tipoMaquina === "Granos y semillas" ? "selected":""}>Granos y semillas</option>
    <option value="Shampo para autos" ${wizardData.tipoMaquina === "Shampo para autos" ? "selected":""}>Shampo para autos</option>
    <option value="Despachador de Tags" ${wizardData.tipoMaquina === "Despachador de Tags" ? "selected":""}>Despachador de Tags</option>
  </select>
`,

 // PASO 2 - Cantidad de productos
() => `
  <h2>Cantidad de productos</h2>
  <p>Seleccione el número de productos configurables:</p>

  <select id="cantidadProductosSelect" class="wizard-select">
    ${Array.from({ length: 9 }, (_, i) => i + 4)
      .map(num => `
        <option value="${num}" ${wizardData.cantidadProductos == num ? "selected":""}>${num}</option>
      `).join("")}
  </select>
`,


  // PASO 3 - Métodos de pago
  // PASO 3 - Métodos de pago
() => `
  <h2>Métodos de pago</h2>

  <div class="toggle-row">
    <span>Billetero</span>
    <label class="switch">
      <input type="checkbox" id="billetero" ${wizardData.billetero ? "checked":""}>
      <span class="slider"></span>
    </label>
  </div>

  <div class="toggle-row">
    <span>Nayax</span>
    <label class="switch">
      <input type="checkbox" id="nayax" ${wizardData.nayax ? "checked":""}>
      <span class="slider"></span>
    </label>
  </div>

  <div class="toggle-row">
    <span>Monedero NFC</span>
    <label class="switch">
      <input type="checkbox" id="nfc" ${wizardData.nfc ? "checked":""}>
      <span class="slider"></span>
    </label>
  </div>
`,


  // PASO 4 - Funciones extra
  // PASO 4 - Funciones extra
() => `
  <h2>Funciones extra</h2>

  <div class="toggle-row">
    <span>Audio</span>
    <label class="switch">
      <input type="checkbox" id="audio" ${wizardData.audio ? "checked":""}>
      <span class="slider"></span>
    </label>
  </div>
`,


  // PASO 5 - Resumen
// PASO 5 - Resumen
() => `
  <h2>Resumen</h2>

  <p><b>Tipo de máquina:</b> ${wizardData.tipoMaquina}</p>
  <p><b>Cantidad productos:</b> ${wizardData.cantidadProductos}</p>

  <p><b>Billetero:</b> ${wizardData.billetero ? "Sí tiene" : "No tiene"}</p>
  <p><b>Nayax:</b> ${wizardData.nayax ? "Sí tiene" : "No tiene"}</p>
  <p><b>NFC:</b> ${wizardData.nfc ? "Sí tiene" : "No tiene"}</p>
  <p><b>Audio:</b> ${wizardData.audio ? "Sí tiene" : "No tiene"}</p>

`,

];

/* -----------------------------------------
      RENDER DEL WIZARD
----------------------------------------- */
function renderWizard() {
  wizardStepContent.innerHTML = wizardSteps[wizardStep]();

  // Barra de progreso
  const progress = ((wizardStep + 1) / wizardSteps.length) * 100;
  wizardProgressBar.style.width = progress + "%";

  wizardPrevBtn.style.display = wizardStep === 0 ? "none" : "inline-block";
  wizardNextBtn.textContent =
    wizardStep === wizardSteps.length - 1 ? "Guardar" : "Siguiente";

  // PASO 1 — Listener del SELECT
  if (wizardStep === 0) {
    const select = document.getElementById("tipoMaquinaSelect");

    select.addEventListener("change", () => {
      wizardData.tipoMaquina = select.value;
    });
  }

  // PASO 2, 3, 4 no requieren listeners aquí
}

/* -----------------------------------------
      BOTÓN ANTERIOR
----------------------------------------- */
wizardPrevBtn.onclick = () => {
  if (wizardStep > 0) wizardStep--;
  renderWizard();
};

/* -----------------------------------------
      BOTÓN SIGUIENTE / GUARDAR
----------------------------------------- */
wizardNextBtn.onclick = async () => {

  // Validación paso 1
  if (wizardStep === 0 && !wizardData.tipoMaquina) {
    showToast("Selecciona un tipo de máquina");
    return;
  }

  // Paso 2
 if (wizardStep === 1) {
  const select = document.getElementById("cantidadProductosSelect");
  const val = parseInt(select.value);

  if (isNaN(val) || val < 4 || val > 12) {
    showToast("Selecciona entre 4 y 12 productos");
    return;
  }

  wizardData.cantidadProductos = val;
}


  // Paso 3
  if (wizardStep === 2) {
    wizardData.billetero = document.getElementById("billetero").checked;
    wizardData.nayax = document.getElementById("nayax").checked;
    wizardData.nfc = document.getElementById("nfc").checked;
  }

  // Paso 4
  if (wizardStep === 3) {
    wizardData.audio = document.getElementById("audio").checked;
  }

  // Paso final → Guardar JSON
  if (wizardStep === wizardSteps.length - 1) {


    const resp = await fetch("/saveConfigWizard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wizardData)
    });


  if (resp.ok) {
    showToast("Configuración guardada correctamente", "success");
    wizardModal.classList.add("hidden");
  } else {
    showToast("Error al guardar configuración", "error");
  }

    return;
  }

  wizardStep++;
  renderWizard();
};

/* -----------------------------------------
      ABRIR WIZARD
----------------------------------------- */
document.getElementById("openWizardBtn").onclick = () => {
  wizardStep = 0;

  wizardData = {
    tipoMaquina: "",
    cantidadProductos: 0,
    billetero: false,
    nayax: false,
    audio: false,
    nfc: false
  };

  wizardModal.classList.remove("hidden");
  renderWizard();
};

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;

  toast.className = "toast " + type + " show";

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 250);
  }, 3000);
}

document.getElementById("wizardCloseBtn").onclick = () => {
  wizardModal.classList.add("hidden");
};

/* -----------------------------------------
      CARGAR PRODUCTOS PARA CALIBRACIÓN
----------------------------------------- */

const calibContainer = document.getElementById("calibracionContainer");
let productosData = []; // para reutilizar en el modal
async function cargarProductosCalibracion() {
  const calibContainer = document.getElementById("calibracionContainer");
  loader.classList.remove("hidden");
  calibContainer.innerHTML = ""; // limpiar contenido

  try {
    // 2️⃣ Solicitar inventario al ESP32
    const resp = await fetch("/inventario");
    const data = await resp.json();

    productosData = data.productos;

    // 3️⃣ Crear las cards de calibración
    data.productos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card";  // reutiliza diseño de inventario
      card.dataset.id = prod.id;

      card.innerHTML = `
        <h3>${prod.nombre}</h3>
        <p><b>Tiempo calibrado:</b> ${prod.tiempo} s</p>
        <p><b>Estado:</b> ${prod.bloqueado ? "✖ Inactivo" : "✔ Activo"}</p>
        <button class="edit-btn" data-id="${prod.id}">Calibrar</button>
      `;

      // Evento abrir modal
      card.querySelector(".edit-btn").onclick = () => openCalibrationModal(prod);

      calibContainer.appendChild(card);
    });

  } catch (err) {
    console.error("Error cargando calibración:", err);
    showToast("Error al cargar calibración", "error");
  }

  setTimeout(() => loader.classList.add("hidden"), 150);
}


/* Ejecutar carga SOLO cuando entran a la pestaña Calibración */
document
  .querySelector(`[data-tab="calibracion"]`)
  .addEventListener("click", async () => {

    // 1️⃣ Avisar al ESP32 que queremos entrar a modo calibración
    try {
      await fetch("/calibration/start");
      console.log("Modo calibración iniciado en ESP32");
    } catch (e) {
      console.warn("No se pudo iniciar calibración:", e);
    }

    // 2️⃣ Cargar los productos como siempre
    cargarProductosCalibracion();
  });



// ==========================================================
// CALIBRACION DE PRODUCTOS
// ==========================================================
let currentProductId = null;


function openCalibrationModal(prod) {
  currentProductId = prod.id;

  document.getElementById("calibTitle").textContent =
    "Calibración de: " + prod.nombre;

  document.getElementById("calibWave").classList.add("hidden");

  document.getElementById("calibModal").classList.remove("hidden");
}


/* -------- EVENTOS -------- */

document.getElementById("calibCloseBtn").onclick = () => {
  stopCalibration();
  cargarProductosCalibracion();
  document.getElementById("calibModal").classList.add("hidden");
};

document.getElementById("btnPurgar").onclick = async () => {
  document.getElementById("calibWave").classList.remove("hidden");

  await fetch("/calibration/purgar?id=" + currentProductId);
};

document.getElementById("btnIniciar").onclick = async () => {
  document.getElementById("calibWave").classList.remove("hidden");
  // Indicar que producto inicia calibración
  await fetch("/calibration/startProduct?id=" + currentProductId);

};

document.getElementById("btnDetener").onclick = () => stopCalibration();


function stopCalibration() {
  fetch("/calibration/stop");

  document.getElementById("calibWave").classList.add("hidden");
}


/* ==========================================================
      FIN CALIBRACION DE PRODUCTOS
========================================================== */


const nfcModal = document.getElementById("nfcModal");
const nfcStatusText = document.getElementById("nfcStatusText");

async function cargarTagsNFC() {
  const container = document.getElementById("nfcContainer");
  loader.classList.remove("hidden");
  container.innerHTML = "";

  try {
    

    const resp = await fetch("/nfc/tags.csv");
    const csv = await resp.text();

    const lines = csv.trim().split("\n");

    lines.forEach(uid => {
      if (!uid) return;

      const card = document.createElement("div");
      card.className = "nfc-card";

      card.innerHTML = `
        <h3>UID NFC</h3>
        <p>${uid}</p>
        <button class="nfc-delete-btn" data-uid="${uid}">Eliminar</button>
      `;

      card.querySelector(".nfc-delete-btn").onclick = () =>
        eliminarTagNFC(uid);

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error cargando tags NFC", err);
    showToast("Error cargando tags NFC", "error");
  }
 setTimeout(() => loader.classList.add("hidden"), 150);
}

async function eliminarTagNFC(uid) {
  loader.classList.remove("hidden");

  const resp = await fetch("/nfc/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid })
  });

  

  if (resp.ok) {
    showToast("Tag eliminado", "success");
    cargarTagsNFC();
  } else {
    showToast("Error al eliminar tag", "error");
  }
  
 setTimeout(() => loader.classList.add("hidden"), 150);
}


document.getElementById("addNfcBtn").onclick = async () => {

  nfcStatusText.textContent = "Acerque una tarjeta NFC al lector...";
  nfcModal.classList.remove("hidden");

  await fetch("/nfc/add"); // Inicia el modo de lectura
};

document.getElementById("nfcCloseBtn").onclick = async () => {
  nfcModal.classList.add("hidden");
  await fetch("/nfc/stop");
};


document.querySelector('[data-tab="nfc"]').addEventListener("click", () => {
  cargarTagsNFC();
});

// Mantener loader visible hasta que la página termine de cargar
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
});
