// ================= MOCK CSV =================
// function getMockCSV() {
// return `Producto,Cantidad(L),Venta($),Fecha,Hora,Pago
// hielo,5kg,10,2026-03-24,10:00,nayax
// hielo,10kg,20,2026-03-23,11:00,efectivo
// hielo,2.5kg,5,2026-03-23,13:00,efectivo
// hielo,3_kg,6,2026-03-22,09:00,nayax
// hielo,7_kg,14,2026-03-21,15:00,efectivo`;
// }

// function getMockCSV() {
// return `Producto,Cantidad(L),Venta($),Fecha,Hora,Pago
// agua,garrafon,20,2026-03-24,08:00,efectivo
// aguaalcalina,botella,12,2026-03-24,09:00,telegram
// hielo,5kg,10,2026-03-24,10:00,nayax
// agua,1/2garrafon,10,2026-03-23,08:00,efectivo
// hielo,3_kg,6,2026-03-23,10:00,nayax`;
// }

function getMockCSV() {
return `Producto,Cantidad(L),Venta($),Fecha,Hora,Pago
suavizante,1.5,15,2026-03-24,08:00,efectivo
jabon,2,20,2026-03-24,10:00,nayax
cloro,1,10,2026-03-23,09:00,efectivo
desinfectante,3,30,2026-03-23,12:00,tarjeta
suavizante,2.5,25,2026-03-22,11:00,efectivo`;
}

// function getMockCSV() {
// return `Producto,Cantidad(L),Venta($),Fecha,Hora,Pago
// agua,garrafon,20,2026-03-24,08:00,efectivo
// aguaalcalina,botella,12,2026-03-24,09:00,telegram
// agua,1/2garrafon,10,2026-03-23,08:00,efectivo
// aguaalcalina,garrafon,25,2026-03-23,09:00,telegram
// agua,botella,5,2026-03-22,08:00,efectivo`;
// }
// Para colores globales
function getCSSVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

let modoHoras = "hoy";
let cacheData = [];

// ================= PARSER =================
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    let obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

