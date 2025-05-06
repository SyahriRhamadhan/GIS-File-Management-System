import Modal from '@/components/Modal';
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
    nama_kategori?: string;
    ket_warna?: string;
}

interface Kategori {
    id_kategori: number;
    nama_kategori: string;
    kode_warna: string;
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

    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState<number | string>('');
    const [regionFilter, setRegionFilter] = useState<number | string>('');
    const [ownerFilter, setOwnerFilter] = useState<number | string>('');
    const [categoryFilter, setCategoryFilter] = useState<number | string>(''); // ← new
    const [sortBy, setSortBy] = useState<keyof Geojson>('source_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGeojson, setSelectedGeojson] = useState<Geojson | null>(null);

    // Apply all four filters
    const filtered = useMemo(() => {
        return geojsons
            .filter(
                (g) =>
                    (!search || g.source_name.toLowerCase().includes(search.toLowerCase())) &&
                    (!userFilter || g.id_user === +userFilter) &&
                    (!regionFilter || g.id_region === +regionFilter) &&
                    (!ownerFilter || g.id_owner === +ownerFilter) &&
                    (!categoryFilter || g.id_kategori === +categoryFilter),
            )
            .sort((a, b) => {
                const aVal = (a[sortBy] ?? '').toString().toLowerCase();
                const bVal = (b[sortBy] ?? '').toString().toLowerCase();
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [geojsons, search, userFilter, regionFilter, ownerFilter, categoryFilter, sortBy, sortDirection]);

    const pages = Math.ceil(filtered.length / perPage);
    const displayed = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, currentPage]);

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
                </div>

                {/* filters */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    {/* search */}
                    <input
                        type="text"
                        placeholder="Cari source name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />

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

                    {/* ** kategori ** */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Semua Kategori</option>
                        {kategoris.map((k) => (
                            <option key={k.id_kategori} value={k.id_kategori}>
                                {k.nama_kategori}
                            </option>
                        ))}
                    </select>
                </div>

                {/* table */}
                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[800px] border text-sm">
                        <thead className="bg-gray-100">
                            <tr className="dark:bg-gray-700">
                                <th className="border px-4 py-2">#</th>
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
                            {displayed.map((g, i) => (
                                <tr key={g.id_geojson} className="bg-white even:bg-gray-50 dark:bg-gray-800 dark:even:bg-gray-700">
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + i + 1}</td>
                                    <td className="border px-4 py-2">{g.source_name}</td>
                                    <td className="border px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-4 flex-shrink-0 rounded" style={{ backgroundColor: g.kode_warna ?? '#000' }} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{g.nama_kategori}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{g.kode_warna}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border px-4 py-2">{users.find((u) => u.id === g.id_user)?.name}</td>
                                    <td className="border px-4 py-2">{regions.find((r) => r.id_region === g.id_region)?.name ?? '-'}</td>
                                    <td className="border px-4 py-2">{owners.find((o) => o.id_owner === g.id_owner)?.name ?? '-'}</td>
                                    <td className="flex justify-center gap-1 border px-4 py-2">
                                        <button onClick={() => handleView(g)} className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600">
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
                            ))}
                        </tbody>
                    </table>
                </div>

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
            </div>

            {isModalOpen && selectedGeojson && <Modal geojson={selectedGeojson} onClose={() => setIsModalOpen(false)} />}
        </AppLayout>
    );
}
