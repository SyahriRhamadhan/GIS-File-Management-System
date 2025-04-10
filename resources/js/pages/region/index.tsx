import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast'; // 🔥 Import toast

export default function RegionIndex() {
    const { props } = usePage<{
        regions: {
            id_region: number;
            name: string;
            link: string;
            detail: string;
            desa: string;
            kecamatan: string;
            kabupaten: string;
            provinsi: string;
        }[];
        flash?: { success?: string; error?: string };
    }>();
    const { regions, flash } = props;

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [kecamatanFilter, setKecamatanFilter] = useState('');
    const [desaFilter, setDesaFilter] = useState('');

    const filteredRegions = useMemo(() => {
        let data = [...regions];
        if (search) {
            data = data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (kecamatanFilter) {
            data = data.filter((item) => item.kecamatan === kecamatanFilter);
        }
        if (desaFilter) {
            data = data.filter((item) => item.desa === desaFilter);
        }
        data.sort((a, b) => {
            const aVal = (a as any)[sortBy]?.toString().toLowerCase();
            const bVal = (b as any)[sortBy]?.toString().toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [regions, search, kecamatanFilter, desaFilter, sortBy, sortDirection]);

    const toggleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const paginatedRegions = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        return filteredRegions.slice(start, end);
    }, [filteredRegions, currentPage]);

    const handleView = (id: number) => router.visit(`/dashboard/region/${id}`);
    const handleEdit = (id: number) => router.visit(`/dashboard/region/${id}/edit`);

    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const confirmDelete = (id: number) => {
        setSelectedId(id);
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (selectedId !== null) {
            router.delete(`/dashboard/region/${selectedId}`, {
                onSuccess: () => {
                    toast.success('Data berhasil dihapus!');
                    setShowConfirm(false);
                    setSelectedId(null);
                },
                onError: () => toast.error('Gagal menghapus data'),
            });
        }
    };

    const kecamatanOptions = useMemo(() => {
        const values = regions.map((r) => r.kecamatan);
        return [...new Set(values)].sort();
    }, [regions]);

    const desaOptions = useMemo(() => {
        const filtered = kecamatanFilter ? regions.filter((r) => r.kecamatan === kecamatanFilter) : regions;
        const values = filtered.map((r) => r.desa);
        return [...new Set(values)].sort();
    }, [regions, kecamatanFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, kecamatanFilter, desaFilter]);
    
    useEffect(() => {
        setDesaFilter('');
    }, [kecamatanFilter]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Region', href: '/dashboard/region' },
            ]}
        >
            <Head title="Region" />
            <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Daftar Wilayah</h1>
                    <Link
                        href={route('dashboard.region.create')}
                        className="inline-block rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                    >
                        + Tambah Wilayah
                    </Link>
                </div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari nama wilayah..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    />

                    <select
                        value={kecamatanFilter}
                        onChange={(e) => setKecamatanFilter(e.target.value)}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua Kecamatan</option>
                        {kecamatanOptions.map((kec) => (
                            <option key={kec} value={kec}>
                                {kec}
                            </option>
                        ))}
                    </select>

                    <select
                        value={desaFilter}
                        onChange={(e) => setDesaFilter(e.target.value)}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua Desa</option>
                        {desaOptions.map((desa) => (
                            <option key={desa} value={desa}>
                                {desa}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[800px] border text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="cursor-pointer border px-4 py-2 text-left" onClick={() => toggleSort('name')}>
                                    Nama {sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="border px-4 py-2 text-left">Provinsi</th>
                                <th className="border px-4 py-2 text-left">Kabupaten</th>
                                <th className="border px-4 py-2 text-left">Kecamatan</th>
                                <th className="border px-4 py-2 text-left">Desa</th>
                                <th className="border px-4 py-2 text-left">Link</th>
                                <th className="border px-4 py-2 text-left">Detail</th>
                                <th className="border px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRegions.map((region, index) => (
                                <tr key={region.id_region}>
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + index + 1}</td>
                                    <td className="border px-4 py-2">{region.name}</td>
                                    <td className="border px-4 py-2">{region.provinsi}</td>
                                    <td className="border px-4 py-2">{region.kabupaten}</td>
                                    <td className="border px-4 py-2">{region.kecamatan}</td>
                                    <td className="border px-4 py-2">{region.desa}</td>
                                    <td className="border px-4 py-2">
                                        <a href={region.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            Link
                                        </a>
                                    </td>
                                    <td className="border px-4 py-2">{region.detail}</td>
                                    <td className="flex flex-wrap items-center justify-center gap-1 border px-4 py-2">
                                        <button
                                            onClick={() => handleView(region.id_region)}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEdit(region.id_region)}
                                            className="rounded bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(region.id_region)}
                                            className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                                        >
                                            Delete
                                        </button>

                                        {showConfirm && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                                <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
                                                    <h2 className="mb-4 text-lg font-semibold">Konfirmasi</h2>
                                                    <p>Yakin ingin menghapus data ini?</p>
                                                    <div className="mx-auto mt-4 flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setShowConfirm(false)}
                                                            className="rounded bg-gray-300 px-3 py-1 dark:bg-gray-700"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button onClick={handleConfirmDelete} className="rounded bg-red-600 px-3 py-1 text-white">
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="my-4 flex flex-wrap items-center justify-center gap-2">
                        {Array.from({ length: Math.ceil(filteredRegions.length / perPage) }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`rounded border px-3 py-1 text-sm ${
                                    currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
