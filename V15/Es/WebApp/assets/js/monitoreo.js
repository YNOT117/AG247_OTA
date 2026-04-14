document.addEventListener("DOMContentLoaded", async () => {
  // 🔥 Mostrar loader al entrar a la página
  showLoader();
  const logout = document.getElementById("logout");
  validarSesion();

  await cargarDatos();
  initEventos();

  // 🔥 Ocultar loader SOLO cuando todo terminó de cargar
  hideLoader();
});

 /* -----------------------------------------
      CERRAR SESIÓN
  ----------------------------------------- */
  logout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  });


/* ================= RSSI ================= */
function formatearRSSI(rssi) {
  if (rssi === undefined || rssi === null) return "--";

  let calidad = "";
  let color = "";
  let icono = "";

  if (rssi >= -60) {
    calidad = "Excelente";
    color = "#22c55e";
    icono = "📶📶📶📶";
  } else if (rssi >= -70) {
    calidad = "Buena";
    color = "#84cc16";
    icono = "📶📶📶";
  } else if (rssi >= -80) {
    calidad = "Regular";
    color = "#f59e0b";
    icono = "📶📶";
  } else {
    calidad = "Débil";
    color = "#ef4444";
    icono = "📶";
  }

  return `
    <span style="color:${color}; font-weight:500;">
      ${icono} ${rssi} dBm (${calidad})
    </span>
  `;
}


/* ================= CARGAR DATOS ================= */
async function cargarDatos() {
  try {
    const res = await fetch("/monitor/datos");
    const data = await res.json();

    // PCBA
    pcbaName.value = data.name || "";
    pcbaUser.value = data.userweblocal || "";
    pcbaPass.value = data.passweblocal || "";

    // WIFI
    monitorSSID.textContent = data.ssid || "--";
    monitorRSSI.innerHTML = formatearRSSI(data.rssi);
    monitorPASS.textContent = data.pass || "--";
    monitorIP.textContent = data.ip || "--";

    // TELEGRAM
    telegramToken.value = data.token || "";
    telegramChatID.value = data.chatid || "";

    if (data.groupid) {
      telegramGroupID.value = data.groupid;
      useGroupID.checked = true;
      telegramGroupID.disabled = false;
    }

  } catch {
    showToast("Error al cargar datos", "error");
  }
}


/* ================= EVENTOS ================= */
function initEventos() {

  useGroupID.addEventListener("change", () => {
    telegramGroupID.disabled = !useGroupID.checked;
  });

  savePcbaBtn.onclick = guardarPCBA;
  saveTelegramBtn.onclick = guardarTelegram;
  testTelegramBtn.onclick = testTelegram;

  modalClose.onclick = reiniciarESP;
}


/* ================= GUARDAR PCBA ================= */
async function guardarPCBA() {
  try {
    showLoader();

    const res = await fetch("/monitor/pcba", {
      method: "POST",
      body: JSON.stringify({
        name: pcbaName.value,
        user: pcbaUser.value,
        pass: pcbaPass.value
      })
    });

    if (!res.ok) throw new Error();

    showToast("Guardado correctamente", "success");

  } catch {
    showToast("Error al guardar", "error");
  } finally {
    hideLoader();
  }
}


/* ================= GUARDAR TELEGRAM ================= */
async function guardarTelegram() {
  try {
    showLoader();

    const res = await fetch("/monitor/saveTelegram", {
      method: "POST",
      body: JSON.stringify({
        token: telegramToken.value,
        chatid: telegramChatID.value,
        groupid: useGroupID.checked ? telegramGroupID.value : ""
      })
    });

    if (!res.ok) throw new Error();

    mostrarModalReinicio();

  } catch {
    showToast("Error Telegram", "error");
  } finally {
    hideLoader();
  }
}


/* ================= TEST TELEGRAM ================= */
async function testTelegram() {
  try {
    showLoader();

    const res = await fetch("/monitor/TelegramTest", {
      method: "POST"
    });

    if (!res.ok) throw new Error();

    showToast("Mensaje enviado", "success");

  } catch {
    showToast("Error al enviar", "error");
  } finally {
    hideLoader();
  }
}


/* ================= MODAL ================= */
function mostrarModalReinicio() {
  restartModal.classList.remove("hidden");
}

function cerrarModal() {
  restartModal.classList.add("hidden");
}


/* ================= REINICIAR ESP ================= */
async function reiniciarESP() {
  try {
    showLoader();

    await fetch("/monitor/restart", {
      method: "POST"
    });

    cerrarModal();

    // 🔴 FORZAR estado offline inmediatamente
    status.classList.remove("online");
    status.classList.add("offline");

    // 🔥 Toast indicando espera de reconexión
    showToast("Esperando reconexión...", "info");

    // ❌ NO recargar la página
    // 👉 global.js se encargará de volver a poner en verde automáticamente

  } catch {
    showToast("Error al reiniciar", "error");
  } finally {
    hideLoader();
  }
}