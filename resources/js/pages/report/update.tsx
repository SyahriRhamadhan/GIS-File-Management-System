import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function UpdateReport() {
    const { report, geojsons } = usePage<{
        report: {
            id_report: number;
            id_geojson: number;
            file_path: string;
            description: string;
            nomor: string;
            sifat: string;
            hal: string;
            kepada: string;
        };
        geojsons: { id_geojson: number; source_name?: string }[];
    }>().props;

    const { data, setData, put, processing, errors } = useForm({
        id_geojson: String(report.id_geojson ?? ''),
        file_path: null as File | null,
        description: report.description ?? '',
        nomor: report.nomor ?? '',
        sifat: report.sifat ?? 'Biasa',
        hal: report.hal ?? '',
        kepada: report.kepada ?? '',
    });

    useEffect(() => {
        setData('id_geojson', String(report.id_geojson ?? ''));
        setData('file_path', null);
        setData('description', report.description ?? '');
        setData('nomor', report.nomor ?? '');
        setData('sifat', report.sifat ?? 'Biasa');
        setData('hal', report.hal ?? '');
        setData('kepada', report.kepada ?? '');
    }, [report.id_report]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        console.log('Form data:', data);
        put(route('dashboard.report.update', report.id_report), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Laporan berhasil diperbarui!');
            },
            onError: () => toast.error('Gagal memperbarui laporan'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Laporan', href: '/dashboard/tambah-pdf' },
                { title: 'Edit Laporan', href: `/dashboard/tambah-pdf/${report.id_report}/edit` },
            ]}
        >
            <Head title="Update Laporan PDF" />
            <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6">
                <h1 className="mb-4 text-2xl font-bold">Edit Laporan PDF</h1>
                <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Riwayat Sebelumnya</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div><span className="font-medium">Nomor:</span> {report.nomor || '-'}</div>
                        <div><span className="font-medium">Sifat:</span> {report.sifat || '-'}</div>
                        <div><span className="font-medium">Hal:</span> {report.hal || '-'}</div>
                        <div><span className="font-medium">Kepada:</span> {report.kepada || '-'}</div>
                        <div className="md:col-span-2"><span className="font-medium">Deskripsi:</span> {report.description || '-'}</div>
                        <div className="md:col-span-2">
                            <span className="font-medium">File PDF:</span>{' '}
                            {report.file_path ? (
                                <a
                                    href={`/storage/${report.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-700"
                                >
                                    {report.file_path.split('/').pop()}
                                </a>
                            ) : (
                                '-'
                            )}
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label htmlFor="geojson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GeoJSON</label>
                            <select
                                id="geojson"
                                name="id_geojson"
                                value={data.id_geojson}
                                onChange={e => setData('id_geojson', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                required
                            >
                                <option value="">Pilih GeoJSON</option>
                                {geojsons.map(g => (
                                    <option key={g.id_geojson} value={g.id_geojson}>{g.source_name || `Geojson ${g.id_geojson}`}</option>
                                ))}
                            </select>
                            {errors.id_geojson && <div className="text-sm text-red-500">{errors.id_geojson}</div>}
                        </div>

                        <div>
                            <label htmlFor="nomor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor</label>
                            <input
                                id="nomor"
                                name="nomor"
                                type="text"
                                value={data.nomor}
                                onChange={e => setData('nomor', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder={`Sebelumnya: ${report.nomor || ''}`}
                                required
                            />
                            {errors.nomor && <div className="text-sm text-red-500">{errors.nomor}</div>}
                        </div>

                        <div>
                            <label htmlFor="sifat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sifat</label>
                            <select
                                id="sifat"
                                name="sifat"
                                value={data.sifat}
                                onChange={e => setData('sifat', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                required
                            >
                                <option value="Biasa">Biasa</option>
                                <option value="Segera">Segera</option>
                                <option value="Rahasia">Rahasia</option>
                            </select>
                            {errors.sifat && <div className="text-sm text-red-500">{errors.sifat}</div>}
                        </div>

                        <div>
                            <label htmlFor="hal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hal</label>
                            <input
                                id="hal"
                                name="hal"
                                type="text"
                                value={data.hal}
                                onChange={e => setData('hal', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder={`Sebelumnya: ${report.hal || ''}`}
                                required
                            />
                            {errors.hal && <div className="text-sm text-red-500">{errors.hal}</div>}
                        </div>

                        <div>
                            <label htmlFor="kepada" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kepada</label>
                            <input
                                id="kepada"
                                name="kepada"
                                type="text"
                                value={data.kepada}
                                onChange={e => setData('kepada', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder={`Sebelumnya: ${report.kepada || ''}`}
                                required
                            />
                            {errors.kepada && <div className="text-sm text-red-500">{errors.kepada}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder={`Sebelumnya: ${report.description || ''}`}
                                rows={4}
                            />
                            {errors.description && <div className="text-sm text-red-500">{errors.description}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="file_path" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                File PDF (opsional, kosongkan jika tidak ingin mengganti)
                            </label>
                            <input
                                id="file_path"
                                name="file_path"
                                type="file"
                                accept="application/pdf"
                                onChange={e => setData('file_path', e.target.files ? e.target.files[0] : null)}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            {report.file_path ? (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    File sebelumnya:{' '}
                                    <a
                                        href={`/storage/${report.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-700"
                                    >
                                        {report.file_path.split('/').pop()}
                                    </a>
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-gray-500">Tidak ada file sebelumnya</div>
                            )}
                            {errors.file_path && <div className="text-sm text-red-500">{errors.file_path}</div>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" disabled={processing}>
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
