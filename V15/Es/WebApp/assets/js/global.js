/* ================= SIMULACIÓN API ================= */
const MOCK = false;

// ================= INIT GLOBAL =================
window.addEventListener("DOMContentLoaded", () => {
  // showLoader(); 
 
  validarSesion();
  initMenu();
  initTheme();
  initOverlayFix();
  initConexion();
  initSSE();
  initActiveMenu();
  initNavigation();

    // ocultar cuando todo esté listo
  // setTimeout(hideLoader, 300);
});

// window.addEventListener("beforeunload", () => {
//   showLoader();
// });


// ================= MENU =================
function initMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");

  if (!menuBtn || !sidebar || !overlay) return;

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
  });
}


// ================= FIX SWITCH =================
function initOverlayFix() {
  const toggle = document.querySelector(".theme-toggle");

  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}


// ================= TEMA =================
function initTheme() {
  const switchTheme = document.getElementById("themeSwitch");

  if (!switchTheme) return;

  // cargar estado
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    switchTheme.checked = true;
  }

  switchTheme.addEventListener("change", () => {

    if (switchTheme.checked) {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    }

    // 🔥 actualizar gráficas
    if (window.cargarVentas) cargarVentas();
    if (window.cargarGrafica7DiasDesdeCSV) cargarGrafica7DiasDesdeCSV();
  });

  setTimeout(() => {
  if (window.cargarVentas) cargarVentas();
  if (window.cargarGrafica7DiasDesdeCSV) cargarGrafica7DiasDesdeCSV();
}, 50);

}


// ================= CONEXIÓN =================
function initConexion() {
  const statusDot = document.getElementById("status");

  if (!statusDot) return;

  // 🔥 Si está en simulación → no hacer ping
  if (typeof MOCK !== "undefined" && MOCK) {
    statusDot.classList.remove("offline");
    statusDot.classList.add("online");
    return;
  }

  async function verificarConexion() {
    try {
      await fetch("/ping");
      statusDot.classList.replace("offline", "online");
    } catch {
      statusDot.classList.replace("online", "offline");
    }
  }

  verificarConexion();
  setInterval(verificarConexion, 3000);
}


// ================= SSE GLOBAL =================
function initSSE() {

  // 🔥 Si está en simulación → no hacer nada
  if (typeof MOCK !== "undefined" && MOCK) {
    return;
  }

  if (!window.EventSource) return;

  const evtSource = new EventSource("/events");

  evtSource.addEventListener("nuevaVenta", () => {

    // 👉 dispara eventos globales para cada página
    document.dispatchEvent(new Event("updateDashboard"));

    // glow opcional
    const cont = document.getElementById("chartVentas");
    if (cont) {
      cont.classList.add("chart-update-glow");
      setTimeout(() => cont.classList.remove("chart-update-glow"), 600);
    }

  });

}

function initActiveMenu() {
  const links = document.querySelectorAll(".menu a");
  const current = window.location.pathname.split("/").pop();

  links.forEach(link => {
    const href = link.getAttribute("href");

    if (href === current) {
      link.classList.add("active");
    }
  });
}

function initNavigation() {
  const links = document.querySelectorAll(".menu a");

  links.forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      // e.preventDefault();

      // showLoader(); // 🔥 aquí

      // setTimeout(() => {
      //   window.location.href = href;
      // }, 150);
      // 🔥 activar loader persistente entre páginas
      // sessionStorage.setItem("loading", "true");

      showLoader();

    });
  });
}


/* ================= CERRAR SESIÓN ================= */
const logout = document.getElementById("logout");
if (logout) {
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}


/* ================= VALIDAR SESIÓN ================= */
function validarSesion() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../index.html"; // ajusta ruta si es necesario
  }
}

// ================= LOADER =================
function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.classList.add("hidden");
}

function initCustomSelect(options, selected, id = "customNombre") {

  const container = document.getElementById(id);
  const trigger = container.querySelector(".custom-select-trigger");
  const text = container.querySelector(".custom-text");
  const optionsContainer = container.querySelector(".custom-options");

  optionsContainer.innerHTML = "";

  let selectedLabel = "";

  options.forEach(opt => {
    const label = typeof opt === "string" ? opt : opt.label;
    const value = typeof opt === "string" ? opt : opt.value;

    if (value === selected) selectedLabel = label;

    const div = document.createElement("div");
    div.className = "custom-option";
    div.textContent = label;
    div.dataset.value = value;

    if (value === selected) div.classList.add("selected");

    div.onclick = () => {
      text.textContent = label;
      container.dataset.value = value;

      optionsContainer.querySelectorAll(".custom-option")
        .forEach(o => o.classList.remove("selected"));

      div.classList.add("selected");
      container.classList.remove("open");
    };

    optionsContainer.appendChild(div);
  });

  text.textContent = selectedLabel || "Seleccionar";
  container.dataset.value = selected;

  trigger.onclick = () => {
    container.classList.toggle("open");
  };

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove("open");
    }
  });
}

function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;

  toast.className = "toast"; // reset
  toast.classList.add("show", type);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

























// 6. USO EN FETCH (MUY IMPORTANTE)

// Ahora puedes usarlo en cualquier JS:

// async function cargarCSV() {
//   try {
//     showLoader();

//     const res = await fetch("/ventas.csv");
//     const texto = await res.text();

//     // lógica...

//   } catch (err) {
//     console.error(err);
//   } finally {
//     hideLoader();
//   }
// }