// ================= FETCH =================
async function fetchVentas() {
  if (MOCK) return parseCSV(getMockCSV());

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
function procesar(data) {

  let balance = 0;
  let total = data.length;
  let ventasHoy = 0;

  // 🔥 métricas separadas
  let agua = 0;
  let alcalina = 0;
  let hielo = 0;
  let kilos = 0;   // croquetas / granos
  let litros = 0;  // limpieza / automotriz

  const porProducto = {};
  const porHora = Array(24).fill(0);
  const porPago = {};

  const fechas = data.map(v => v["Fecha"]).filter(Boolean);
  const hoy = fechas.sort().slice(-1)[0];

  const hoyDate = new Date(hoy + "T00:00:00");

  const ayerDate = new Date(hoyDate);
  ayerDate.setDate(ayerDate.getDate() - 1);

  const ayer = `${ayerDate.getFullYear()}-${String(ayerDate.getMonth()+1).padStart(2,"0")}-${String(ayerDate.getDate()).padStart(2,"0")}`;

  // 🔥 parser avanzado de cantidades
  // function parseCantidad(valor) {

  //   if (!valor) return 0;

  //   // ===== AGUA =====
  //   if (valor === "Garrafon") return 1;
  //   if (valor === "1/2Garrafon") return 0.5;
  //   if (valor === "Botella") return 0.05;

  //   if (valor.includes("_Garrafones")) {
  //     return parseFloat(valor.split("_")[0]) || 0;
  //   }

  //   // ===== HIELO / KILOS =====
  //   if (valor.includes("kg")) return parseFloat(valor);

  //   if (valor.includes("_Kg")) {
  //     return parseFloat(valor.split("_")[0]) || 0;
  //   }

  //   return 0;
  // }

// function parseCantidad(valor) {

//   if (!valor) return 0;

//   valor = valor.toLowerCase().trim();

//   // ===== AGUA =====
//   if (valor === "garrafon") return 1;
//   if (valor === "1/2garrafon") return 0.5;
//   if (valor === "botella") return 0.05;

//   if (valor.includes("_garrafones")) {
//     return parseFloat(valor.split("_")[0]) || 0;
//   }

//   // ===== HIELO / KILOS =====
//   if (valor.includes("kg")) {
//     return parseFloat(valor) || parseFloat(valor.split("_")[0]) || 0;
//   }

//   // ===== LÍQUIDOS =====
//   if (!isNaN(valor)) {
//     return parseFloat(valor);
//   }

//   return 0;
// }

function parseCantidad(valor, tipoMaquina) {

  if (!valor) return 0;

  valor = valor.toLowerCase().trim();

  // ===== AGUA =====
  if (valor === "garrafon") return 1;
  if (valor === "1/2garrafon") return 0.5;
  if (valor === "botella") return 0.05;

  if (valor.includes("_garrafones")) {
    return parseFloat(valor.split("_")[0]) || 0;
  }

  // ===== HIELO =====
  if (valor.includes("kg")) {
    return parseFloat(valor) || parseFloat(valor.split("_")[0]) || 0;
  }

  // ===== NÚMEROS PUROS =====
  if (!isNaN(valor)) {

    const num = parseFloat(valor);

    // 🔥 aquí está la clave
    // tipo 1 = croquetas
    // tipo 3 = granos
    if (tipoMaquina === 1 || tipoMaquina === 3) {
      return num; // 👉 kilos
    }

    // tipo 0 = limpieza
    // tipo 4 = automotriz
    if (tipoMaquina === 0 || tipoMaquina === 4) {
      return num; // 👉 litros
    }

    // fallback
    return num;
  }

  return 0;
}

const tipo = window.tipoMaquina;
data.forEach(v => {

  const venta = parseFloat(v["Venta($)"]) || 0;
  const producto = (v["Producto"] || "").toLowerCase();
  const fecha = v["Fecha"];
  const hora = parseInt(v["Hora"]?.split(":")[0]);
  const pago = v["Pago"] || "Otro";
  const cantidadRaw = v["Cantidad(L)"] || "";

  const cantidad = parseCantidad(cantidadRaw, tipo);

  balance += venta;

  if (fecha === hoy) ventasHoy++;

  // ===== filtro por horas =====
  let incluir = false;

  if (modoHoras === "todo") incluir = true;
  if (modoHoras === "hoy" && fecha === hoy) incluir = true;
  if (modoHoras === "ayer" && fecha === ayer) incluir = true;

  if (modoHoras === "semana") {
    const fechaObj = new Date(fecha + "T00:00:00");
    const diff = (hoyDate - fechaObj) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff < 7) incluir = true;
  }

  if (incluir && !isNaN(hora)) {
    porHora[hora] += venta;
  }

  porProducto[v["Producto"]] = (porProducto[v["Producto"]] || 0) + venta;
  porPago[pago] = (porPago[pago] || 0) + venta;

  // ============================
  // 🔥 CLASIFICACIÓN CORRECTA
  // ============================

  if (tipo === 2) {
    // 🟢 PURIFICADORA (DUO / AGUA / HIELO)

    if (producto === "agua") {
      agua += cantidad;
    }
    else if (producto === "aguaalcalina") {
      alcalina += cantidad;
    }
    else if (producto.includes("hielo")) {
      hielo += cantidad;
    }

  } else if (tipo === 1 || tipo === 3) {
    // 🐶 🌾 CROQUETAS / GRANOS
    kilos += cantidad;

  } else if (tipo === 0 || tipo === 4) {
    // 🧼 🚗 LIMPIEZA / AUTOMOTRIZ
    litros += cantidad;

  }

});

  const top = Object.entries(porProducto)
    .sort((a,b) => b[1] - a[1])
    .slice(0,3);

  let metodoTop = "-";
  let maxPago = 0;

  for (let p in porPago) {
    if (porPago[p] > maxPago) {
      maxPago = porPago[p];
      metodoTop = p;
    }
  }

  const promedio = total ? balance / total : 0;

  return {
    balance,
    promedio,
    ventasHoy,
    top,
    porHora,
    metodoTop,
    agua,
    alcalina,
    hielo,
    kilos,
    litros
  };
}

