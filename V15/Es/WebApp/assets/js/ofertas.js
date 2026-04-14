const OFERTA_UNICA = 0;
const OFERTA_SEMANAL = 1;
const OFERTA_DIARIA = 2;

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

let contenedor;
let selector;

document.addEventListener("DOMContentLoaded", () => {

  contenedor = document.getElementById("ofertaDinamica");
  const modal = document.getElementById("oferta-modal-bg");

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target.id === "oferta-modal-bg") {
            modal.classList.remove("show");
            }
        });
    }

  initCustomSelect(
    [
      { label: "Oferta única", value: "0" },
      { label: "Oferta diaria", value: "2" },
      { label: "Oferta semanal", value: "1" }
    ],
    "0",
    "customOfertaTipo"
  );

  const customTipo = document.getElementById("customOfertaTipo");

  customTipo.addEventListener("click", () => {
    setTimeout(() => {
      renderOferta();
    }, 50);
  });

  renderOferta();

  /* ===== SWITCH ===== */

  const switchOferta = document.getElementById("ofertaEnabled");
  const estadoLabel = document.getElementById("ofertaEstado");

  if (switchOferta && estadoLabel) {

    function actualizarEstado() {
      if (switchOferta.checked) {
        estadoLabel.textContent = "Activa";
        estadoLabel.classList.add("activo");
        estadoLabel.classList.remove("inactivo");
      } else {
        estadoLabel.textContent = "Desactivada";
        estadoLabel.classList.add("inactivo");
        estadoLabel.classList.remove("activo");
      }
    }

    actualizarEstado();
    switchOferta.addEventListener("change", actualizarEstado);
  }

});

/* ================= RENDER ================= */

function renderOferta() {
  const container = document.getElementById("customOfertaTipo");
  const tipo = parseInt(container.dataset.value);

  contenedor.innerHTML = "";

  if (tipo === OFERTA_UNICA) renderUnica();
  if (tipo === OFERTA_DIARIA) renderDiaria();
  if (tipo === OFERTA_SEMANAL) renderSemanal();
}

/* ================= UNICA ================= */

function renderUnica() {
  contenedor.innerHTML = `
    <div class="oferta-grid">

      <div class="field">
        <input type="date" id="fechaInicio">
      </div>

      <div class="field">
        <input type="date" id="fechaFin">
      </div>

      <div class="field">
        <input type="time" id="horaInicio">
      </div>

      <div class="field">
        <input type="time" id="horaFin">
      </div>

    </div>
  `;
}

/* ================= DIARIA ================= */

function renderDiaria() {
  contenedor.innerHTML = `
    <div class="oferta-dinamica">

      <div class="oferta-row">
        <div class="field">
          <label>Hora inicio</label>
          <input type="time" id="horaInicio">
        </div>

        <div class="field">
          <label>Hora fin</label>
          <input type="time" id="horaFin">
        </div>
      </div>

    </div>
  `;
}

