import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const VANCOUVER_CENTER = [-123.1207, 49.2827] // [lng, lat]

// 👉 simple fake polygons near Vancouver, just for testing
const testPolygons = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1,
      properties: {
        name: 'Test Area A',
        score: 0.2,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-123.15, 49.285],
            [-123.13, 49.285],
            [-123.13, 49.275],
            [-123.15, 49.275],
            [-123.15, 49.285],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 2,
      properties: {
        name: 'Test Area B',
        score: 0.7,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-123.13, 49.285],
            [-123.11, 49.285],
            [-123.11, 49.275],
            [-123.13, 49.275],
            [-123.13, 49.285],
          ],
        ],
      },
    },
  ],
}

export default function MapView() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: VANCOUVER_CENTER,
      zoom: 11,
    })

    mapRef.current = map

    // Zoom controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Scale bar
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }),
      'bottom-left'
    )

    // Test marker in downtown
    const marker = new maplibregl.Marker({ color: '#e63946' })
      .setLngLat(VANCOUVER_CENTER)
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<h3>Downtown Vancouver</h3><p>Marker for testing</p>`
        )
      )
      .addTo(map)

    // ─────────────────────────────────────────
    // 1. Add GeoJSON source + fill & outline layers
    // ─────────────────────────────────────────
    map.on('load', () => {
      map.addSource('test-areas', {
        type: 'geojson',
        data: testPolygons,
      })

      // Fill layer, color by "score"
      map.addLayer({
        id: 'test-areas-fill',
        type: 'fill',
        source: 'test-areas',
        paint: {
          // light → dark based on score
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            0, '#fee5d9',
            0.5, '#fcae91',
            1, '#fb6a4a',
          ],
          // base opacity; hover will bump this
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.9, // when hovered
            0.5, // normal
          ],
        },
      })

      // Outline layer
      map.addLayer({
        id: 'test-areas-outline',
        type: 'line',
        source: 'test-areas',
        paint: {
          'line-color': '#b22222',
          'line-width': 2,
        },
      })

      // ─────────────────────────────────────
      // 2. Hover highlight using feature-state
      // ─────────────────────────────────────
      let hoveredId = null

      map.on('mousemove', 'test-areas-fill', (e) => {
        if (!e.features || !e.features.length) return

        const feature = e.features[0]

        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'test-areas', id: hoveredId },
            { hover: false }
          )
        }

        hoveredId = feature.id

        map.setFeatureState(
          { source: 'test-areas', id: hoveredId },
          { hover: true }
        )

        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'test-areas-fill', () => {
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'test-areas', id: hoveredId },
            { hover: false }
          )
        }
        hoveredId = null
        map.getCanvas().style.cursor = ''
      })

      // ─────────────────────────────────────
      // 3. Popup on click showing properties
      // ─────────────────────────────────────
      map.on('click', 'test-areas-fill', (e) => {
        if (!e.features || !e.features.length) return
        const feature = e.features[0]
        const { name, score } = feature.properties

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `<h3>${name}</h3>
             <p>Score: <strong>${score}</strong></p>`
          )
          .addTo(map)
      })
    })

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
