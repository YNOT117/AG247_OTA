document.addEventListener("DOMContentLoaded", () => {

  showLoader();
  const logout = document.getElementById("logout");
  validarSesion();

  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {

      // activar botón
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // mostrar contenido
      const id = tab.dataset.tab;

      contents.forEach(c => c.classList.remove("active"));
      document.getElementById("tab-" + id).classList.add("active");

      // 🔥 INIT SOLO SI ES BASIC
      if (id === "basic") {
        initConfiguracion();
      }
      if (id === "calibracion") {
        initCalibracion();
      }
      if (id === "nfc") {
        loadNFC();
      }

    });
  });

  // 🔥 INIT SI YA ESTÁ ACTIVO AL CARGAR
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab && activeTab.dataset.tab === "basic") {
    initConfiguracion();
  }

  initCalibracion();

  hideLoader();

});

 /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

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

    // 🔥 parsear JSON correctamente
    const data = JSON.parse(e.data);
    const uid = data.uid;

    console.log("Tag detectado:", uid);

    // 🔥 feedback UI
    showToast("Tag agregado: " + uid, "success");

    // 🔥 recargar datos
    loadNFC(); // (ojo: tu función actual es loadNFC, no cargarTagsNFC)

  });

} catch (err) {
  console.warn("SSE no disponible.");
}


async function fetchInventario() {

  if (!MOCK) {
    return fetch("/inventarioData").then(r => r.json());
  }

  return new Promise(resolve => {
    setTimeout(() => {

      resolve({
  tipo: 0,
  modo: "DUO",

  nombres: [
    "AGUA PURIFICADA",
    "AGUA PURIFICADA 20L",
    "AGUA PURIFICADA 10L",
    "AGUA PURIFICADA 5L",
    "AGUA PURIFICADA 1L",

    "AGUA ALCALINA",
    "AGUA ALCALINA 20L",
    "AGUA ALCALINA 10L",
    "AGUA ALCALINA 5L",
    "AGUA ALCALINA 1L",

    "ENJUAGUE",

    "HIELO",
    "HIELO A GRANEL",
    "HIELO 2.5Kg",
    "HIELO 5Kg",
    "HIELO 10Kg"
  ],

  productos: [
    {
      id: 0,
      nombre: "AGUA PURIFICADA",
      precio: 10,
      cantidad: 25,
      despacho: true,
      tiempo: 5,
      caudal: 0,
      bloqueado: false,
      promocion: 0
    },
    {
      id: 1,
      nombre: "AGUA PURIFICADA 20L",
      precio: 30,
      cantidad: 10,
      despacho: true,
      tiempo: 8,
      caudal: 0,
      bloqueado: false,
      promocion: 5
    },
    {
      id: 2,
      nombre: "HIELO 5Kg",
      precio: 50,
      cantidad: 8,
      despacho: false,
      tiempo: 0,
      caudal: 120,
      bloqueado: true,
      promocion: 10
    },
    {
      id: 3,
      nombre: "HIELO 10Kg",
      precio: 80,
      cantidad: 5,
      despacho: false,
      tiempo: 0,
      caudal: 150,
      bloqueado: false,
      promocion: 0
    }
  ],

  ofertas: [
    /* ================= SIN OFERTA ================= */
    {
      enabled: false,
      tipo: 0,
      precioPromo: 0,
      diaSemana: 0,
      fechaInicio: 0,
      fechaFin: 0,
      horaInicio: 0,
      horaFin: 0
    },

    /* ================= OFERTA DIARIA ================= */
    {
      enabled: true,
      tipo: 2, // DIARIA
      precioPromo: 25,
      diaSemana: 0,
      fechaInicio: 0,
      fechaFin: 0,
      horaInicio: 800,   // 08:00
      horaFin: 1800      // 18:00
    },

    /* ================= OFERTA SEMANAL ================= */
    {
      enabled: true,
      tipo: 1, // SEMANAL
      precioPromo: 40,

      // 🔥 Lunes + Miércoles + Viernes
      // bits: Lun(1)=5, Mie(3)=3, Vie(5)=1 → 101010
      diaSemana: 0b0101010,

      fechaInicio: 0,
      fechaFin: 0,
      horaInicio: 900,
      horaFin: 1700
    },

    /* ================= OFERTA ÚNICA ================= */
    {
      enabled: true,
      tipo: 0, // UNICA
      precioPromo: 60,
      diaSemana: 0,

      fechaInicio: 321,  // 21 marzo
      fechaFin: 331,     // 31 marzo

      horaInicio: 0,
      horaFin: 2359
    }
  ]
});

    }, 500);
  });

}

