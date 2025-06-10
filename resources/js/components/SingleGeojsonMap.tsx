import L from 'leaflet';
import React, { useEffect } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';

interface SingleGeojsonMapProps {
    geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | null;
    zoom?: number;
}

const FitBoundsToGeojson: React.FC<{ geojson: GeoJSON.GeoJsonObject }> = ({ geojson }) => {
    const map = useMap();

    useEffect(() => {
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { maxZoom: 16, padding: [20, 20] });
        }
    }, [geojson, map]);

    return null;
};

const SingleGeojsonMap: React.FC<SingleGeojsonMapProps> = ({ geojson, zoom = 11 }) => {
    if (!geojson) return <p>No GeoJSON data available.</p>;

    // Default center fallback, akan digantikan fitBounds nanti
    const defaultCenter: [number, number] = [1.0, 104.521117];

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <MapContainer center={defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={geojson} />
                <FitBoundsToGeojson geojson={geojson} />
            </MapContainer>
        </div>
    );
};

export default SingleGeojsonMap;
