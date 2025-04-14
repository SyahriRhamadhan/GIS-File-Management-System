import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';
import toast from 'react-hot-toast';

type Geojson = {
    id_geojson: number;
    source_name?: string;
};

export default function CreateReport() {
    const { geojsons } = usePage<{ geojsons: Geojson[] }>().props;

    const { data, setData, post, processing, errors, transform } = useForm({
        id_geojson: '',
        file_path: null as File | null,
        description: '',
        nomor: '',
        sifat: 'Biasa',
        hal: '',
        kepada: '',
    });

    transform((data) => {
        const formData = new FormData();
        formData.append('id_geojson', data.id_geojson);
        formData.append('file_path', data.file_path!);
        formData.append('description', data.description ?? '');
        formData.append('nomor', data.nomor);
        formData.append('sifat', data.sifat);
        formData.append('hal', data.hal);
        formData.append('kepada', data.kepada);
        return formData;
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('dashboard.report.store'), {
            onSuccess: () => toast.success('Laporan berhasil ditambahkan!'),
            onError: () => toast.error('Gagal menambahkan laporan'),
        });
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setData('file_path', file);
        } else {
            toast.error('Hanya file PDF yang diperbolehkan.');
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Laporan', href: '/dashboard/tambah-pdf' },
                { title: 'Tambah Laporan', href: '#' },
            ]}
        >
            <Head title="Tambah Laporan" />
            <div className="mx-auto w-full max-w-screen-lg px-4 py-6 md:px-6">
                <h1 className="mb-2 text-2xl font-bold">Tambah Laporan</h1>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Lengkapi data laporan di bawah ini secara detail dan benar.</p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Surat</label>
                        <input
                            type="text"
                            value={data.nomor}
                            onChange={(e) => setData('nomor', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.nomor ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.nomor && <p className="mt-1 text-sm text-red-500">{errors.nomor}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sifat Surat</label>
                        <select
                            value={data.sifat}
                            onChange={(e) => setData('sifat', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.sifat ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        >
                            <option value="Biasa">Biasa</option>
                            <option value="Penting">Penting</option>
                            <option value="Rahasia">Rahasia</option>
                            <option value="Rahasia">Segera</option>
                        </select>
                        {errors.sifat && <p className="mt-1 text-sm text-red-500">{errors.sifat}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hal</label>
                        <input
                            type="text"
                            value={data.hal}
                            onChange={(e) => setData('hal', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.hal ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.hal && <p className="mt-1 text-sm text-red-500">{errors.hal}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kepada</label>
                        <input
                            type="text"
                            value={data.kepada}
                            onChange={(e) => setData('kepada', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.kepada ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.kepada && <p className="mt-1 text-sm text-red-500">{errors.kepada}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Geojson</label>
                        <select
                            value={data.id_geojson}
                            onChange={(e) => setData('id_geojson', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.id_geojson ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        >
                            <option value="">-- Pilih Geojson --</option>
                            {geojsons.map((g) => (
                                <option key={g.id_geojson} value={g.id_geojson}>
                                    {g.source_name ?? `Geojson ID ${g.id_geojson}`}
                                </option>
                            ))}
                        </select>
                        {errors.id_geojson && <p className="mt-1 text-sm text-red-500">{errors.id_geojson}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Upload File PDF</label>

                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={handleFileClick}
                            className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-10 transition-all duration-200 ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800'} ${errors.file_path ? 'border-red-500' : ''} `}
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {data.file_path
                                    ? typeof data.file_path === 'string'
                                        ? data.file_path
                                        : data.file_path.name
                                    : 'Seret dan lepas PDF di sini atau klik untuk memilih'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Format: PDF, maksimal 2MB</p>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setData('file_path', e.target.files?.[0] ?? null)}
                                ref={fileInputRef}
                                className="hidden"
                            />
                        </div>

                        {errors.file_path && <p className="mt-1 text-sm text-red-500">{errors.file_path}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.description ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 md:col-span-2">
                        <button
                            type="button"
                            onClick={() => history.back()}
                            className="rounded-md bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400 dark:bg-gray-700 dark:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
