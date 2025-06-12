import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
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

type Geojson = {
    id_geojson: number;
    source_name?: string;
    region?: { name: string } | null;
    owner?: { name: string } | null;
    reports?: Report[];
};

type Props = {
    geojsons: Geojson[];
};

export default function ViewPdfGeojson({ geojsons }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'PDF', href: '/dashboard/view-pdf' },
                { title: 'View PDF', href: '' },
            ]}
        >
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-[#1656b9]">Daftar GeoJSON & PDF</h1>
                <div className="space-y-8">
                    {geojsons.length === 0 ? (
                        <div className="rounded-lg border bg-white py-12 text-center text-gray-400 shadow">Tidak ada data GeoJSON.</div>
                    ) : (
                        geojsons.map((item) => (
                            <div
                                key={item.id_geojson}
                                className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-[#f6f8fa] to-[#f5f5f9] p-6 shadow-sm transition hover:shadow-lg"
                            >
                                {/* Header */}
                                <div className="mb-3 flex flex-col gap-2 border-b border-[#e5e7eb] pb-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="mb-1 text-xl font-semibold text-[#1656b9]">{item.source_name || 'Tanpa Nama'}</div>
                                        <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500">
                                            <span className="inline-flex items-center rounded border border-[#dae1e7] bg-[#f5f7fa] px-2 py-0.5">
                                                <span className="mr-1">Wilayah:</span> {item.region?.name || '-'}
                                            </span>
                                            <span className="inline-flex items-center rounded border border-[#dae1e7] bg-[#f5f7fa] px-2 py-0.5">
                                                <span className="mr-1">Pemilik:</span> {item.owner?.name || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/geojson/${item.id_geojson}/view`}
                                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#ebe129] bg-[#f9f9e6] px-4 py-2 font-semibold text-[#393e41] transition hover:bg-[#ebe129] md:mt-0"
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        title="Lihat GeoJSON"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="mr-1 h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="#393e41"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                        Lihat GeoJSON
                                    </Link>
                                </div>

                                {/* List PDF */}
                                <div>
                                    <div className="mb-2 font-medium text-[#393e41]">PDF Terkait:</div>
                                    {item.reports && item.reports.length > 0 ? (
                                        <ul className="space-y-2">
                                            {item.reports.map((pdf) => (
                                                <li
                                                    key={pdf.id}
                                                    className="flex flex-col rounded-lg border border-[#f1f2f4] bg-[#fcfcfc] p-3 hover:bg-[#f5f7fa] md:flex-row md:items-center md:gap-3"
                                                >
                                                    <a
                                                        href={pdf.file_path.startsWith('http') ? pdf.file_path : `/storage/${pdf.file_path}`}
                                                        className="inline-flex items-center gap-2 font-semibold text-[#e64b33] hover:text-[#c22c10]"
                                                        target="_blank"
                                                        rel="noreferrer noopener"
                                                        title="Lihat PDF"
                                                    >
                                                        <FaFilePdf className="mr-1 text-lg text-[#e64b33]" />
                                                        {pdf.nomor ?? 'PDF'}
                                                        {pdf.hal && <span className="ml-1 text-xs font-normal text-gray-500">({pdf.hal})</span>}
                                                    </a>
                                                    <span className="ml-0 text-xs text-gray-500 md:ml-2">
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
                                                            <span className="inline-block rounded border border-[#eee] bg-[#f8fafb] px-2 py-0.5 text-xs text-[#777]">
                                                                {pdf.sifat}
                                                            </span>
                                                        )}
                                                        {pdf.kepada && (
                                                            <span className="inline-block rounded border border-[#eee] bg-[#f8fafb] px-2 py-0.5 text-xs text-[#777]">
                                                                Kepada: {pdf.kepada}
                                                            </span>
                                                        )}
                                                        {pdf.description && (
                                                            <span className="inline-block rounded border border-[#f1e4c9] bg-[#f9f3ea] px-2 py-0.5 text-xs text-[#9f6118]">
                                                                {pdf.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="rounded border border-[#e7e9ef] bg-[#f8f9fb] px-3 py-2 text-sm text-gray-400">
                                            Belum ada PDF terkait.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
