import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type Region = {
    id_region: number;
    name: string;
};

type Kategori = {
    id_kategori: number;
    orde0: string;
    orde1?: string;
    orde2?: string;
    orde3?: string;
    orde4?: string;
};

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
        region?: Region;
        kategori?: Kategori;
    };
};

export default function ReportIndex() {
    const { reports, regions, kategoris, flash } = usePage<{ 
        reports: Report[]; 
        regions: Region[];
        kategoris: Kategori[];
        flash?: { success?: string; error?: string } 
    }>().props;

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('nomor');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    // Filter states
    const [sifatFilter, setSifatFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const filteredReports = useMemo(() => {
        let data = [...reports];
        
        // Search filter
        if (search) {
            data = data.filter(
                (item) =>
                    item.nomor.toLowerCase().includes(search.toLowerCase()) ||
                    item.hal.toLowerCase().includes(search.toLowerCase()) ||
                    item.kepada.toLowerCase().includes(search.toLowerCase()),
            );
        }

        // Sifat filter
        if (sifatFilter) {
            data = data.filter((item) => item.sifat === sifatFilter);
        }

        // Region filter
        if (regionFilter) {
            data = data.filter((item) => item.geojson?.region?.id_region.toString() === regionFilter);
        }

        // Kategori filter
        if (kategoriFilter) {
            data = data.filter((item) => item.geojson?.kategori?.id_kategori.toString() === kategoriFilter);
        }

        data.sort((a, b) => {
            const aVal = (a as any)[sortBy]?.toString().toLowerCase();
            const bVal = (b as any)[sortBy]?.toString().toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [reports, search, sifatFilter, regionFilter, kategoriFilter, sortBy, sortDirection]);

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
            router.delete(`/dashboard/tambah-pdf/${selectedId}`, {
                onSuccess: () => {
                    toast.success('Laporan berhasil dihapus!');
                    setShowConfirm(false);
                    setSelectedId(null);
                    router.reload({ only: ['reports'] });
                },
                onError: () => toast.error('Gagal menghapus laporan'),
            });
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, sifatFilter, regionFilter, kategoriFilter]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Get unique sifat values
    const uniqueSifat = useMemo(() => {
        const sifatSet = new Set(reports.map(report => report.sifat));
        return Array.from(sifatSet).sort();
    }, [reports]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Laporan', href: '/dashboard/report' },
            ]}
        >
            <Head title="Laporan" />
            <div className="p-6">
                {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Daftar Laporan</h1>
                    <Link
                        href="/dashboard/tambah-pdf/create"
                        className="inline-block rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                    >
                        + Tambah Laporan
                    </Link>
                </div> */}

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari nomor/hal/kepada..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    />
                </div>

                {/* Filter Section */}
                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {/* Sifat Filter */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter Sifat
                        </label>
                        <select
                            value={sifatFilter}
                            onChange={(e) => setSifatFilter(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm shadow-sm dark:bg-gray-800"
                        >
                            <option value="">Semua Sifat</option>
                            {uniqueSifat.map((sifat) => (
                                <option key={sifat} value={sifat}>
                                    {sifat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Region Filter */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter Region
                        </label>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm shadow-sm dark:bg-gray-800"
                        >
                            <option value="">Semua Region</option>
                            {regions.map((region) => (
                                <option key={region.id_region} value={region.id_region.toString()}>
                                    {region.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Kategori Filter */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter Kategori
                        </label>
                        <select
                            value={kategoriFilter}
                            onChange={(e) => setKategoriFilter(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm shadow-sm dark:bg-gray-800"
                        >
                            <option value="">Semua Kategori</option>
                            {kategoris.map((kategori) => (
                                <option key={kategori.id_kategori} value={kategori.id_kategori.toString()}>
                                    {kategori.orde0} {kategori.orde1 ? `/ ${kategori.orde1}` : ''} {kategori.orde2 ? `/ ${kategori.orde2}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSifatFilter('');
                                setRegionFilter('');
                                setKategoriFilter('');
                                setSearch('');
                            }}
                            className="w-full rounded bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600"
                        >
                            Reset Filter
                        </button>
                    </div>
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
                                <th className="border px-4 py-2 text-left">Region</th>
                                <th className="border px-4 py-2 text-left">Kategori</th>
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
                                        <td className="border px-4 py-2">{report.geojson?.region?.name ?? '-'}</td>
                                        <td className="border px-4 py-2">
                                            {report.geojson?.kategori ? 
                                                `${report.geojson.kategori.orde0}${report.geojson.kategori.orde1 ? ` / ${report.geojson.kategori.orde1}` : ''}` 
                                                : '-'
                                            }
                                        </td>
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
                                            {report.geojson?.id_geojson ? (
                                                <Link
                                                    href={`/dashboard/geojson/${report.geojson.id_geojson}/edit`}
                                                    className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                                                >
                                                    View GeoJSON
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/dashboard/tambah-pdf/${report.id_report}/edit`}
                                                    className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
                                                >
                                                    Tambah GeoJSON
                                                </Link>
                                            )}
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
