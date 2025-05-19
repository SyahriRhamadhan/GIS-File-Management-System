import Modal from '@/components/Modal'; // Keep the original Modal intact
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

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

interface PageProps {
    geojsons: Geojson[];
    users: { id: number; name: string }[];
    regions: { id_region: number; name: string }[];
    owners: { id_owner: number; name: string }[];
    kategoris: Kategori[];
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

export default function GeojsonIndex() {
    const { geojsons, users, regions, owners, kategoris, flash } = usePage<PageProps>().props;
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState<number | string>('');
    const [regionFilter, setRegionFilter] = useState<number | string>('');
    const [ownerFilter, setOwnerFilter] = useState<number | string>('');
    const [categoryFilter, setCategoryFilter] = useState<number | string>('');
    const [sourceFilter, setSourceFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<keyof Geojson>('source_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGeojson, setSelectedGeojson] = useState<Geojson | null>(null);

    // State for showing detail kategori popup
    const [detailKategoriId, setDetailKategoriId] = useState<number | null>(null);

    // Apply all filters, and search also matches user, region, owner
    const filtered = useMemo(() => {
        return geojsons
            .filter((g) => {
                // 1. Filter by source_name dropdown
                if (sourceFilter && g.source_name !== sourceFilter) {
                    return false;
                }

                // 2. Cari relasi lain
                const user = users.find((u) => u.id === g.id_user);
                const region = regions.find((r) => r.id_region === g.id_region);
                const owner = owners.find((o) => o.id_owner === g.id_owner);
                const kategoriObj = kategoris.find((k) => k.id_kategori === g.id_kategori);

                // 3. Gabungkan orde kategori
                const kategoriString = [kategoriObj?.orde0, kategoriObj?.orde1, kategoriObj?.orde2, kategoriObj?.orde3, kategoriObj?.orde4]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                // 4. Pencarian text
                const s = search.toLowerCase();
                const matchesSearch =
                    !search ||
                    g.source_name.toLowerCase().includes(s) ||
                    g.orde0?.toLowerCase().includes(s) ||
                    user?.name.toLowerCase().includes(s) ||
                    region?.name.toLowerCase().includes(s) ||
                    owner?.name.toLowerCase().includes(s) ||
                    kategoriString.includes(s);

                // 5. Gabungkan semua filter
                return (
                    matchesSearch &&
                    (!userFilter || g.id_user === +userFilter) &&
                    (!regionFilter || g.id_region === +regionFilter) &&
                    (!ownerFilter || g.id_owner === +ownerFilter) &&
                    (!categoryFilter || g.id_kategori === +categoryFilter)
                );
            })
            .sort((a, b) => {
                const aVal = (a[sortBy] ?? '').toString().toLowerCase();
                const bVal = (b[sortBy] ?? '').toString().toLowerCase();
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [
        geojsons,
        sourceFilter, // ← tambahkan di deps
        users,
        regions,
        owners,
        kategoris,
        search,
        userFilter,
        regionFilter,
        ownerFilter,
        categoryFilter,
        sortBy,
        sortDirection,
    ]);

    const pages = pageSize === 'all' ? 1 : Math.ceil(filtered.length / pageSize);

    const displayed = useMemo(() => {
        if (pageSize === 'all') return filtered;
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

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
        if (sortBy === col) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortBy(col);
            setSortDirection('asc');
        }
    };

    const maxButtons = 5;
    const goToPage = (p: number) => setCurrentPage(p);

    const visiblePages = useMemo(() => {
        const total = pages;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;

        if (end > total) {
            end = total;
            start = Math.max(1, end - maxButtons + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [currentPage, pages]);

    // State untuk menyimpan ID geojson yang dipilih
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
            setCurrentPage(1);
            setShowBulkModal(false);
        });
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

                {/* filters */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    {/* search */}
                    <input
                        type="text"
                        placeholder="Cari..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <select
                        value={sourceFilter}
                        onChange={(e) => {
                            setSourceFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border bg-white px-3 py-2 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Semua Source</option>
                        {Array.from(new Set(geojsons.map((g) => g.source_name))).map((src) => (
                            <option key={src} value={src}>
                                {src}
                            </option>
                        ))}
                    </select>

                    {/* user */}
                    <select
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Semua User</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>

                    {/* region */}
                    <select
                        value={regionFilter}
                        onChange={(e) => {
                            setRegionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Semua Region</option>
                        {regions.map((r) => (
                            <option key={r.id_region} value={r.id_region}>
                                {r.name}
                            </option>
                        ))}
                    </select>

                    {/* owner */}
                    <select
                        value={ownerFilter}
                        onChange={(e) => {
                            setOwnerFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Semua Owner</option>
                        {owners.map((o) => (
                            <option key={o.id_owner} value={o.id_owner}>
                                {o.name}
                            </option>
                        ))}
                    </select>
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
                                            checked={displayed.length > 0 && displayed.every((g) => selectedIds.includes(g.id_geojson))}
                                            onChange={(e) =>
                                                toggleSelectAll(
                                                    e.target.checked,
                                                    displayed.map((g) => g.id_geojson),
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
                                            setCurrentPage(1);
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
                            {displayed.map((g, i) => {
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
                                                    {(currentPage - 1) * (pageSize === 'all' ? filtered.length : pageSize) + i + 1}
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
                        const g = displayed.find((item) => item.id_geojson === detailKategoriId);
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
                        disabled={currentPage === pages}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        Next ›
                    </button>

                    {/* Last */}
                    <button
                        onClick={() => goToPage(pages)}
                        disabled={currentPage === pages}
                        className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                    >
                        Last »
                    </button>
                </div>
                {showBulkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="mx-4 flex max-h-[100vh] w-full flex-col rounded bg-white p-3 shadow-lg sm:mx-auto sm:max-w-3xl lg:max-w-5xl">
                            <h2 className="mb-4 text-xl font-semibold">Konfirmasi Hapus</h2>
                            <div className="mb-2 text-sm text-gray-700">
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered
                                            .filter((g) => selectedIds.includes(g.id_geojson))
                                            .map((g: Geojson) => {
                                                const nomor = filtered.findIndex((item) => item.id_geojson === g.id_geojson) + 1;
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
