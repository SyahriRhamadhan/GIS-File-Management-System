import BaseLayers from '@/components/BaseLayer';
import SidebarFilter from '@/components/SidebarFilter';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Feature } from 'geojson';
import { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { FaFilePdf } from 'react-icons/fa6';
import { IoAddCircleOutline } from 'react-icons/io5';
import { GeoJSON, LayersControl, MapContainer, Popup, ScaleControl, useMap } from 'react-leaflet';
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

// Component to set mapRef after map is ready
const MapRefSetter: React.FC<{ mapRef: React.MutableRefObject<LeafletMap | null> }> = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);
    return null;
};

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;
    const mapRef = useRef<LeafletMap | null>(null);
    // Untuk simpan ref tiap fitur
    const geoJsonRefs = useRef<Record<string, L.GeoJSON>>({});

    // Sort & Group data
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

    // Grouped children per parent, id dan label (label = gabungan property k-v)
    const groupedChildren = useMemo(() => {
        const groups: Record<string, Array<{ id: string; label: string }>> = {};
        geojsonData.forEach((item) => {
            const parent = item.source_name;
            const propEntries = Object.entries(item.geojson.properties || {})
                .filter(([k]) => k !== 'id_geojson')
                .map(([k, v]) => `${k}: ${v}`);
            // Label fallback ke id jika tidak ada property lain
            const label = propEntries.length > 0 ? propEntries.join(', ') : String(item.id_geojson || 'Unknown');
            const id = String(item.id_geojson || label);

            if (!groups[parent]) groups[parent] = [];
            if (!groups[parent].find((c) => c.id === id)) {
                groups[parent].push({ id, label });
            }
        });
        return groups;
    }, [geojsonData]);

    // State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((open) => !open);

    // Parent & child checklist state
    const [activeChildFilters, setActiveChildFilters] = useState<Record<string, Record<string, boolean>>>({});

    // Auto-initialize parent/child filter state
    useEffect(() => {
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

    // Parent toggle logic: toggle ALL child in group
    const toggleSourceFilter = (parent: string) => {
        setActiveChildFilters((prev) => {
            const group = prev[parent] || {};
            const allChecked = Object.values(group).every((v) => v);
            // Jika semua aktif, uncheck semua, jika tidak, aktifkan semua
            const newState = { ...prev };
            newState[parent] = {};
            (groupedChildren[parent] || []).forEach((child) => {
                newState[parent][child.id] = !allChecked;
            });
            return newState;
        });
    };

    // Parent checked status = semua child dalam parent aktif
    const isParentChecked = (parent: string) =>
        groupedChildren[parent]?.length > 0 && groupedChildren[parent].every((child) => !!activeChildFilters[parent]?.[child.id]);

    // Child handler
    const toggleChildFilter = (parent: string, childId: string) => {
        setActiveChildFilters((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [childId]: !prev[parent]?.[childId],
            },
        }));
    };

    // Show/Hide all
    const handleShowAll = () => {
        setActiveChildFilters((prev) => {
            const updated = { ...prev };
            for (const parent of Object.keys(groupedChildren)) {
                updated[parent] = {};
                for (const child of groupedChildren[parent]) {
                    updated[parent][child.id] = true;
                }
            }
            return updated;
        });
    };
    const handleHideAll = () => {
        setActiveChildFilters((prev) => {
            const updated = { ...prev };
            for (const parent of Object.keys(groupedChildren)) {
                updated[parent] = {};
                for (const child of groupedChildren[parent]) {
                    updated[parent][child.id] = false;
                }
            }
            return updated;
        });
    };

    // Overlay visibility per child
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

    // Handler for View (fly to location)
    const handleViewLocation = (parent: string, childId: string) => {
        const item = geojsonData.find((i) => String(i.id_geojson) === String(childId) && i.source_name === parent);
        if (!item) return;
        let latLng: [number, number] | null = null;
        const geom = item.geojson.geometry;

        if (geom.type === 'Point') {
            latLng = [geom.coordinates[1], geom.coordinates[0]];
        } else if (geom.type === 'LineString') {
            latLng = [geom.coordinates[0][1], geom.coordinates[0][0]];
        } else if (geom.type === 'Polygon') {
            latLng = [geom.coordinates[0][0][1], geom.coordinates[0][0][0]];
        } else if (geom.type === 'MultiPoint') {
            latLng = [geom.coordinates[0][1], geom.coordinates[0][0]];
        } else if (geom.type === 'MultiLineString') {
            latLng = [geom.coordinates[0][0][1], geom.coordinates[0][0][0]];
        } else if (geom.type === 'MultiPolygon') {
            latLng = [geom.coordinates[0][0][0][1], geom.coordinates[0][0][0][0]];
        }
        // Fly dan buka popup
        if (latLng && mapRef.current) {
            mapRef.current.flyTo(latLng, 16, { duration: 1 });
            setTimeout(() => {
                const refKey = `${parent}-${childId}`;
                const layer = geoJsonRefs.current[refKey];
                if (layer) {
                    layer.eachLayer((l) => {
                        if ('openPopup' in l && typeof l.openPopup === 'function') {
                            l.openPopup();
                        }
                    });
                }
            }, 1000);
        }
    };
    const handleSearchCoordinate = (x: string, y: string) => {
        // Parsing ke number, pastikan valid
        const lat = Number(y);
        const lng = Number(x);
        if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
            mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
        }
    };

    return (
        <div className="flex h-screen">
            {/* Konten Peta */}
            <div className={`relative flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-67' : 'mr-0'}`}>
                <MapContainer center={center} zoom={zoom} touchZoom scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    {/* Inilah kunci: ref setter */}
                    <MapRefSetter mapRef={mapRef} />

                    <ScaleControl position="bottomleft" />
                    <ScaleControl position="topright" />

                    <GeomanControl />

                    <LayersControl position="topright">
                        <BaseLayers />
                        {/* Overlay filtered */}
                        {uniqueSourceNames.map((sourceName) => {
                            // Ambil id anak yang visible
                            const visibleChildrenIds = groupedChildren[sourceName]
                                ? groupedChildren[sourceName].filter((child) => activeChildFilters[sourceName]?.[child.id]).map((c) => c.id)
                                : [];

                            const items = groupedBySourceName[sourceName] || [];
                            const filteredItems = items.filter((item) => visibleChildrenIds.includes(String(item.id_geojson)));

                            if (filteredItems.length === 0) return null;

                            return (
                                <Overlay key={sourceName} name={sourceName} checked>
                                    {filteredItems.map((item) => (
                                        <GeoJSON
                                            key={item.id_geojson}
                                            ref={(layer) => {
                                                if (layer) {
                                                    geoJsonRefs.current[`${sourceName}-${item.id_geojson}`] = layer;
                                                }
                                            }}
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
                                            style={(feature) => ({
                                                color: feature?.properties?.kode_warna || '#3388ff',
                                                fillColor: feature?.properties?.kode_warna || '#3388ff',
                                                weight: 4,
                                                opacity: 1,
                                                fillOpacity: 0.5,
                                            })}
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
                toggleSourceFilter={toggleSourceFilter}
                activeChildFilters={activeChildFilters}
                toggleChildFilter={toggleChildFilter}
                onShowAll={handleShowAll}
                onHideAll={handleHideAll}
                onView={handleViewLocation}
                isParentChecked={isParentChecked}
                onSearchCoordinate={handleSearchCoordinate}
            />
        </div>
    );
};

export default MapView;
