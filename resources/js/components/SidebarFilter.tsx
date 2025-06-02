import React, { useState } from 'react';
import { IoChevronDown, IoChevronForward } from 'react-icons/io5';
import { MdOutlineFilterAlt, MdOutlineFilterAltOff } from 'react-icons/md';

interface SidebarFilterProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    uniqueSourceNames: string[];
    groupedChildren: Record<string, Array<{ id: string; label: string }>>;
    activeChildFilters: Record<string, Record<string, boolean>>;
    toggleSourceFilter: (name: string) => void;
    toggleChildFilter: (parent: string, childId: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
    isParentChecked?: (parent: string) => boolean; // Tambahan (optional)
    onView: (parent: string, childId: string) => void;
    onSearchCoordinate?: (x: string, y: string) => void; // Tambahan
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
    sidebarOpen,
    toggleSidebar,
    uniqueSourceNames,
    groupedChildren,
    activeChildFilters,
    toggleSourceFilter,
    toggleChildFilter,
    onShowAll,
    onHideAll,
    isParentChecked = () => false,
    onView,
    onSearchCoordinate,
}) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const [coordX, setCoordX] = useState('');
    const [coordY, setCoordY] = useState('');

    const handleToggleGroup = (group: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [group]: !prev[group],
        }));
    };

    const allChecked = uniqueSourceNames.every(
        (parent) => groupedChildren[parent]?.length > 0 && groupedChildren[parent].every((child) => activeChildFilters[parent]?.[child.id]),
    );
    const noneChecked = uniqueSourceNames.every((parent) => !groupedChildren[parent]?.some((child) => activeChildFilters[parent]?.[child.id]));

    const filteredSourceNames = uniqueSourceNames.filter(
        (parent) =>
            parent.toLowerCase().includes(search.toLowerCase()) ||
            groupedChildren[parent]?.some((child) => child.label.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div
            className={`fixed top-0 right-0 z-[9999] flex h-full flex-col border-l border-gray-300 bg-white shadow-lg transition-all duration-300 ${
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
                className="fixed top-2 right-6 z-[10001] rounded-full border border-gray-300 bg-white p-2 shadow hover:bg-gray-100"
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                type="button"
            >
                {sidebarOpen ? <MdOutlineFilterAltOff className="text-3xl" /> : <MdOutlineFilterAlt className="text-3xl" />}
            </button>
            {sidebarOpen && (
                <>
                    <h2 className="mb-2 font-semibold">Filter Layers</h2>
                    <div className="mb-4 flex flex-col items-center gap-3 px-4">
                        {/* Search Bar */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                                    className="flex-1 rounded-lg border border-gray-300 py-2 ps-2 text-xs"
                                    placeholder="Koordinat X (Long)"
                                />
                                <input
                                    type="text"
                                    value={coordY}
                                    onChange={(e) => setCoordY(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 py-2 ps-2 text-xs"
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
                        {filteredSourceNames.map((parent) => (
                            <div key={parent} className="mb-3">
                                <div className="group flex cursor-pointer items-center" onClick={() => handleToggleGroup(parent)}>
                                    <label
                                        htmlFor={`filter-source-${parent}`}
                                        className="flex items-center space-x-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`filter-source-${parent}`}
                                            checked={isParentChecked(parent)}
                                            onChange={() => toggleSourceFilter(parent)}
                                        />
                                    </label>
                                    <span className="mx-2 text-xl">{expandedGroups[parent] ? <IoChevronDown /> : <IoChevronForward />}</span>
                                    <span className="font-semibold">{parent}</span>
                                </div>

                                {expandedGroups[parent] && groupedChildren[parent]?.length > 0 && (
                                    <table className="mt-2 min-w-full rounded border bg-gray-50 text-xs">
                                        <thead>
                                            <tr>
                                                <th className="p-1 text-left font-bold">Checklist</th>
                                                <th className="p-1 text-left font-bold">Lokasi</th>
                                                <th className="p-1 text-left font-bold">Label</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedChildren[parent]
                                                .filter(
                                                    (child) =>
                                                        child.label.toLowerCase().includes(search.toLowerCase()) ||
                                                        parent.toLowerCase().includes(search.toLowerCase()),
                                                )
                                                .map((child) => (
                                                    <tr key={child.id}>
                                                        <td className="p-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!activeChildFilters[parent]?.[child.id]}
                                                                onChange={() => toggleChildFilter(parent, child.id)}
                                                            />
                                                        </td>
                                                        <td className="p-1">
                                                            <button
                                                                type="button"
                                                                className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-700"
                                                                onClick={() => onView(parent, child.id)}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                        <td className="p-1">{child.label}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
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
