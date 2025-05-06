import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/core';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

    // ──────────────────── PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;
    const maxButtons = 5;

    // ──────────────────── FILTER & SORT
    const filtered = useMemo(
        () =>
            kategoris
                .slice()
                .sort((a, b) => a.layer_order - b.layer_order)
                .filter((k) => k.nama_kategori.toLowerCase().includes(search.toLowerCase())),
        [kategoris, search],
    );

    // total halaman
    const pages = Math.ceil(filtered.length / perPage);

    // reset page ke 1 jika keyword berubah
    useEffect(() => setCurrentPage(1), [search]);

    // data yang ditampilkan
    const displayed = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, currentPage]);

    // window tombol
    const visiblePages = useMemo(() => {
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;
        if (end > pages) {
            end = pages;
            start = Math.max(1, end - maxButtons + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [currentPage, pages]);

    const goToPage = (p: number) => setCurrentPage(p);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kategori', href: '/dashboard/kategori' },
            ]}
        >
            <Head title="Daftar Kategori" />

            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {/* header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">Daftar Kategori</h1>
                    <Link href="/dashboard/kategori/create" className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">
                        + Tambah Kategori
                    </Link>
                </div>

                {/* search */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari kategori..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                </div>

                {/* table */}
                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full table-auto border-collapse text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="border px-4 py-2 text-left">Nama Kategori</th>
                                <th className="border px-4 py-2 text-left">Kode Warna</th>
                                <th className="border px-4 py-2 text-left">Urutan Layer</th>
                                <th className="border px-4 py-2 text-left">Keterangan</th>
                                <th className="border px-4 py-2 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((k, i) => (
                                <tr key={k.id_kategori} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + i + 1}</td>
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
                            {displayed.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="border px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        Tidak ada kategori ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* pagination bar */}
                {pages > 1 && (
                    <div className="my-4 flex flex-wrap items-center justify-center gap-2">
                        {/* First */}
                        <button
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            « First
                        </button>

                        {/* Prev */}
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            ‹ Prev
                        </button>

                        {/* window */}
                        {visiblePages.map((p) => (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`rounded border px-3 py-1 text-sm ${
                                    currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                        {/* Next */}
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === pages}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            Next ›
                        </button>

                        {/* Last */}
                        <button
                            onClick={() => goToPage(pages)}
                            disabled={currentPage === pages}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            Last »
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
