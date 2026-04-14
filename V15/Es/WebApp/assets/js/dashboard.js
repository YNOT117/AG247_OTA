// ================= MOCK CSV =================
function getMockCSV() {
  return `Producto,Cantidad(L),Venta($),Fecha,Hora,Pago
Agua,Garrafon,30,2026-03-20,10:30,Monedas/Efectivo
Hielo,10kg,70,2026-03-16,10:30,Monedas/Efectivo
Hielo,5kg,10,2026-03-20,11:00,Nayax
Agua_Alcalina,Botella,12,2026-03-20,12:15,Telegram
Enjuague,1,10,2026-03-21,13:00,Saldo
Agua,Garrafon,30,2026-03-21,10:30,Monedas/Efectivo
Hielo,5kg,10,2026-03-22,11:00,Nayax
Agua_Alcalina,Botella,12,2026-03-22,12:15,Telegram
Enjuague,1,10,2026-03-22,13:00,Saldo
`;
}

function getCSSVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

// ================= PARSER CSV =================
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    let obj = {};

    headers.forEach((h, i) => {
      obj[h] = values[i];
    });

    return obj;
  });
}

// ================= FETCH =================
async function fetchVentas() {

  if (MOCK) {
    return parseCSV(getMockCSV());
  }

  try {
    const res = await fetch("/ventas.csv");
    const text = await res.text();
    return parseCSV(text);
  } catch (err) {
    console.error("Error cargando ventas:", err);
    return [];
  }
}

// ================= PROCESAR =================
function procesarVentas(data) {

  let totalVentas = data.length;
  let balance = 0;
  let ventasHoy = 0;

  const porProducto = {};

  const hoyStr = getFechaLocal();

  data.forEach(v => {

    const producto = v["Producto"] || "Desconocido";
    const venta = parseFloat(v["Venta($)"]) || 0;
    const fecha = v["Fecha"];

    balance += venta;

    // conteo por producto
    if (!porProducto[producto]) {
      porProducto[producto] = 0;
    }
    porProducto[producto] += venta;

    // ventas hoy
    if (fecha === hoyStr) {
      ventasHoy++;
    }

  });

  // 🔥 producto top
  let topProducto = "-";
  let max = 0;

  for (let p in porProducto) {
    if (porProducto[p] > max) {
      max = porProducto[p];
      topProducto = p;
    }
  }

  return {
    totalVentas,
    balance,
    porProducto,
    ventasHoy,
    topProducto
  };
}

// ================= PLUGIN DONUT =================
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

    ctx.save();
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(`$${total.toFixed(0)}`, width / 2, height / 2);
    ctx.restore();
  }
};

// ================= CHART DONUT =================
let chart;

