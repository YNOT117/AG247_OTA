document.addEventListener("DOMContentLoaded", () => {

    const selector   = document.getElementById("selector");
    const btnBuscar  = document.getElementById("btnBuscar");
    const loader     = document.getElementById("loader");

    const inputName  = document.getElementById("machineName");
    const nameError  = document.getElementById("nameError");

    // FORM CORRECTO
    const form       = document.getElementById("wifiForm");

    /* ============================
       VALIDACIÓN DEL NOMBRE
    ============================ */
function validarNombre() {
    let val = inputName.value;

    // Convertir a minúsculas
    val = val.toLowerCase();

    // Permitir solo letras minúsculas y números
    const filtrado = val.replace(/[^a-z0-9]/g, "");

    // Siempre actualizar el input
    inputName.value = filtrado;

    if (filtrado.length === 0) {
        inputName.classList.remove("input-valid");
        inputName.classList.add("input-error");
        nameError.textContent = "El nombre es obligatorio.";
        return false;
    }

    if (!/^[a-z0-9]+$/.test(filtrado)) {
        inputName.classList.remove("input-valid");
        inputName.classList.add("input-error");
        nameError.textContent = "Solo letras minúsculas y números.";
        return false;
    }

    inputName.classList.remove("input-error");
    inputName.classList.add("input-valid");
    nameError.textContent = "";
    return true;
}



    inputName.addEventListener("input", validarNombre);
    inputName.addEventListener("keyup", validarNombre);


    /* ============================
       BLOQUEAR SUBMIT
    ============================ */
    form.addEventListener("submit", (e) => {
        if (!validarNombre()) {
            e.preventDefault();
        }
    });

    /* ============================
       BUSCAR REDES
    ============================ */
    btnBuscar.addEventListener("click", async () => {

        selector.innerHTML = "";
        loader.classList.remove("hidden");

        try {
            const res = await fetch("/Buscar");
            const data = await res.json();

            const redes = data.Redes || [];

            redes.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.SSID;
                opt.textContent = r.SSID;
                selector.appendChild(opt);
            });

            if (redes.length === 0) {
                const opt = document.createElement("option");
                opt.textContent = "No se encontraron redes";
                selector.appendChild(opt);
            }

        } catch {
            alert("Error buscando redes");
        }

        loader.classList.add("hidden");
    });

});
