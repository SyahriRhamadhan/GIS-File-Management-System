import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';

function FitToBounds({ data }: { data: any }) {
    const map = useMap();

    useEffect(() => {
        if (!data) return;

        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 });
        }
    }, [data, map]);

    return null;
}

export default function Modal({ geojson, onClose }: { geojson: any; onClose: () => void }) {
    const [centre] = useState<[number, number]>([1.0, 104.521117]);
    const MAX_VISIBLE_PROPERTIES = 8;

    const onEachFeature = (feature: any, layer: L.Layer) => {
        if (feature.properties) {
            const entries = Object.entries(feature.properties);
            const visibleEntries = entries.slice(0, MAX_VISIBLE_PROPERTIES);
            const scrollableEntries = entries.slice(MAX_VISIBLE_PROPERTIES);

            // Show the first `MAX_VISIBLE_PROPERTIES` items, then place the rest in a scrollable container.
            let html = '<div>';
            visibleEntries.forEach(([key, value]) => {
                html += `<p><strong>${key}:</strong> ${value}</p>`;
            });

            if (scrollableEntries.length) {
                html += '<div style="max-height: 200px; overflow-y: auto; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">';
                scrollableEntries.forEach(([key, value]) => {
                    html += `<p><strong>${key}:</strong> ${value}</p>`;
                });
                html += '</div>';
            }

            html += '</div>';
            layer.bindPopup(html);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl overflow-hidden rounded-lg bg-white p-4 shadow-lg"
                style={{ height: '90vh' }}
            >
                <button className="absolute top-2 right-2 text-gray-700 hover:text-gray-900" onClick={onClose}>
                    <IoClose size={28} />
                </button>

                <h2 className="mb-3 text-lg font-semibold">GeoJSON Preview</h2>

                <div className="h-[calc(100%-2.5rem)] w-full">
                    <MapContainer className="h-full w-full" center={centre} zoom={11} scrollWheelZoom>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {geojson?.geojson && (
                            <>
                                <GeoJSON data={geojson.geojson} onEachFeature={onEachFeature} />
                                <FitToBounds data={geojson.geojson} />
                            </>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
