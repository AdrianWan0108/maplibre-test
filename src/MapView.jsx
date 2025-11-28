import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const VANCOUVER_CENTER = [-123.1207, 49.2827] // [lng, lat]

export default function MapView() {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null) // store map instance

    useEffect(() => {
        if (mapRef.current) return // prevent re-init

        // 1. Create the map
        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
            center: VANCOUVER_CENTER,
            zoom: 11,
        })

        const map = mapRef.current

        // 2. Navigation controls (zoom buttons + compass)
        map.addControl(new maplibregl.NavigationControl(), 'top-right')

        // 3. Scale control (meters)
        map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }),
            'bottom-left'
        )

        // 4. Test marker in downtown Vancouver
        const marker = new maplibregl.Marker({ color: '#e63946' })
            .setLngLat(VANCOUVER_CENTER)
            .setPopup(
                new maplibregl.Popup().setHTML(
                    `<h3>Downtown Vancouver</h3><p>Test marker for MapLibre</p>`
                )
            )
            .addTo(map)

        // 5. Click handler: show popup at click location
        map.on('click', (e) => {
            const { lng, lat } = e.lngLat

            new maplibregl.Popup()
                .setLngLat([lng, lat])
                .setHTML(
                    `<p>Clicked at:<br><strong>${lng.toFixed(
                        5
                    )}, ${lat.toFixed(5)}</strong></p>`
                )
                .addTo(map)
        })

        // 6. Clean up on unmount
        return () => {
            marker.remove()
            map.remove()
            mapRef.current = null
        }
    }, [])

    return (
        <div className="map-wrapper">
            <div ref={mapContainerRef} className="map-container" />
        </div>
    )
}
