import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface Kategori {
    id_kategori: number;
    nama_kategori: string;
    kode_warna: string;
    ket_warna?: string;
}

interface PageProps {
    kategori: Kategori;
    [key: string]: any;
}

export default function Edit() {
    const { kategori } = usePage<PageProps>().props;
    const { data, setData, put, processing, errors } = useForm({
        nama_kategori: kategori.nama_kategori,
        kode_warna: kategori.kode_warna,
        ket_warna: kategori.ket_warna || '',
    });

    const palette = ['#f7a1cc', '#34a853', '#ff6f61', '#4285f4', '#fbbc05'];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(`/dashboard/kategori/${kategori.id_kategori}`, {
            onSuccess: () => toast.success('Kategori diperbarui!'),
        });
    };

    // shared input classes
    const inputClasses =
        'mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kategori', href: '/dashboard/kategori' },
                {
                    title: 'Edit Kategori',
                    href: `/dashboard/kategori/${kategori.id_kategori}/edit`,
                },
            ]}
        >
            <Head title="Edit Kategori" />

            <div className="p-6">
                <h1 className="text-2xl font-bold">Edit Kategori</h1>

                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    {/* Nama Kategori */}
                    <div>
                        <label className="block font-medium">Nama Kategori</label>
                        <input
                            type="text"
                            value={data.nama_kategori}
                            onChange={(e) => setData('nama_kategori', e.target.value)}
                            className={inputClasses}
                        />
                        {errors.nama_kategori && <div className="mt-1 text-red-600">{errors.nama_kategori}</div>}
                    </div>

                    {/* Kode Warna */}
                    <div>
                        <label className="block font-medium">Kode Warna</label>
                        <div className="mt-1 flex items-center gap-3">
                            <input
                                type="color"
                                value={data.kode_warna}
                                onChange={(e) => setData('kode_warna', e.target.value)}
                                className="h-10 w-10 border-0 p-0"
                            />
                            <input
                                type="text"
                                value={data.kode_warna}
                                onChange={(e) => setData('kode_warna', e.target.value)}
                                className={inputClasses + ' w-24'}
                            />
                        </div>
                        {errors.kode_warna && <div className="mt-1 text-red-600">{errors.kode_warna}</div>}
                        <div className="mt-2 flex gap-2">
                            {palette.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setData('kode_warna', c)}
                                    className="h-6 w-6 rounded border"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Keterangan Warna */}
                    <div>
                        <label className="block font-medium">Keterangan Warna</label>
                        <input type="text" value={data.ket_warna} onChange={(e) => setData('ket_warna', e.target.value)} className={inputClasses} />
                        {errors.ket_warna && <div className="mt-1 text-red-600">{errors.ket_warna}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-4">
                        <Link href="/dashboard/kategori" className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400">
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Memperbarui...' : 'Perbarui'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