function initCalibracion() {

  if (window.calibInit) return;
  window.calibInit = true;

  const selectId = "ProductoSelect";
  const btnCalibrar = document.getElementById("btnCalibrar");
  const btnDetener = document.getElementById("btnDetener");
  const modoSwitch = document.getElementById("modoCalibracion");
  const btnPurgar = document.getElementById("btnPurgar");

  modoSwitch.checked = false;
  btnCalibrar.disabled = true;
  btnDetener.disabled = true;
  btnPurgar.disabled = true;

  if (!btnCalibrar || !btnDetener) return;

  let productos = [];
  let productoSeleccionado = null;

  // =========================
  // CARGAR INVENTARIO
  // =========================
  async function loadProductos() {

    try {
      const data = await fetchInventario();

      productos = data.productos || [];

      // map para select
      const options = productos.map(p => ({
        label: p.nombre,
        value: p.id
      }));

      // usar tu helper global
      initCustomSelect(options, options[0]?.value, selectId);

      productoSeleccionado = options[0]?.value;

      // escuchar cambios
      const container = document.getElementById(selectId);

      container.addEventListener("click", () => {
        productoSeleccionado = container.dataset.value;
      });

    } catch (e) {
      console.error("Error cargando productos", e);
      showToast("Error al cargar productos ⚠️", "error");
    }

  }

  // =========================
  // CALIBRAR
  // =========================
  btnCalibrar.addEventListener("click", async () => {

    if (productoSeleccionado === null) {
      showToast("Selecciona un producto ⚠️", "error");
      return;
    }

    if (!modoSwitch.checked) {
      showToast("Activa modo calibración primero ⚠️", "error");
      return;
    }

    try {

      showLoader();

      if (MOCK) {
        console.log("Simulación calibrar", productoSeleccionado);
        showToast("Calibrando (simulación) 🔧", "info");
        return;
      }

      await fetch("/calibracion/startProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productoSeleccionado
        })
      });

      showToast("Calibración iniciada 🔧", "success");

    } catch (e) {
      showToast("Error al calibrar ⚠️", "error");
    } finally {
      hideLoader();
    }

  });

  // =========================
  // DETENER
  // =========================
  btnDetener.addEventListener("click", async () => {

    try {

      showLoader();

      if (MOCK) {
        console.log("Simulación detener");
        showToast("Calibración detenida ⏹", "info");
        return;
      }

      await fetch("/calibracion/stop", {
        method: "POST"
      });

      showToast("Calibración detenida ⏹", "success");

    } catch (e) {
      showToast("Error al detener ⚠️", "error");
    } finally {
      hideLoader();
    }

  });

  // PURGAR

  btnPurgar.addEventListener("click", async () => {

  if (!modoSwitch.checked) {
    showToast("Activa modo calibración primero ⚠️", "error");
    return;
  }

  if (productoSeleccionado === null) {
    showToast("Selecciona un producto ⚠️", "error");
    return;
  }

  try {

    showLoader();

    if (MOCK) {
      console.log("Simulación purgar", productoSeleccionado);
      showToast("Purgando (simulación) 💨", "info");
      return;
    }

    await fetch("/calibracion/purgar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: productoSeleccionado
      })
    });

    showToast("Purgado iniciado 💨", "success");

  } catch (e) {
    console.error(e);
    showToast("Error al purgar ⚠️", "error");
  } finally {
    hideLoader();
  }

});

  // =========================
  // MODO CALIBRACIÓN
  // =========================
  modoSwitch.addEventListener("change", async () => {

    const estado = modoSwitch.checked;
      // 🔥 habilitar / deshabilitar botones
    btnCalibrar.disabled = !estado;
    btnDetener.disabled = !estado;
    btnPurgar.disabled = !estado;

    try {

      showLoader();

      if (MOCK) {
        console.log("Modo calibración:", estado);
        showToast(
          estado ? "Modo calibración activado 🔧" : "Modo calibración desactivado ⏹",
          "info"
        );
        return;
      }

      const endpoint = estado
        ? "/calibracion/on"
        : "/calibracion/off";

      const res = await fetch(endpoint);

      if (!res.ok) throw new Error("Error en calibración");

      showToast(
        estado ? "Modo calibración activado 🔧" : "Modo calibración desactivado ⏹",
        "success"
      );

    } catch (e) {
      console.error(e);
      showToast("Error al cambiar modo ⚠️", "error");
      // 🔥 rollback UI si falla
      modoSwitch.checked = !estado;
      btnCalibrar.disabled = estado;
      btnDetener.disabled = estado;
    } finally {
      hideLoader();
    }

  });

  // =========================
  // INIT
  // =========================
  loadProductos();
}

