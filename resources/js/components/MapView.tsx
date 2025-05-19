// MapView.tsx
import '@geoman-io/leaflet-geoman-free'; // side-effect: register map.pm
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { FaFilePdf } from 'react-icons/fa6';
import { IoAddCircleOutline } from 'react-icons/io5';
import { GeoJSON, LayersControl, MapContainer, Popup, ScaleControl, TileLayer } from 'react-leaflet';
import GeomanControl from './GeomanControl';

const { BaseLayer, Overlay } = LayersControl;

interface MapViewProps {
    geojsonData: Array<{
        id_geojson: number | string;
        geojson: {
            geometry: GeoJSON.Geometry;
            properties: Record<string, any>;
        };
        kode_warna: string;
        kategori: {
            layer_order: number;
        };
    }>;
}

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;
    const sortedData = React.useMemo(() => [...geojsonData].sort((a, b) => a.kategori.layer_order - b.kategori.layer_order), [geojsonData]);

    // buat FeatureCollection dan sertakan kode_warna ke properties
    const formattedGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: sortedData.map((item) => ({
            type: 'Feature',
            geometry: item.geojson.geometry,
            properties: {
                ...item.geojson.properties,
                id_geojson: item.id_geojson,
                kode_warna: item.kode_warna || '#3388ff',
            },
        })),
    };

    // style function menggunakan kode_warna
    const geojsonStyle = (feature: any) => ({
        color: feature.properties.kode_warna,
        fillColor: feature.properties.kode_warna,
        weight: 4,
        opacity: 1,
        fillOpacity: 0.5,
    });

    return (
        <div className="h-screen w-full">
            <MapContainer center={center} zoom={zoom} touchZoom={true} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                {/* Scale Controls */}
                <ScaleControl position="bottomleft" />
                <ScaleControl position="topright" />

                {/* Geoman Draw Controls */}
                <GeomanControl />

                {/* Layer Switcher */}
                <LayersControl position="topright">
                    {/* Base Layers */}
                    <BaseLayer checked name="Esri Satellite">
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri — Source: Esri, USDA, USGS"
                        />
                    </BaseLayer>

                    <BaseLayer name="OSM Standard">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    </BaseLayer>

                    <BaseLayer name="Stamen Toner">
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
                            attribution={`
    &copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> 
    &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> 
    &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> 
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
    `}
                        />
                    </BaseLayer>

                    <BaseLayer name="Stamen Terrain">
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                            maxZoom={20}
                            attribution={`
    &copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>
    &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>
    &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
  `}
                        />
                    </BaseLayer>

                    <BaseLayer name="Carto Positron">
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution="&copy; CARTO &copy; OpenStreetMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="Carto Dark">
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution="&copy; CARTO &copy; OpenStreetMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="OpenTopoMap">
                        <TileLayer
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="NASA City Lights">
                        <TileLayer
                            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/2012-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
                            attribution="Imagery courtesy NASA EOSDIS GIBS"
                            maxNativeZoom={8}
                            maxZoom={18}
                        />
                    </BaseLayer>

                    {/* GeoJSON Overlay dengan Popup React-style */}
                    <Overlay checked name="GeoJSON Data">
                        {formattedGeojson.features.map((feat, idx) => (
                            <GeoJSON key={idx} data={feat} style={geojsonStyle}>
                                <Popup>
                                    <div className="font-sans text-sm">
                                        {Object.entries(feat.properties || {})
                                            .filter(([k]) => k !== 'id_geojson')
                                            .map(([k, v]) => (
                                                <p key={k}>
                                                    <strong>{k}:</strong> {v}
                                                </p>
                                            ))}
                                        <div className="mt-2 space-x-2 text-right">
                                            <a
                                                href={`/dashboard/geojson/${feat.properties?.id_geojson}/view`}
                                                className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                                                target="_blank"
                                            >
                                                <IoAddCircleOutline className="mr-1" />
                                                Add
                                            </a>
                                            <a
                                                href={`/dashboard/geojson/${feat.properties?.id_geojson}/view`}
                                                className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                                                target="_blank"
                                            >
                                                <FaFilePdf className="mr-1" />
                                                View
                                            </a>
                                            <a
                                                href={`/dashboard/geojson/${feat.properties?.id_geojson}/edit`}
                                                className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                                                target="_blank"
                                            >
                                                <FaMapMarkedAlt className="mr-1" />
                                                Edit
                                            </a>
                                        </div>
                                    </div>
                                </Popup>
                            </GeoJSON>
                        ))}
                    </Overlay>
                </LayersControl>
            </MapContainer>
        </div>
    );
};

export default MapView;
