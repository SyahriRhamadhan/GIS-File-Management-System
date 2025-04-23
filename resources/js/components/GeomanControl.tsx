import '@geoman-io/leaflet-geoman-free';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function GeomanControl() {
    const map = useMap();

    useEffect(() => {
        map.pm.addControls({
            position: 'bottomleft',
            drawMarker: true,
            drawCircle: true,
            drawCircleMarker: true,
            drawRectangle: true,
            dragMode: true,
            cutPolygon: true,
            removalMode: true,
            drawPolyline: true,
            drawPolygon: true,
            editMode: false,
        });

        map.on('pm:create', (e) => {
            const layer = e.layer;
            if (e.shape === 'PolyLine') {
                console.log('Length (m):', (layer as any).pm.getLength());
            }
            if (e.shape === 'Polygon') {
                console.log('Area (m²):', (layer as any).pm.getArea());
            }
        });
    }, [map]);

    return null;
}
