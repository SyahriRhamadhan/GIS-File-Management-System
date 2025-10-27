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
        main_category?: string | null;
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

    // State for inline editing in Popup
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    // Cache perubahan properti per id agar tidak perlu reload
    const [updatedProps, setUpdatedProps] = useState<Record<string, Record<string, any>>>({});
    const startEdit = (item: (typeof geojsonData)[0]) => {
        setEditingId(String(item.id_geojson));
        const props = { ...(item.geojson?.properties || {}) } as Record<string, any>;
        delete props['id_geojson'];
        setEditValues(props);
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };
    const saveEdit = async (id: string | number) => {
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/dashboard/geojson/${id}/properties`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ properties: editValues }),
            });
            if (!res.ok) throw new Error('Gagal menyimpan properti');
            // Tanpa reload: simpan perubahan ke cache lokal dan tetap buka popup
            setUpdatedProps((prev) => ({ ...prev, [String(id)]: { ...editValues } }));
            setEditingId(null);
        } catch (e) {
            alert((e as Error).message);
        }
    };

    // Helper row to add new property in edit mode
    const AddPropertyRow: React.FC<{ onAdd: (key: string, value: string) => void }> = ({ onAdd }) => {
        const [k, setK] = useState('');
        const [v, setV] = useState('');
        return (
            <div className="grid grid-cols-2 gap-2 items-center" onMouseDown={(e) => e.stopPropagation()}>
                <input
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="Nama properti"
                    value={k}
                    onChange={(e) => setK(e.target.value)}
                />
                <div className="flex gap-2">
                    <input
                        className="border rounded px-2 py-1 text-sm flex-1"
                        placeholder="Nilai"
                        value={v}
                        onChange={(e) => setV(e.target.value)}
                    />
                    <button
                        type="button"
                        className="rounded bg-green-600 text-white px-2"
                        disabled={!k}
                        onClick={() => {
                            onAdd(k, v);
                            setK('');
                            setV('');
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        Tambah
                    </button>
                </div>
            </div>
        );
    };

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

    // Grouped children per 3-level hierarchy with flattened key: "main_category › category" > parent > child
    const groupedByCategory = useMemo(() => {
        const groups: Record<string, Record<string, Array<{ id: string; label: string }>>> = {};

        // Define the order of main categories
        const mainCategoryOrder = ['RDTR', 'RTRW', 'KKPR', 'GANTI RUGI', 'Uncategorized'];

        geojsonData.forEach((item) => {
            // Level 1: Main Category (langsung dari geojson.main_category)
            const mainCategory = item.main_category || 'Uncategorized';

            // Level 2: Category dari kategori (orde0)
            const categoryName = item.kategori?.orde0 || 'Tanpa Kategori';

            // Combine main_category and categoryName for flattened 3-level structure
            const flattenedCategory = `${mainCategory} › ${categoryName}`;

            // Level 2: Parent (source_name)
            const parent = item.source_name || 'Unknown';

            // Level 3: Individual GeoJSON items
            const propEntries = Object.entries(item.geojson.properties || {})
                .filter(([k]) => k !== 'id_geojson')
                .map(([k, v]) => `${k}: ${v}`);
            const label = propEntries.length > 0 ? propEntries.join(', ') : String(item.id_geojson || 'Unknown');
            const id = String(item.id_geojson || label);

            // Build hierarchy
            if (!groups[flattenedCategory]) groups[flattenedCategory] = {};
            if (!groups[flattenedCategory][parent]) groups[flattenedCategory][parent] = [];
            if (!groups[flattenedCategory][parent].find((c) => c.id === id)) {
                groups[flattenedCategory][parent].push({ id, label });
            }
        });

        // Sort groups by predefined main category order
        const sortedGroups: typeof groups = {};
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const aMain = a.split(' › ')[0];
            const bMain = b.split(' › ')[0];
            const aIndex = mainCategoryOrder.indexOf(aMain);
            const bIndex = mainCategoryOrder.indexOf(bMain);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });

        sortedKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
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
    const renderPopupContent = (item: (typeof geojsonData)[0]) => {
        const isEditing = editingId === String(item.id_geojson);
        if (isEditing) {
            const entries = Object.entries(editValues);
            return (
                <div
                    className="font-sans text-sm w-[420px] max-w-[90vw] min-w-[300px]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-2">
                        {entries.length === 0 && (
                            <p className="text-gray-500">Tidak ada properti. Tambahkan pasangan kunci-nilai.</p>
                        )}
                        {entries.map(([k, v]) => (
                            <div key={k} className="grid grid-cols-2 gap-2 items-center">
                                <label className="font-semibold mr-2">{k}</label>
                                <input
                                    className="border rounded px-2 py-1 text-sm"
                                    value={String(v ?? '')}
                                    onChange={(e) => setEditValues((prev) => ({ ...prev, [k]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <AddPropertyRow onAdd={(key, value) => setEditValues((p) => ({ ...p, [key]: value }))} />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button className="rounded bg-gray-200 px-3 py-1" onClick={cancelEdit}>Batal</button>
                        <button className="rounded bg-blue-600 text-white px-3 py-1" onClick={() => saveEdit(item.id_geojson)}>Simpan</button>
                    </div>
                </div>
            );
        }

        // Merge properti asli dengan yang sudah diperbarui (tanpa reload)
        const mergedProps = {
            ...(item.geojson.properties || {}),
            ...(updatedProps[String(item.id_geojson)] || {}),
        } as Record<string, any>;

        return (
            <div
                className="font-sans text-sm w-[420px] max-w-[90vw] min-w-[300px]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {Object.entries(mergedProps)
                    .filter(([k]) => k !== 'id_geojson')
                    .map(([k, v]) => (
                        <p key={k}>
                            <strong>{k}:</strong> {String(v)}
                        </p>
                    ))}
                <div className="mt-2 flex flex-wrap items-center gap-2 justify-end">
                    <a
                        href={`/dashboard/geojson/${item.id_geojson}/add`}
                        className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                        target="_blank"
                        rel="noreferrer noopener"
                        title="Add PDF"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <IoAddCircleOutline className="mr-1" />
                        Add PDF
                    </a>
                    <a
                        href={`/dashboard/geojson/${item.id_geojson}/view`}
                        className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                        target="_blank"
                        rel="noreferrer noopener"
                        title="View list PDF"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <FaFilePdf className="mr-1" />
                        View PDFs
                    </a>
                    <a
                        href={`/dashboard/geojson/${item.id_geojson}/edit`}
                        className="inline-flex items-center rounded bg-white px-2 py-1 text-gray-800 hover:bg-gray-100"
                        target="_blank"
                        rel="noreferrer noopener"
                        title="Edit GeoJSON"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <FaMapMarkedAlt className="mr-1" />
                        Edit GeoJSON
                    </a>
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all"
                        title="Edit properties"
                        onClick={() => startEdit(item)}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        Edit Properties
                    </button>
                </div>
            </div>
        );
    };

    // Handler for View (fly to location) - updated for three-level hierarchy
    const handleViewLocation = (category: string, parent: string, childId: string) => {
        // category di Sidebar adalah key gabungan: "<main_category> f <orde0>"
        const [mainPartRaw, orde0Raw] = (category || '').split(' f ').map((s) => s?.trim());
        const mainPart = mainPartRaw || 'Uncategorized';
        const orde0 = orde0Raw || 'Tanpa Kategori';

        // Cari item terutama berdasarkan id (paling andal). Parent dipakai sebagai verifikasi tambahan.
        const item =
            geojsonData.find(
                (i) => String(i.id_geojson) === String(childId) && (!parent || i.source_name === parent)
            ) || geojsonData.find((i) => String(i.id_geojson) === String(childId));

        if (!item || !mapRef.current) return;

        const geometry = item.geojson.geometry as any;
        // Posisikan peta ke geometri terkait
        if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates as [number, number];
            mapRef.current.flyTo([lat, lng], 15);
        } else if (
            geometry.type === 'Polygon' ||
            geometry.type === 'MultiPolygon' ||
            geometry.type === 'LineString' ||
            geometry.type === 'MultiLineString'
        ) {
            const bounds = L.geoJSON(geometry).getBounds();
            mapRef.current.fitBounds(bounds);
        }

        // Buka popup berdasarkan refKey yang disusun saat render
        const refKey = `${category}-${parent}-${childId}`;
        const geoJsonLayer = geoJsonRefs.current[refKey];
        if (geoJsonLayer) {
            setTimeout(() => {
                geoJsonLayer.openPopup();
            }, 300);
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

                    {/* Render GeoJSON using flattened 3-level hierarchy */}
                    {groupedBySourceName &&
                        Object.entries(groupedBySourceName).map(([sourceName, items]) => {
                            return items.map((item) => {
                                // Build flattened category key
                                const mainCategory = item.main_category || 'Uncategorized';
                                const categoryName = item.kategori?.orde0 || 'Tanpa Kategori';
                                const flattenedCategory = `${mainCategory} › ${categoryName}`;

                                const parent = item.source_name || 'Unknown';
                                const childId = String(item.id_geojson);

                                // Check visibility with flattened category
                                const isVisible = activeCategoryFilters[flattenedCategory] &&
                                                activeParentFilters[flattenedCategory]?.[parent] &&
                                                activeChildFilters[flattenedCategory]?.[parent]?.[childId];

                                if (!isVisible) return null;

                                const refKey = `${flattenedCategory}-${parent}-${childId}`;
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
                                        <Popup
                                            closeOnClick={false}
                                            keepInView
                                            maxWidth={520}
                                            minWidth={300}
                                            autoPanPadding={[24, 24] as any}
                                            className="leaflet-custom-popup"
                                        >
                                            {renderPopupContent(item)}
                                        </Popup>
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
