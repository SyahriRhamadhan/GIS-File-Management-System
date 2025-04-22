import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

const Modal = ({ geojson, onClose }: { geojson: any; onClose: () => void }) => {
    const [center, setCenter] = useState<[number, number]>([1.0, 104.521117]);
    const [zoom, setZoom] = useState(11);

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

    useEffect(() => {
        if (geojson && geojson.geojson) {
            const geojsonLayer = L.geoJSON(geojson.geojson);
            const bounds = geojsonLayer.getBounds();

            if (bounds.isValid()) {
                const newCenter = bounds.getCenter();
                setCenter([newCenter.lat, newCenter.lng]);
                setZoom(geojsonLayer.getBounds().isValid() ? 10 : 11);
            }
        }
    }, [geojson]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
                <button className="absolute top-2 right-2 text-black" onClick={onClose}>
                    <IoClose />
                </button>
                <h2 className="mb-4 text-xl font-bold">GeoJSON Data</h2>
                <div style={{ height: '60vh', width: '100%' }}>
                    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <GeoJSON data={geojson.geojson} onEachFeature={onEachFeature} />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default Modal;
