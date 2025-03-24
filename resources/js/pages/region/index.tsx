import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast'; // 🔥 Import toast

export default function RegionIndex() {
    const { props } = usePage<{
        regions: { id_region: number; name: string; type: string; link: string; alamat: string }[];
        flash?: { success?: string; error?: string };
    }>();
    const { regions, flash } = props;

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [typeFilter, setTypeFilter] = useState('');

    const filteredRegions = useMemo(() => {
        let data = [...regions];
        if (search) {
            data = data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (typeFilter) {
            data = data.filter((item) => item.type === typeFilter);
        }
        data.sort((a, b) => {
            const aVal = (a as any)[sortBy]?.toString().toLowerCase();
            const bVal = (b as any)[sortBy]?.toString().toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [regions, search, sortBy, sortDirection, typeFilter]);

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

    const handleView = (id: number) => {
        router.visit(`/dashboard/region/${id}`);
    };

    const handleEdit = (id: number) => {
        router.visit(`/dashboard/region/${id}/edit`);
    };

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
                onError: () => {
                    toast.error('Gagal menghapus data');
                },
            });
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter]);

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
                <h1 className="mb-4 text-2xl font-bold">Daftar Wilayah</h1>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full max-w-xs rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="provinsi">Provinsi</option>
                        <option value="kabupaten">Kabupaten</option>
                        <option value="kecamatan">Kecamatan</option>
                        <option value="desa">Desa</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Cari nama wilayah..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[600px] border text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="cursor-pointer border px-4 py-2 text-left" onClick={() => toggleSort('name')}>
                                    Nama {sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="cursor-pointer border px-4 py-2 text-left" onClick={() => toggleSort('type')}>
                                    Tipe {sortBy === 'type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="border px-4 py-2 text-left">Link</th>
                                <th className="border px-4 py-2 text-left">Alamat</th>
                                <th className="border px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRegions.map((region, index) => (
                                <tr key={region.id_region}>
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + index + 1}</td>
                                    <td className="border px-4 py-2">{region.name}</td>
                                    <td className="border px-4 py-2 capitalize">{region.type}</td>
                                    <td className="border px-4 py-2">{region.link}</td>
                                    <td className="border px-4 py-2">{region.alamat}</td>
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

                                        {/* Modal Sederhana */}
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
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
