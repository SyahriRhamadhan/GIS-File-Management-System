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

const COLOR_STORAGE_KEY = 'dashboard.layerColors.v1';
const COLOR_STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

const normalizeColorForPicker = (color: string, fallback = '#3388ff') =>
    isHexColor(color) ? color : fallback;

const readStoredColors = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(COLOR_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, { color: string; updatedAt?: number }>;
        const now = Date.now();
        const cleaned: Record<string, string> = {};
        let needsPersist = false;
        for (const [key, entry] of Object.entries(parsed || {})) {
            if (!entry || typeof entry.color !== 'string') {
                needsPersist = true;
                continue;
            }
            const updatedAt = typeof entry.updatedAt === 'number' ? entry.updatedAt : 0;
            if (updatedAt && now - updatedAt > COLOR_STORAGE_TTL_MS) {
                needsPersist = true;
                continue;
            }
            cleaned[key] = entry.color;
            if (!updatedAt) needsPersist = true;
        }
        if (needsPersist) {
            try {
                const payload: Record<string, { color: string; updatedAt: number }> = {};
                const timestamp = Date.now();
                Object.entries(cleaned).forEach(([key, color]) => {
                    payload[key] = { color, updatedAt: timestamp };
                });
                window.localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(payload));
            } catch {
                /* ignore persist errors */
            }
        }
        return cleaned;
    } catch {
        return {};
    }
};

const persistStoredColors = (colors: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    try {
        const timestamp = Date.now();
        const payload: Record<string, { color: string; updatedAt: number }> = {};
        Object.entries(colors).forEach(([key, color]) => {
            payload[key] = { color, updatedAt: timestamp };
        });
        window.localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* ignore persist errors */
    }
};

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

interface PopupAddPropertyRowProps {
    onAdd: (key: string, value: string) => void;
    onPendingChange?: (pending: boolean) => void;
}

