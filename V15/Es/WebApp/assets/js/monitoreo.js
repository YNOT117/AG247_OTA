document.addEventListener("DOMContentLoaded", async () => {

    /* ============================================================
       REFERENCIAS GENERALES
    ============================================================ */
    const loader = document.getElementById("loader");
    const toast = document.getElementById("toast");
    const restartModal = document.getElementById("restartModal");
    const modalClose = document.getElementById("modalClose");

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const overlay = document.getElementById("overlay");
    const logout = document.getElementById("logout");

    const statusDot = document.getElementById("status");

    // Telegram
    const inputToken = document.getElementById("telegramToken");
    const inputChatID = document.getElementById("telegramChatID");
    const inputGroupID = document.getElementById("telegramGroupID");
    const toggleGroup = document.getElementById("useGroupID");
    const saveBtn = document.getElementById("saveTelegramBtn");

    // PCBA
    const pcbaName = document.getElementById("pcbaName");
    const pcbaUser = document.getElementById("pcbaUser");
    const pcbaPass = document.getElementById("pcbaPass");
    const savePcbaBtn = document.getElementById("savePcbaBtn");

    let originalToken = "";

    /* ============================================================
       FUNCIONES AUXILIARES
    ============================================================ */
    function isMobile() {
        return window.innerWidth <= 750;
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove("hidden");
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.classList.add("hidden"), 300);
        }, 2500);
    }

    /* ============================================================
       LOADER EN CAMBIO DE PÁGINA
    ============================================================ */
    document.querySelectorAll(".sidebar-nav a").forEach(link => {
        link.addEventListener("click", e => {
            const url = link.getAttribute("href");
            if (!url) return;

            loader.classList.remove("hidden");

            if (isMobile()) {
                sidebar.classList.remove("show");
                overlay.classList.remove("show");
            }

            e.preventDefault();
            setTimeout(() => window.location.href = url, 200);
        });
    });

    /* ============================================================
       MENÚ HAMBURGUESA
    ============================================================ */
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

    /* ============================================================
       LOGOUT
    ============================================================ */
    logout.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../index.html";
    });

    /* ============================================================
       VALIDAR SESIÓN
    ============================================================ */
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    /* ============================================================
       INDICADOR DE CONEXIÓN
    ============================================================ */
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

    /* ============================================================
       CARGAR DATOS DE /monitor/datos
    ============================================================ */
    async function cargarDatos() {
        loader.classList.remove("hidden");

        try {
            const r = await fetch("/monitor/datos");
            const data = await r.json();

            // ---- PCBA ----
            pcbaName.value = data.name || "";
            pcbaUser.value = data.userweblocal || "";
            pcbaPass.value = data.passweblocal || "";

            // ---- WIFI ----
            document.getElementById("monitorSSID").textContent = data.ssid;
            document.getElementById("monitorPASS").textContent = data.pass;
            document.getElementById("monitorIP").textContent = data.ip;

            // ---- TELEGRAM ----
            inputToken.value = data.token || "";
            inputChatID.value = data.chatid || "";
            originalToken = data.token;

            if (data.groupid !== -1 && data.groupid !== "") {
                toggleGroup.checked = true;
                inputGroupID.disabled = false;
                inputGroupID.value = data.groupid;
            } else {
                toggleGroup.checked = false;
                inputGroupID.disabled = true;
                inputGroupID.value = "";
            }

        } catch (err) {
            console.error(err);
            showToast("Error cargando datos");
        }

        loader.classList.add("hidden");
    }

    cargarDatos();

    /* ============================================================
       TOGGLE GROUP ID
    ============================================================ */
    toggleGroup.addEventListener("change", () => {
        inputGroupID.disabled = !toggleGroup.checked;

        if (inputGroupID.disabled) {
            inputGroupID.value = "";
        }
    });

    /* ============================================================
       GUARDAR TELEGRAM
    ============================================================ */
    saveBtn.onclick = async () => {

        loader.classList.remove("hidden");

        const payload = {
            token: inputToken.value.trim(),
            chatid: inputChatID.value.trim(),
            groupid: toggleGroup.checked ? inputGroupID.value.trim() : ""
        };

        const resp = await fetch("/monitor/saveTelegram", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });

        loader.classList.add("hidden");

        if (resp.ok) {
            showToast("Datos guardados");

            if (originalToken !== payload.token) {
                restartModal.classList.remove("hidden");
            }
        } else {
            showToast("Error al guardar");
        }
    };

    modalClose.onclick = () => {
        restartModal.classList.add("hidden");
    };

    // ===== Enviar mensaje de prueba =====
    const testBtn = document.getElementById("testTelegramBtn");

    testBtn.onclick = async () => {
        loader.classList.remove("hidden");

        try {
            const resp = await fetch("/monitor/TelegramTest", {
                method: "POST"
            });

            loader.classList.add("hidden");

            if (resp.ok) {
                showToast("Mensaje de prueba enviado");
            } else {
                showToast("Error enviando mensaje de prueba");
            }

        } catch (err) {
            loader.classList.add("hidden");
            showToast("Error de conexión");
        }
    };


    /* ============================================================
       GUARDAR PCBA
    ============================================================ */
    savePcbaBtn.onclick = async () => {

        loader.classList.remove("hidden");

        const body = {
            name: pcbaName.value.trim(),
            user: pcbaUser.value.trim(),
            pass: pcbaPass.value.trim()
        };

        const resp = await fetch("/monitor/pcba", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

        loader.classList.add("hidden");

        if (resp.ok) {
            showToast("Datos guardados");
        } else {
            showToast("Error al guardar");
        }
    };

});
