import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/core';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Kategori {
    id_kategori: number;
    nama_kategori: string;
    kode_warna: string;
    ket_warna?: string;
    layer_order: number;
}

interface IndexProps {
    kategoris: Kategori[];
}

export default function Index({ kategoris }: IndexProps) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () =>
            kategoris
                .slice()
                .sort((a, b) => a.layer_order - b.layer_order)
                .filter((k) => k.nama_kategori.toLowerCase().includes(search.toLowerCase())),
        [kategoris, search],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kategori', href: '/dashboard/kategori' },
            ]}
        >
            <Head title="Daftar Kategori" />

            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">Daftar Kategori</h1>
                    <Link href="/dashboard/kategori/create" className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">
                        + Tambah Kategori
                    </Link>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari kategori..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full table-auto border-collapse text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="border px-4 py-2 text-left">Nama Kategori</th>
                                <th className="border px-4 py-2 text-left">Kode Warna</th>
                                <th className="border px-4 py-2 text-left">Urutan Layer</th>
                                <th className="border px-4 py-2 text-left">Keterangan</th>
                                <th className="border px-4 py-2 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((k, i) => (
                                <tr key={k.id_kategori} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                    <td className="border px-4 py-2">{i + 1}</td>
                                    <td className="border px-4 py-2">{k.nama_kategori}</td>
                                    <td className="border px-4 py-2">
                                        <span className="mr-2 inline-block h-4 w-4 rounded align-middle" style={{ backgroundColor: k.kode_warna }} />
                                        <span className="align-middle">{k.kode_warna}</span>
                                    </td>
                                    <td className="border px-4 py-2">{k.layer_order}</td>
                                    <td className="border px-4 py-2">{k.ket_warna || '-'}</td>
                                    <td className="flex justify-center gap-2 border px-4 py-2">
                                        <Link
                                            href={`/dashboard/kategori/${k.id_kategori}/edit`}
                                            className="rounded bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (confirm('Yakin menghapus kategori ini?')) {
                                                    router.delete(`/dashboard/kategori/${k.id_kategori}`);
                                                }
                                            }}
                                            className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-800"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="border px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        Tidak ada kategori ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
