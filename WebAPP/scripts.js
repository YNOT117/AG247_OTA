document.addEventListener('DOMContentLoaded', function() {
  actualizarFormulario();  // Llamar al cargar la página para aplicar cambios iniciales si es necesario
});

function actualizarFormulario() {
  const tipoVending = document.getElementById("tipoVending").value;

  // Itera sobre los productos para ajustar el formulario según el tipo de vending
  for (let i = 1; i <= 8; i++) {
      const nombreContainer = document.getElementById(`nombreProducto${i}-container`);
      const cantidadContainer = document.getElementById(`cantidadProducto${i}-container`);

      if (tipoVending === "agua_hielo") {
          // Si es "Agua y Hielo", cambiar a un select y ocultar la cantidad
          nombreContainer.innerHTML = `
              <select id="nombreProducto${i}" name="nombreProducto${i}">
                  <option value="Alcalina">Alcalina</option>
                  <option value="Purificada">Purificada</option>
                  <option value="Hielo">Hielo</option>
              </select>
          `;
          cantidadContainer.style.display = "none";  // Ocultar el campo de cantidad
      } else {
          // Si no es "Agua y Hielo", cambiar a un input de texto y mostrar la cantidad
          nombreContainer.innerHTML = `<input type="text" id="nombreProducto${i}" name="nombreProducto${i}">`;
          cantidadContainer.style.display = "block";  // Mostrar el campo de cantidad
      }
  }
}

function generarJSON() {
  // Recoger los valores de las preguntas
  let configuracion = {
      tipoVending: document.getElementById("tipoVending").value,
      usaBilletero: document.getElementById("usaBilletero").value,
      daCambio: document.getElementById("daCambio").value,
      vozActivada: document.getElementById("vozActivada").value,
      productos: []
  };

  // Recoger los valores de los productos
  for (let i = 1; i <= 8; i++) {
      let producto = {
          nombre: document.getElementById("nombreProducto" + i).value,
          costo: parseFloat(document.getElementById("costoProducto" + i).value),
          cantidad: document.getElementById("cantidadProducto" + i) ? parseFloat(document.getElementById("cantidadProducto" + i).value) : null
      };
      configuracion.productos.push(producto);
  }

  // Generar el JSON y mostrarlo
  let jsonConfiguracion = JSON.stringify(configuracion, null, 2);
  document.getElementById("resultado").textContent = jsonConfiguracion;
}