function renderChart(data) {

  const labels = Object.keys(data);
  const values = Object.values(data);

  if (chart) chart.destroy();

  const ctx = document.getElementById("ventasChart")?.getContext("2d");
  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        hoverOffset: 30,
        backgroundColor: [
          "#d47171",
          "#597bd8",
          "#8e7bd8",
          "#d8a86b",
          "#6bd8b0",
          "#ff9f40",
          "#4bc0c0"
        ],
        borderWidth: 0
      }]
    },
    // plugins: [centerTextPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          backgroundColor: getCSSVar('--card'),
          titleColor: getCSSVar('--text'),
          bodyColor: getCSSVar('--text'),
          borderColor: getCSSVar('--accent1'),
          borderWidth: 1,
          cornerRadius: 10,  
          caretSize: 6,    
          padding: 10,
          displayColors: false,

          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percent = ((value / total) * 100).toFixed(1);

              return `${context.label}: $${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

// ================= UI =================
function renderResumen({ totalVentas, balance, ventasHoy, topProducto }) {

  const totalEl = document.getElementById("totalVentas");
  const balanceEl = document.getElementById("balance");
  const hoyEl = document.getElementById("ventasHoy");
  const topEl = document.getElementById("topProducto");

  if (totalEl) totalEl.textContent = totalVentas;
  if (balanceEl) balanceEl.textContent = `$${balance.toFixed(2)}`;
  if (hoyEl) hoyEl.textContent = ventasHoy;
  if (topEl) topEl.textContent = topProducto;
}

// ================= MAIN =================
async function cargarVentas() {

  try {

    const data = await fetchVentas();

    const resumen = procesarVentas(data);

    renderResumen(resumen);
    renderChart(resumen.porProducto);

  } catch (err) {
    console.error("Error en cargarVentas:", err);
  }

}

// ================= INIT =================
// document.addEventListener("DOMContentLoaded", () => {
//   // Se renderisan en initTheme() en global.js para que se muestren las etiquetas de la grafica correctamente 
//   // cargarVentas();
//   // cargarGrafica7DiasDesdeCSV();
  
// });
document.addEventListener("DOMContentLoaded", async () => {

  showLoader();
  const logout = document.getElementById("logout");
  validarSesion();
  // 🔥 cargar TODO aquí
  await cargarVentas();
  await cargarGrafica7DiasDesdeCSV();
  initSSE();

  // 🔥 limpiar estado
  sessionStorage.removeItem("loading");


  // 🔥 ocultar loader cuando TODO terminó
  hideLoader();
});

 /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

  /*-------------
  SSE
  */
  async function recargarDashboard() {
    await cargarVentas();
    await cargarGrafica7DiasDesdeCSV();
  }

  function initSSE() {
    try {
      const evtSource = new EventSource("/events");

      evtSource.addEventListener("nuevaVenta", async () => {

        console.log("🔥 Nueva venta en dashboard");

        await recargarDashboard();

        // 🔥 animación ligera
        const cont = document.querySelector(".ventas-top");
        if (cont) {
          cont.style.boxShadow = "0 0 20px rgba(255,122,26,0.5)";
          setTimeout(() => cont.style.boxShadow = "none", 600);
        }

      });

    } catch (err) {
      console.warn("SSE no disponible");
    }
  }


// ================= CHART 7 DÍAS =================
function getFechaLocal() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

let grafica7dias = null;
async function cargarGrafica7DiasDesdeCSV() {

  try {

    const data = await fetchVentas();

    const labels = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
    const ventas = [0,0,0,0,0,0,0];

    const hoy = new Date();

    function fechaADias(y, m, d) {
      return y * 365 + m * 30 + d;
    }

    const hoy_abs = fechaADias(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      hoy.getDate()
    );

    function mapWdayToIndex(wday) {
      if (wday === 0) return 6;
      return wday - 1;
    }

    data.forEach(v => {

      const fechaStr = v["Fecha"];
      if (!fechaStr) return;

      const [y, m, d] = fechaStr.split("-").map(Number);

      const fecha_abs = fechaADias(y, m, d);
      const diff = hoy_abs - fecha_abs;

      if (diff < 0 || diff >= 7) return;

      const fechaObj = new Date(y, m - 1, d);
      const index = mapWdayToIndex(fechaObj.getDay());

      const venta = parseFloat(v["Venta($)"]) || 0;

      ventas[index] += venta;

    });

    renderGrafica7Dias(labels, ventas);

  } catch (err) {
    console.log("Error 7 días:", err);
  }
}

// ================= RENDER 7 DÍAS =================
function renderGrafica7Dias(labels, data) {

  const ctx = document.getElementById("chart7dias")?.getContext("2d");
  if (!ctx) return;

  if (grafica7dias) grafica7dias.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(255, 122, 26, 0.45)");
  gradient.addColorStop(1, "rgba(255, 122, 26, 0)");

  grafica7dias = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ventas últimos 7 días",
        data,
        borderColor: "#ff7a1a",
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#ff7a1a"
      }]
    },
    plugins: [ChartDataLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: { color: getCSSVar('--text') },
          grid: { color: getCSSVar('--muted') + "33" } // transparencia suave
        },
        x: {
          ticks: { color: getCSSVar('--text') },
          grid: { color: getCSSVar('--muted') + "33" } // transparencia suave
        }
      },
      plugins: {
        datalabels: {
          color: getCSSVar('--text'),
          anchor: "end",
          align: "top",
          font: {
            size: 10,
            weight: "bold"
          },
          formatter: value => value === 0 ? "" : `$${value}`
        },
        legend: { display: false }
      }
    }
  });
}