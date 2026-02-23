/* ============================================================
   VENTAS.JS — Sistema completo de ventas + filtros + SSE
   ============================================================ */

let ventas = [];            // Todas las ventas del CSV
let graficaProductos = null;

/* ============ Al cargar la página ============ */

window.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById("loader");
    // setTimeout(() => {
    //     loader.classList.add("hidden");
    // }, 300);

    /* ========= Loader al cambiar de página desde el menú ========= */
    document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", e => {
        const loader = document.getElementById("loader");
        const url = link.getAttribute("href");

        if (!url || url === "#") return;

        e.preventDefault();             // detener navegación inmediata
        if (isMobile()) {
            sidebar.classList.remove("show");
            overlay.classList.remove("show");
        }
        loader.classList.remove("hidden"); // mostrar loader

        setTimeout(() => {
        window.location.href = url;   // navegar después del efecto
        }, 200);
    });
    });

  


    const logout = document.getElementById("logout");
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const overlay = document.getElementById("overlay");
    const statusDot = document.getElementById("status");


    /* ================== Manejo del menú ================== */
    function isMobile() {
        return window.innerWidth <= 750;
    }

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

    /* ================== Logout ================== */
    logout.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../index.html";
    });

    /* ================== Protección por sesión ================== */
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    /* ================== Cargar CSV inicial ================== */
    cargarCSV();

    /* ================== Tabs ================== */
    activarTabsVentas();

    /* ================== SSE — Nuevas ventas ================== */
    const evtSource = new EventSource("/events");

    evtSource.addEventListener("nuevaVenta", (e) => {
        agregarVentaNueva(e.data);
    });

    /* Botón actualizar manual */
    document.getElementById("btnActualizar").addEventListener("click", cargarCSV);

    loader.classList.add("hidden");

    /* ================= VERIFICACIÓN DE CONEXIÓN CADA 3s ================= */
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

});


/* ============================================================
   Cargar y procesar el CSV
   ============================================================ */

async function cargarCSV() {
    try {
        const res = await fetch("/ventas.csv");
        const texto = await res.text();

        ventas = parseCSV(texto);

        llenarTabla();
        llenarFiltros();
        actualizarProductos();
    }
    catch (err) {
        console.error("Error cargando CSV:", err);
    }
}


/* ============= Convertir CSV a array de objetos ============= */

function parseCSV(texto) {

    let lineas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    // ❗ Omitir SIEMPRE la primera fila (encabezados)
    if (lineas.length > 0) lineas = lineas.slice(1);

    const lista = [];

    for (let linea of lineas) {
        const campos = linea.split(",");

        if (campos.length < 7) continue;

        lista.push({
            id: campos[0],
            producto: campos[1],
            cantidad: campos[2],
            venta: parseFloat(campos[3]),
            fecha: campos[4].replace("'", ""), // quitar comilla si existe
            hora: campos[5],
            pago: campos[6]
        });
    }

    return lista;
}


/* ============================================================
   TABLA DE VENTAS
   ============================================================ */

function llenarTabla() {
    const cuerpo = document.querySelector("#tablaVentas tbody");
    cuerpo.innerHTML = "";

    const filtroTxt = document.getElementById("buscar").value.toLowerCase();
    const filtroProd = document.getElementById("filtroProducto").value;
    const filtroPago = document.getElementById("filtroPago").value;

    const filtradas = ventas.filter(v => {

        if (filtroTxt && !(
            v.producto.toLowerCase().includes(filtroTxt) ||
            v.pago.toLowerCase().includes(filtroTxt) ||
            v.fecha.toLowerCase().includes(filtroTxt)
        )) return false;

        if (filtroProd && v.producto !== filtroProd) return false;
        if (filtroPago && v.pago !== filtroPago) return false;

        return true;
    });

    for (let v of filtradas) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${v.producto}</td>
            <td>${v.cantidad}</td>
            <td>$${v.venta.toFixed(2)}</td>
            <td>${v.fecha}</td>
            <td>${v.hora}</td>
            <td>${v.pago}</td>
        `;

        cuerpo.appendChild(tr);
    }
}


/* ============================================================
   FILTROS
   ============================================================ */

function llenarFiltros() {
    const filtroProd = document.getElementById("filtroProducto");

    const productos = [...new Set(ventas.map(v => v.producto))];

    filtroProd.innerHTML = `<option value="">Producto (todos)</option>`;

    for (let p of productos) {
        filtroProd.innerHTML += `<option>${p}</option>`;
    }

    // recargar tabla cuando cambien los filtros
    document.getElementById("buscar").oninput = llenarTabla;
    document.getElementById("filtroProducto").onchange = llenarTabla;
    document.getElementById("filtroPago").onchange = llenarTabla;
}


/* ============================================================
   SSE — Nueva venta
   ============================================================ */

function agregarVentaNueva(linea) {
    if (!linea || linea.length < 5) return;

    const campos = linea.split(",");

    if (campos.length < 7) return;

    const ventaNueva = {
        id: campos[0],
        producto: campos[1],
        cantidad: campos[2],
        venta: parseFloat(campos[3]),
        fecha: campos[4].replace("'", ""),
        hora: campos[5],
        pago: campos[6]
    };

    // agregar al array principal
    ventas.push(ventaNueva);

    // refrescar tabla y productos
    llenarTabla();
    actualizarProductos();

    // animación ligera
    const cont = document.querySelector(".table-container");
    cont.style.boxShadow = "0 0 20px rgba(255,122,26,0.5)";
    setTimeout(() => cont.style.boxShadow = "none", 600);
}


/* ============================================================
   TAB — Ventas por producto
   ============================================================ */

function actualizarProductos() {


    const caja = document.getElementById("cardsProductos");
    caja.innerHTML = "";

    const resumen = {};

    for (let v of ventas) {
        if (!resumen[v.producto]) {
            resumen[v.producto] = { ventas: 0, cantidad: 0 };
        }
        resumen[v.producto].ventas += v.venta;
        resumen[v.producto].cantidad += parseFloat(v.cantidad);
    }

    for (let producto in resumen) {
        const card = document.createElement("div");
        card.className = "card-prod";

        card.innerHTML = `
          <h3>${producto}</h3>
          <p class="num">$${resumen[producto].ventas.toFixed(2)}</p>
          <!--<small>${resumen[producto].cantidad} vendidos</small>-->
        `;


        caja.appendChild(card);
    }

    actualizarGraficaProductos(resumen);
}


/* ============================================================
   Gráfica por producto (Chart.js)
   ============================================================ */

function actualizarGraficaProductos(resumen) {

    const labels = Object.keys(resumen);
    const data = labels.map(p => resumen[p].ventas);

    const ctx = document.getElementById("graficaProductos").getContext("2d");

    if (graficaProductos) graficaProductos.destroy();

    graficaProductos = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Ventas por producto ($)",
                data,
                backgroundColor: "#ff7a1a"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: { color: "#fff" }
                },
                x: {
                    ticks: { color: "#fff" }
                }
            }
        }
    });
}


/* ============================================================
   Tabs
   ============================================================ */

function activarTabsVentas() {
    const tabs = document.querySelectorAll(".tab");
    const contenidos = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            contenidos.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
        });
    });
}
