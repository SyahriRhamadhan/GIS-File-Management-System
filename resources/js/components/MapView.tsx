import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

// MapView komponen
const MapView = ({ geojsonData }: { geojsonData: any }) => {
    const center: [number, number] = [1.029868, 104.521117]; 
    const zoom = 10; 
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
            const popupContent = `
                <div>
                    <h4>FID_POLARU: ${feature.properties.FID_POLARU}</h4>
                    <p>KLS_I: ${feature.properties.KLS_I}</p>
                    <p>KLS_III: ${feature.properties.KLS_III}</p>
                    <p>LUAS_Km2: ${feature.properties.LUAS_Km2}</p>
                    <p>SUMBER: ${feature.properties.SUMBER}</p>
                </div>
            `;
            layer.bindPopup(popupContent); 
        }
    };

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={formattedGeojson} onEachFeature={onEachFeature} />
            </MapContainer>
        </div>
    );
};

export default MapView;
