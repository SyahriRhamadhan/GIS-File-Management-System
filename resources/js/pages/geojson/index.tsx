import Modal from '@/components/Modal'; // Keep the original Modal intact
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface Geojson {
    id_geojson: number;
    source_name: string;
    geojson: any;
    id_user: number;
    id_region?: number;
    id_owner?: number;
    id_kategori?: number;
    kode_warna?: string;
    orde0?: string;
    ket_warna?: string;
    orde1?: string;
    orde2?: string;
    orde3?: string;
    orde4?: string;
    kode?: string;
    layer_order?: number;
}

interface Kategori {
    id_kategori: number;
    orde0: string;
    kode_warna: string;
    orde1?: string;
    orde2?: string;
    orde3?: string;
    orde4?: string;
    kode?: string;
    ket_warna?: string;
    layer_order?: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface PageProps {
    geojsons: PaginatedData<Geojson>;
    users: { id: number; name: string }[];
    regions: { id_region: number; name: string }[];
    owners: { id_owner: number; name: string }[];
    kategoris: Kategori[];
    sourceNames: string[];
    filters: {
        search: string;
        user_filter: string;
        region_filter: string;
        owner_filter: string;
        category_filter: string;
        source_filter: string;
        sort_by: string;
        sort_direction: string;
        per_page: number | string;
    };
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

export default function GeojsonIndex() {
    const { geojsons, users, regions, owners, kategoris, sourceNames, filters, flash } = usePage<PageProps>().props;
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [userFilter, setUserFilter] = useState<number | string>(filters.user_filter || '');
    const [regionFilter, setRegionFilter] = useState<number | string>(filters.region_filter || '');
    const [ownerFilter, setOwnerFilter] = useState<number | string>(filters.owner_filter || '');
    const [categoryFilter, setCategoryFilter] = useState<number | string>(filters.category_filter || '');
    const [sourceFilter, setSourceFilter] = useState<string>(filters.source_filter || '');
    const [sortBy, setSortBy] = useState<keyof Geojson>(filters.sort_by as keyof Geojson || 'source_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters.sort_direction as 'asc' | 'desc' || 'asc');
    const [pageSize, setPageSize] = useState<number | 'all'>(
        typeof filters.per_page === 'string' && filters.per_page === 'all' 
            ? 'all' 
            : typeof filters.per_page === 'number' 
                ? filters.per_page 
                : 10
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGeojson, setSelectedGeojson] = useState<Geojson | null>(null);

    // State for showing detail kategori popup
    const [detailKategoriId, setDetailKategoriId] = useState<number | null>(null);

    // Server-side navigation function
    const navigateWithFilters = (additionalParams: Record<string, any> = {}) => {
        const params: Record<string, any> = {
            search,
            user_filter: userFilter,
            region_filter: regionFilter,
            owner_filter: ownerFilter,
            category_filter: categoryFilter,
            source_filter: sourceFilter,
            sort_by: sortBy,
            sort_direction: sortDirection,
            per_page: pageSize,
            ...additionalParams,
        };

        // Remove empty values
        Object.keys(params).forEach((key: string) => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        router.get('/dashboard/geojson', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Get current data from paginated response
    const currentData = geojsons.data;
    const currentPage = geojsons.current_page;
    const lastPage = geojsons.last_page;
    const total = geojsons.total;

    const handleView = (g: Geojson) => {
        setSelectedGeojson(g);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin hapus data ini?')) return;
        router.delete(`/dashboard/geojson/${id}`, {
            onSuccess: () => toast.success('GeoJSON berhasil dihapus'),
            onError: () => toast.error('Gagal menghapus GeoJSON'),
        });
    };

    const toggleSort = (col: keyof Geojson) => {
        let newDirection: 'asc' | 'desc' = 'asc';
        if (sortBy === col) {
            newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        }
        setSortBy(col);
        setSortDirection(newDirection);
        navigateWithFilters({ 
            sort_by: col, 
            sort_direction: newDirection,
            page: 1 
        });
    };

    const maxButtons = 5;
    const goToPage = (p: number) => {
        navigateWithFilters({ page: p });
    };

    const visiblePages = useMemo(() => {
        const total = lastPage;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;

        if (end > total) {
            end = total;
            start = Math.max(1, end - maxButtons + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [currentPage, lastPage]);

    // State untuk menyimpan ID geojson yang dipilih
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Debounced search
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            if (search !== filters.search) {
                navigateWithFilters({ 
                    search: search,
                    page: 1 
                });
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, filters.search, navigateWithFilters]);

    // Toggle single checkbox
    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // Toggle “select all” pada current page
    const toggleSelectAll = (checked: boolean, ids: number[]) => {
        if (checked) setSelectedIds(ids);
        else setSelectedIds([]);
    };

    const handleBulkDelete = () => {
        if (!selectedIds.length) return;
        setShowBulkModal(true);
    };
    const confirmBulkDelete = () => {
        Promise.all(selectedIds.map((id) => router.delete(`/dashboard/geojson/${id}`, { preserveScroll: true }))).then(() => {
            toast.success('Items terhapus');
            setSelectedIds([]);
            navigateWithFilters({ page: 1 });
            setShowBulkModal(false);
        });
    };

    // Clear all filters function
    const clearAllFilters = () => {
        setSearch('');
        setUserFilter('');
        setRegionFilter('');
        setOwnerFilter('');
        setCategoryFilter('');
        setSourceFilter('');
        setSortBy('source_name');
        setSortDirection('asc');
        setPageSize(10);
        
        // Navigate with cleared filters
        router.get('/dashboard/geojson', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const sourceOptions = sourceNames.map((src) => ({
        value: src,
        label: src,
    }));
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

    const customSelectStyles = {
        control: (provided: { boxShadow: any }, state: { isFocused: any }) => ({
            ...provided,
            backgroundColor: isDark ? '#374151' : '#fff', // dark:bg-gray-700, light:bg-white
            color: isDark ? '#f3f4f6' : '#111827', // dark:text-gray-100, light:text-gray-900
            borderColor: isDark ? '#4b5563' : '#d1d5db', // dark:border-gray-600, light:border-gray-300
            boxShadow: state.isFocused ? '0 0 0 2px #2563eb22' : provided.boxShadow,
        }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: isDark ? '#374151' : '#fff',
            color: isDark ? '#f3f4f6' : '#111827',
            zIndex: 99,
        }),
        option: (provided: any, state: { isSelected: any; isFocused: any }) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? isDark
                    ? '#2563eb'
                    : '#93c5fd'
                : state.isFocused
                  ? isDark
                      ? '#4b5563'
                      : '#f3f4f6'
                  : isDark
                    ? '#374151'
                    : '#fff',
            color: isDark ? '#f3f4f6' : '#111827',
            cursor: 'pointer',
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        input: (provided: any) => ({
            ...provided,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: isDark ? '#9ca3af' : '#6b7280',
        }),
        menuPortal: (provided: any) => ({ ...provided, zIndex: 9999 }),
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
            ]}
        >
            <Head title="GeoJSON Index" />

            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {/* header + add button */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Daftar GeoJSON</h1>
                    <Link href="/dashboard/geojson/create" className="rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700">
                        + Tambah GeoJSON
                    </Link>
                    <button
                        onClick={handleBulkDelete}
                        disabled={!selectedIds.length}
                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        Delete Selected
                    </button>
                </div>

                {/* Search and Filter Section */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Cari GeoJSON..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                            />
                        </div>
                        
                        {/* Clear Filter Button */}
                        <button
                            onClick={clearAllFilters}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:bg-gray-600 dark:hover:bg-gray-700"
                            title="Hapus semua filter"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear Filters
                        </button>
                    </div>

                    {/* Filter Controls */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="mb-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Data</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Source Filter */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Source
                                </label>
                                <Select
                                    options={sourceOptions}
                                    className="w-full"
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: isDark ? '#374151' : '#fff',
                                            color: isDark ? '#f3f4f6' : '#111827',
                                            borderColor: isDark ? '#4b5563' : '#d1d5db',
                                            borderRadius: '0.5rem',
                                            minHeight: '38px',
                                            boxShadow: state.isFocused ? '0 0 0 2px #2563eb22' : base.boxShadow,
                                            '&:hover': {
                                                borderColor: isDark ? '#6b7280' : '#9ca3af',
                                            },
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: isDark ? '#374151' : '#fff',
                                            color: isDark ? '#f3f4f6' : '#111827',
                                            zIndex: 99,
                                            borderRadius: '0.5rem',
                                            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? isDark ? '#2563eb' : '#3b82f6'
                                                : state.isFocused
                                                  ? isDark ? '#4b5563' : '#f3f4f6'
                                                  : isDark ? '#374151' : '#fff',
                                            color: state.isSelected 
                                                ? '#fff' 
                                                : isDark ? '#f3f4f6' : '#111827',
                                            cursor: 'pointer',
                                            padding: '8px 12px',
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: isDark ? '#f3f4f6' : '#111827',
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: isDark ? '#f3f4f6' : '#111827',
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: isDark ? '#9ca3af' : '#6b7280',
                                        }),
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                    }}
                                    value={sourceOptions.find((option) => option.value === sourceFilter) || null}
                                    onChange={(selectedOption) => {
                                        const value = selectedOption ? selectedOption.value : '';
                                        setSourceFilter(value);
                                        navigateWithFilters({ 
                                            source_filter: value,
                                            page: 1 
                                        });
                                    }}
                                    isClearable
                                    placeholder="Pilih source..."
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                />
                            </div>

                            {/* User Filter */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    User
                                </label>
                                <select
                                    value={userFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setUserFilter(value);
                                        navigateWithFilters({ 
                                            user_filter: value,
                                            page: 1 
                                        });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                                >
                                    <option value="">Semua User</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Region Filter */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Region
                                </label>
                                <select
                                    value={regionFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setRegionFilter(value);
                                        navigateWithFilters({ 
                                            region_filter: value,
                                            page: 1 
                                        });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                                >
                                    <option value="">Semua Region</option>
                                    {regions.map((r) => (
                                        <option key={r.id_region} value={r.id_region}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Owner Filter */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Owner
                                </label>
                                <select
                                    value={ownerFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setOwnerFilter(value);
                                        navigateWithFilters({ 
                                            owner_filter: value,
                                            page: 1 
                                        });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                                >
                                    <option value="">Semua Owner</option>
                                    {owners.map((o) => (
                                        <option key={o.id_owner} value={o.id_owner}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* table */}
                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[800px] border text-sm">
                        <thead className="bg-gray-100">
                            <tr className="dark:bg-gray-700">
                                <th className="border px-4 py-2">
                                    {/* Rows per page */}
                                    <label className="flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={currentData.length > 0 && currentData.every((g) => selectedIds.includes(g.id_geojson))}
                                            onChange={(e) =>
                                                toggleSelectAll(
                                                    e.target.checked,
                                                    currentData.map((g) => g.id_geojson),
                                                )
                                            }
                                        />
                                        <span className="text-1xl my-1 text-gray-500">Select All</span>
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                            setPageSize(val);
                                            navigateWithFilters({ 
                                                per_page: val,
                                                page: 1 
                                            });
                                        }}
                                        className="w-full max-w-xs rounded border bg-white px-3 py-2 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        {[10, 20, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                        <option value="all">All</option>
                                    </select>
                                </th>
                                <th className="cursor-pointer border px-4 py-2" onClick={() => toggleSort('source_name')}>
                                    Source {sortBy === 'source_name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="border px-4 py-2">Kategori</th>
                                <th className="border px-4 py-2">User</th>
                                <th className="border px-4 py-2">Region</th>
                                <th className="border px-4 py-2">Owner</th>
                                <th className="border px-4 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((g, i) => {
                                // Find kategori detail from the categories array
                                const kategori = kategoris.find((k) => k.id_kategori === g.id_kategori);

                                return (
                                    <tr key={g.id_geojson} className="bg-white even:bg-gray-50 dark:bg-gray-800 dark:even:bg-gray-700">
                                        <td className="border px-4 py-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(g.id_geojson)}
                                                    onChange={() => toggleSelect(g.id_geojson)}
                                                />
                                                <span className="mx-auto">
                                                    {geojsons.from + i}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border px-4 py-2">{g.source_name}</td>
                                        <td className="border px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="h-4 w-4 flex-shrink-0 rounded" style={{ backgroundColor: g.kode_warna ?? '#000' }} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                        {kategori ? (
                                                            <ul className="list-disc pl-4">
                                                                {[kategori.orde0, kategori.orde1, kategori.orde2, kategori.orde3, kategori.orde4]
                                                                    .filter(Boolean)
                                                                    .map((orde, idx) => (
                                                                        <li key={idx}>{orde}</li>
                                                                    ))}
                                                            </ul>
                                                        ) : (
                                                            g.orde0
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{g.kode_warna}</span>
                                                    <button
                                                        className="mt-1 w-fit rounded bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600"
                                                        onClick={() => setDetailKategoriId(g.id_geojson)}
                                                        type="button"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border px-4 py-2">{users.find((u) => u.id === g.id_user)?.name}</td>
                                        <td className="border px-4 py-2">{regions.find((r) => r.id_region === g.id_region)?.name ?? '-'}</td>
                                        <td className="border px-4 py-2">{owners.find((o) => o.id_owner === g.id_owner)?.name ?? '-'}</td>
                                        <td className="flex justify-center gap-1 border px-4 py-2">
                                            <button
                                                onClick={() => handleView(g)}
                                                className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                            >
                                                View
                                            </button>
                                            <Link
                                                href={`/dashboard/geojson/${g.id_geojson}/edit`}
                                                className="rounded bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(g.id_geojson)}
                                                className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Popup for detail */}
                {detailKategoriId !== null &&
                    (() => {
                        const g = currentData.find((item) => item.id_geojson === detailKategoriId);
                        const kategori = kategoris.find((k) => k.id_kategori === g?.id_kategori);
                        return (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                                onClick={() => setDetailKategoriId(null)}
                            >
                                <div className="rounded bg-white p-6 shadow-lg dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="mb-2 text-lg font-bold">Detail Kategori</h2>
                                    <div className="p-4">
                                        <div>
                                            <b>Nama Kategori:</b> {kategori?.orde0 ?? '-'}
                                        </div>
                                        <div>
                                            <b>Orde 1:</b> {kategori?.orde1 ?? '-'}
                                        </div>
                                        <div>
                                            <b>Orde 2:</b> {kategori?.orde2 ?? '-'}
                                        </div>
                                        <div>
                                            <b>Orde 3:</b> {kategori?.orde3 ?? '-'}
                                        </div>
                                        <div>
                                            <b>Orde 4:</b> {kategori?.orde4 ?? '-'}
                                        </div>
                                        <div>
                                            <b>Kode:</b> {kategori?.kode ?? '-'}
                                        </div>
                                        <div>
                                            <b>Kode Warna:</b> {kategori?.kode_warna ?? '-'}
                                        </div>
                                        <div>
                                            <b>Keterangan Warna:</b> {kategori?.ket_warna ?? '-'}
                                        </div>
                                        <div>
                                            <b>Layer Order:</b> {kategori?.layer_order ?? '-'}
                                        </div>
                                    </div>
                                    <button
                                        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                        onClick={() => setDetailKategoriId(null)}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                {/* pagination */}
                <div className="my-4 flex flex-wrap items-center justify-center gap-2">
                    {/* First */}
                    <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        « First
                    </button>

                    {/* Prev */}
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        ‹ Prev
                    </button>

                    {/* window 5 angka */}
                    {visiblePages.map((p) => (
                        <button
                            key={p}
                            onClick={() => goToPage(p)}
                            className={`rounded border px-3 py-1 text-sm ${
                                currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}

                    {/* Next */}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === lastPage}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        Next ›
                    </button>

                    {/* Last */}
                    <button
                        onClick={() => goToPage(lastPage)}
                        disabled={currentPage === lastPage}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        Last »
                    </button>
                </div>

                {/* Pagination Info */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Showing {geojsons.from || 0} to {geojsons.to || 0} of {total} results
                </div>
                {showBulkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowBulkModal(false)}>
                        <div
                            className="mx-4 flex max-h-[100vh] w-full flex-col rounded bg-white p-3 shadow-lg sm:mx-auto sm:max-w-3xl lg:max-w-5xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-1 text-xl font-semibold">Konfirmasi Hapus</h2>
                            <div className="mb-2 text-lg text-gray-700">
                                Total dipilih: <b>{selectedIds.length}</b> item
                            </div>
                            <div className="mb-4 flex-1 overflow-y-auto">
                                <table className="min-w-full border text-sm">
                                    <thead className="sticky top-0 bg-gray-100">
                                        <tr>
                                            <th className="border px-2 py-1">#</th>
                                            <th className="border px-2 py-1">Source</th>
                                            <th className="border px-2 py-1">Kategori</th>
                                            <th className="border px-2 py-1">User</th>
                                            <th className="border px-2 py-1">Region</th>
                                            <th className="border px-2 py-1">Owner</th>
                                            <th className="border px-2 py-1">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentData
                                            .filter((g: Geojson) => selectedIds.includes(g.id_geojson))
                                            .map((g: Geojson) => {
                                                const nomor = currentData.findIndex((item: Geojson) => item.id_geojson === g.id_geojson) + 1;
                                                const kategori = kategoris.find((k) => k.id_kategori === g.id_kategori);
                                                return (
                                                    <tr key={g.id_geojson}>
                                                        <td className="border px-2 py-1">{nomor}</td>
                                                        <td className="border px-2 py-1">{g.source_name}</td>
                                                        <td className="border px-4 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="h-4 w-4 flex-shrink-0 rounded"
                                                                    style={{ backgroundColor: g.kode_warna ?? '#000' }}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                                        {kategori ? (
                                                                            <ul className="list-disc pl-4">
                                                                                {[
                                                                                    kategori.orde0,
                                                                                    kategori.orde1,
                                                                                    kategori.orde2,
                                                                                    kategori.orde3,
                                                                                    kategori.orde4,
                                                                                ]
                                                                                    .filter(Boolean)
                                                                                    .map((orde, idx) => (
                                                                                        <li key={idx}>{orde}</li>
                                                                                    ))}
                                                                            </ul>
                                                                        ) : (
                                                                            g.orde0
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{g.kode_warna}</span>
                                                                    <button
                                                                        className="mt-1 w-fit rounded bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600"
                                                                        onClick={() => setDetailKategoriId(g.id_geojson)}
                                                                        type="button"
                                                                    >
                                                                        Detail
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="border px-2 py-1">{users.find((u) => u.id === g.id_user)?.name}</td>
                                                        <td className="border px-2 py-1">
                                                            {regions.find((r) => r.id_region === g.id_region)?.name ?? '-'}
                                                        </td>
                                                        <td className="border px-2 py-1">
                                                            {owners.find((o) => o.id_owner === g.id_owner)?.name ?? '-'}
                                                        </td>
                                                        <td className="border px-2 py-1">
                                                            <div className="flex h-full flex-col items-center justify-center">
                                                                <button
                                                                    onClick={() => handleView(g)}
                                                                    className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                                                >
                                                                    View
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <button onClick={() => setShowBulkModal(false)} className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
                                    Batal
                                </button>
                                <button onClick={confirmBulkDelete} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GeoJSON Preview Modal */}
            {isModalOpen && selectedGeojson && <Modal geojson={selectedGeojson} onClose={() => setIsModalOpen(false)} />}
        </AppLayout>
    );
}
