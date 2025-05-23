import BaseLayers from '@/components/BaseLayer';
import SidebarFilter from '@/components/SidebarFilter';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Feature } from 'geojson';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { FaFilePdf } from 'react-icons/fa6';
import { IoAddCircleOutline } from 'react-icons/io5';
import { GeoJSON, LayersControl, MapContainer, Popup, ScaleControl } from 'react-leaflet';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((open) => !open);

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

    // Grouped children per layer: child = id_geojson + label (property summary string)
    const groupedChildren = useMemo(() => {
        const groups: Record<string, Array<{ id: string; label: string }>> = {};
        geojsonData.forEach((item) => {
            const parent = item.source_name;
            const properties = item.geojson?.properties || {};
            const propEntries = Object.entries(properties)
                .filter(([k]) => k !== 'id_geojson')
                .map(([k, v]) => `${k}: ${v}`);
            let label: string;

            if (propEntries.length > 0) {
                label = propEntries.join(', ');
            } else if (item.id_geojson) {
                label = String(item.id_geojson);
            } else {
                label = 'Unknown';
            }

            const id = item.id_geojson ? String(item.id_geojson) : 'unknown';

            if (!groups[parent]) groups[parent] = [];
            // Pastikan tidak duplikat (berdasarkan id)
            if (!groups[parent].find((c) => c.id === id)) {
                groups[parent].push({ id, label });
            }
        });
        return groups;
    }, [geojsonData]);

    const [activeSourceFilters, setActiveSourceFilters] = useState<Record<string, boolean>>(() =>
        uniqueSourceNames.reduce(
            (acc, name) => {
                acc[name] = true;
                return acc;
            },
            {} as Record<string, boolean>,
        ),
    );

    // Child checklist state
    const [activeChildFilters, setActiveChildFilters] = useState<Record<string, Record<string, boolean>>>({});

    // Auto-initialize on data change
    useEffect(() => {
        setActiveSourceFilters((prev) => {
            const updated = { ...prev };
            for (const parent of Object.keys(groupedChildren)) {
                if (!(parent in updated)) updated[parent] = true;
            }
            return updated;
        });
        setActiveChildFilters((prev) => {
            const updated = { ...prev };
            for (const [parent, children] of Object.entries(groupedChildren)) {
                if (!updated[parent]) updated[parent] = {};
                for (const child of children) {
                    if (!(child.id in updated[parent])) updated[parent][child.id] = true;
                }
            }
            return updated;
        });
    }, [groupedChildren]);

    const toggleSourceFilter = (name: string) => {
        setActiveSourceFilters((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const toggleChildFilter = (parent: string, childId: string) => {
        setActiveChildFilters((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [childId]: !prev[parent][childId],
            },
        }));
    };

    const handleShowAll = () => setActiveSourceFilters(Object.fromEntries(uniqueSourceNames.map((name) => [name, true])));
    const handleHideAll = () => setActiveSourceFilters(Object.fromEntries(uniqueSourceNames.map((name) => [name, false])));

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
            <div className={`relative flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-67' : 'mr-0'}`}>
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
                            const visibleChildrenIds = groupedChildren[sourceName]
                                ? groupedChildren[sourceName].filter((child) => activeChildFilters[sourceName]?.[child.id]).map((c) => c.id)
                                : [];

                            const filteredItems = items.filter((item) => visibleChildrenIds.includes(String(item.id_geojson)));

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

            <SidebarFilter
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                uniqueSourceNames={Object.keys(groupedChildren)}
                groupedChildren={groupedChildren}
                activeSourceFilters={activeSourceFilters}
                toggleSourceFilter={toggleSourceFilter}
                activeChildFilters={activeChildFilters}
                toggleChildFilter={toggleChildFilter}
                onShowAll={handleShowAll}
                onHideAll={handleHideAll}
            />
        </div>
    );
};

export default MapView;
