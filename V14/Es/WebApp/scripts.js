document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  const titulo = document.getElementById("tituloSeccion");
  const navButtons = document.querySelectorAll(".bottom-nav button");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const id = btn.id;
      if (id === "nav-inicio") cargarInicio();
      else if (id === "nav-ventas") cargarVentas();
      else if (id === "nav-config") cargarConfig();
      else if (id === "nav-perfil") cargarPerfil();
    });
  });

  cargarPerfil(); // Perfil por defecto
});

function cargarPerfil() {
  const content = document.getElementById("content");
  const titulo = document.getElementById("tituloSeccion");
  titulo.textContent = "Perfil";

  const perfil = {
    nombre: "Edgar",
    firmware: "Versión 2.1.4"
  };

  content.innerHTML = `
    <div class="card">
      <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="avatar">
      <h2>${perfil.nombre}</h2>
      <button id="cerrarSesion">Cerrar sesión</button>
      <div class="info">
        <p><strong>Firmware:</strong> ${perfil.firmware}</p>
      </div>
    </div>
  `;
}

function cargarInicio() {
  const titulo = document.getElementById("tituloSeccion");
  titulo.textContent = "Inicio";
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="card">
      <h2>Hola, Edgar 👋</h2>
      <p>Total de ventas de hoy</p>
      <h1>$250.00</h1>
      <p>Productos vendidos: 35</p>
      <p>Estado: <span style="color: green;">Online</span></p>
      <button>Ver detalles</button>
    </div>
  `;
}

function cargarVentas() {
  const titulo = document.getElementById("tituloSeccion");
  titulo.textContent = "Ventas";
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="card">
      <h2>Ventas por producto</h2>
      <canvas id="grafica" width="300" height="300"></canvas>
      <ul style="text-align:left; margin-top:10px;">
        <li>Agua — $15.00</li>
        <li>Jugo — $10.00</li>
        <li>Refresco — $30.00</li>
      </ul>
    </div>
  `;
}

function cargarConfig() {
  const titulo = document.getElementById("tituloSeccion");
  titulo.textContent = "Configuración";
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="card" style="text-align:left;">
      <p>⚙️ Modo inteligente</p>
      <p>🌐 Conexión Wi-Fi</p>
      <p>💳 Métodos de pago</p>
      <p>🔔 Notificaciones</p>
      <p>🔄 Sincronización</p>
    </div>
  `;
}
