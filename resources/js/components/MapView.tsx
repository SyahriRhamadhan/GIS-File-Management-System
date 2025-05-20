import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Feature } from 'geojson';
import 'leaflet/dist/leaflet.css';
import React, { useMemo, useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { FaFilePdf } from 'react-icons/fa6';
import { IoAddCircleOutline } from 'react-icons/io5';
import { GeoJSON, LayersControl, MapContainer, Popup, ScaleControl, TileLayer } from 'react-leaflet';
import GeomanControl from './GeomanControl';
import BaseLayers from '@/components/BaseLayer'; 

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

    const sortedData = useMemo(() => {
        return [...geojsonData].sort((a, b) => {
            const aOrder = a.kategori?.layer_order ?? 0;
            const bOrder = b.kategori?.layer_order ?? 0;
            return aOrder - bOrder;
        });
    }, [geojsonData]);

    const uniqueSourceNames = useMemo(() => {
        const set = new Set<string>();
        geojsonData.forEach((item) => set.add(item.source_name));
        return Array.from(set);
    }, [geojsonData]);

    const groupedBySourceName = useMemo(() => {
        const groups: Record<string, typeof geojsonData> = {};
        sortedData.forEach((item) => {
            const key = item.source_name || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [sortedData]);

    const subGroupsBySourceName = useMemo(() => {
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

    const [activeSourceFilters, setActiveSourceFilters] = useState<Record<string, boolean>>(() =>
        uniqueSourceNames.reduce(
            (acc, name) => {
                acc[name] = true;
                return acc;
            },
            {} as Record<string, boolean>,
        ),
    );

    const [activeSubGroupFilters, setActiveSubGroupFilters] = useState<Record<string, string | 'all'>>(() =>
        uniqueSourceNames.reduce(
            (acc, name) => {
                acc[name] = 'all';
                return acc;
            },
            {} as Record<string, string | 'all'>,
        ),
    );

    // State toggle sidebar show/hide
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((open) => !open);

    const toggleSourceFilter = (name: string) => {
        setActiveSourceFilters((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const setSubGroupFilter = (sourceName: string, subGroup: string | 'all') => {
        setActiveSubGroupFilters((prev) => ({
            ...prev,
            [sourceName]: subGroup,
        }));
    };

    const geojsonStyle = (feature: any): L.PathOptions => ({
        color: feature.properties.kode_warna,
        fillColor: feature.properties.kode_warna,
        weight: 4,
        opacity: 1,
        fillOpacity: 0.5,
    });

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
            {/* Konten Peta */}
            <div className={`relative flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-72' : ''}`}>
                <MapContainer center={center} zoom={zoom} touchZoom scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <ScaleControl position="bottomleft" />
                    <ScaleControl position="topright" />

                    <GeomanControl />

                    <LayersControl position="topright">
                        <BaseLayers />

                        {/* Overlay filtered */}
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
            <div
                className={`fixed top-0 right-0 flex h-full flex-col border-l border-gray-300 bg-white shadow-lg transition-all duration-300 ${
                    sidebarOpen ? 'w-72 p-4' : 'w-10 p-2'
                } overflow-auto`}
            >
                {/* Tombol toggle sidebar */}
                <button
                    onClick={toggleSidebar}
                    className="mb-4 self-end rounded bg-gray-200 px-2 py-1 text-sm select-none hover:bg-gray-300"
                    aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                    {sidebarOpen ? 'Hide ◀' : '▶'}
                </button>

                {/* Konten filter muncul hanya jika sidebar terbuka */}
                {sidebarOpen && (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default MapView;
