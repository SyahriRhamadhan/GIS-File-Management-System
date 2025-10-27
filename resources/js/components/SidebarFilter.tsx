import React, { useState } from 'react';
import { IoChevronDown, IoChevronForward, IoInformationCircleOutline } from 'react-icons/io5';
import { MdOutlineFilterAlt, MdOutlineFilterAltOff } from 'react-icons/md';

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
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedParents, setExpandedParents] = useState<Record<string, Record<string, boolean>>>({});
    const [search, setSearch] = useState('');
    const [coordX, setCoordX] = useState('');
    const [coordY, setCoordY] = useState('');
    const [showCategoryInfo, setShowCategoryInfo] = useState<Record<string, boolean>>({});

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

    // Function to get category description based on category name
    const getCategoryDescription = (category: string): string => {
        // Map category names to descriptions
        const categoryDescriptions: Record<string, string> = {
            'Infrastruktur': 'Kategori ini mencakup semua infrastruktur fisik seperti jalan, jembatan, gedung pemerintahan, fasilitas umum, dan infrastruktur pendukung lainnya yang penting untuk pembangunan daerah.',
            'Lingkungan': 'Kategori ini meliputi data terkait lingkungan hidup seperti kawasan hutan, daerah aliran sungai, area konservasi, zona hijau, dan wilayah yang memerlukan perlindungan lingkungan.',
            'Ekonomi': 'Kategori ini berisi informasi tentang pusat-pusat ekonomi, kawasan industri, pasar tradisional, area perdagangan, dan zona ekonomi khusus yang mendukung pertumbuhan ekonomi daerah.',
            'Sosial': 'Kategori ini mencakup fasilitas sosial seperti sekolah, rumah sakit, tempat ibadah, pusat komunitas, dan fasilitas pelayanan masyarakat lainnya.',
            'Transportasi': 'Kategori ini meliputi sistem transportasi termasuk terminal, pelabuhan, bandara, stasiun, jalur transportasi umum, dan infrastruktur pendukung mobilitas masyarakat.',
            'Pariwisata': 'Kategori ini berisi informasi tentang objek wisata, destinasi pariwisata, hotel, restoran, dan fasilitas pendukung industri pariwisata daerah.',
            'Pertanian': 'Kategori ini mencakup lahan pertanian, perkebunan, area irigasi, gudang penyimpanan hasil pertanian, dan infrastruktur pendukung sektor pertanian.',
            'Kesehatan': 'Kategori ini meliputi fasilitas kesehatan seperti rumah sakit, puskesmas, klinik, apotek, dan infrastruktur kesehatan masyarakat lainnya.',
        };

        return categoryDescriptions[category] || `Informasi detail untuk kategori ${category}. Kategori ini berisi data geospasial yang relevan dengan ${category.toLowerCase()} di wilayah ini.`;
    };

    // Check if all items are checked
    const allChecked = uniqueCategoryNames.every((category) =>
        activeCategoryFilters[category] &&
        Object.keys(groupedByCategory[category] || {}).every((parent) =>
            activeParentFilters[category]?.[parent] &&
            groupedByCategory[category][parent]?.every((child) => activeChildFilters[category]?.[parent]?.[child.id])
        )
    );

    // Check if no items are checked
    const noneChecked = uniqueCategoryNames.every((category) =>
        !activeCategoryFilters[category] ||
        !Object.keys(groupedByCategory[category] || {}).some((parent) =>
            activeParentFilters[category]?.[parent] &&
            groupedByCategory[category][parent]?.some((child) => activeChildFilters[category]?.[parent]?.[child.id])
        )
    );

    // Filter categories based on search
    const filteredCategories = uniqueCategoryNames.filter((category) => {
        if (category.toLowerCase().includes(search.toLowerCase())) return true;
        
        return Object.entries(groupedByCategory[category] || {}).some(([parent, children]) => {
            if (parent.toLowerCase().includes(search.toLowerCase())) return true;
            return children.some((child) => child.label.toLowerCase().includes(search.toLowerCase()));
        });
    });

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
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Filter Layers
                             RTWR RTRW, KKPR, GANTI RUGI
                        </h2>
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        )}
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
                    </div>

                    <div>
                        <small >*click checkbox 2x jika tak tampil</small>
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
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                    />
                                    <span className="mx-2 text-xl cursor-pointer" onClick={() => handleToggleCategory(category)}>{expandedCategories[category] ? <IoChevronDown /> : <IoChevronForward />}</span>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleCategory(category)}>
                                        {categoryColors[category] && (
                                            <div 
                                                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
                                                style={{ backgroundColor: categoryColors[category] }}
                                                title={`Warna kategori: ${categoryColors[category]}`}
                                            ></div>
                                        )}
                                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{category}</span>
                                        {categoryCodes[category] && (
                                            <span className="ml-2 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border">
                                                {categoryCodes[category]}
                                            </span>
                                        )}
                                    </div>
                                    {/* Info Icon */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleCategoryInfo(category);
                                        }}
                                        className="ml-2 p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                        title="Lihat informasi kategori"
                                    >
                                        <IoInformationCircleOutline className="text-lg" />
                                    </button>
                                </div>

                                {/* Category Information Popup */}
                                {showCategoryInfo[category] && (
                                    <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                                                Informasi Kategori: {category}
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
                                                <strong>Kode Kategori:</strong> {categoryCodes[category] || 'Tidak tersedia'}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Warna:</strong> 
                                                <span className="ml-2 inline-flex items-center gap-2">
                                                    {categoryColors[category] && (
                                                        <div 
                                                            className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                                                            style={{ backgroundColor: categoryColors[category] }}
                                                        ></div>
                                                    )}
                                                    {categoryColors[category] || 'Tidak tersedia'}
                                                </span>
                                            </p>
                                            <p className="mb-2">
                                                <strong>Deskripsi:</strong>
                                            </p>
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm">
                                                {getCategoryDescription(category)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Parent Level */}
                                {expandedCategories[category] && groupedByCategory[category] && (
                                    <div className="ml-6 mt-2">
                                        {Object.entries(groupedByCategory[category]).map(([parent, children]) => {
                                            const q = search.toLowerCase();
                                            const filteredChildren = (children || []).filter(
                                                (child) =>
                                                    child.label.toLowerCase().includes(q) ||
                                                    parent.toLowerCase().includes(q) ||
                                                    category.toLowerCase().includes(q),
                                            );
                                            const showParent = !search.trim() || filteredChildren.length > 0 || parent.toLowerCase().includes(q) || category.toLowerCase().includes(q);
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
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                                    />
                                                    <span className="mx-2 text-lg cursor-pointer" onClick={() => handleToggleParent(category, parent)}>{expandedParents[category]?.[parent] ? <IoChevronDown /> : <IoChevronForward />}</span>
                                                    <span className="font-semibold text-gray-800 dark:text-gray-100 cursor-pointer" onClick={() => handleToggleParent(category, parent)}>{parent}</span>
                                                </div>

                                                {/* Children Level */}
                                                {expandedParents[category]?.[parent] && filteredChildren.length > 0 && (
                                                    <div className="ml-6 mt-2">
                                                        <table className="min-w-full rounded border bg-gray-50 text-xs dark:border-[#393e41] dark:bg-[#232329]">
                                                            <thead>
                                                                <tr>
                                                                    <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">Checklist</th>
                                                                    <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">Lokasi</th>
                                                                    <th className="p-1 text-left font-bold text-gray-700 dark:text-gray-200">Label</th>
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
        </div>
    );
};

export default SidebarFilter;
