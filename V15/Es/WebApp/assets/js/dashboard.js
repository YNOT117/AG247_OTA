window.addEventListener("DOMContentLoaded", async () => {

  const loader    = document.getElementById("loader");
  const statusDot = document.getElementById("status");
  const logout    = document.getElementById("logout");
  const sidebar   = document.getElementById("sidebar");
  const menuBtn   = document.getElementById("menuBtn");
  const overlay   = document.getElementById("overlay");

  function isMobile() {
    return window.innerWidth <= 750;
  }

  /* ========= Loader al cambiar de página desde el menú ========= */
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", e => {
      const loader = document.getElementById("loader");
      loader.classList.remove("hidden"); // mostrar loader
      const url = link.getAttribute("href");

      if (!url || url === "#") return;

      e.preventDefault();             // detener navegación inmediata

      if (isMobile()) {
        sidebar.classList.remove("show");
        overlay.classList.remove("show");
      }

      setTimeout(() => {
        window.location.href = url;   // navegar después del efecto
      }, 200);
    });
  });


  /* ================= FUNCIÓN GENERAL: Verificar conexión ================= */
  async function verificarConexion() {
    try {
      await fetch("/ping");
      statusDot.classList.replace("offline", "online");
      return true;
    } catch (err) {
      statusDot.classList.replace("online", "offline");
      return false;
    }
  }

  /* ================= SSE - eventos desde el ESP32 ================= */
  const evtSource = new EventSource("/events");

  evtSource.addEventListener("nuevaVenta", () => {
    cargarDashboard();
    cargarGrafica7Dias();

    const cont = document.getElementById("chartVentas");
    cont.classList.add("chart-update-glow");

    setTimeout(() => {
      cont.classList.remove("chart-update-glow");
    }, 600);
  });

  /* ================= ABRIR / CERRAR MENÚ ================= */
  menuBtn.addEventListener("click", () => {
    if (isMobile()) {
      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  overlay.addEventListener("click", () => {
    if (isMobile()) {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
    }
  });

  /* ================= CERRAR SESIÓN ================= */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });

  /* ================= VALIDAR SESIÓN ================= */
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  /* ================= SECUENCIA DE INICIO ================= */
  // 1. Verificamos conexión antes de mostrar nada
  await verificarConexion();

  // 2. Cargar datos iniciales
  await cargarDashboard();
  await cargarGrafica7Dias();

  // 3. Ocultar loader cuando todo esté listo
  setTimeout(() => loader.classList.add("hidden"), 250);

  /* ================= VERIFICACIÓN DE CONEXIÓN CADA 3s ================= */
  setInterval(verificarConexion, 3000);

});


async function cargarDashboard() { 
    try { 
        const res = await fetch("/totalVentas"); 
        const data = await res.json(); 
        document.getElementById("ventaDia").textContent = `$${data.total ?? 0}`;
        document.getElementById("ventasTotales").textContent = data.hoy ?? 0; 
        document.getElementById("ultimaVenta").textContent = data.ultima ?? "—"; 
        document.getElementById("estadoMaquina").textContent = data.estado ?? "—"; 
    } catch (err) { 
        console.log("No se pudo cargar el dashboard:", err); 
    } 
}

let grafica7dias = null;

async function cargarGrafica7Dias() {
  try {
    const res = await fetch("/ventas7Dias");
    const json = await res.json();

    const cont = document.getElementById("chartVentas");

    // Limpiar contenido previo (si se vuelve a generar)
    cont.innerHTML = "";

    // Crear canvas
    const canvas = document.createElement("canvas");
    cont.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Crear degradado debajo de la línea
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(255, 122, 26, 0.45)"); // arriba naranja suave
    gradient.addColorStop(1, "rgba(255, 122, 26, 0)");    // abajo transparente

    // Destruir gráfica anterior para evitar duplicados
    if (grafica7dias) grafica7dias.destroy();

    // Crear nueva gráfica
    grafica7dias = new Chart(ctx, {
      type: "line",
      data: {
        labels: json.labels,
        datasets: [{
          label: "Ventas últimos 7 días",
          data: json.data,
          borderColor: "#ff7a1a",
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#ff7a1a",
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
          y: {
            ticks: { color: "#e5e7eb" },
            grid: { color: "rgba(255, 255, 255, 0.05)" }
          },
          x: {
            ticks: { color: "#e5e7eb" },
            grid: { display: false }
          }
        },

        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0b1120",
            borderColor: "#ff7a1a",
            borderWidth: 1,
            titleColor: "#fff",
            bodyColor: "#ddd",
            padding: 8,
            displayColors: false
          }
        }
      }
    });

  } catch (err) {
    console.log("Error al cargar gráfica 7 días:", err);
  }
}
