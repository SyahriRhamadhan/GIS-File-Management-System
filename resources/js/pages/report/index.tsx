import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type Report = {
    id_report: number;
    id_geojson: number;
    file_path: string;
    description: string | null;
    nomor: string;
    sifat: string;
    hal: string;
    kepada: string;
    created_at: string;
    updated_at: string;
    geojson?: {
        id_geojson: number;
        source_name?: string;
    };
};

export default function ReportIndex() {
    const { reports, flash } = usePage<{ reports: Report[]; flash?: { success?: string; error?: string } }>().props;

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('nomor');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const filteredReports = useMemo(() => {
        let data = [...reports];
        if (search) {
            data = data.filter(
                (item) =>
                    item.nomor.toLowerCase().includes(search.toLowerCase()) ||
                    item.hal.toLowerCase().includes(search.toLowerCase()) ||
                    item.kepada.toLowerCase().includes(search.toLowerCase()),
            );
        }

        data.sort((a, b) => {
            const aVal = (a as any)[sortBy]?.toString().toLowerCase();
            const bVal = (b as any)[sortBy]?.toString().toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [reports, search, sortBy, sortDirection]);

    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        return filteredReports.slice(start, end);
    }, [filteredReports, currentPage]);

    const toggleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const confirmDelete = (id: number) => {
        setSelectedId(id);
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (selectedId !== null) {
            router.delete(`/dashboard/report/${selectedId}`, {
                onSuccess: () => {
                    toast.success('Laporan berhasil dihapus!');
                    setShowConfirm(false);
                    setSelectedId(null);
                },
                onError: () => toast.error('Gagal menghapus laporan'),
            });
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Laporan', href: '/dashboard/report' },
            ]}
        >
            <Head title="Laporan" />
            <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Daftar Laporan</h1>
                    <Link
                        href="/dashboard/tambah-pdf/create"
                        className="inline-block rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                    >
                        + Tambah Laporan
                    </Link>
                </div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari nomor/hal/kepada..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full min-w-[800px] border text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="cursor-pointer border px-4 py-2 text-left" onClick={() => toggleSort('nomor')}>
                                    Nomor {sortBy === 'nomor' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="border px-4 py-2 text-left">Sifat</th>
                                <th className="border px-4 py-2 text-left">Hal</th>
                                <th className="border px-4 py-2 text-left">Kepada</th>
                                <th className="border px-4 py-2 text-left">Geojson</th>
                                <th className="border px-4 py-2 text-left">PDF</th>
                                <th className="border px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReports.map((report, index) => {
                                console.log('Sebelumnya:', {
                                    nomor: report.nomor,
                                    sifat: report.sifat,
                                    hal: report.hal,
                                    kepada: report.kepada,
                                    deskripsi: report.description,
                                });
                                return (
                                    <tr key={report.id_report}>
                                        <td className="border px-4 py-2">{(currentPage - 1) * perPage + index + 1}</td>
                                        <td className="border px-4 py-2">{report.nomor}</td>
                                        <td className="border px-4 py-2">{report.sifat}</td>
                                        <td className="border px-4 py-2">{report.hal}</td>
                                        <td className="border px-4 py-2">{report.kepada}</td>
                                        <td className="border px-4 py-2">{report.geojson?.source_name ?? `Geojson ID ${report.id_geojson}`}</td>
                                        <td className="border px-4 py-2">
                                            <a
                                                href={`/storage/${report.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                Lihat PDF
                                            </a>
                                        </td>
                                        <td className="flex flex-wrap items-center justify-center gap-1 border px-4 py-2">
                                            <Link
                                                href={`/dashboard/tambah-pdf/${report.id_report}/edit`}
                                                className="rounded bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(report.id_report)}
                                                className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                            {showConfirm && selectedId === report.id_report && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                                    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
                                                        <h2 className="mb-4 text-lg font-semibold">Konfirmasi</h2>
                                                        <p>Yakin ingin menghapus laporan ini?</p>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="my-4 flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: Math.ceil(filteredReports.length / perPage) }, (_, i) => i + 1).map((page) => (
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
        </AppLayout>
    );
}
