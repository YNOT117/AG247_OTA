
function ObtenerRedes() {

    xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/Buscar", true);
    xhttp.send();
    //alert("Buscando Redes");
    //Mostrar imagen de carga
    loading.style.display = "flex";

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        
        // Ocultar imagen de carga
        loading.style.display = "none";

        Redes = JSON.parse(this.responseText).Redes;
       
        Selector = document.getElementById("selector");
        for(Red of Redes) {
          nuevaOpcion = document.createElement("option");
          nuevaOpcion.value = Red.SSID;
          nuevaOpcion.innerHTML = Red.SSID;
          Selector.appendChild(nuevaOpcion);
        }  
        Selector.selectedIndex = "0"; 
        
      }
    };


}