// ================= UI =================
function renderUI(r) {

  document.getElementById("balanceHeader").textContent = `💰 $${r.balance.toFixed(2)}`;
  document.getElementById("ventasHoyHeader").textContent = `📅 ${r.ventasHoy} ventas hoy`;
  document.getElementById("promedio").textContent = `$${r.promedio.toFixed(2)}`;
  document.getElementById("metodoPago").textContent = r.metodoTop;

  // Card de top de productos 
  const ul = document.getElementById("topProductos");
  ul.innerHTML = "";
  const medallas = ["🥇", "🥈", "🥉"];
  r.top.forEach((p, i) => {
    const nombre = p[0].replaceAll("_", " ");
    const emoji = medallas[i] || "🏅";

    ul.innerHTML += `
      <li class="top-item">
        <div class="left">${emoji} ${nombre}</div>
        <div class="right">$${p[1]}</div>
      </li>
    `;
  });

  // Card de ventas realizadas, garrafones, litros o kilos 
  const card = document.getElementById("litros");
  const titulo = document.getElementById("cardCantidadTitulo");

  const tipo = window.tipoMaquina;
  const modo = window.modoMaquina;

  // 🔥 limpiar contenido
  card.innerHTML = "";

  if (tipo === 2 && modo === "DUO") {

    titulo.textContent = "💧🧊 Garrafones y Kg";

    let html = "";

    if (r.agua > 0) {
      html += `<div>💧 ${r.agua.toFixed(2)} Purificada</div>`;
    }

    if (r.alcalina > 0) {
      html += `<div>💧 ${r.alcalina.toFixed(2)} Alcalina</div>`;
    }

    if (r.hielo > 0) {
      html += `<div>🧊 ${r.hielo.toFixed(2)} kg</div>`;
    }

    card.innerHTML = html || `<div>Sin ventas</div>`;
  }

  else if (tipo === 2 && modo === "AGUA") {

    titulo.textContent = "💧 Garrafones de agua vendida";

    card.innerHTML = `
      <div>💧 ${r.agua.toFixed(2)} Purificada</div>
      ${r.alcalina > 0 ? `<div>💧 ${r.alcalina.toFixed(2)} Alcalina</div>` : ""}
    `;
  }
  else if (tipo === 2 && modo === "HIELO") {

    titulo.textContent = "🧊 Kilos vendidos";
    // card.textContent = `${r.kilos} kg`;
    card.textContent = `${r.hielo.toFixed(2)} kg`;

  }
  else {

    const map = {
      0: { text: "🧼 Litros vendidos", value: `${r.litros} L` },
      1: { text: "🐶 Kilos vendidos", value: `${r.kilos} kg` },
      3: { text: "🌾 Kilos vendidos", value: `${r.kilos} kg` },
      4: { text: "🚗 Litros vendidos", value: `${r.litros} L` }
    };

    const conf = map[tipo] || { text: "📦 Cantidad", value: "-" };

    titulo.textContent = conf.text;
    card.textContent = conf.value;
  }



}
// Parsear cantidades 
function parseCantidadAvanzada(producto, cantidadRaw) {

  if (!cantidadRaw) return 0;

  // ===== AGUA =====
  if (cantidadRaw === "Garrafon") return 1;
  if (cantidadRaw === "1/2Garrafon") return 0.5;
  if (cantidadRaw === "Botella") return 0.05;

  // Ej: "0.5_Garrafones", "1_Garrafones"
  if (cantidadRaw.includes("_Garrafones")) {
    return parseFloat(cantidadRaw.split("_")[0]) || 0;
  }

  // ===== HIELO =====
  if (cantidadRaw.includes("kg")) {
    return parseFloat(cantidadRaw);
  }

  // Ej: "3_Kg"
  if (cantidadRaw.includes("_Kg")) {
    return parseFloat(cantidadRaw.split("_")[0]) || 0;
  }

  return 0;
}

// ================= CHART =================
let chartHoras;
function renderHoras(data) {

  if (chartHoras) chartHoras.destroy();

  const ctx = document.getElementById("chartHoras").getContext("2d");

  chartHoras = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((_,i)=>`${i}:00`),
      datasets: [{
        data,
        backgroundColor: "#4f7cff"
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display:false } }
    }
  });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {

  showLoader();
  const logout = document.getElementById("logout");
  validarSesion();
  cargarTipoMaquina();

  cacheData = await fetchVentas();
  const r = procesar(cacheData);
  renderUI(r);
  renderHoras(r.porHora);


  const hist = agruparPorDia(cacheData);
  renderHistorico(
    hist.labels,
    hist.dinero,     // 🔥 antes era valores
    hist.variacion,
    hist.ventas
  );
  // console.log(hist);

  document.querySelectorAll(".toggle-btn").forEach(btn => {

    btn.addEventListener("click", () => {

      document.querySelectorAll(".toggle-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      modoHoras = btn.dataset.mode;
      // console.log("modo:", modoHoras);

      const r = procesar(cacheData);
      renderHoras(r.porHora);

    });

  });

  initSSE(); 

  hideLoader();

});

 /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

async function recargarVentasUI() {
  cacheData = await fetchVentas();

  const r = procesar(cacheData);
  renderUI(r);
  renderHoras(r.porHora);

  const hist = agruparPorDia(cacheData);
  renderHistorico(hist.labels, hist.dinero, hist.variacion, hist.ventas);
}

// function initSSE() {
//   try {
//     const evtSource = new EventSource("/events");

//     evtSource.addEventListener("nuevaVenta", (e) => {
//       agregarVentaNueva(e.data);
//     });

