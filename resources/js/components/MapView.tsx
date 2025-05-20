// MapView.tsx
import '@geoman-io/leaflet-geoman-free';
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

    // Unik source_name
    const uniqueSourceNames = React.useMemo(() => {
        const set = new Set<string>();
        geojsonData.forEach((item) => set.add(item.source_name));
        return Array.from(set);
    }, [geojsonData]);

    // Group per source_name
    const groupedBySourceName = React.useMemo(() => {
        const groups: Record<string, typeof geojsonData> = {};
        sortedData.forEach((item) => {
            const key = item.source_name || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [sortedData]);

    // Ambil sub-group unik per source_name (asumsi property 'sub_group')
    const subGroupsBySourceName = React.useMemo(() => {
        const result: Record<string, string[]> = {};
        for (const sourceName of uniqueSourceNames) {
            const items = groupedBySourceName[sourceName] || [];
            const subSet = new Set<string>();
            items.forEach((item) => {
                const sub = item.geojson.properties?.sub_group || 'Undefined';
                subSet.add(sub);
            });
            result[sourceName] = Array.from(subSet);
        }
        return result;
    }, [uniqueSourceNames, groupedBySourceName]);

    // State filter checkbox source_name
    const [activeSourceFilters, setActiveSourceFilters] = React.useState<Record<string, boolean>>(() =>
        uniqueSourceNames.reduce(
            (acc, name) => {
                acc[name] = true; // default semua true
                return acc;
            },
            {} as Record<string, boolean>,
        ),
    );

    // State filter dropdown sub_group per source_name
    const [activeSubGroupFilters, setActiveSubGroupFilters] = React.useState<Record<string, string | 'all'>>(() =>
        uniqueSourceNames.reduce(
            (acc, name) => {
                acc[name] = 'all';
                return acc;
            },
            {} as Record<string, string | 'all'>,
        ),
    );

    // Toggle source_name checkbox
    const toggleSourceFilter = (name: string) => {
        setActiveSourceFilters((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    // Set dropdown sub-group
    const setSubGroupFilter = (sourceName: string, subGroup: string | 'all') => {
        setActiveSubGroupFilters((prev) => ({
            ...prev,
            [sourceName]: subGroup,
        }));
    };

    // GeoJSON style
    const geojsonStyle = (feature: any): L.PathOptions => ({
        color: feature.properties.kode_warna,
        fillColor: feature.properties.kode_warna,
        weight: 4,
        opacity: 1,
        fillOpacity: 0.5,
    });

    // Popup content render
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
        <div className="flex h-screen">
            {/* Konten peta kiri */}
            <div className="relative flex-1">
                <MapContainer center={center} zoom={zoom} touchZoom scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <ScaleControl position="bottomleft" />
                    <ScaleControl position="topright" />

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


                        {/* Overlay sesuai filter */}
                        {uniqueSourceNames.map((sourceName) => {
                            if (!activeSourceFilters[sourceName]) return null;

                            const items = groupedBySourceName[sourceName] || [];

                            const filteredItems =
                                activeSubGroupFilters[sourceName] && activeSubGroupFilters[sourceName] !== 'all'
                                    ? items.filter(
                                          (item) => (item.geojson.properties?.sub_group || 'Undefined') === activeSubGroupFilters[sourceName],
                                      )
                                    : items;

                            if (filteredItems.length === 0) return null;

                            return (
                                <Overlay key={sourceName} name={sourceName} checked>
                                    {filteredItems.map((item) => (
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
                            );
                        })}
                    </LayersControl>
                </MapContainer>
            </div>

            {/* Sidebar filter kanan */}
            <div className="w-72 overflow-auto border-l border-gray-300 bg-white p-4">
                <h2 className="mb-3 font-semibold">Filter Layers</h2>
                {uniqueSourceNames.map((sourceName) => (
                    <div key={sourceName} className="mb-4">
                        <label className="inline-flex cursor-pointer items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={activeSourceFilters[sourceName] || false}
                                onChange={() => toggleSourceFilter(sourceName)}
                            />
                            <span>{sourceName}</span>
                        </label>
                        {activeSourceFilters[sourceName] && subGroupsBySourceName[sourceName]?.length > 1 && (
                            <select
                                className="mt-1 w-full rounded border px-2 py-1"
                                value={activeSubGroupFilters[sourceName]}
                                onChange={(e) => setSubGroupFilter(sourceName, e.target.value)}
                            >
                                <option value="all">All</option>
                                {subGroupsBySourceName[sourceName].map((subGroup) => (
                                    <option key={subGroup} value={subGroup}>
                                        {subGroup}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapView;
