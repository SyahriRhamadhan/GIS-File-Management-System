import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';

import { FeatureCollection, Geometry } from 'geojson';

interface MapViewProps {
    geojsonData: FeatureCollection<Geometry>; 
    regions: any; 
}

// Fungsi untuk menghapus nilai ketiga (elevasi) dalam koordinat
const removeElevation = (geojsonData: FeatureCollection): FeatureCollection => {
    // Pastikan geojsonData.features ada
    if (!geojsonData || !geojsonData.features) {
        console.error("GeoJSON data tidak valid", geojsonData);
        return { type: "FeatureCollection", features: [] };
    }

    return {
        type: 'FeatureCollection',
        features: geojsonData.features.map((feature: any) => {
            // Cek jika tipe geometry adalah Polygon atau MultiPolygon
            if (feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates = (feature.geometry.coordinates as number[][][]).map((polygon: number[][]) =>
                    polygon.map((coord: number[]) => coord.slice(0, 2)) // Hanya ambil dua nilai: longitude, latitude
                );
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates = (feature.geometry.coordinates as number[][][][]).map((polygon: number[][][]) =>
                    polygon.map((ring: number[][]) =>
                        ring.map((coord: number[]) => coord.slice(0, 2)) // Hanya ambil dua nilai: longitude, latitude
                    )
                );
            }
            return feature;
        }),
    };
};

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: LatLngExpression = [1.029868, 104.521117];
    const zoom = 10;

    // Memastikan GeoJSON sudah diformat dengan benar
    const formattedGeojsonData = geojsonData ? removeElevation(geojsonData) : [];

    console.log(formattedGeojsonData); // Cek format GeoJSON yang telah diproses

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Menambahkan GeoJSON */}
                {formattedGeojsonData && <GeoJSON data={formattedGeojsonData as any} />}
            </MapContainer>
        </div>
    );
};

export default MapView;