/* ================= SEMANAL ================= */
function renderSemanal() {
  contenedor.innerHTML = `
    <div class="oferta-grid">

      <!-- DIAS -->
      <div class="field full">
        <label>Días</label>
        <div class="dias-semana">
          ${dias.map((d, i) => `
            <div class="dia-btn" data-dia="${i}">${d}</div>
          `).join("")}
        </div>
      </div>

      <!-- HORAS -->
      <div class="field">
        <input type="time" id="horaInicio">
      </div>

      <div class="field">
        <input type="time" id="horaFin">
      </div>

    </div>
  `;

  document.querySelectorAll(".dia-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });
}

/* ================= HELPERS ================= */

function limitarFechas() {
  const hoy = new Date();
  const max = new Date();
  max.setDate(hoy.getDate() + 30);

  const minStr = hoy.toISOString().split("T")[0];
  const maxStr = max.toISOString().split("T")[0];

  const fInicio = document.getElementById("fechaInicio");
  const fFin = document.getElementById("fechaFin");

  if (fInicio && fFin) {
    fInicio.min = minStr;
    fInicio.max = maxStr;

    fFin.min = minStr;
    fFin.max = maxStr;
  }
}

function obtenerDias() {
  return [...document.querySelectorAll(".dia-btn.active")]
    .map(btn => parseInt(btn.dataset.dia));
}

/* ================= EXPORT DATA ================= */

function obtenerOferta() {

  const enabled = document.getElementById("ofertaEnabled")?.checked || false;

  const tipo = parseInt(
    document.getElementById("customOfertaTipo").dataset.value
  );

  return {
    enabled,

    tipo: enabled ? tipo : 0,

    precioPromo: enabled
      ? parseFloat(document.getElementById("precioPromo")?.value || 0)
      : 0,

    diaSemana: (enabled && tipo === 1)
      ? obtenerDiasBitmask()
      : 0,

    fechaInicio: (enabled && tipo === 0)
      ? convertirFecha(document.getElementById("fechaInicio")?.value)
      : 0,

    fechaFin: (enabled && tipo === 0)
      ? convertirFecha(document.getElementById("fechaFin")?.value)
      : 0,

    horaInicio: enabled
      ? convertirHora(document.getElementById("horaInicio")?.value)
      : 0,

    horaFin: enabled
      ? convertirHora(document.getElementById("horaFin")?.value)
      : 0
  };
}

document.addEventListener("DOMContentLoaded", () => {

  const btnGuardar = document.getElementById("btnGuardarOferta");
  if (!btnGuardar) return;

 btnGuardar.addEventListener("click", async () => {

  const oferta = obtenerOferta();
  const index = window.productoOfertaActual;
  const producto = window.productos?.[index];

  const validacion = validarOferta(oferta, producto);

  if (!validacion.ok) {
    showToast(validacion.msg, "error");
    return;
  }

  const payload = {
    id: index,
    ...oferta
  };

  App.showLoader();

  try {

    if (MOCK) {

      window.ofertas[index] = payload;

      showToast("Oferta guardada (mock)", "success");

      App.construirCards(); // opcional

    } else {

      await fetch("/ofertaUpdate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      showToast("Oferta guardada", "success");

      await App.cargarInventario();
    }

    // 🔥 AQUÍ se cierra (correcto)
    document.getElementById("oferta-modal-bg").classList.remove("show");

  } catch (err) {
    console.error(err);
    showToast("Error al guardar oferta", "error");
  }

  App.hideLoader();
});

});

function validarOferta(oferta, producto) {

  if (!oferta.enabled) {
    return { ok: true };
  }

  /* ===== PRECIO ===== */

  if (!oferta.precioPromo || oferta.precioPromo <= 0) {
    return { ok: false, msg: "Ingresa un precio válido" };
  }

  // 👉 opcional (cuando quieras reactivarlo)
  /*
  if (oferta.precioPromo > producto.precio) {
    return { ok: false, msg: "El precio promocional no puede ser mayor al actual" };
  }
  */

  /* ===== TIPO ===== */

  if (oferta.tipo === OFERTA_UNICA) {

    if (!oferta.fechaInicio || !oferta.fechaFin) {
      return { ok: false, msg: "Selecciona fechas válidas" };
    }

    if (oferta.fechaFin < oferta.fechaInicio) {
      return { ok: false, msg: "La fecha final no puede ser antes que la inicial" };
    }
  }

  if (oferta.tipo === OFERTA_SEMANAL) {

    if (!oferta.diaSemana || oferta.diaSemana === 0) {
      return { ok: false, msg: "Selecciona al menos un día" };
    }
  }

  /* ===== HORAS ===== */

  if (!oferta.horaInicio || !oferta.horaFin) {
    return { ok: false, msg: "Selecciona horas válidas" };
  }

  // if (oferta.horaFin <= oferta.horaInicio) {
  //   return { ok: false, msg: "La hora final debe ser mayor a la inicial" };
  // }

  return { ok: true };
}

function convertirHora(horaStr) {
  if (!horaStr) return 0;
  const [h, m] = horaStr.split(":");
  return parseInt(h) * 100 + parseInt(m);
}

function convertirFecha(fechaStr) {
  if (!fechaStr) return 0;

// 🔥 parse manual (SIN timezone)
  const [year, mes, dia] = fechaStr.split("-").map(Number);

  return (mes * 100) + dia; // 👉 formato ESP32
}

function obtenerDiasBitmask() {
  let mask = 0;

  document.querySelectorAll(".dia-btn.active").forEach(btn => {
    const i = parseInt(btn.dataset.dia);
    const bit = 6 - i; // 🔥 ajuste correcto
    mask |= (1 << bit);
  });

  return mask;
}