//   } catch (err) {
//     console.warn("SSE no disponible");
//   }
// }
function initSSE() {
  try {
    const evtSource = new EventSource("/events");

    evtSource.addEventListener("nuevaVenta", async () => {

      console.log("Nueva venta detectada 🔥");

      await recargarVentasUI();

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

// ================= TIPO MAQUINA =================
async function cargarTipoMaquina() {

  let tipo, modo;

  // 🔥 SIMULACIÓN
  if (MOCK) {
    tipo = 0;        // 2 = purificadora
    modo = "DUO";    // "DUO" | "AGUA" | "HIELO"
  } else {
    showLoader();
    try {
      const res = await fetch("/inventarioData");
      const json = await res.json();

      tipo = json.tipo;
      modo = json.modo;

    } catch (err) {
      console.log("Error tipo máquina:", err);

      // fallback seguro
      tipo = 2;
      modo = "AGUA";
    }finally {
      hideLoader(); // 🔥 no ocultar aquí
    }
  }

  // 🔥 GUARDAR GLOBAL (IMPORTANTE)
  window.tipoMaquina = tipo;
  window.modoMaquina = modo;

  const label = document.getElementById("tipoMaquinaLabel");

  let texto = "";

  if (tipo === 2) {
    if (modo === "DUO") texto = "💧🧊 Purificadora DUO";
    else if (modo === "AGUA") texto = "💧 Agua purificada";
    else if (modo === "HIELO") texto = "🧊 Hielo purificado";
    else texto = "💧 Purificadora";
  } else {
    const tipos = {
      0: "🧼 Productos de limpieza",
      1: "🐶 Croquetas",
      3: "🌾 Granos",
      4: "🚗 Automotriz"
    };
    texto = tipos[tipo] || "⚙️ Desconocido";
  }

  if (label) {
    label.textContent = `Máquina: ${texto}`;
  }
}



//  Grafica del historico 
function agruparPorDia(data) {

  const dineroPorFecha = {};
  const ventasPorFecha = {};

  data.forEach(v => {
    const fecha = v["Fecha"];
    const venta = parseFloat(v["Venta($)"]) || 0;

    if (!fecha) return;

    dineroPorFecha[fecha] = (dineroPorFecha[fecha] || 0) + venta;
    ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + 1;
  });

  const fechasOrdenadas = Object.keys(dineroPorFecha).sort();

  const labels = fechasOrdenadas.map(f => {
    const d = new Date(f);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit"
    });
  });

  const dinero = fechasOrdenadas.map(f => dineroPorFecha[f]);
  const ventas = fechasOrdenadas.map(f => ventasPorFecha[f]);

  const variacion = dinero.map((v, i) => {
    if (i === 0) return 0;
    const prev = dinero[i - 1];
    if (prev === 0) return 0;
    return ((v - prev) / prev) * 100;
  });

  return { labels, dinero, ventas, variacion };
}
const pluginLabels = {
  id: "customLabels",
  afterDatasetsDraw(chart) {

    const { ctx } = chart;
    const variacion = chart.config._variacion || [];
    const dinero = chart.config._dinero || [];

    ctx.save();
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";

    const meta = chart.getDatasetMeta(0);

    meta.data.forEach((point, i) => {

      const valorDinero = dinero[i] || 0;
      const varPct = variacion[i] || 0;

      const signo = varPct >= 0 ? "+" : "";
      const color = varPct >= 0 ? "#22c55e" : "#ef4444";

      // 💰 dinero
      ctx.fillStyle = "#fff";
      ctx.fillText(`$${valorDinero}`, point.x, point.y - 18);

      // 📊 %
      ctx.fillStyle = color;
      ctx.fillText(`(${signo}${varPct.toFixed(0)}%)`, point.x, point.y - 5);

    });

    ctx.restore();
  }
};
let chartHistorico;
function renderHistorico(labels, dinero, variacion, ventas) {

  if (chartHistorico) chartHistorico.destroy();

  const canvas = document.getElementById("chartHistorico");
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(255, 122, 26, 0.45)");
  gradient.addColorStop(1, "rgba(255, 122, 26, 0)");

  const maxVentas = Math.max(...ventas);

  chartHistorico = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [

        {
          // 🔥 LA POSICIÓN ES POR VENTAS
          data: ventas,
          borderColor: "#ff7a1a",
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#ff7a1a"
        }
      ]
    },
    plugins: [pluginLabels],
    options: {
      interaction: {
        mode: "index",
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          borderColor: "#ff7a1a",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#fff",
          displayColors: false,
          padding: 10,
          callbacks: {
            label: function(context) {
              const dinero = context.chart.config._dinero;
              return ` $${dinero[context.dataIndex]}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: getCSSVar('--text'), 
            autoSkip: false,       
            padding: 8,
            maxRotation: 0,         
            minRotation: 0 },
          grid: { color: getCSSVar('--muted') + "33" }
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: maxVentas + 2,
          ticks: { color: getCSSVar('--text'), padding: 8 },
          grid: { color: getCSSVar('--muted') + "33" },
          title: {
            display: true,
            text: "Cantidad de ventas",
            color: "#94a3b8"
          }
        }

      }
    }
  });

  // 🔥 PASAR DATOS AL PLUGIN
  chartHistorico.config._variacion = variacion;
  chartHistorico.config._dinero = dinero;
}