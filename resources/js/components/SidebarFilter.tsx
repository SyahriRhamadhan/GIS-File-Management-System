import React, { useState } from 'react';
import { IoChevronDown, IoChevronForward } from 'react-icons/io5';
import { MdOutlineFilterAlt, MdOutlineFilterAltOff } from 'react-icons/md';

interface SidebarFilterProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    uniqueSourceNames: string[];
    // Map: sourceName -> list of child (your "layer" items)
    groupedChildren: Record<string, string[]>;
    activeSourceFilters: Record<string, boolean>; // For parent
    toggleSourceFilter: (name: string) => void;
    activeChildFilters: Record<string, Record<string, boolean>>; // {parent: {child: true/false}}
    toggleChildFilter: (parent: string, child: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
    sidebarOpen,
    toggleSidebar,
    uniqueSourceNames,
    groupedChildren,
    activeSourceFilters,
    toggleSourceFilter,
    activeChildFilters,
    toggleChildFilter,
    onShowAll,
    onHideAll,
}) => {
    // Track which parent group is expanded
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const handleToggleGroup = (group: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [group]: !prev[group],
        }));
    };

    // Check "all checked" and "none checked" (can be enhanced for group logic)
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
                    <h2 className="mb-3 font-semibold">Filter Layers</h2>
                    <div className="mb-4 flex gap-2">
                        <button
                            type="button"
                            className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600 disabled:bg-blue-300"
                            onClick={onShowAll}
                            disabled={allChecked}
                        >
                            Tampilkan Semua
                        </button>
                        <button
                            type="button"
                            className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-red-300"
                            onClick={onHideAll}
                            disabled={noneChecked}
                        >
                            Sembunyikan Semua
                        </button>
                    </div>
                    <div>
                        {uniqueSourceNames.map((parent) => (
                            <div key={parent} className="mb-3">
                                {/* Parent as dropdown */}
                                <div className="group flex cursor-pointer items-center" onClick={() => handleToggleGroup(parent)}>
                                    <span className="mr-2 text-xl">{expandedGroups[parent] ? <IoChevronDown /> : <IoChevronForward />}</span>
                                    <label htmlFor={`filter-source-${parent}`} className="flex w-full items-center space-x-2">
                                        {/* OPTIONAL: Parent checkbox (if you want select-all for group) */}
                                        
                                        <input
                                            type="checkbox"
                                            id={`filter-source-${parent}`}
                                            checked={activeSourceFilters[parent] || false}
                                            onChange={() => toggleSourceFilter(parent)}
                                            onClick={e => e.stopPropagation()} // so it doesn't toggle the accordion
                                        />
                                       
                                        <span className="font-semibold">{parent}</span>
                                    </label>
                                </div>
                                {expandedGroups[parent] && groupedChildren[parent]?.length > 0 && (
                                    <div className="pt-1 pl-8">
                                        {groupedChildren[parent].map((child) => (
                                            <label key={child} className="mb-1 flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`filter-child-${parent}-${child}`}
                                                    checked={!!activeChildFilters[parent]?.[child]}
                                                    onChange={() => toggleChildFilter(parent, child)}
                                                />
                                                <span>{child}</span>
                                            </label>
                                        ))}
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
