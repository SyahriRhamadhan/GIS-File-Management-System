import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer } from 'react-leaflet';

const MapView = () => {
    const center: LatLngExpression = [1.029868, 104.521117];
    const zoom = 10; // Menyesuaikan zoom level

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
        </div>
    );
};

export default MapView;