function initConfiguracion() {

  if (window.configInit) return;
  window.configInit = true;

  // =========================
  // ELEMENTOS
  // =========================
  const select = document.getElementById("TipoUI");
  const trigger = select.querySelector(".custom-select-trigger span");
  const options = select.querySelectorAll(".custom-option");

  const saveBtn = document.getElementById("saveConfigBtn");

  const btnMinus = document.getElementById("btnMinus");
  const btnPlus = document.getElementById("btnPlus");
  const productosValue = document.getElementById("ProductosValue");

  if (!select || !btnMinus || !btnPlus) return;

  let selectedTipo = "limpieza";
  let productos = 1;

  // =========================
  // UI STEP
  // =========================
  function updateUI() {
    productosValue.textContent = productos;
  }

  function getMaxProductos() {
    const tipo = getTipo();
    return (tipo === "duo" || tipo === "agua" || tipo === "hielo") ? 8 : 12;
  }

  function updateProductosLimit() {
    const max = getMaxProductos();

    if (productos > max) {
      productos = max;
      updateUI();
    }

    btnMinus.disabled = productos <= 1;
    btnPlus.disabled = productos >= max;
  }

  // =========================
  // STEPPER
  // =========================
  btnPlus.addEventListener("click", () => {
    if (productos < getMaxProductos()) {
      productos++;
      updateUI();
      updateProductosLimit();
    }
  });

  btnMinus.addEventListener("click", () => {
    if (productos > 1) {
      productos--;
      updateUI();
      updateProductosLimit();
    }
  });

  // =========================
  // CUSTOM SELECT
  // =========================
  select.addEventListener("click", () => {
    select.classList.toggle("open");
  });

  options.forEach(option => {
    option.addEventListener("click", (e) => {

      e.stopPropagation();

      options.forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");

      selectedTipo = option.dataset.value;
      trigger.textContent = option.textContent;

      select.classList.remove("open");

      updateProductosLimit();
    });
  });

  document.addEventListener("click", (e) => {
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });

  function setTipo(value) {
    const option = select.querySelector(`[data-value="${value}"]`);
    if (option) option.click();
  }

  function getTipo() {
    return selectedTipo;
  }

  // =========================
  // MAPEO
  // =========================
  function mapTipoToConfig(tipo) {
    switch (tipo) {
      case "limpieza": return { TipoDeVending: 0, SensorTemp: 0, SensorPres: 0 };
      case "croquetas": return { TipoDeVending: 1, SensorTemp: 0, SensorPres: 0 };
      case "duo": return { TipoDeVending: 2, SensorTemp: 1, SensorPres: 1 };
      case "agua": return { TipoDeVending: 2, SensorTemp: 0, SensorPres: 1 };
      case "hielo": return { TipoDeVending: 2, SensorTemp: 1, SensorPres: 0 };
      case "granos": return { TipoDeVending: 3, SensorTemp: 0, SensorPres: 0 };
      case "carro": return { TipoDeVending: 4, SensorTemp: 0, SensorPres: 0 };
      default: return { TipoDeVending: 0, SensorTemp: 0, SensorPres: 0 };
    }
  }

  function mapConfigToUI(config) {
    if (config.TipoDeVending === 2) {
      if (config.SensorTemp && config.SensorPres) return "duo";
      if (!config.SensorTemp && config.SensorPres) return "agua";
      if (config.SensorTemp && !config.SensorPres) return "hielo";
    }
    if (config.TipoDeVending === 0) return "limpieza";
    if (config.TipoDeVending === 1) return "croquetas";
    if (config.TipoDeVending === 3) return "granos";
    if (config.TipoDeVending === 4) return "carro";

    return "limpieza";
  }

  // =========================
  // LOAD CONFIG
  // =========================
async function loadConfig() {

  let config;

  if (!MOCK) {
    try {
      const res = await fetch("/configData");
      config = await res.json();
    } catch (e) {
      console.error("Error al obtener config");
      return;
    }
  } else {
    console.warn("Modo simulación 🔥");

    config = {
      DineroEnCaja: 0.0,
      AudioActivo: true,
      Volumen: 70,
      SSID: "",
      PASS: "",
      Nombre: "mivending",
      UserWebLocal: "admin",
      PassWebLocal: "1234",
      Version: "1.0.0",
      Balance: 0,
      CambioMaximo: 0,
      ProductosSize: 4,
      ChatID: "",
      Token: "",
      GroupID: "",
      BilleteroType: 1,
      MonederoType: 1,
      NFC532: true,
      TipoDeVending: 2,
      SensorTemp: 1,
      SensorPres: 1,
      Incremento: 1,
      Divisa: 0,
      NayaxState: 0,
      LectorQR: false,
      IluminacionLED: false,
      NumeroLED: 0,
      BrilloLED: 70
    };
  }

  // 🔥 AQUÍ ya existe config

  setTipo(mapConfigToUI(config));

  productos = (config.ProductosSize ?? 2);
  updateUI();
  updateProductosLimit();

  document.getElementById("MonederoType").checked = config.MonederoType > 0;
  document.getElementById("BilleteroType").checked = config.BilleteroType > 0;
  document.getElementById("NayaxState").checked = config.NayaxState > 0;

  document.getElementById("AudioActivo").checked = config.AudioActivo;
  document.getElementById("Volumen").value = config.Volumen;

  document.getElementById("NFC532").checked = config.NFC532;

  updateVolumenUI();
  toggleAudio();
}
  // =========================
  // GET CONFIG
  // =========================
  function getConfigFromUI() {

    const tipoMap = mapTipoToConfig(getTipo());

    return {
      ...tipoMap,

      ProductosSize: productos,

      MonederoType: document.getElementById("MonederoType").checked ? 1 : 0,
      BilleteroType: document.getElementById("BilleteroType").checked ? 1 : 0,
      NayaxState: document.getElementById("NayaxState").checked ? 1 : 0,

      AudioActivo: document.getElementById("AudioActivo").checked,
      Volumen: Number(document.getElementById("Volumen").value),

      NFC532: document.getElementById("NFC532").checked
    };
  }

  // =========================
  // SAVE
  // =========================
 saveBtn.addEventListener("click", async () => {

  const config = getConfigFromUI();



  try {

    showLoader();

    // =========================
    // 🧪 MODO SIMULACIÓN
    // =========================
    if (MOCK) {

      console.warn("Modo en simulación 🔥");
      console.log("CONFIG FINAL 🚀", config);
      showToast("Configuración guardada (simulación) ✅", "success");
      return;
    }

    // =========================
    // 🔌 MODO REAL (ESP32)
    // =========================
    const res = await fetch("/saveconfigdata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });

    if (!res.ok) {
      throw new Error("Error en servidor");
    }

    showToast("Configuración guardada ✅", "success");

  } catch (e) {

    console.error(e);
    showToast("Error al guardar ⚠️", "error");

  } finally {

    hideLoader();

  }

});

  const audioSwitch = document.getElementById("AudioActivo");
  const volumenSlider = document.getElementById("Volumen");
  const volumenValue = document.getElementById("VolumenValue");

  // mostrar valor
  function updateVolumenUI() {
    volumenValue.textContent = volumenSlider.value + "%";
  }

  // activar / desactivar slider
  function toggleAudio() {
    const enabled = audioSwitch.checked;

    volumenSlider.disabled = !enabled;
    volumenValue.style.opacity = enabled ? "1" : "0.4";
  }

  // eventos
  volumenSlider.addEventListener("input", updateVolumenUI);
  audioSwitch.addEventListener("change", toggleAudio);

  // =========================
  // INIT
  // =========================
  loadConfig();
}



// =============================
// Tab NFC
// =============================

let currentNFCStatus = {
  active: false,
  uid: null
};


async function editTagName(index) {

  const newName = prompt("Nuevo nombre:");

  if (!newName) return;

  // 🔥 obtener archivo actual
  const res = await fetch("/TagsValidos.csv");
  const text = await res.text();

  const rows = text.trim().split("\n");

  const data = rows.map(row => row.split(","));

  // 🔥 modificar nombre (columna 1)
  data[index][1] = newName;

  // 🔥 reconstruir CSV
  const newCSV = data.map(r => r.join(",")).join("\n");
  showLoader();
  try {

    await fetch("/saveTags", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: newCSV
    });

    showToast("Guardado correctamente ✅", "success");

    loadNFC();

  } catch (e) {
    console.error(e);
    showToast("Error al guardar ❌", "error");
  }finally {
    hideLoader();
  }
}

