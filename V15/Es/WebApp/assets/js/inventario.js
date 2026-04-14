

function mockProductoBloqueo({ id, enabled }) {
  return new Promise(resolve => {

    setTimeout(() => {

      // 🔥 simulamos cambio en productos
      if (window.productos && window.productos[id]) {
        window.productos[id].bloqueado = !enabled;
      }

      resolve({ ok: true });

    }, 300);

  });
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

/* ================= MAIN ================= */

document.addEventListener("DOMContentLoaded", () => {
  showLoader();
  const logout = document.getElementById("logout");
  validarSesion();

  const modalBG = document.getElementById("modal-bg");
  const cardsMobile = document.getElementById("cardsMobile");
  
  let productos = [];
  let nombresDisponibles = [];
  let tipoMaquina = 0;
  let modo = null;
  let editIndex = -1;
  
  window.construirCards = construirCards;

  const btnCancelarOferta = document.getElementById("btnCancelarOferta");

  if (btnCancelarOferta) {
    btnCancelarOferta.onclick = () => {
      document.getElementById("oferta-modal-bg").classList.remove("show");
    };
  }
  
  /* ================= CARGAR ================= */

 

  async function cargarInventario() {
  // window.cargarInventario = async function () {
    

    try {
      const data = await fetchInventario();

      productos = data.productos || [];
      window.productos = productos;
      window.ofertas = data.ofertas || [];
      nombresDisponibles = data.nombres || [];
      tipoMaquina = data.tipo || 0;
      modo = data.modo || null;

      construirCards();
      const label = document.getElementById("tipoMaquinaLabel");
      let texto = "";
      if (tipoMaquina === 2) {
        // ===== PURIFICADORA =====
        if (modo === "DUO") {
          texto = "💧🧊 Purificadora DUO";
        } 
        else if (modo === "AGUA") {
          texto = "💧 Agua purificada";
        } 
        else if (modo === "HIELO") {
          texto = "🧊 Hielo purificado";
        }
        else if (modo === "Sin servicio") {
          texto = "⚠️ Sin servicio";
        } 
        else {
          texto = "💧 Purificadora";
        }
      } else {
        const tipos = {
          0: "🧼 Productos de limpieza",
          1: "🐶 Croquetas para mascotas",
          3: "🌾 Granos y semillas",
          4: "🚗 Automotriz"
        };
        texto = tipos[tipoMaquina] || "⚙️ Desconocido";
      }

      label.textContent = `Máquina: ${texto}`;

    } catch (e) {
      console.log(e);
    }

  }

  // 🔥 AQUÍ VA
  window.App = {
    cargarInventario,
    construirCards,
    showLoader,
    hideLoader
  };

   cargarInventario();

  /* ================= CARDS ================= */

  function construirCards() {
    cardsMobile.innerHTML = "";

    productos.forEach((p, i) => {

      const div = document.createElement("div");
      div.className = `inv-card ${p.bloqueado ? "bloqueado" : ""}`;
      // div.className = "inv-card";

      div.innerHTML = `
        <div class="card-header">
          <h3>${p.nombre}</h3>

          <label class="switch small">
            <input type="checkbox" ${!p.bloqueado ? "checked" : ""} data-i="${i}">
            <span class="slider"></span>
          </label>
        </div>

        <div class="card-precio">$${p.precio}</div>

        <div class="card-footer">
          <div class="card-info">
            <span>${p.despacho ? `🕒 Tiempo: ${p.tiempo}s` : `💧 Caudal: ${p.caudal}`}</span>
            <span>Cantidad: ${p.cantidad ?? "-"}</span>
          </div>

          <div class="card-cashback">
            Cashback: ${p.promocion}%
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-primary btnEditar" data-i="${i}">✏️ Editar</button>
          <button class="btn btn-secondary btnOferta" data-i="${i}">🎁 Oferta</button>
        </div>
      `;

      cardsMobile.appendChild(div);
    });

    // ✅ EDITAR
    document.querySelectorAll(".btnEditar").forEach(btn => {
      btn.onclick = () => abrirModal(btn.dataset.i);
    });

    // ✅ OFERTA (🔥 ESTO TE FALTABA)
    document.querySelectorAll(".btnOferta").forEach(btn => {
      btn.onclick = () => abrirModalOferta(btn.dataset.i);
    });


  }

  cardsMobile.addEventListener("change", async (e) => {

    if (!e.target.matches(".switch input")) return;

    const index = e.target.dataset.i;
    const activo = e.target.checked;


    try {

      if (MOCK) {
        await mockProductoBloqueo({
          id: parseInt(index),
          enabled: activo
        });

        construirCards();
      } else {
        await fetch("/productoBloqueo", {
          method: "POST",
          body: JSON.stringify({
            id: parseInt(index),
            enabled: activo
          })
        });

        await cargarInventario();
      }

    } catch (err) {
      console.error(err);
      showToast("Error al actualizar producto", "error");
    }

  });

  /* ================= MODAL ================= */

  function abrirModal(i) {
    editIndex = i;
    const p = productos[i];

    const esPurificadora = tipoMaquina === 2;

    const customNombre = document.getElementById("customNombre");
    const inputNombre = document.getElementById("prodNombreInput");
    const cantidadRow = document.getElementById("cantidadRow");
    const inputCantidad = document.getElementById("prodCantidad");
    const labelCantidad = document.getElementById("labelCantidad");

    const customDespacho = document.getElementById("customDespacho");

    const inputValor = document.getElementById("prodValor");
    const labelValor = document.getElementById("labelValor");

    /* ===== NOMBRE ===== */

    if (esPurificadora) {

      customNombre.classList.remove("hidden");
      inputNombre.classList.add("hidden");
      cantidadRow.classList.add("hidden");

      let nombresFiltrados = [...nombresDisponibles];

      if (modo === "AGUA") {
        nombresFiltrados = nombresFiltrados.filter(n => !n.includes("HIELO"));
      }

      if (modo === "HIELO") {
        nombresFiltrados = nombresFiltrados.filter(n => n.includes("HIELO"));
      }

      initCustomSelect(nombresFiltrados, p.nombre, "customNombre");

    } else {

      customNombre.classList.add("hidden");
      inputNombre.classList.remove("hidden");
      cantidadRow.classList.remove("hidden");

      inputNombre.value = p.nombre;
      inputCantidad.value = p.cantidad ?? 0;

      if (tipoMaquina === 0 || tipoMaquina === 4) {
        labelCantidad.textContent = "Cantidad (L)";
      } else {
        labelCantidad.textContent = "Cantidad (Kg)";
      }
    }

    /* ===== DESPACHO (CUSTOM) ===== */

    let opcionesDespacho = [
      { label: "🕒 Tiempo", value: "tiempo" },
      { label: "💧 Caudal", value: "caudal" }
    ];

    let valorDespacho = p.despacho ? "tiempo" : "caudal";

    if (tipoMaquina === 2 && modo === "HIELO") {
      opcionesDespacho = [{ label: "🕒 Tiempo", value: "tiempo" }];
      valorDespacho = "tiempo";
      customDespacho.classList.add("disabled");
    } 
    else if (tipoMaquina === 1 || tipoMaquina === 3) {
      opcionesDespacho = [{ label: "🕒 Tiempo", value: "tiempo" }];
      valorDespacho = "tiempo";
      customDespacho.classList.add("disabled");
    } 
    else {
      customDespacho.classList.remove("disabled");
    }

    initCustomSelect(opcionesDespacho, valorDespacho, "customDespacho");

    actualizarValor();

    function actualizarValor() {
      if (document.getElementById("customDespacho").dataset.value === "tiempo") {
        labelValor.textContent = "🕒 Tiempo (seg)";
        inputValor.value = p.tiempo;
      } else {
        labelValor.textContent = "💧 Pulsos";
        inputValor.value = p.caudal;
      }
    }

    customDespacho.addEventListener("click", () => {
      setTimeout(actualizarValor, 50);
    });

    /* ===== OTROS ===== */

    document.getElementById("prodPrecio").value = p.precio;
    document.getElementById("prodCashback").value = p.promocion;

    modalBG.classList.add("show");
  }

  /* ================= CERRAR ================= */

  document.getElementById("btnCancelar").onclick = () => {
    modalBG.classList.remove("show");
  };

  modalBG.addEventListener("click", e => {
    if (e.target === modalBG) modalBG.classList.remove("show");
  });

  /* ================= GUARDAR ================= */

  document.getElementById("btnGuardar").onclick = async () => {

    showLoader();

    const esPurificadora = tipoMaquina === 2;

    const selectDespacho = document.getElementById("customDespacho").dataset.value;
    const valor = parseFloat(document.getElementById("prodValor").value);

    const data = {
      id: editIndex,
      nombre: esPurificadora
        ? document.getElementById("customNombre").dataset.value
        : document.getElementById("prodNombreInput").value,

      precio: Math.max(0, parseFloat(document.getElementById("prodPrecio").value)),
      cantidad: esPurificadora ? productos[editIndex].cantidad : parseFloat(document.getElementById("prodCantidad").value),

      promocion: Math.min(100, Math.max(0, parseInt(document.getElementById("prodCashback").value))),

      despacho: selectDespacho === "tiempo",
      tiempo: selectDespacho === "tiempo" ? valor : 0,
      caudal: selectDespacho === "caudal" ? valor : 0
    };

    modalBG.classList.remove("show");

    await fetch("/InventarioGuardar", {
      method: "POST",
      body: JSON.stringify(data)
    });

    await cargarInventario();
    hideLoader();
  };

  hideLoader();
});

 /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

  
// function abrirModalOferta(i) {
//   window.productoOfertaActual = i;

//   const modal = document.getElementById("oferta-modal-bg");
//   modal.classList.add("show");

//   // 🔥 reset UI al abrir
//   document.getElementById("ofertaEnabled").checked = false;
//   document.getElementById("precioPromo").value = "";

//   const selector = document.getElementById("ofertaTipo");
//   selector.value = "0";

//   // 🔥 forzar render del contenido dinámico
//   if (typeof renderOferta === "function") {
//     renderOferta();
//   }
// }

function abrirModalOferta(i) {

  window.productoOfertaActual = i;

  const modal = document.getElementById("oferta-modal-bg");
  modal.classList.add("show");

  const oferta = window.ofertas?.[i];

  if (!oferta) return;

  // ===== SWITCH =====
  const enabled = oferta.enabled || false;
  document.getElementById("ofertaEnabled").checked = enabled;

  // ===== PRECIO =====
  document.getElementById("precioPromo").value = oferta.precioPromo || "";

  // ===== TIPO =====
  const tipo = enabled ? oferta.tipo : 0;

  const customTipo = document.getElementById("customOfertaTipo");

  customTipo.dataset.value = tipo;

  const texto = {
    0: "Oferta única",
    1: "Oferta semanal",
    2: "Oferta diaria"
  };

  customTipo.querySelector(".custom-text").textContent = texto[tipo];

  // 🔥 render dinámico
  renderOferta();

  // 🔥 IMPORTANTE: esperar DOM
  setTimeout(() => {

    // ===== HORAS =====
    if (oferta.horaInicio) {
      document.getElementById("horaInicio").value = formatearHoraInput(oferta.horaInicio);
    }

    if (oferta.horaFin) {
      document.getElementById("horaFin").value = formatearHoraInput(oferta.horaFin);
    }

    // ===== TIPO ESPECÍFICO =====

    if (tipo === OFERTA_UNICA) {

      if (oferta.fechaInicio) {
        document.getElementById("fechaInicio").value = formatearFechaInput(oferta.fechaInicio);
      }

      if (oferta.fechaFin) {
        document.getElementById("fechaFin").value = formatearFechaInput(oferta.fechaFin);
      }
    }

    if (tipo === OFERTA_SEMANAL) {
      aplicarDiasBitmask(oferta.diaSemana);
    }

  }, 50);
}

function formatearHoraInput(valor) {
  const h = Math.floor(valor / 100);
  const m = valor % 100;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatearFechaInput(valor) {
  const mes = Math.floor(valor / 100);
  const dia = valor % 100;

  const year = new Date().getFullYear();

  return `${year}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function aplicarDiasBitmask(mask) {

  document.querySelectorAll(".dia-btn").forEach(btn => {
    const i = parseInt(btn.dataset.dia);
    const bit = 6 - i;

    if (mask & (1 << bit)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

}

// document.addEventListener("DOMContentLoaded", () => {

//   const btnCancelarOferta = document.getElementById("btnCancelarOferta");

//   if (btnCancelarOferta) {
//     btnCancelarOferta.onclick = () => {
//       document.getElementById("oferta-modal-bg").classList.remove("show");
//     };
//   }

// });