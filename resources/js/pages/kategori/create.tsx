import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        nama_kategori: '',
        kode_warna: '',
        ket_warna: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/dashboard/kategori');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kategori', href: '/dashboard/kategori' },
                { title: 'Tambah Kategori', href: '/dashboard/kategori/create' },
            ]}
        >
            <div className="p-6">
                <h1 className="text-2xl font-bold">Tambah Kategori</h1>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block">Nama Kategori</label>
                        <input
                            type="text"
                            value={data.nama_kategori}
                            onChange={(e) => setData('nama_kategori', e.target.value)}
                            className="mt-1 w-full rounded border p-2"
                        />
                        {errors.nama_kategori && <div className="text-red-600">{errors.nama_kategori}</div>}
                    </div>

                    <div>
                        <label className="block">Kode Warna</label>
                        <input
                            type="text"
                            value={data.kode_warna}
                            onChange={(e) => setData('kode_warna', e.target.value)}
                            className="mt-1 w-full rounded border p-2"
                        />
                        {errors.kode_warna && <div className="text-red-600">{errors.kode_warna}</div>}
                    </div>

                    <div>
                        <label className="block">Keterangan Warna</label>
                        <input
                            type="text"
                            value={data.ket_warna}
                            onChange={(e) => setData('ket_warna', e.target.value)}
                            className="mt-1 w-full rounded border p-2"
                        />
                        {errors.ket_warna && <div className="text-red-600">{errors.ket_warna}</div>}
                    </div>

                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