// =============================
// LOAD DATA
// =============================
async function loadNFC() {
  try {

    let ventasText, tagsText, status;

    // =========================
    // 🧪 MODO MOCK
    // =========================
    if (MOCK) {

      console.warn("NFC en modo simulación 🔥");

      const [ventasRes, tagsRes, statusRes] = await Promise.all([
        fetch("/.../mock/tags_mock.csv"),
        fetch("/.../mock/ventas_mock.csv"),
        fetch("/.../mock/nfcStatus_mock.json")
      ]);

      ventasText = await ventasRes.text();
      tagsText = await tagsRes.text();
      status = await statusRes.json();

    } else {

      // =========================
      // 🔌 MODO REAL
      // =========================
      const [ventasRes, tagsRes, statusRes] = await Promise.all([
        fetch("/ventas.csv"),
        fetch("/TagsValidos.csv"),
        fetch("/nfcStatus")
      ]);

      ventasText = await ventasRes.text();
      tagsText = await tagsRes.text();
      status = await statusRes.json();
    }

    const ventas = parseCSV(ventasText, true);
    const tags = parseCSV(tagsText, false);

    currentNFCStatus = status;

    renderNFCCards(tags, ventas);

  } catch (err) {
    console.error("Error NFC:", err);
  }
}


// function parseCSV(text, hasHeader = true) {
//   const rows = text.trim().split("\n");

