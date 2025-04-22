import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

interface Geojson {
    id_geojson: number;
    source_name: string;
    geojson: any;
    id_user: number;
    id_region?: number;
    id_owner?: number;
}

import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    geojsons: Geojson[];
    users: { id: number; name: string }[];
    regions: { id_region: number; name: string }[];
    owners: { id_owner: number; name: string }[];
    flash?: { success?: string; error?: string };
}

export default function GeojsonIndex() {
    const { geojsons, users, regions, owners, flash } = usePage<PageProps>().props;

    // toast flash
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // search / filters
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState<number | string>('');
    const [regionFilter, setRegionFilter] = useState<number | string>('');
    const [ownerFilter, setOwnerFilter] = useState<number | string>('');

    const [sortBy, setSortBy] = useState<keyof Geojson>('source_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const filtered = useMemo(() => {
        return geojsons
            .filter(
                (g) =>
                    (!search || g.source_name.toLowerCase().includes(search.toLowerCase())) &&
                    (!userFilter || g.id_user === +userFilter) &&
                    (!regionFilter || g.id_region === +regionFilter) &&
                    (!ownerFilter || g.id_owner === +ownerFilter),
            )
            .sort((a, b) => {
                const aVal = (a[sortBy] ?? '').toString().toLowerCase();
                const bVal = (b[sortBy] ?? '').toString().toLowerCase();
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [geojsons, search, userFilter, regionFilter, ownerFilter, sortBy, sortDirection]);

    // paginate
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;
    const pages = Math.ceil(filtered.length / perPage);
    const displayed = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, currentPage]);

    // utils
    const toggleSort = (col: keyof Geojson) => {
        if (sortBy === col) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortBy(col);
            setSortDirection('asc');
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin hapus data ini?')) return;
        router.delete(`/dashboard/geojson/${id}`, {
            onSuccess: () => toast.success('GeoJSON berhasil dihapus'),
            onError: () => toast.error('Gagal menghapus GeoJSON'),
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

            <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Daftar GeoJSON</h1>
                    <Link href="/dashboard/geojson/create" className="rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700">
                        + Tambah GeoJSON
                    </Link>
                </div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari source name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-md rounded border px-3 py-2 shadow-sm"
                    />

                    <select
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm"
                    >
                        <option value="">Semua User</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={regionFilter}
                        onChange={(e) => {
                            setRegionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm"
                    >
                        <option value="">Semua Region</option>
                        {regions.map((r) => (
                            <option key={r.id_region} value={r.id_region}>
                                {r.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={ownerFilter}
                        onChange={(e) => {
                            setOwnerFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm"
                    >
                        <option value="">Semua Owner</option>
                        {owners.map((o) => (
                            <option key={o.id_owner} value={o.id_owner}>
                                {o.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[800px] border text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border px-4 py-2">#</th>
                                <th className="cursor-pointer border px-4 py-2" onClick={() => toggleSort('source_name')}>
                                    Source {sortBy === 'source_name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="border px-4 py-2">User</th>
                                <th className="border px-4 py-2">Region</th>
                                <th className="border px-4 py-2">Owner</th>
                                <th className="border px-4 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((g, i) => (
                                <tr key={g.id_geojson}>
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + i + 1}</td>
                                    <td className="border px-4 py-2">{g.source_name}</td>
                                    <td className="border px-4 py-2">{users.find((u) => u.id === g.id_user)?.name}</td>
                                    <td className="border px-4 py-2">{regions.find((r) => r.id_region === g.id_region)?.name ?? '-'}</td>
                                    <td className="border px-4 py-2">{owners.find((o) => o.id_owner === g.id_owner)?.name ?? '-'}</td>
                                    <td className="flex justify-center gap-1 border px-4 py-2">
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
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`rounded border px-3 py-1 text-sm ${currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
