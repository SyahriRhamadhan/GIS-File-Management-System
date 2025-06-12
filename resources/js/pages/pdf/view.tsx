import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';

type Report = {
    id: number;
    file_path: string;
    nomor?: string;
    sifat?: string;
    hal?: string;
    kepada?: string;
    description?: string;
    created_at?: string;
};

type ReportsPaginator = {
    data: Report[];
    current_page: number;
    last_page: number;
    per_page: number | string;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Geojson = {
    id_geojson: number;
    source_name?: string;
    region?: { name: string } | null;
    owner?: { name: string } | null;
    reports?: ReportsPaginator;
};

type Props = {
    geojsons: Geojson[];
};

const PER_PAGE_OPTIONS = [
    { label: '10', value: 10 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'All', value: 'all' },
];

export default function ViewPdfGeojson({ geojsons }: Props) {
    const [open, setOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const geojson = geojsons[0]; // satu geojson saja sesuai controller
    const reports = geojson?.reports;

    // Pagination handler
    const handlePageChange = (page: number | string) => {
        router.get(
            `/dashboard/geojson/${geojson.id_geojson}/view`,
            { page, per_page: reports?.per_page },
            { preserveScroll: true, preserveState: true },
        );
    };

    // Change per page
    const handlePerPageChange = (perPage: number | string) => {
        router.get(`/dashboard/geojson/${geojson.id_geojson}/view`, { per_page: perPage }, { preserveScroll: true, preserveState: true });
    };

    // PDF preview modal handler
    const handlePreview = (url: string) => {
        setPdfUrl(url);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setPdfUrl(null);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'PDF', href: '/dashboard/view-pdf' },
                { title: 'View PDF', href: '' },
            ]}
        >
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-[#1656b9] dark:text-[#ffffff]">Daftar GeoJSON & PDF</h1>
                {!geojson ? (
                    <div className="rounded-lg border bg-white py-12 text-center text-gray-400 shadow dark:border-[#232329] dark:bg-[#18181b] dark:text-gray-500">
                        Tidak ada data GeoJSON.
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-[#f6f8fa] to-[#f5f5f9] p-6 shadow-sm transition hover:shadow-lg dark:border-[#232329] dark:from-[#191920] dark:via-[#16161a] dark:to-[#232329]">
                        {/* Header */}
                        <div className="mb-3 flex flex-col gap-2 border-b border-[#e5e7eb] pb-2 md:flex-row md:items-center md:justify-between dark:border-[#29292f]">
                            <div>
                                <div className="mb-1 text-xl font-semibold text-[#1656b9] dark:text-[#ffffff]">
                                    {geojson.source_name || 'Tanpa Nama'}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500 dark:text-gray-300">
                                    <span className="inline-flex items-center rounded border border-[#dae1e7] bg-[#f5f7fa] px-2 py-0.5 dark:border-[#29292f] dark:bg-[#232329]">
                                        <span className="mr-1">Wilayah:</span> {geojson.region?.name || '-'}
                                    </span>
                                    <span className="inline-flex items-center rounded border border-[#dae1e7] bg-[#f5f7fa] px-2 py-0.5 dark:border-[#29292f] dark:bg-[#232329]">
                                        <span className="mr-1">Pemilik:</span> {geojson.owner?.name || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Per page selector & Table Info */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm text-gray-700 dark:text-gray-200">
                                Total: <b>{reports?.total ?? 0}</b> PDF
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-300">Tampilkan</span>
                                <select
                                    value={reports?.per_page}
                                    onChange={(e) => handlePerPageChange(e.target.value)}
                                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 transition-colors dark:border-[#232329] dark:bg-[#18181b] dark:text-gray-100"
                                >
                                    {PER_PAGE_OPTIONS.map((opt) => (
                                        <option value={opt.value} key={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* List PDF */}
                        <div>
                            <div className="mb-2 font-medium text-[#393e41] dark:text-[#fdfdfd]">PDF Terkait:</div>
                            {reports && reports.data.length > 0 ? (
                                <ul className="space-y-2">
                                    {reports.data.map((pdf) => (
                                        <li
                                            key={pdf.id}
                                            className="flex flex-col rounded-lg border border-[#f1f2f4] bg-[#fcfcfc] p-3 hover:bg-[#f5f7fa] md:flex-row md:items-center md:gap-3 dark:border-[#232329] dark:bg-[#18181b] dark:hover:bg-[#232329]"
                                        >
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePreview(pdf.file_path.startsWith('http') ? pdf.file_path : `/storage/${pdf.file_path}`);
                                                }}
                                                className="dark:text-white-400 inline-flex items-center gap-2 font-semibold text-[#e64b33] hover:text-[#c22c10] dark:hover:text-yellow-200"
                                                title="Preview PDF"
                                            >
                                                <FaFilePdf className="mr-1 text-lg text-[#e64b33]" />
                                                {pdf.nomor ?? 'PDF'}
                                                {pdf.hal && (
                                                    <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-300">({pdf.hal})</span>
                                                )}
                                                <span className="ml-2 rounded border border-[#e8e8d9] bg-[#f5f7fa] px-2 py-0.5 text-xs text-[#393e41] dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-200">
                                                    Preview
                                                </span>
                                            </a>
                                            <span className="ml-0 text-xs text-gray-500 md:ml-2 dark:text-gray-300">
                                                {pdf.created_at
                                                    ? new Date(pdf.created_at).toLocaleDateString('id-ID', {
                                                          day: 'numeric',
                                                          month: 'long',
                                                          year: 'numeric',
                                                      })
                                                    : ''}
                                            </span>
                                            {/* Badge untuk sifat, kepada, description */}
                                            <div className="mt-1 flex flex-wrap gap-2 md:mt-0 md:ml-auto">
                                                {pdf.sifat && (
                                                    <span className="inline-block rounded border border-[#eee] bg-[#f8fafb] px-2 py-0.5 text-xs text-[#777] dark:border-[#29292f] dark:bg-[#232329] dark:text-gray-300">
                                                        {pdf.sifat}
                                                    </span>
                                                )}
                                                {pdf.kepada && (
                                                    <span className="inline-block rounded border border-[#eee] bg-[#f8fafb] px-2 py-0.5 text-xs text-[#777] dark:border-[#29292f] dark:bg-[#232329] dark:text-gray-300">
                                                        Kepada: {pdf.kepada}
                                                    </span>
                                                )}
                                                {pdf.description && (
                                                    <span className="inline-block rounded border border-[#f1e4c9] bg-[#f9f3ea] px-2 py-0.5 text-xs text-[#9f6118] dark:border-yellow-900 dark:bg-[#29292f] dark:text-yellow-300">
                                                        {pdf.description}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="rounded border border-[#e7e9ef] bg-[#f8f9fb] px-3 py-2 text-sm text-gray-400 dark:border-[#232329] dark:bg-[#18181b] dark:text-gray-500">
                                    Belum ada PDF terkait.
                                </div>
                            )}
                        </div>
                        {/* Pagination Controls */}
                        {reports && reports.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    disabled={!reports.prev_page_url}
                                    className="rounded border bg-white px-3 py-1 text-sm font-medium hover:bg-[#f1f2f4] disabled:opacity-50 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-200 dark:hover:bg-[#29292f]"
                                    onClick={() => handlePageChange(reports.current_page - 1)}
                                >
                                    &larr; Prev
                                </button>
                                {[...Array(reports.last_page)].map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`rounded border px-3 py-1 text-sm font-medium ${
                                            reports.current_page === idx + 1
                                                ? 'bg-[#ebe129] text-[#393e41] dark:bg-yellow-400 dark:text-[#18181b]'
                                                : 'bg-white hover:bg-[#f1f2f4] dark:bg-[#232329] dark:text-gray-200 dark:hover:bg-[#29292f]'
                                        }`}
                                        onClick={() => handlePageChange(idx + 1)}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={!reports.next_page_url}
                                    className="rounded border bg-white px-3 py-1 text-sm font-medium hover:bg-[#f1f2f4] disabled:opacity-50 dark:border-[#393e41] dark:bg-[#232329] dark:text-gray-200 dark:hover:bg-[#29292f]"
                                    onClick={() => handlePageChange(reports.current_page + 1)}
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        )}
                        {/* Modal Preview PDF */}
                        {open && pdfUrl && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg dark:bg-[#18181b]">
                                    <button
                                        className="absolute top-2 right-2 rounded-full bg-[#ebe129] px-2 py-1 font-bold text-[#393e41] hover:bg-yellow-500"
                                        onClick={handleClose}
                                        title="Tutup"
                                    >
                                        ✕
                                    </button>
                                    <iframe src={pdfUrl} title="Preview PDF" className="h-[80vh] w-[90vw] max-w-2xl" style={{ border: 'none' }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
