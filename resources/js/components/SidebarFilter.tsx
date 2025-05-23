import React from 'react';
import { MdOutlineFilterAlt, MdOutlineFilterAltOff } from 'react-icons/md';

interface SidebarFilterProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    uniqueSourceNames: string[];
    activeSourceFilters: Record<string, boolean>;
    toggleSourceFilter: (name: string) => void;
    subGroupsBySourceName: Record<string, string[]>;
    activeSubGroupFilters: Record<string, string | 'all'>;
    setSubGroupFilter: (sourceName: string, subGroup: string | 'all') => void;
    onShowAll: () => void;
    onHideAll: () => void;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
    sidebarOpen,
    toggleSidebar,
    uniqueSourceNames,
    activeSourceFilters,
    toggleSourceFilter,
    subGroupsBySourceName,
    activeSubGroupFilters,
    setSubGroupFilter,
    onShowAll,
    onHideAll,
}) => {
    const allChecked = uniqueSourceNames.every((name) => activeSourceFilters[name]);
    const noneChecked = uniqueSourceNames.every((name) => !activeSourceFilters[name]);

    return (
        <div
            className={`fixed top-0 right-0 z-[9999] flex h-full flex-col border-l border-gray-300 bg-white shadow-lg transition-all duration-300 ${
                sidebarOpen ? 'w-72 p-4' : 'w-0 p-0'
            } overflow-auto`}
            style={{
                minWidth: sidebarOpen ? '18rem' : '0',
                width: sidebarOpen ? '18rem' : '0',
                padding: sidebarOpen ? '1rem' : '0',
            }}
        >
            {/* Tombol filter SELALU MUNCUL */}
            <button
                onClick={toggleSidebar}
                className="fixed top-2 right-6 z-[10001] rounded-full border border-gray-300 bg-white p-2 shadow hover:bg-gray-100"
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                type="button"
            >
                {sidebarOpen ? <MdOutlineFilterAltOff className="text-3xl" /> : <MdOutlineFilterAlt className="text-3xl" />}
            </button>

            {/* Konten filter hanya muncul jika sidebarOpen */}
            {sidebarOpen && (
                <>
                    <h2 className="mb-3 font-semibold">Filter Layers</h2>
                    {/* Tombol Tampilkan Semua / Hide Semua */}
                    <div className="mb-4 flex gap-2">
                        <button
                            type="button"
                            className={`rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600 disabled:bg-blue-300`}
                            onClick={onShowAll}
                            disabled={allChecked}
                        >
                            Tampilkan Semua
                        </button>
                        <button
                            type="button"
                            className={`rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-red-300`}
                            onClick={onHideAll}
                            disabled={noneChecked}
                        >
                            Sembunyikan Semua
                        </button>
                    </div>
                    {uniqueSourceNames.map((sourceName) => (
                        <div key={sourceName} className="mb-4">
                            <label htmlFor={`filter-source-${sourceName}`} className="inline-flex cursor-pointer items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={`filter-source-${sourceName}`}
                                    name={`filter-source-${sourceName}`}
                                    checked={activeSourceFilters[sourceName] || false}
                                    onChange={() => toggleSourceFilter(sourceName)}
                                />
                                <span>{sourceName}</span>
                            </label>
                            {activeSourceFilters[sourceName] && subGroupsBySourceName[sourceName]?.length > 1 && (
                                <select
                                    id={`subgroup-filter-${sourceName}`}
                                    name={`subgroup-filter-${sourceName}`}
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
    );
};

export default SidebarFilter;
