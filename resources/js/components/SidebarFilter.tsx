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
}) => (
    <div
        className={`fixed top-0 right-0 z-[9999] flex h-full flex-col border-l border-gray-300 bg-white shadow-lg transition-all duration-300 ${
            sidebarOpen ? 'w-7 p-4' : 'w-0 p-0'
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
            className="fixed top-6 right-6 z-[10001] rounded-full border border-gray-300 bg-white p-2 shadow hover:bg-gray-100"
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

export default SidebarFilter;
