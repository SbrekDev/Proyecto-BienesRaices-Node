(function() {
    const lat = document.querySelector('#lat').value || -34.603722;
    const lng = document.querySelector('#lng').value || -58.381592;
    const mapa = L.map('mapa').setView([lat, lng ], 16);
    let marker;

    // provider y geocoder
    const geocodeService = L.esri.Geocoding.geocodeService()
    

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // colocar pin
    marker = new L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
    .addTo(mapa)

    // detectar mov del pin
    marker.on('moveend', function(e){
        marker = e.target

        const position = marker.getLatLng()

        mapa.panTo(new L.latLng(position.lat, position.lng))

        //obtener info de las calles al soltar el pin

        geocodeService.reverse().latlng(position, 16).run(function(error, resultado){
            
            marker.bindPopup(resultado.address.LongLabel)

            document.querySelector('.calle').textContent = resultado?.address?.Address ?? ''
            document.querySelector('#calle').value = resultado?.address?.Address ?? ''
            document.querySelector('#lat').value = resultado?.latlng?.lat ?? ''
            document.querySelector('#lng').value = resultado?.latlng?.lng ?? ''
            
            
        })
        
    })


})()