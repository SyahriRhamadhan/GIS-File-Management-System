// MapView.tsx
import '@geoman-io/leaflet-geoman-free'; // side-effect: register map.pm
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Feature } from 'geojson';
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
        source_name: string;
    }>;
}

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;

    // Urutkan data berdasarkan kategori.layer_order
    const sortedData = React.useMemo(() => {
        return [...geojsonData].sort((a, b) => {
            const aOrder = a.kategori?.layer_order ?? 0;
            const bOrder = b.kategori?.layer_order ?? 0;
            return aOrder - bOrder;
        });
    }, [geojsonData]);

    // Kelompokkan data berdasarkan source_name
    const groupedBySourceName = React.useMemo(() => {
        const groups: Record<string, typeof geojsonData> = {};
        sortedData.forEach((item) => {
            const key = item.source_name || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [sortedData]);

    // Style GeoJSON berdasarkan kode_warna
    const geojsonStyle = (feature: any): L.PathOptions => ({
        color: feature.properties.kode_warna,
        fillColor: feature.properties.kode_warna,
        weight: 4,
        opacity: 1,
        fillOpacity: 0.5,
    });

    // Helper render popup content
    const renderPopupContent = (item: (typeof geojsonData)[0]) => (
        <div className="font-sans text-sm">
            {Object.entries(item.geojson.properties || {})
                .filter(([k]) => k !== 'id_geojson')
                .map(([k, v]) => (
                    <p key={k}>
                        <strong>{k}:</strong> {v}
                    </p>
                ))}
            <div className="mt-2 space-x-2 text-right">
                <a
                    href={`/dashboard/geojson/${item.id_geojson}/view`}
                    className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Add"
                >
                    <IoAddCircleOutline className="mr-1" />
                    Add
                </a>
                <a
                    href={`/dashboard/geojson/${item.id_geojson}/view`}
                    className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                    target="_blank"
                    rel="noreferrer noopener"
                    title="View"
                >
                    <FaFilePdf className="mr-1" />
                    View
                </a>
                <a
                    href={`/dashboard/geojson/${item.id_geojson}/edit`}
                    className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Edit"
                >
                    <FaMapMarkedAlt className="mr-1" />
                    Edit
                </a>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full">
            <MapContainer center={center} zoom={zoom} touchZoom scrollWheelZoom style={{ height: '100%', width: '100%' }}>
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
    &copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> 
    &copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a> 
    &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> 
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
    `}
                        />
                    </BaseLayer>

                    <BaseLayer name="Stamen Terrain">
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                            maxZoom={20}
                            attribution={`
    &copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a>
    &copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a>
    &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
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

                    {/* Overlays berdasarkan source_name */}
                    {Object.entries(groupedBySourceName).map(([sourceName, items]) => (
                        <Overlay key={sourceName} name={sourceName}>
                            {items.map((item) => (
                                <GeoJSON
                                    key={item.id_geojson}
                                    data={
                                        {
                                            type: 'Feature',
                                            geometry: item.geojson.geometry,
                                            properties: {
                                                ...item.geojson.properties,
                                                id_geojson: item.id_geojson,
                                                kode_warna: item.kode_warna || '#3388ff',
                                            },
                                        } as Feature
                                    }
                                    style={geojsonStyle}
                                >
                                    <Popup>{renderPopupContent(item)}</Popup>
                                </GeoJSON>
                            ))}
                        </Overlay>
                    ))}
                </LayersControl>
            </MapContainer>
        </div>
    );
};

export default MapView;