//   // 🔥 SIN HEADER (tu caso)
//   if (!hasHeader) {
//     return rows.map(row => {
//       const values = row.split(",");

//       return {
//         UID: values[0]?.trim(),
//         Nombre: values[1]?.trim(),
//         Saldo: values[2]?.trim(),
//         Puntos: values[3]?.trim()
//       };
//     });
//   }

//   const headers = rows[0].split(",");

//   return rows.slice(1).map(row => {
//     const values = row.split(",");
//     let obj = {};

//     headers.forEach((h, i) => {
//       obj[h.trim()] = values[i]?.trim();
//     });

//     return obj;
//   });
// }
function parseCSV(text, hasHeader = true) {
  const rows = text
    .trim()
    .split("\n")
    .filter(row => row.trim() !== ""); // 🔥 clave

  // 🔥 SI NO HAY FILAS → retornar vacío
  if (rows.length === 0) return [];

  if (!hasHeader) {
    return rows.map(row => {
      const values = row.split(",");

      return {
        UID: values[0]?.trim(),
        Nombre: values[1]?.trim(),
        Saldo: values[2]?.trim(),
        Puntos: values[3]?.trim()
      };
    });
  }

  const headers = rows[0].split(",");

  return rows.slice(1).map(row => {
    const values = row.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });

    return obj;
  });
}

// =============================
// User Stats
// =============================
function getUserStats(uid, ventas) {
  const userVentas = ventas.filter(v => v.Cliente === uid);

  let total = 0;
  let compras = userVentas.length;

  const productos = {};

  userVentas.forEach(v => {
    const venta = parseFloat(v["Venta($)"] || 0);
    total += venta;

    const prod = v.Producto || "Otro";

    if (!productos[prod]) productos[prod] = 0;
    productos[prod]++;
  });

  let topProducto = "-";
  let max = 0;

  for (const p in productos) {
    if (productos[p] > max) {
      max = productos[p];
      topProducto = p;
    }
  }

  return {
    total,
    compras,
    topProducto
  };
}