const PopupAddPropertyRow: React.FC<PopupAddPropertyRowProps> = ({ onAdd, onPendingChange }) => {
    const [k, setK] = useState('');
    const [v, setV] = useState('');

    useEffect(() => {
        onPendingChange?.(Boolean(k.trim() || v.trim()));
    }, [k, v, onPendingChange]);

    const handleAdd = () => {
        const key = k.trim();
        const value = v.trim();
        if (!key || !value) return;
        onAdd(key, value);
        setK('');
        setV('');
    };

    return (
        <div className="space-y-2" onMouseDown={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2 items-center">
                <input
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="Nama properti"
                    value={k}
                    onChange={(e) => setK(e.target.value)}
                />
                <input
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="Nilai"
                    value={v}
                    onChange={(e) => setV(e.target.value)}
                />
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    className="rounded bg-green-600 text-white px-3 py-1 text-xs font-semibold disabled:bg-green-300"
                    disabled={!k.trim() || !v.trim()}
                    onClick={handleAdd}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    Tambah
                </button>
            </div>
        </div>
    );
};

const MapView: React.FC<MapViewProps> = ({ geojsonData, initialVisibleIds = [] }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;
    const mapRef = useRef<LeafletMap | null>(null);
    // Untuk simpan ref tiap fitur
    const geoJsonRefs = useRef<Record<string, L.GeoJSON>>({});
    const layerDefaultColors = useRef<Record<string, string>>({});

    // State for inline editing in Popup
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    const [baseValues, setBaseValues] = useState<Record<string, any>>({});
    const [hasPendingNewKV, setHasPendingNewKV] = useState<boolean>(false);
    // Cache perubahan properti per id agar tidak perlu reload
    const [updatedProps, setUpdatedProps] = useState<Record<string, Record<string, any>>>({});
    const [layerOrder, setLayerOrder] = useState<string[]>([]);
    const [customColors, setCustomColors] = useState<Record<string, string>>(() => readStoredColors());
    const startEdit = (item: (typeof geojsonData)[0]) => {
        setEditingId(String(item.id_geojson));
        const props = { ...(item.geojson?.properties || {}) } as Record<string, any>;
        delete props['id_geojson'];
        // merge dengan perubahan lokal jika ada
        const merged = { ...props, ...(updatedProps[String(item.id_geojson)] || {}) };
        setBaseValues(merged);
        setEditValues(merged);
        setHasPendingNewKV(false);
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

    // Grouped children per 3-level hierarchy with flattened key: "main_category â€º category" > parent > child
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
            const flattenedCategory = `${mainCategory} â€º ${categoryName}`;

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
            const aMain = a.split(' â€º ')[0];
            const bMain = b.split(' â€º ')[0];
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

        const categoryState: Record<string, boolean> = {};
        for (const category of uniqueCategoryNames) {
            categoryState[category] = !hasInitial;
        }

        const parentState: Record<string, Record<string, boolean>> = {};
        const childState: Record<string, Record<string, Record<string, boolean>>> = {};
        const initialOrder: string[] = [];

        for (const [category, parents] of Object.entries(groupedByCategory)) {
            parentState[category] = {};
            childState[category] = {};

            for (const [parent, children] of Object.entries(parents)) {
                parentState[category][parent] = !hasInitial;
                childState[category][parent] = {};

                for (const child of children) {
                    const idStr = String(child.id);
                    const visible = hasInitial ? initialSet.has(idStr) : false;
                    childState[category][parent][child.id] = visible;
                    if (visible) {
                        initialOrder.push(`${category}-${parent}-${child.id}`);
                    }
                }
            }
        }

        setActiveCategoryFilters(categoryState);
        setActiveParentFilters(parentState);
        setActiveChildFilters(childState);
        setLayerOrder(initialOrder);
    }, [groupedByCategory, uniqueCategoryNames, initialVisibleIds]);

    useEffect(() => {
        const validKeys = new Set<string>();
        Object.entries(groupedByCategory).forEach(([category, parents]) => {
            Object.entries(parents || {}).forEach(([parent, children]) => {
                children.forEach((child) => {
                    validKeys.add(`${category}-${parent}-${child.id}`);
                });
            });
        });
        setLayerOrder((prev) => {
            const next = prev.filter((key) => validKeys.has(key));
            if (next.length === prev.length) return prev;
            return next;
        });
    }, [groupedByCategory]);

    const applyLayerColor = useCallback((key: string, color: string) => {
        const layer = geoJsonRefs.current[key];
        if (layer && typeof layer.setStyle === 'function') {
            layer.setStyle({
                color,
                fillColor: color,
            });
        }
    }, []);

    useEffect(() => {
        Object.entries(layerDefaultColors.current).forEach(([key, defaultColor]) => {
            const color = customColors[key] ?? defaultColor;
            applyLayerColor(key, color);
        });
    }, [customColors, applyLayerColor]);

    useEffect(() => {
        persistStoredColors(customColors);
    }, [customColors]);

    const closeLayerPopup = useCallback((key: string) => {
        const layer = geoJsonRefs.current[key];
        layer?.closePopup();
    }, []);

    const moveLayerToFront = useCallback((key: string) => {
        setLayerOrder((prev) => {
            if (!prev.includes(key)) return [...prev, key];
            const filtered = prev.filter((k) => k !== key);
            return [...filtered, key];
        });
    }, []);

    const moveLayerToBack = useCallback((key: string) => {
        setLayerOrder((prev) => {
            if (!prev.includes(key)) return [key, ...prev];
            const filtered = prev.filter((k) => k !== key);
            return [key, ...filtered];
        });
    }, []);

    const moveLayerForward = useCallback((key: string) => {
        setLayerOrder((prev) => {
            const idx = prev.indexOf(key);
            if (idx === -1 || idx === prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    const moveLayerBackward = useCallback((key: string) => {
        setLayerOrder((prev) => {
            const idx = prev.indexOf(key);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);

    const removeLayerKeys = useCallback((keys: string[]) => {
        if (!keys.length) return;
        const toRemove = new Set(keys);
        setLayerOrder((prev) => prev.filter((key) => !toRemove.has(key)));
    }, []);

    const updateLayerColor = useCallback(
        (key: string, color: string | null, fallback?: string) => {
            setCustomColors((prev) => {
                const next = { ...prev };
                if (color) {
                    next[key] = color;
                } else {
                    delete next[key];
                }
                return next;
            });

            const base = fallback ?? layerDefaultColors.current[key] ?? '#3388ff';
            applyLayerColor(key, color ?? base);
        },
        [applyLayerColor]
    );

    const applyLayerOrder = useCallback(
        (order: string[]) => {
            order.forEach((key) => {
                const layer = geoJsonRefs.current[key];
                if (layer && typeof layer.bringToFront === 'function') {
                    layer.bringToFront();
                }
            });
        },
        []
    );

    useEffect(() => {
        applyLayerOrder(layerOrder);
    }, [layerOrder, applyLayerOrder]);

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

            if (newCategoryState) {
                Object.entries(groupedByCategory[category] || {}).forEach(([parentKey, children]) => {
                    children.forEach((child) => {
                        const refKey = `${category}-${parentKey}-${child.id}`;
                        moveLayerToFront(refKey);
                    });
                });
            } else {
                const keysToRemove: string[] = [];
                Object.entries(groupedByCategory[category] || {}).forEach(([parentKey, children]) => {
                    children.forEach((child) => {
                        keysToRemove.push(`${category}-${parentKey}-${child.id}`);
                    });
                });
                removeLayerKeys(keysToRemove);
            }

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
                const children = groupedByCategory[category]?.[parent] || [];
                children.forEach((child) => {
                    const refKey = `${category}-${parent}-${child.id}`;
                    moveLayerToFront(refKey);
                });
            } else {
                const keysToRemove = (groupedByCategory[category]?.[parent] || []).map(
                    (child) => `${category}-${parent}-${child.id}`
                );
                removeLayerKeys(keysToRemove);
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
                const refKey = `${category}-${parent}-${childId}`;
                moveLayerToFront(refKey);
            } else {
                removeLayerKeys([`${category}-${parent}-${childId}`]);
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
        const newKeys: string[] = [];

        Object.keys(groupedByCategory).forEach(category => {
            allCategories[category] = true;
            allParents[category] = {};
            allChildren[category] = {};

            Object.keys(groupedByCategory[category]).forEach(parent => {
                allParents[category][parent] = true;
                allChildren[category][parent] = {};

                groupedByCategory[category][parent].forEach(child => {
                    allChildren[category][parent][child.id] = true;
                    newKeys.push(`${category}-${parent}-${child.id}`);
                });
            });
        });

        setActiveCategoryFilters(allCategories);
        setActiveParentFilters(allParents);
        setActiveChildFilters(allChildren);
        if (newKeys.length > 0) {
            setLayerOrder((prev) => {
                const filtered = prev.filter((key) => !newKeys.includes(key));
                return [...filtered, ...newKeys];
            });
        }
    };

    const handleHideAll = () => {
        setActiveCategoryFilters({});
        setActiveParentFilters({});
        setActiveChildFilters({});
        setLayerOrder([]);
    };

    // Overlay visibility per child
    const renderPopupContent = (
        item: (typeof geojsonData)[0],
        meta: { refKey: string; categoryKey: string; parentKey: string; childId: string }
    ) => {
        const { refKey } = meta;
        const layerIndex = layerOrder.indexOf(refKey);
        const layerCount = layerOrder.length;
        const layerExists = layerIndex !== -1;
        const canMoveForward = layerExists && layerIndex < layerCount - 1;
        const canMoveBackward = layerExists && layerIndex > 0;

        const defaultColorRaw =
            layerDefaultColors.current[refKey] ||
            (typeof item.kategori?.kode_warna === 'string' ? item.kategori?.kode_warna : undefined) ||
            (typeof item.kode_warna === 'string' ? item.kode_warna : undefined) ||
            '#3388ff';
        const defaultColor = typeof defaultColorRaw === 'string' ? defaultColorRaw : '#3388ff';
        const pickerDefault = normalizeColorForPicker(defaultColor);
        const currentPickerValue = normalizeColorForPicker(customColors[refKey] ?? defaultColor, pickerDefault);
        const isCustomColor = Boolean(customColors[refKey]);

        const renderLayerControls = () => (
            <div className="mb-3 space-y-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canMoveForward}
                        onClick={(e) => {
                            e.stopPropagation();
                            moveLayerForward(refKey);
                            closeLayerPopup(refKey);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Majukan satu posisi"
                    >
                        Majukan
                    </button>
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!layerExists || layerCount <= 1}
                        onClick={(e) => {
                            e.stopPropagation();
                            moveLayerToFront(refKey);
                            closeLayerPopup(refKey);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Kirim ke posisi paling depan"
                    >
                        Majukan Semua
                    </button>
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canMoveBackward}
                        onClick={(e) => {
                            e.stopPropagation();
                            moveLayerBackward(refKey);
                            closeLayerPopup(refKey);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Mundurkan satu posisi"
                    >
                        Mundurkan
                    </button>
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!layerExists || layerCount <= 1}
                        onClick={(e) => {
                            e.stopPropagation();
                            moveLayerToBack(refKey);
                            closeLayerPopup(refKey);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Kirim ke posisi paling belakang"
                    >
                        Mundurkan Semua
                    </button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-600">
                    <span className="font-semibold">Warna</span>
                    <input
                        type="color"
                        value={currentPickerValue}
                        className="h-7 w-10 cursor-pointer rounded border border-gray-300 bg-white p-0"
                        onChange={(e) => {
                            e.stopPropagation();
                            const newColor = e.target.value;
                            if (isHexColor(newColor)) {
                                updateLayerColor(refKey, newColor, defaultColor);
                            }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Pilih warna polygon"
                    />
                    {isCustomColor && (
                        <button
                            type="button"
                            className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                updateLayerColor(refKey, null, defaultColor);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Kembalikan warna default"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        );

        const isEditing = editingId === String(item.id_geojson);
        if (isEditing) {
            const entries = Object.entries(editValues);
            const norm = (o: Record<string, any>) =>
                Object.keys(o || {})
                    .sort()
                    .reduce((acc: Record<string, any>, k: string) => {
                        acc[k] = String(o[k] ?? '');
                        return acc;
                    }, {});
            const hasChanges = JSON.stringify(norm(editValues)) !== JSON.stringify(norm(baseValues));
            // Hanya blokir jika nilai yang DIUBAH menjadi kosong, bukan yang memang kosong sejak awal
            const hasEmpty = Object.entries(editValues).some(([key, v]) => {
                const now = String(v ?? '').trim();
                const before = String((baseValues as any)[key] ?? '').trim();
                return now === '' && now !== before; // baru dikosongkan
            });
            return (
                <div
                    className="font-sans text-sm w-[420px] max-w-[90vw] min-w-[300px]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {renderLayerControls()}
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                        {entries.length === 0 && (
                            <p className="text-gray-500">Tidak ada properti. Tambahkan pasangan kunci-nilai.</p>
                        )}
                        {entries.map(([k, v]: [string, any]) => (
                            <div key={k} className="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
                                <label className="font-semibold mr-2">{k}</label>
                                <input
                                    className="border rounded px-2 py-1 text-sm w-full"
                                    value={String(v ?? '')}
                                    onChange={(e) => setEditValues((prev) => ({ ...prev, [k]: e.target.value }))}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <button
                                    type="button"
                                    title={`Hapus ${k}`}
                                    className="rounded bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-700"
                                    onClick={() => setEditValues((prev) => { const copy = { ...prev } as Record<string, any>; delete copy[k as string]; return copy; })}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    Hapus
                                </button>
                            </div>
                        ))}
                        <PopupAddPropertyRow
                            onAdd={(key: string, value: string) => setEditValues((p) => ({ ...p, [key]: value }))}
                            onPendingChange={setHasPendingNewKV}
                        />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button className="rounded bg-gray-200 px-3 py-1" onClick={cancelEdit}>Batal</button>
                        <button
                            className="rounded bg-blue-600 text-white px-3 py-1 disabled:bg-blue-300"
                            onClick={() => saveEdit(item.id_geojson)}
                            disabled={!hasChanges || hasPendingNewKV || hasEmpty}
                            title={!hasChanges ? 'Tidak ada perubahan' : hasPendingNewKV ? 'Klik Tambah dulu' : hasEmpty ? 'Nilai tidak boleh kosong' : ''}
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            );
        }

        // Merge properti asli dengan yang sudah diperbarui (tanpa reload)
        const baseProps = (item.geojson.properties || {}) as Record<string, any>;
        const cachedProps = updatedProps[String(item.id_geojson)];
        const mergedProps = cachedProps ? cachedProps : baseProps;

        return (
            <div
                className="font-sans text-sm w-[420px] max-w-[90vw] min-w-[300px]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {renderLayerControls()}
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
        moveLayerToFront(refKey);
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
                                const flattenedCategory = `${mainCategory} â€º ${categoryName}`;

                                const parent = item.source_name || 'Unknown';
                                const childId = String(item.id_geojson);

                                // Check visibility with flattened category
                                const isVisible = activeCategoryFilters[flattenedCategory] &&
                                                activeParentFilters[flattenedCategory]?.[parent] &&
                                                activeChildFilters[flattenedCategory]?.[parent]?.[childId];

                                if (!isVisible) return null;

                                const refKey = `${flattenedCategory}-${parent}-${childId}`;
                                const baseColor =
                                    (typeof item.kategori?.kode_warna === 'string' ? item.kategori?.kode_warna : undefined) ||
                                    (typeof item.kode_warna === 'string' ? item.kode_warna : undefined) ||
                                    '#3388ff';
                                layerDefaultColors.current[refKey] = baseColor;
                                const effectiveColor = customColors[refKey] ?? baseColor;
                                return (
                                    <GeoJSON
                                        key={`${item.id_geojson}-${sourceName}`}
                                        ref={(ref) => {
                                            if (ref) {
                                                geoJsonRefs.current[refKey] = ref;
                                            } else {
                                                delete geoJsonRefs.current[refKey];
                                                delete layerDefaultColors.current[refKey];
                                            }
                                        }}
                                        data={item.geojson as Feature}
                                        style={() => ({
                                            color: effectiveColor,
                                            weight: 2,
                                            opacity: 0.8,
                                            fillColor: effectiveColor,
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
                                            {renderPopupContent(item, {
                                                refKey,
                                                categoryKey: flattenedCategory,
                                                parentKey: parent,
                                                childId,
                                            })}
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
