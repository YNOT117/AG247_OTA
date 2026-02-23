// ====================== PING AL ESP32 ======================
async function verificarConexionInicial() {
  const msg = document.getElementById("msg");

  try {
    const res = await fetch("/ping", { method: "GET" });
    if (!res.ok) throw "no ping";

    msg.style.display = "none";
    return true;

  } catch (err) {
    msg.innerText = "⚠️ La máquina no está disponible.";
    msg.style.display = "block";
    return false;
  }
}

// ====================== LOADER AL CARGAR LOGIN ======================
window.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");

  // Mostrar loader al entrar
  loader.classList.remove("hidden");

  // Revisar si el ESP32 responde
  await verificarConexionInicial();

  // Ocultar después de verificación
  setTimeout(() => loader.classList.add("hidden"), 350);
});


// ====================== FUNCIÓN LOGIN ======================
async function IniciarSesion() {
  const user   = document.getElementById("user").value.trim();
  const pass   = document.getElementById("pass").value.trim();
  const msg    = document.getElementById("msg");
  const loader = document.getElementById("loader");

  if (!user || !pass) {
    msg.innerText = "Por favor, completa ambos campos.";
    msg.style.display = "block";
    return;
  }

  msg.style.display = "none";
  loader.classList.remove("hidden");

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass })
    });

    if (!response.ok) {
      loader.classList.add("hidden");
      msg.innerText = "Error de servidor.";
      msg.style.display = "block";
      return;
    }

    const data = await response.json();

    if (data.status === "OK") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", user);

      // Redirigir manteniendo loader visible
      window.location.href = "/pages/dashboard.html";

    } else {
      loader.classList.add("hidden");
      msg.innerText = "Usuario o contraseña incorrectos.";
      msg.style.display = "block";
    }

  } catch (err) {
    loader.classList.add("hidden");
    msg.innerText = "⚠️ No se pudo conectar con la máquina.";
    msg.style.display = "block";
  }
}
