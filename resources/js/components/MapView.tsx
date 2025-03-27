import { GeoJsonObject } from 'geojson';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

interface MapViewProps {
    geojsonData: any; // Data GeoJSON yang diterima dari backend
}

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: LatLngExpression = [1.029868, 104.521117];
    const zoom = 10; // Menyesuaikan zoom level
    console.log(geojsonData);
    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Menambahkan GeoJSON ke peta */}
                {geojsonData && geojsonData.length > 0 && <GeoJSON data={geojsonData as GeoJsonObject} />}
            </MapContainer>
        </div>
    );
};

export default MapView;
