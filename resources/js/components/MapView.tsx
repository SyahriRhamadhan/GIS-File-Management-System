import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

// MapView komponen
const MapView = ({ geojsonData }: { geojsonData: any }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;
    const [activePopup, setActivePopup] = useState<string | null>(null);
    console.log(geojsonData);
    const formattedGeojson = geojsonData.map((item: any) => {
        return {
            type: 'Feature',
            geometry: item.geojson.geometry,
            properties: item.geojson.properties,
        };
    });

    const onEachFeature = (feature: any, layer: any) => {
        if (feature.properties) {
            let popupContent = '<div>';
            Object.entries(feature.properties).forEach(([key, value]) => {
                popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
            });
            popupContent += '</div>';
            layer.bindPopup(popupContent);
        }
    };

    return (
        <div className="relative z-0 h-[500px] w-full" style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100vh', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={formattedGeojson} onEachFeature={onEachFeature} />
            </MapContainer>
        </div>
    );
};

export default MapView;
