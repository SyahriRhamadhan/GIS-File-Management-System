import React, { memo, useState } from 'react';
// Tree-shakeable icon imports for better bundle size
import { IoChevronDown, IoChevronForward, IoInformationCircleOutline } from 'react-icons/io5';
import { MdOutlineEdit, MdOutlineFilterAlt, MdOutlineFilterAltOff } from 'react-icons/md';

interface SidebarFilterProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    uniqueCategoryNames: string[];
    groupedByCategory: Record<string, Record<string, Array<{ id: string; label: string }>>>;
    categoryColors?: Record<string, string>;
    categoryCodes?: Record<string, string>;
    isLoading?: boolean;
    activeCategoryFilters: Record<string, boolean>;
    activeParentFilters: Record<string, Record<string, boolean>>;
    activeChildFilters: Record<string, Record<string, Record<string, boolean>>>;
    toggleCategoryFilter: (category: string) => void;
    toggleParentFilter: (category: string, parent: string) => void;
    toggleChildFilter: (category: string, parent: string, childId: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
    isCategoryChecked?: (category: string) => boolean;
    isParentChecked?: (category: string, parent: string) => boolean;
    onView: (category: string, parent: string, childId: string) => void;
    onSearchCoordinate?: (x: string, y: string) => void;
    polygonDisplayMode: 'fill' | 'outline';
    onDisplayModeChange: (mode: 'fill' | 'outline') => void;
    fillOpacity: number;
    outlineHidden: boolean;
    onFillOpacityChange: (value: number) => void;
    onOutlineHiddenChange: (hidden: boolean) => void;
    onParentRename?: (oldParent: string, newParent: string) => void;
    readOnly?: boolean;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
    sidebarOpen,
    toggleSidebar,
    uniqueCategoryNames,
    groupedByCategory,
    categoryColors = {},
    categoryCodes = {},
    isLoading = false,
    activeCategoryFilters,
    activeParentFilters,
    activeChildFilters,
    toggleCategoryFilter,
    toggleParentFilter,
    toggleChildFilter,
    onShowAll,
    onHideAll,
    isCategoryChecked = () => false,
    isParentChecked = () => false,
    onView,
    onSearchCoordinate,
    polygonDisplayMode,
    onDisplayModeChange,
    fillOpacity,
    outlineHidden,
    onFillOpacityChange,
    onOutlineHiddenChange,
    onParentRename,
    readOnly = false,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedParents, setExpandedParents] = useState<Record<string, Record<string, boolean>>>({});
    const [search, setSearch] = useState('');
    const [coordX, setCoordX] = useState('');
    const [coordY, setCoordY] = useState('');
    const [showCategoryInfo, setShowCategoryInfo] = useState<Record<string, boolean>>({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<{ category: string; parent: string } | null>(null);
    const [parentRenameValue, setParentRenameValue] = useState('');
    const [parentRenameError, setParentRenameError] = useState<string | null>(null);
    const [parentRenameSuccess, setParentRenameSuccess] = useState<string | null>(null);
    const [parentRenameLoading, setParentRenameLoading] = useState(false);
    const formatCategoryLabel = (category: string) => {
        if (!category) return category;
        const [firstPart] = category.split('-');
        return (firstPart ?? category).trim();
    };

    const handleToggleCategory = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleToggleParent = (category: string, parent: string) => {
        setExpandedParents((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [parent]: !prev[category]?.[parent],
            },
        }));
    };

    const handleToggleCategoryInfo = (category: string) => {
        setShowCategoryInfo((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const startEditParent = (category: string, parent: string) => {
        if (readOnly) return;
        setEditingParent({ category, parent });
        setParentRenameValue(parent);
        setParentRenameError(null);
        setParentRenameSuccess(null);
    };

    const cancelParentEdit = () => {
        setEditingParent(null);
        setParentRenameValue('');
        setParentRenameError(null);
        setParentRenameSuccess(null);
        setParentRenameLoading(false);
    };

    const handleParentRenameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingParent) return;

        const newValue = parentRenameValue.trim();
        if (!newValue) {
            setParentRenameError('Nama baru tidak boleh kosong.');
            setParentRenameSuccess(null);
            return;
        }
        if (newValue === editingParent.parent) {
            setParentRenameError('Nama baru harus berbeda dari nama lama.');
            setParentRenameSuccess(null);
            return;
        }

        try {
            setParentRenameLoading(true);
            setParentRenameError(null);
            const token = (document.querySelector('meta[name=\"csrf-token\"]') as HTMLMetaElement)?.content;
            const response = await fetch('/dashboard/geojson/source-groups/rename', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({
                    old_name: editingParent.parent,
                    new_name: newValue,
                }),
            });
            let payload: Record<string, any> | null = null;
            try {
                payload = await response.json();
            } catch (err) {
                payload = null;
            }
            if (!response.ok) {
                throw new Error(payload?.message || 'Gagal memperbarui nama sumber.');
            }
            const { category, parent: previousName } = editingParent;
            setParentRenameValue(newValue);
            setParentRenameSuccess(payload?.message || 'Nama sumber berhasil diperbarui.');
            setExpandedParents((prev) => {
                let changed = false;
                const next: typeof prev = {};
                Object.entries(prev).forEach(([catKey, parents]) => {
                    if (parents && Object.prototype.hasOwnProperty.call(parents, previousName)) {
                        changed = true;
                        const updatedParents = { ...parents };
                        const wasExpanded = updatedParents[previousName];
                        delete updatedParents[previousName];
                        updatedParents[newValue] = wasExpanded;
                        next[catKey] = updatedParents;
                    } else {
                        next[catKey] = parents;
                    }
                });
                return changed ? next : prev;
            });
            onParentRename?.(previousName, newValue);
            setEditingParent({ category, parent: newValue });
            setTimeout(() => {
                cancelParentEdit();
            }, 1200);
        } catch (error) {
            setParentRenameError((error as Error).message);
            setParentRenameSuccess(null);
        } finally {
            setParentRenameLoading(false);
        }
    };

    // Function to get category description based on category name
    const getCategoryDescription = (category: string): string => {
        // Map category names to descriptions
        const categoryDescriptions: Record<string, string> = {
            Infrastruktur:
                'Kategori ini mencakup semua infrastruktur fisik seperti jalan, jembatan, gedung pemerintahan, fasilitas umum, dan infrastruktur pendukung lainnya yang penting untuk pembangunan daerah.',
            Lingkungan:
                'Kategori ini meliputi data terkait lingkungan hidup seperti kawasan hutan, daerah aliran sungai, area konservasi, zona hijau, dan wilayah yang memerlukan perlindungan lingkungan.',
            Ekonomi:
                'Kategori ini berisi informasi tentang pusat-pusat ekonomi, kawasan industri, pasar tradisional, area perdagangan, dan zona ekonomi khusus yang mendukung pertumbuhan ekonomi daerah.',
            Sosial: 'Kategori ini mencakup fasilitas sosial seperti sekolah, rumah sakit, tempat ibadah, pusat komunitas, dan fasilitas pelayanan masyarakat lainnya.',
            Transportasi:
                'Kategori ini meliputi sistem transportasi termasuk terminal, pelabuhan, bandara, stasiun, jalur transportasi umum, dan infrastruktur pendukung mobilitas masyarakat.',
            Pariwisata:
                'Kategori ini berisi informasi tentang objek wisata, destinasi pariwisata, hotel, restoran, dan fasilitas pendukung industri pariwisata daerah.',
            Pertanian:
                'Kategori ini mencakup lahan pertanian, perkebunan, area irigasi, gudang penyimpanan hasil pertanian, dan infrastruktur pendukung sektor pertanian.',
            Kesehatan:
                'Kategori ini meliputi fasilitas kesehatan seperti rumah sakit, puskesmas, klinik, apotek, dan infrastruktur kesehatan masyarakat lainnya.',
        };

        return (
            categoryDescriptions[category] ||
            `Informasi detail untuk kategori ${category}. Kategori ini berisi data geospasial yang relevan dengan ${category.toLowerCase()} di wilayah ini.`
        );
    };

    // Check if all items are checked
    const allChecked = uniqueCategoryNames.every(
        (category) =>
            activeCategoryFilters[category] &&
            Object.keys(groupedByCategory[category] || {}).every(
                (parent) =>
                    activeParentFilters[category]?.[parent] &&
                    groupedByCategory[category][parent]?.every((child) => activeChildFilters[category]?.[parent]?.[child.id]),
            ),
    );

    // Check if no items are checked
    const noneChecked = uniqueCategoryNames.every(
        (category) =>
            !activeCategoryFilters[category] ||
            !Object.keys(groupedByCategory[category] || {}).some(
                (parent) =>
                    activeParentFilters[category]?.[parent] &&
                    groupedByCategory[category][parent]?.some((child) => activeChildFilters[category]?.[parent]?.[child.id]),
            ),
    );

    // Filter categories based on search
    const filteredCategories = uniqueCategoryNames.filter((category) => {
        if (category.toLowerCase().includes(search.toLowerCase())) return true;

        return Object.entries(groupedByCategory[category] || {}).some(([parent, children]) => {
            if (parent.toLowerCase().includes(search.toLowerCase())) return true;
            return children.some((child) => child.label.toLowerCase().includes(search.toLowerCase()));
        });
    });

    const baseDisplayButtonClasses =
        'flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60';
    const fillButtonClasses =
        polygonDisplayMode === 'fill'
            ? `${baseDisplayButtonClasses} bg-indigo-600 hover:bg-indigo-700`
            : `${baseDisplayButtonClasses} bg-gray-500 hover:bg-gray-600`;
    const outlineButtonClasses =
        polygonDisplayMode === 'outline'
            ? `${baseDisplayButtonClasses} bg-indigo-600 hover:bg-indigo-700`
            : `${baseDisplayButtonClasses} bg-gray-500 hover:bg-gray-600`;

    return (
        <div
            className={`fixed top-0 right-0 z-[9999] flex h-full flex-col border-l border-gray-300 bg-white shadow-lg transition-all duration-300 dark:border-[#232329] dark:bg-[#18181b] ${
                sidebarOpen ? 'w-96 p-4' : 'w-0 p-0'
            } overflow-auto`}
            style={{
                minWidth: sidebarOpen ? '25rem' : '0',
                width: sidebarOpen ? '25rem' : '0',
                padding: sidebarOpen ? '1rem' : '0',
            }}
        >
            {/* Filter button ALWAYS shown */}
            <button
                onClick={toggleSidebar}
                className="fixed top-2 right-6 z-[10001] rounded-full border border-gray-300 bg-white p-2 shadow hover:bg-gray-100 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-200 dark:hover:bg-[#29292f]"
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                type="button"
            >
                {sidebarOpen ? <MdOutlineFilterAltOff className="text-3xl" /> : <MdOutlineFilterAlt className="text-3xl" />}
            </button>
            {sidebarOpen && (
                <>
                    <div className="mb-2 flex items-center gap-2">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Filter Layers</h2>
                        {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>}
                    </div>
                    <div className="mb-4 flex flex-col items-center gap-3 px-4">
                        {/* Search Bar */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-100"
                            placeholder="Cari layer atau label…"
                        />

                        {/* Search by Koordinat */}
                        <form
                            className="w-full max-w-md"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (onSearchCoordinate && coordX && coordY) {
                                    onSearchCoordinate(coordX, coordY);
                                }
                            }}
                        >
                            <div className="mb-3 flex gap-3">
                                <input
                                    type="text"
                                    value={coordX}
                                    onChange={(e) => setCoordX(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white py-2 ps-2 text-xs text-gray-900 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-100"
                                    placeholder="Koordinat X (Long)"
                                />
                                <input
                                    type="text"
                                    value={coordY}
                                    onChange={(e) => setCoordY(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white py-2 ps-2 text-xs text-gray-900 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-100"
                                    placeholder="Koordinat Y (Lat)"
                                />
                            </div>
                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={!coordX || !coordY}
                                    className="rounded-lg bg-green-500 px-6 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                                >
                                    Cari Koordinat
                                </button>
                            </div>
                        </form>

                        {/* Tombol Aksi */}
                        <div className="flex w-full max-w-md gap-3">
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:bg-blue-300"
                                onClick={onShowAll}
                                disabled={allChecked}
                            >
                                Tampilkan Semua
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:bg-red-300"
                                onClick={onHideAll}
                                disabled={noneChecked}
                            >
                                Sembunyikan Semua
                            </button>
                        </div>
                        <div className="mt-3 flex w-full max-w-md gap-3">
                            <button
                                type="button"
                                className={fillButtonClasses}
                                onClick={() => onDisplayModeChange('fill')}
                                disabled={polygonDisplayMode === 'fill'}
                                aria-pressed={polygonDisplayMode === 'fill'}
                            >
                                Isi Polygon
                            </button>
                            <button
                                type="button"
                                className={outlineButtonClasses}
                                onClick={() => onDisplayModeChange('outline')}
                                disabled={polygonDisplayMode === 'outline'}
                                aria-pressed={polygonDisplayMode === 'outline'}
                            >
                                Hanya Outline
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                                onClick={() => setSettingsOpen(true)}
                            >
                                Pengaturan Tampilan
                            </button>
                        </div>
                    </div>

                    <div>
                        <small>*click checkbox 2x jika tak tampil</small>
                        {filteredCategories.map((category) => (
                            <div key={category} className="mb-4">
                                {/* Category Level */}
                                <div className="group flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        id={`category-${category}`}
                                        checked={isCategoryChecked(category)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleCategoryFilter(category);
                                        }}
                                        className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="mx-2 cursor-pointer text-xl" onClick={() => handleToggleCategory(category)}>
                                        {expandedCategories[category] ? <IoChevronDown /> : <IoChevronForward />}
                                    </span>
                                    <div className="flex cursor-pointer items-center gap-2" onClick={() => handleToggleCategory(category)}>
                                        {categoryColors[category] && (
                                            <div
                                                className="h-4 w-4 flex-shrink-0 rounded border border-gray-300 dark:border-gray-600"
                                                style={{ backgroundColor: categoryColors[category] }}
                                                title={`Warna kategori: ${categoryColors[category]}`}
                                            ></div>
                                        )}
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {formatCategoryLabel(category)}
                                        </span>
                                    </div>
                                    {/* Info Icon */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleCategoryInfo(category);
                                        }}
                                        className="ml-2 p-1 text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                        title="Lihat informasi kategori"
                                    >
                                        <IoInformationCircleOutline className="text-lg" />
                                    </button>
                                </div>

                                {/* Category Information Popup */}
                                {showCategoryInfo[category] && (
                                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-700 dark:bg-blue-900/20">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                                                Informasi Kategori: {formatCategoryLabel(category)}
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleCategoryInfo(category)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                title="Tutup informasi"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <p className="mb-2">
                                                <strong>Warna:</strong>
                                                <span className="ml-2 inline-flex items-center gap-2">
                                                    {categoryColors[category] && (
                                                        <div
                                                            className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600"
                                                            style={{ backgroundColor: categoryColors[category] }}
                                                        ></div>
                                                    )}
                                                    {categoryColors[category] || 'Tidak tersedia'}
                                                </span>
                                            </p>
                                            <p className="mb-2">
                                                <strong>Deskripsi:</strong>
                                            </p>
                                            <div className="rounded border bg-white p-3 text-sm dark:bg-gray-800">
                                                {getCategoryDescription(category)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Parent Level */}
                                {expandedCategories[category] && groupedByCategory[category] && (
                                    <div className="mt-2 ml-6">
                                        {Object.entries(groupedByCategory[category]).map(([parent, children]) => {
                                            const q = search.toLowerCase();
                                            const filteredChildren = (children || []).filter(
                                                (child) =>
                                                    child.label.toLowerCase().includes(q) ||
                                                    parent.toLowerCase().includes(q) ||
                                                    category.toLowerCase().includes(q),
                                            );
                                            const showParent =
                                                !search.trim() ||
                                                filteredChildren.length > 0 ||
                                                parent.toLowerCase().includes(q) ||
                                                category.toLowerCase().includes(q);
                                            if (!showParent) return null;
                                            return (
                                                <div key={`${category}-${parent}`} className="mb-3">
                                                    <div className="group flex cursor-pointer items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`parent-${category}-${parent}`}
                                                            checked={isParentChecked(category, parent)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleParentFilter(category, parent);
                                                            }}
                                                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span
                                                            className="mx-2 cursor-pointer text-lg"
                                                            onClick={() => handleToggleParent(category, parent)}
                                                        >
                                                            {expandedParents[category]?.[parent] ? <IoChevronDown /> : <IoChevronForward />}
                                                        </span>
                                                    <span
                                                        className="cursor-pointer font-semibold text-gray-800 dark:text-gray-100"
                                                        onClick={() => handleToggleParent(category, parent)}
                                                    >
                                                        {parent}
                                                    </span>
                                                    {!readOnly && (
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-gray-400 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                                            title="Ubah nama sumber"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEditParent(category, parent);
                                                            }}
                                                        >
                                                            <MdOutlineEdit />
                                                        </button>
                                                    )}
                                                </div>

                                                {!readOnly && editingParent?.category === category && editingParent.parent === parent && (
                                                    <form
                                                        className="mt-2 rounded-md border border-dashed border-blue-300 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/10"
                                                        onSubmit={handleParentRenameSubmit}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <label
                                                            htmlFor="parent-rename-input"
                                                            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200"
                                                        >
                                                            Nama Baru
                                                        </label>
                                                        <input
                                                            id="parent-rename-input"
                                                            type="text"
                                                            value={parentRenameValue}
                                                            onChange={(e) => {
                                                                setParentRenameValue(e.target.value);
                                                                setParentRenameError(null);
                                                                setParentRenameSuccess(null);
                                                            }}
                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1c1c21]"
                                                            placeholder="Masukkan nama sumber baru"
                                                            autoFocus
                                                            disabled={parentRenameLoading}
                                                        />
                                                        <div className="mt-2 flex gap-2">
                                                            <button
                                                                type="submit"
                                                                className="flex-1 rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                                                disabled={parentRenameLoading}
                                                            >
                                                                {parentRenameLoading ? 'Menyimpan...' : 'Simpan'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="flex-1 rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/40"
                                                                onClick={cancelParentEdit}
                                                                disabled={parentRenameLoading}
                                                            >
                                                                Batal
                                                            </button>
                                                        </div>
                                                        {parentRenameError && (
                                                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{parentRenameError}</p>
                                                        )}
                                                        {parentRenameSuccess && (
                                                            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                                                {parentRenameSuccess}
                                                            </p>
                                                        )}
                                                    </form>
                                                )}

                                                {/* Children Level */}
                                                {expandedParents[category]?.[parent] && filteredChildren.length > 0 && (
                                                    <div className="mt-2 ml-6">
                                                            <table className="min-w-full rounded border bg-gray-50 text-xs dark:border-[#393e41] dark:bg-[#232329]">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">
                                                                            Checklist
                                                                        </th>
                                                                        <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">
                                                                            Lokasi
                                                                        </th>
                                                                        <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">
                                                                            Label
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {filteredChildren.map((child) => (
                                                                        <tr key={child.id} className="dark:hover:bg-[#1a1a1e]">
                                                                            <td className="p-1">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`child-${category}-${parent}-${child.id}`}
                                                                                    checked={!!activeChildFilters[category]?.[parent]?.[child.id]}
                                                                                    onChange={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleChildFilter(category, parent, child.id);
                                                                                    }}
                                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                                />
                                                                            </td>
                                                                            <td className="p-1">
                                                                                <button
                                                                                    type="button"
                                                                                    className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-700"
                                                                                    onClick={() => onView(category, parent, child.id)}
                                                                                >
                                                                                    View
                                                                                </button>
                                                                            </td>
                                                                            <td className="p-1 text-gray-700 dark:text-gray-200">{child.label}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
            {settingsOpen && (
                <div
                    className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/40"
                    onClick={() => setSettingsOpen(false)}
                >
                    <div
                        className="w-[360px] max-w-[90vw] rounded-lg bg-white p-4 shadow-lg dark:bg-[#232329]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pengaturan Tampilan</h3>
                            <button
                                type="button"
                                className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-[#393e41] dark:text-gray-200"
                                onClick={() => setSettingsOpen(false)}
                            >
                                Tutup
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-200">Opacity Isi</div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Math.round((fillOpacity || 0) * 100)}
                                    onChange={(e) => onFillOpacityChange(Number(e.target.value) / 100)}
                                    className="w-full"
                                />
                                <div className="mt-1 text-right text-xs text-gray-600 dark:text-gray-300">
                                    {Math.round((fillOpacity || 0) * 100)}%
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={!!outlineHidden}
                                    onChange={(e) => onOutlineHiddenChange(e.target.checked)}
                                />
                                Hilangkan Outline
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(SidebarFilter);
