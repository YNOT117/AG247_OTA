window.addEventListener("DOMContentLoaded", () => {

  /* ============================= ELEMENTOS ============================= */
  const loader      = document.getElementById("loader");
  const statusDot   = document.getElementById("status");
  const sidebar     = document.getElementById("sidebar");
  const menuBtn     = document.getElementById("menuBtn");
  const overlay     = document.getElementById("overlay");
  const logout      = document.getElementById("logout");

  const modalBG     = document.getElementById("modal-bg");
  const prodPrecio  = document.getElementById("prodPrecio");
  const prodCantidad = document.getElementById("prodCantidad");
  const prodTiempo  = document.getElementById("prodTiempo");
  const prodBloqueo = document.getElementById("prodBloqueo");
  const prodCashback = document.getElementById("prodCashback");

  const cardsMobile = document.getElementById("cardsMobile");


  /* ============================================
    LOADER AL CAMBIAR DE PÁGINA (GLOBAL)
=============================================== */

  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    const url = link.getAttribute("href");

    if (!url || url === "#" || link.id === "logout") return;

    link.addEventListener("click", e => {
      e.preventDefault();

      // Mostrar loader
      document.getElementById("loader").classList.remove("hidden");

      // Esperar un frame para asegurar visibilidad
      requestAnimationFrame(() => {
        window.location.href = url;
      });
    });
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

  /* ============================= VARIABLES ============================= */
  let productos = [];
  let nombresDisponibles = [];
  let tipoMaquina = 0; 
  let editIndex = -1;

  document.getElementById("btnCancelar").addEventListener("click", () => {
    modalBG.classList.remove("show");
  });

  function isMobile() { return window.innerWidth <= 750; }

  /* ============================= MENÚ ============================= */
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

  /* ============================= CARGAR INVENTARIO ============================= */
  cargarInventario();

  async function cargarInventario() {
    try {
      const r1 = await fetch("/inventario");
      const json1 = await r1.json();

      productos = json1.productos || [];
      tipoMaquina = json1.tipo || 0;

      const r2 = await fetch("/nombresInventario");
      nombresDisponibles = (await r2.json()).nombres || [];

      construirTabla();
      construirCards();

    } catch (e) {
      console.log("Error cargando inventario:", e);
    }
    loader.classList.add("hidden");
  }

  /* ============================= TABLA (PC) ============================= */
  function construirTabla() {
    const tbody = document.getElementById("invTableBody");
    tbody.innerHTML = "";

    productos.forEach((p, i) => {

      const cantHTML   = (tipoMaquina === 2) ? "" : `<td>${p.cantidad}</td>`;
      const blockHTML  = (tipoMaquina === 2) ? "" : `<td>${p.bloqueado ? "🔒" : "✔️"}</td>`;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.nombre}</td>
        <td>$${p.precio}</td>
        ${cantHTML}
        <td>${p.tiempo}</td>
        <td>${p.promocion}%</td>
        ${blockHTML}
        <td><button class="btnEditar" data-i="${i}">Editar</button></td>
      `;

      tbody.appendChild(fila);
    });

    document.querySelectorAll(".btnEditar").forEach(btn => {
      btn.onclick = () => abrirModal(parseInt(btn.dataset.i));
    });
  }

  /* ============================= CARDS MÓVIL ============================= */
  function construirCards() {
    cardsMobile.innerHTML = "";

    productos.forEach((p, i) => {

      const cantHTML  = (tipoMaquina === 2) ? "" : `<small>Cantidad: ${p.cantidad}</small><br>`;
      const blockHTML = (tipoMaquina === 2) ? "" : `<small>${p.bloqueado ? "🔒 Bloqueado" : "✔️ Activo"}</small><br>`;

      const div = document.createElement("div");
      div.className = "card-item";

      div.innerHTML = `
        <h3>${p.nombre}</h3>
        <small>Precio: $${p.precio}</small><br>
        ${cantHTML}
        <small>Tiempo: ${p.tiempo} Seg</small><br>
        <small>Cashback: ${p.promocion}%</small><br>
        ${blockHTML}
        <button class="btnEditar" data-i="${i}" style="margin-top:10px;">Editar</button>
      `;

      cardsMobile.appendChild(div);
    });

    document.querySelectorAll(".btnEditar").forEach(btn => {
      btn.onclick = () => abrirModal(parseInt(btn.dataset.i));
    });
  }

  /* ============================= MODAL ============================= */
  function abrirModal(i) {
    editIndex = i;
    const p = productos[i];

    const sel = document.getElementById("prodNombreSelect");
    const inp = document.getElementById("prodNombreInput");

    const labelPrecio   = document.querySelector("label[for='prodPrecio']");
    const labelCantidad = document.querySelector("label[for='prodCantidad']");
    const labelTiempo   = document.querySelector("label[for='prodTiempo']");
    const labelCashback = document.querySelector("label[for='prodCashback']");

    const chkRow = document.querySelector(".chk-row");

    const inPrecio   = prodPrecio;
    const inCantidad = prodCantidad;
    const inTiempo   = prodTiempo;

    sel.classList.add("hidden");
    inp.classList.add("hidden");

    /* -------- PURIFICADORA -------- */
    if (tipoMaquina === 2) {

      sel.innerHTML = "";
      nombresDisponibles.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n;
        opt.textContent = n;
        if (n === p.nombre) opt.selected = true;
        sel.appendChild(opt);
      });

      sel.classList.remove("hidden");

      labelPrecio.style.display = "block";
      inPrecio.style.display = "block";

      labelTiempo.style.display = "block";
      inTiempo.style.display = "block";

      labelCantidad.style.display = "none";
      inCantidad.style.display = "none";

      chkRow.style.display = "none";

    } else {
      inp.value = p.nombre;
      inp.classList.remove("hidden");

      labelPrecio.style.display   = "";
      labelCantidad.style.display = "";
      labelTiempo.style.display   = "";
      chkRow.style.display        = "";

      inPrecio.style.display   = "";
      inCantidad.style.display = "";
      inTiempo.style.display   = "";

      prodBloqueo.checked = p.bloqueado;
    }

    // --- CASHBACK SIEMPRE VISIBLE ---
    labelCashback.style.display = "";
    prodCashback.style.display = "";
    prodCashback.value = p.promocion;

    prodPrecio.value   = p.precio;
    prodCantidad.value = p.cantidad;
    prodTiempo.value   = p.tiempo;

    modalBG.classList.add("show");
  }

  /* ============================= GUARDAR ============================= */
  document.getElementById("btnGuardar").onclick = async () => {

     // Mostrar loader inmediatamente
    loader.classList.remove("hidden");

    let nombreFinal = (tipoMaquina === 2)
      ? document.getElementById("prodNombreSelect").value
      : document.getElementById("prodNombreInput").value.trim();

    const precioFinal = parseInt(prodPrecio.value);
    const tiempoFinal = parseFloat(prodTiempo.value);
    const cashbackFinal = parseInt(prodCashback.value);

    let cantidadFinal, bloqueoFinal;

    if (tipoMaquina === 2) {
      cantidadFinal = 0;
      bloqueoFinal = false;
    } else {
      cantidadFinal = parseFloat(prodCantidad.value);
      bloqueoFinal = prodBloqueo.checked;
    }

    const data = {
      id: editIndex,
      nombre: nombreFinal,
      precio: precioFinal,
      cantidad: cantidadFinal,
      tiempo: tiempoFinal,
      promocion: cashbackFinal,
      bloqueado: bloqueoFinal
    };

    modalBG.classList.remove("show");

    try {
      await fetch("/inventarioUpdate", {
        method: "POST",
        body: JSON.stringify(data)
      });

      cargarInventario();

    } catch (e) {
      console.log("Error al guardar:", e);
    }
  };

  // Ocultar loader al finalizar
    loader.classList.add("hidden");

});
