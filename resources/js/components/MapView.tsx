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
        console.log('🚀 MapView: Initializing filter states');
        console.log('📊 Initial data:', { 
            uniqueCategoryNames, 
            groupedByCategory, 
            initialVisibleIds,
            geojsonDataLength: geojsonData.length 
        });
        
        const hasInitial = Array.isArray(initialVisibleIds) && initialVisibleIds.length > 0;
        const initialSet = new Set(initialVisibleIds.map((v) => String(v)));

        console.log('🎯 Initialization settings:', { hasInitial, initialSet: Array.from(initialSet) });

        // Initialize category filters
        setActiveCategoryFilters(() => {
            const updated: Record<string, boolean> = {};
            for (const category of uniqueCategoryNames) {
                updated[category] = !hasInitial; // Show all categories by default if no initial IDs
            }
            console.log('📂 Initialized category filters:', updated);
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
            console.log('👥 Initialized parent filters:', updated);
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
            console.log('👶 Initialized child filters:', updated);
            return updated;
        });
    }, [groupedByCategory, uniqueCategoryNames, initialVisibleIds]);

    // Category toggle logic: toggle ALL parents and children in category
    const toggleCategoryFilter = (category: string) => {
        console.log('🔄 toggleCategoryFilter called:', { category });
        console.log('📊 Current state before toggle:', {
            activeCategoryFilters: activeCategoryFilters[category],
            activeParentFilters: activeParentFilters[category],
            activeChildFilters: activeChildFilters[category]
        });
        
        setActiveCategoryFilters((prev) => {
            const newCategoryState = !prev[category];
            const updated = { ...prev, [category]: newCategoryState };
            
            console.log('📊 Category state change:', { 
                category, 
                oldState: prev[category], 
                newState: newCategoryState, 
                fullUpdated: updated 
            });
            
            // Also update all parents and children in this category
            setActiveParentFilters((prevParents) => {
                const updatedParents = { ...prevParents };
                if (!updatedParents[category]) updatedParents[category] = {};
                
                for (const parent of Object.keys(groupedByCategory[category] || {})) {
                    const oldParentState = updatedParents[category][parent];
                    updatedParents[category][parent] = newCategoryState;
                    console.log('👥 Parent state change:', { 
                        category, 
                        parent, 
                        oldState: oldParentState, 
                        newState: newCategoryState 
                    });
                }
                
                console.log('👥 All parent filters updated:', { category, updatedParents: updatedParents[category] });
                return updatedParents;
            });
            
            setActiveChildFilters((prevChildren) => {
                const updatedChildren = { ...prevChildren };
                if (!updatedChildren[category]) updatedChildren[category] = {};
                
                for (const [parent, children] of Object.entries(groupedByCategory[category] || {})) {
                    if (!updatedChildren[category][parent]) updatedChildren[category][parent] = {};
                    for (const child of children) {
                        const oldChildState = updatedChildren[category][parent][child.id];
                        updatedChildren[category][parent][child.id] = newCategoryState;
                        console.log('👶 Child state change:', { 
                            category, 
                            parent, 
                            childId: child.id, 
                            oldState: oldChildState, 
                            newState: newCategoryState 
                        });
                    }
                }
                
                console.log('👶 All child filters updated:', { category, updatedChildren: updatedChildren[category] });
                return updatedChildren;
            });
            
            return updated;
        });
    };

    // Parent toggle logic: toggle ALL children in parent
    const toggleParentFilter = (category: string, parent: string) => {
        console.log('🔄 toggleParentFilter called:', { category, parent });
        console.log('📊 Current parent state before toggle:', {
            activeParentFilters: activeParentFilters[category]?.[parent],
            activeChildFilters: activeChildFilters[category]?.[parent]
        });
        
        setActiveParentFilters((prev) => {
            const currentState = prev[category]?.[parent] || false;
            const newState = !currentState;
            
            console.log('📊 Parent toggle details:', { 
                category, 
                parent, 
                currentState, 
                newState,
                prevCategoryState: prev[category]
            });
            
            const updated = {
                ...prev,
                [category]: {
                    ...prev[category],
                    [parent]: newState,
                },
            };
            
            console.log('👥 Parent filter updated:', { 
                category, 
                parent, 
                newState, 
                updatedCategory: updated[category] 
            });
            
            // Also update all children in this parent to match parent state
            setActiveChildFilters((prevChildren) => {
                const updatedChildren = { ...prevChildren };
                if (!updatedChildren[category]) updatedChildren[category] = {};
                if (!updatedChildren[category][parent]) updatedChildren[category][parent] = {};
                
                console.log('👶 Before updating children:', { 
                    category, 
                    parent, 
                    currentChildren: updatedChildren[category][parent],
                    childrenToUpdate: groupedByCategory[category]?.[parent] || []
                });
                
                for (const child of groupedByCategory[category]?.[parent] || []) {
                    const oldChildState = updatedChildren[category][parent][child.id];
                    updatedChildren[category][parent][child.id] = newState;
                    console.log('👶 Child updated in parent toggle:', { 
                        category, 
                        parent, 
                        childId: child.id, 
                        oldState: oldChildState, 
                        newState 
                    });
                }
                
                console.log('👶 All children updated for parent:', { 
                    category, 
                    parent, 
                    newState, 
                    updatedChildren: updatedChildren[category][parent] 
                });
                return updatedChildren;
            });
            
            // If parent is being activated, also activate the category
            if (newState) {
                setActiveCategoryFilters((prevCategories) => {
                    const updatedCategories = { ...prevCategories, [category]: true };
                    console.log('📂 Category activated due to parent activation:', { 
                        category, 
                        parent, 
                        updatedCategories 
                    });
                    return updatedCategories;
                });
            }
            
            return updated;
        });
    };

    // Child toggle logic
    const toggleChildFilter = (category: string, parent: string, childId: string) => {
        console.log('🔄 toggleChildFilter called:', { category, parent, childId });
        console.log('📊 Current child state before toggle:', {
            activeChildFilters: activeChildFilters[category]?.[parent]?.[childId],
            parentState: activeParentFilters[category]?.[parent],
            categoryState: activeCategoryFilters[category]
        });
        
        setActiveChildFilters((prev) => {
            const currentState = prev[category]?.[parent]?.[childId] || false;
            const newState = !currentState;
            
            console.log('📊 Child toggle details:', { 
                category, 
                parent, 
                childId, 
                currentState, 
                newState,
                prevParentState: prev[category]?.[parent]
            });
            
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
            
            console.log('👶 Child filter updated:', { 
                category, 
                parent, 
                childId, 
                newState, 
                updatedParent: updated[category][parent] 
            });
            
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
                    console.log('👥 Parent activated due to child activation:', { 
                        category, 
                        parent, 
                        updatedParents: updatedParents[category] 
                    });
                    return updatedParents;
                });
                
                setActiveCategoryFilters((prevCategories) => {
                    const updatedCategories = { ...prevCategories, [category]: true };
                    console.log('📂 Category activated due to child activation:', { 
                        category, 
                        parent, 
                        childId, 
                        updatedCategories 
                    });
                    return updatedCategories;
                });
            }
            
            // Check if this affects parent/category state
            const allChildrenInParent = groupedByCategory[category]?.[parent] || [];
            const allChildrenActive = allChildrenInParent.every(child => 
                updated[category][parent][child.id]
            );
            
            console.log('🔍 Parent state check after child toggle:', {
                category,
                parent,
                allChildrenInParent: allChildrenInParent.map(c => c.id),
                allChildrenActive,
                childStates: allChildrenInParent.map(c => ({
                    id: c.id,
                    active: updated[category][parent][c.id]
                }))
            });
            
            return updated;
        });
    };

    // Check if category is checked (all parents and children are active)
    const isCategoryChecked = (category: string) => {
        const parents = groupedByCategory[category];
        if (!parents || Object.keys(parents).length === 0) {
            console.log('✅ isCategoryChecked - no parents:', { category, result: false });
            return false;
        }
        
        // Category is checked if it's active AND all its parents and children are active
        const categoryActive = !!activeCategoryFilters[category];
        const allParentsAndChildrenActive = Object.keys(parents).every((parent) => {
            const parentActive = !!activeParentFilters[category]?.[parent];
            const children = parents[parent];
            const allChildrenActive = children.every((child) => !!activeChildFilters[category]?.[parent]?.[child.id]);
            
            console.log('🔍 Parent check in category:', {
                category,
                parent,
                parentActive,
                allChildrenActive,
                children: children.map(c => ({
                    id: c.id,
                    active: !!activeChildFilters[category]?.[parent]?.[c.id]
                }))
            });
            
            return parentActive && allChildrenActive;
        });
        
        const result = categoryActive && allParentsAndChildrenActive;
        console.log('✅ isCategoryChecked result:', { 
            category, 
            result, 
            categoryActive, 
            allParentsAndChildrenActive,
            activeCategoryFilters: activeCategoryFilters[category],
            activeParentFilters: activeParentFilters[category],
            activeChildFilters: activeChildFilters[category] 
        });
        return result;
    };

    // Check if parent is checked (parent is active AND all children are active)
    const isParentChecked = (category: string, parent: string) => {
        const children = groupedByCategory[category]?.[parent];
        if (!children || children.length === 0) {
            console.log('✅ isParentChecked - no children:', { category, parent, result: false });
            return false;
        }
        
        // Parent is checked if it's active AND all its children are active
        const parentActive = !!activeParentFilters[category]?.[parent];
        const allChildrenActive = children.every((child) => !!activeChildFilters[category]?.[parent]?.[child.id]);
        
        const result = parentActive && allChildrenActive;
        console.log('✅ isParentChecked result:', { 
            category, 
            parent, 
            result, 
            parentActive, 
            allChildrenActive,
            activeParent: activeParentFilters[category]?.[parent],
            activeChildren: activeChildFilters[category]?.[parent],
            childrenDetails: children.map(c => ({
                id: c.id,
                active: !!activeChildFilters[category]?.[parent]?.[c.id]
            }))
        });
        return result;
    };

    // Show/Hide all
    const handleShowAll = () => {
        setActiveCategoryFilters((prev) => {
            const updated: Record<string, boolean> = {};
            for (const category of uniqueCategoryNames) {
                updated[category] = true;
            }
            return updated;
        });
        
        setActiveParentFilters((prev) => {
            const updated: Record<string, Record<string, boolean>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const parent of Object.keys(parents)) {
                    updated[category][parent] = true;
                }
            }
            return updated;
        });
        
        setActiveChildFilters((prev) => {
            const updated: Record<string, Record<string, Record<string, boolean>>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const [parent, children] of Object.entries(parents)) {
                    updated[category][parent] = {};
                    for (const child of children) {
                        updated[category][parent][child.id] = true;
                    }
                }
            }
            return updated;
        });
    };

    const handleHideAll = () => {
        setActiveCategoryFilters((prev) => {
            const updated: Record<string, boolean> = {};
            for (const category of uniqueCategoryNames) {
                updated[category] = false;
            }
            return updated;
        });
        
        setActiveParentFilters((prev) => {
            const updated: Record<string, Record<string, boolean>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const parent of Object.keys(parents)) {
                    updated[category][parent] = false;
                }
            }
            return updated;
        });
        
        setActiveChildFilters((prev) => {
            const updated: Record<string, Record<string, Record<string, boolean>>> = {};
            for (const [category, parents] of Object.entries(groupedByCategory)) {
                updated[category] = {};
                for (const [parent, children] of Object.entries(parents)) {
                    updated[category][parent] = {};
                    for (const child of children) {
                        updated[category][parent][child.id] = false;
                    }
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
