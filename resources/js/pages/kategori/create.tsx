import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        orde0: '',
        kode: '',
        orde1: '',
        orde2: '',
        orde3: '',
        orde4: '',
        kode_warna: '#000000',
        ket_warna: '',
        layer_order: 1,
    });

    const palette = ['#f7a1cc', '#34a853', '#ff6f61', '#4285f4', '#fbbc05'];

    const inputClasses =
        'mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm ' +
        'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 ' +
        'dark:bg-gray-800 dark:text-gray-100';

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
            <Head title="Tambah Kategori" />

            <div className="p-6">
                <h1 className="text-2xl font-bold">Tambah Kategori</h1>

                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    {/* Nama & Kode */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block font-medium">Nama Kategori</label>
                            <input type="text" value={data.orde0} onChange={(e) => setData('orde0', e.target.value)} className={inputClasses} />
                            {errors.orde0 && <div className="mt-1 text-red-600">{errors.orde0}</div>}
                        </div>

                        <div>
                            <label className="block font-medium">Kode (unik)</label>
                            <input
                                type="text"
                                value={data.kode}
                                onChange={(e) => setData('kode', e.target.value.toUpperCase())}
                                className={inputClasses}
                            />
                            {errors.kode && <div className="mt-1 text-red-600">{errors.kode}</div>}
                        </div>
                    </div>

                    {/* Orde1‑4 */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                        {(['orde1', 'orde2', 'orde3', 'orde4'] as const).map((o) => (
                            <div key={o}>
                                <label className="block font-medium capitalize">{o}</label>
                                <input type="text" value={(data as any)[o]} onChange={(e) => setData(o, e.target.value)} className={inputClasses} />
                                {errors[o] && <div className="mt-1 text-red-600">{(errors as any)[o]}</div>}
                            </div>
                        ))}
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

                    {/* Layer order & Keterangan */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block font-medium">Urutan Layer</label>
                            <input
                                type="number"
                                min={0}
                                value={data.layer_order}
                                onChange={(e) => setData('layer_order', Number(e.target.value) || 0)}
                                className={inputClasses + ' w-32'}
                            />
                            {errors.layer_order && <div className="mt-1 text-red-600">{errors.layer_order}</div>}
                        </div>

                        <div>
                            <label className="block font-medium">Keterangan Warna</label>
                            <input
                                type="text"
                                value={data.ket_warna}
                                onChange={(e) => setData('ket_warna', e.target.value)}
                                className={inputClasses}
                            />
                            {errors.ket_warna && <div className="mt-1 text-red-600">{errors.ket_warna}</div>}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