// =============================
// RENDER CARDS
// =============================
// function renderNFCCards(tags, ventas) {
//   const container = document.getElementById("nfcContainer");
//   container.innerHTML = "";

//   tags.forEach(tag => {

//     const stats = getUserStats(tag.UID, ventas);

//     // 🔥 estado dinámico
//     let estado = "Inactivo";
//     if (currentNFCStatus.active && currentNFCStatus.uid === tag.UID) {
//       estado = "Activo";
//     }

//     const card = document.createElement("div");
//     card.className = "inv-card";
//     card.dataset.uid = tag.UID;

//     card.innerHTML = `
//       <div class="card-header">
//         <h3>${tag.Nombre || "Sin nombre"}</h3>
//         <span class="status ${estado.toLowerCase()}">${estado}</span>
//       </div>

//       <div class="card-body">

//         <div class="nfc-grid">
//           <div>
//             <p><strong>Saldo</strong></p>
//             <p>$${tag.Saldo || 0}</p>

//             <p><strong>Puntos</strong></p>
//             <p>$${tag.Puntos || 0}</p>

//             <p><strong>Compras</strong></p>
//             <p>${stats.compras}</p>
//           </div>

//           <div>
//             <p><strong>Consumo</strong></p>
//             <p>$${stats.total.toFixed(2)}</p>

//             <p><strong>Top Producto</strong></p>
//             <p>${stats.topProducto}</p>
//           </div>
//         </div>

//         <div class="nfc-footer">
//           UID: ${tag.UID || "-"}
//         </div>

//       </div>
//     `;

//     container.appendChild(card);
//   });
// }
function renderNFCCards(tags, ventas) {
  const container = document.getElementById("nfcContainer");
  container.innerHTML = "";

  if (!tags || tags.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📭 No hay tarjetas registradas</p>
      </div>
    `;
    return;
  }

  tags.forEach((tag, index) => {

    const stats = getUserStats(tag.UID, ventas);

    let estado = "Inactivo";
    if (currentNFCStatus.active && currentNFCStatus.uid === tag.UID) {
      estado = "Activo";
    }

    const card = document.createElement("div");
    card.className = "inv-card";
    card.dataset.uid = tag.UID;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="card-header">
        <h3 class="nfc-name">${tag.Nombre || "Sin nombre"}</h3>
        <span class="status ${estado.toLowerCase()}">${estado}</span>
      </div>

      <div class="card-body">

        <div class="nfc-grid">
          <div>
            <p><strong>Saldo</strong></p>
            <p>$${tag.Saldo || 0}</p>

            <p><strong>Puntos</strong></p>
            <p>${tag.Puntos || 0}</p>

            <p><strong>Compras</strong></p>
            <p>${stats.compras}</p>
          </div>

          <div>
            <p><strong>Consumo</strong></p>
            <p>$${stats.total.toFixed(2)}</p>

            <p><strong>Top Producto</strong></p>
            <p>${stats.topProducto}</p>
          </div>
        </div>

        <div class="nfc-footer">
          <span>UID: ${tag.UID || "-"}</span>
          <button class="edit-btn">✏️</button>
        </div>

      </div>
    `;

    // 🔥 EVENTO EDITAR
    const btn = card.querySelector(".edit-btn");

    btn.addEventListener("click", () => {
      editTagName(index);
    });

    container.appendChild(card);
  });
}
// =============================
// LIVE STATUS UPDATE 🔥
// =============================
async function updateNFCStatus() {
  try {
    const res = await fetch("/nfcStatus");
    const status = await res.json();

    currentNFCStatus = status;

    const cards = document.querySelectorAll(".inv-card");

    cards.forEach(card => {
      const uid = card.dataset.uid;

      let estado = "Inactivo";

      if (status.active && status.uid === uid) {
        estado = "Activo";
      }

      const badge = card.querySelector(".status");

      if (badge) {
        badge.textContent = estado;
        badge.className = "status " + estado.toLowerCase();
      }
    });

  } catch (err) {
    console.error("Error actualizando estado NFC:", err);
  }
}

// =============================
// LOOP TIEMPO REAL
// =============================
setInterval(updateNFCStatus, 2000);