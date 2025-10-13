import BaseLayers from '@/components/BaseLayer';
import SidebarFilter from '@/components/SidebarFilter';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Feature } from 'geojson';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
        kategori?: {
            layer_order: number;
            orde0?: string;
            kode_warna?: string;
            kode?: string;
        };
        source_name: string;
    }>;
    // Optional: daftar id yang ingin ditampilkan secara default
    initialVisibleIds?: Array<string | number>;
}

// Component to set mapRef after map is ready
const MapRefSetter: React.FC<{ mapRef: React.MutableRefObject<LeafletMap | null> }> = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);
    return null;
};

const MapView: React.FC<MapViewProps> = ({ geojsonData, initialVisibleIds = [] }) => {
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

    // Grouped children per category > parent > child
    const groupedByCategory = useMemo(() => {
        const groups: Record<string, Record<string, Array<{ id: string; label: string }>>> = {};
        
        geojsonData.forEach((item) => {
            const categoryName = item.kategori?.orde0 || 'Uncategorized';
            const parent = item.source_name || 'Unknown';
            
            const propEntries = Object.entries(item.geojson.properties || {})
                .filter(([k]) => k !== 'id_geojson')
                .map(([k, v]) => `${k}: ${v}`);
            // Label fallback ke id jika tidak ada property lain
            const label = propEntries.length > 0 ? propEntries.join(', ') : String(item.id_geojson || 'Unknown');
            const id = String(item.id_geojson || label);

            if (!groups[categoryName]) groups[categoryName] = {};
            if (!groups[categoryName][parent]) groups[categoryName][parent] = [];
            if (!groups[categoryName][parent].find((c) => c.id === id)) {
                groups[categoryName][parent].push({ id, label });
            }
        });
        
        return groups;
    }, [geojsonData]);

    // Create category to unique code mapping for better performance
    const categoryToCodes = useMemo(() => {
        const mapping: Record<string, string> = {};
        geojsonData.forEach((item) => {
            const categoryName = item.kategori?.orde0 || 'Uncategorized';
            const uniqueCode = item.kategori?.kode || 'N/A';
            if (!mapping[categoryName]) {
                mapping[categoryName] = uniqueCode;
            }
        });
        return mapping;
    }, [geojsonData])

    // Create category colors mapping (still needed for visual indicators)
    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        geojsonData.forEach((item) => {
            const categoryName = item.kategori?.orde0 || 'Uncategorized';
            if (!colors[categoryName]) {
                // Use kode_warna from kategori if available, otherwise from item
                colors[categoryName] = item.kategori?.kode_warna || item.kode_warna || '#3388ff';
            }
        });
        return colors;
    }, [geojsonData]);

    // Utility functions for using unique codes as differentiators
    const getCategoryByCode = useCallback((code: string): string => {
        return Object.keys(categoryToCodes).find(cat => categoryToCodes[cat] === code) || 'Uncategorized';
    }, [categoryToCodes]);

    const getCodeByCategory = useCallback((categoryName: string): string => {
        return categoryToCodes[categoryName] || 'N/A';
    }, [categoryToCodes]);

    // Get unique category names
    const uniqueCategoryNames = useMemo(() => {
        return Object.keys(groupedByCategory);
    }, [groupedByCategory]);

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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toggleSidebar = () => setSidebarOpen((open) => !open);

    // Loading effect when data changes
    useEffect(() => {
        if (geojsonData.length > 0) {
            setIsLoading(true);
            // Simulate processing time for large datasets
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [geojsonData]);

    // State for three-level hierarchy: category > parent > child
    const [activeCategoryFilters, setActiveCategoryFilters] = useState<Record<string, boolean>>({});
    const [activeParentFilters, setActiveParentFilters] = useState<Record<string, Record<string, boolean>>>({});
    const [activeChildFilters, setActiveChildFilters] = useState<Record<string, Record<string, Record<string, boolean>>>>({});

    // Auto-initialize filter state for three levels
    useEffect(() => {
        const hasInitial = Array.isArray(initialVisibleIds) && initialVisibleIds.length > 0;
        const initialSet = new Set(initialVisibleIds.map((v) => String(v)));

        // Initialize category filters
        setActiveCategoryFilters(() => {
            const updated: Record<string, boolean> = {};
            for (const category of uniqueCategoryNames) {
                updated[category] = !hasInitial; // Show all categories by default if no initial IDs
            }
            return updated;
        });

        // Initialize parent filters
        setActiveParentFilters(() => {
            const updated: Record<string, Record<string, boolean>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const parent of Object.keys(parents)) {
                    updated[category][parent] = !hasInitial; // Show all parents by default if no initial IDs
                }
            }
            return updated;
        });

        // Initialize child filters
        setActiveChildFilters(() => {
            const updated: Record<string, Record<string, Record<string, boolean>>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const [parent, children] of Object.entries(parents)) {
                    updated[category][parent] = {};
                    for (const child of children) {
                        const idStr = String(child.id);
                        // If there are initial IDs, only show those; otherwise show none by default
                        updated[category][parent][child.id] = hasInitial ? initialSet.has(idStr) : false;
                    }
                }
            }
            return updated;
        });
    }, [groupedByCategory, uniqueCategoryNames, initialVisibleIds]);

    // Category toggle logic: toggle ALL parents and children in category
    const toggleCategoryFilter = (category: string) => {
        setActiveCategoryFilters((prev) => {
            const newCategoryState = !prev[category];
            const updated = { ...prev, [category]: newCategoryState };
            
            // Also update all parents and children in this category
            setActiveParentFilters((prevParents) => {
                const updatedParents = { ...prevParents };
                if (!updatedParents[category]) updatedParents[category] = {};
                
                for (const parent of Object.keys(groupedByCategory[category] || {})) {
                    updatedParents[category][parent] = newCategoryState;
                }
                
                return updatedParents;
            });
            
            setActiveChildFilters((prevChildren) => {
                const updatedChildren = { ...prevChildren };
                if (!updatedChildren[category]) updatedChildren[category] = {};
                
                for (const [parent, children] of Object.entries(groupedByCategory[category] || {})) {
                    if (!updatedChildren[category][parent]) updatedChildren[category][parent] = {};
                    for (const child of children) {
                        updatedChildren[category][parent][child.id] = newCategoryState;
                    }
                }
                
                return updatedChildren;
            });
            
            return updated;
        });
    };

    // Parent toggle logic: toggle ALL children in parent
    const toggleParentFilter = (category: string, parent: string) => {
        setActiveParentFilters((prev) => {
            const currentState = prev[category]?.[parent] || false;
            const newState = !currentState;
            
            const updated = {
                ...prev,
                [category]: {
                    ...prev[category],
                    [parent]: newState,
                },
            };
            
            // Also update all children in this parent to match parent state
            setActiveChildFilters((prevChildren) => {
                const updatedChildren = { ...prevChildren };
                if (!updatedChildren[category]) updatedChildren[category] = {};
                if (!updatedChildren[category][parent]) updatedChildren[category][parent] = {};
                
                for (const child of groupedByCategory[category]?.[parent] || []) {
                    updatedChildren[category][parent][child.id] = newState;
                }
                
                return updatedChildren;
            });
            
            // If parent is being activated, also activate the category
            if (newState) {
                setActiveCategoryFilters((prevCategories) => {
                    const updatedCategories = { ...prevCategories, [category]: true };
                    return updatedCategories;
                });
            }
            
            return updated;
        });
    };

    // Child toggle logic
    const toggleChildFilter = (category: string, parent: string, childId: string) => {
        setActiveChildFilters((prev) => {
            const currentState = prev[category]?.[parent]?.[childId] || false;
            const newState = !currentState;
            
            const updated = {
                ...prev,
                [category]: {
                    ...prev[category],
                    [parent]: {
                        ...prev[category]?.[parent],
                        [childId]: newState,
                    },
                },
            };
            
            // If child is being activated, also activate parent and category
            if (newState) {
                setActiveParentFilters((prevParents) => {
                    const updatedParents = { 
                        ...prevParents,
                        [category]: {
                            ...prevParents[category],
                            [parent]: true
                        }
                    };
                    return updatedParents;
                });
                
                setActiveCategoryFilters((prevCategories) => {
                    const updatedCategories = { ...prevCategories, [category]: true };
                    return updatedCategories;
                });
            }
            
            return updated;
        });
    };

    // Check if category is checked (all parents and children are active)
    const isCategoryChecked = (category: string) => {
        const parents = groupedByCategory[category];
        if (!parents || Object.keys(parents).length === 0) {
            return false;
        }
        
        // Category is checked if it's active AND all its parents and children are active
        const categoryActive = !!activeCategoryFilters[category];
        const allParentsAndChildrenActive = Object.keys(parents).every((parent) => {
            const parentActive = !!activeParentFilters[category]?.[parent];
            const children = parents[parent];
            const allChildrenActive = children.every((child) => !!activeChildFilters[category]?.[parent]?.[child.id]);
            
            return parentActive && allChildrenActive;
        });
        
        const result = categoryActive && allParentsAndChildrenActive;
        return result;
    };

    // Check if parent is checked (parent is active AND all children are active)
    const isParentChecked = (category: string, parent: string) => {
        const children = groupedByCategory[category]?.[parent];
        if (!children || children.length === 0) {
            return false;
        }
        
        // Parent is checked if it's active AND all its children are active
        const parentActive = !!activeParentFilters[category]?.[parent];
        const allChildrenActive = children.every((child) => !!activeChildFilters[category]?.[parent]?.[child.id]);
        
        const result = parentActive && allChildrenActive;
        return result;
    };

    // Show/Hide all
    const handleShowAll = () => {
        const allCategories: { [key: string]: boolean } = {};
        const allParents: { [category: string]: { [parent: string]: boolean } } = {};
        const allChildren: { [category: string]: { [parent: string]: { [childId: string]: boolean } } } = {};

        Object.keys(groupedByCategory).forEach(category => {
            allCategories[category] = true;
            allParents[category] = {};
            allChildren[category] = {};

            Object.keys(groupedByCategory[category]).forEach(parent => {
                allParents[category][parent] = true;
                allChildren[category][parent] = {};

                groupedByCategory[category][parent].forEach(child => {
                    allChildren[category][parent][child.id] = true;
                });
            });
        });

        setActiveCategoryFilters(allCategories);
        setActiveParentFilters(allParents);
        setActiveChildFilters(allChildren);
    };

    const handleHideAll = () => {
        setActiveCategoryFilters({});
        setActiveParentFilters({});
        setActiveChildFilters({});
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
                    href={`/dashboard/geojson/${item.id_geojson}/add`}
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

    // Handler for View (fly to location) - updated for three-level hierarchy
    const handleViewLocation = (category: string, parent: string, childId: string) => {
        const item = geojsonData.find((i) => {
            const itemCategory = i.kategori?.orde0 || 'Uncategorized';
            return String(i.id_geojson) === String(childId) && 
                   i.source_name === parent && 
                   itemCategory === category;
        });
        if (!item || !mapRef.current) return;

        const geometry = item.geojson.geometry;
        if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            mapRef.current.flyTo([lat, lng], 15);
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            const bounds = L.geoJSON(geometry).getBounds();
            mapRef.current.fitBounds(bounds);
        }

        // Open popup for the specific item
        const refKey = `${category}-${parent}-${childId}`;
        const geoJsonLayer = geoJsonRefs.current[refKey];
        if (geoJsonLayer) {
            setTimeout(() => {
                geoJsonLayer.openPopup();
            }, 500);
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
            <div className={`relative flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-67' : 'mr-0'}`} style={{ zIndex: 10 }}>
                <MapContainer center={center} zoom={zoom} touchZoom scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    {/* Inilah kunci: ref setter */}
                    <MapRefSetter mapRef={mapRef} />

                    <ScaleControl position="bottomleft" />
                    <ScaleControl position="topright" />

                    <GeomanControl />

                    <LayersControl position="topright">
                        <BaseLayers />
                    </LayersControl>

                    {/* Render GeoJSON using three-level hierarchy */}
                    {groupedBySourceName &&
                        Object.entries(groupedBySourceName).map(([sourceName, items]) => {
                            return items.map((item) => {
                                const itemCategory = item.kategori?.orde0 || 'Uncategorized';
                                const parent = item.source_name || 'Unknown';
                                const childId = String(item.id_geojson);
                                
                                // Check if this item should be visible based on three-level filters
                                const isVisible = activeCategoryFilters[itemCategory] && 
                                                activeParentFilters[itemCategory]?.[parent] && 
                                                activeChildFilters[itemCategory]?.[parent]?.[childId];
                                
                                if (!isVisible) return null;

                                const refKey = `${itemCategory}-${parent}-${childId}`;
                                return (
                                    <GeoJSON
                                        key={`${item.id_geojson}-${sourceName}`}
                                        ref={(ref) => {
                                            if (ref) geoJsonRefs.current[refKey] = ref;
                                        }}
                                        data={item.geojson as Feature}
                                        style={() => ({
                                            color: item.kode_warna || '#3388ff',
                                            weight: 2,
                                            opacity: 0.8,
                                            fillColor: item.kode_warna || '#3388ff',
                                            fillOpacity: 0.5,
                                        })}
                                    >
                                        <Popup>{renderPopupContent(item)}</Popup>
                                    </GeoJSON>
                                );
                            });
                        })}
                </MapContainer>
            </div>

            <SidebarFilter
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                uniqueCategoryNames={uniqueCategoryNames}
                groupedByCategory={groupedByCategory}
                categoryColors={categoryColors}
                categoryCodes={categoryToCodes}
                isLoading={isLoading}
                activeCategoryFilters={activeCategoryFilters}
                activeParentFilters={activeParentFilters}
                activeChildFilters={activeChildFilters}
                toggleCategoryFilter={toggleCategoryFilter}
                toggleParentFilter={toggleParentFilter}
                toggleChildFilter={toggleChildFilter}
                onShowAll={handleShowAll}
                onHideAll={handleHideAll}
                onView={handleViewLocation}
                isCategoryChecked={isCategoryChecked}
                isParentChecked={isParentChecked}
                onSearchCoordinate={handleSearchCoordinate}
            />
        </div>
    );
};

export default MapView;
