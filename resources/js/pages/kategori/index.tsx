// resources/js/Pages/Geojson/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

interface Kategori {
    id_kategori: number;
    orde0: string;
    orde1?: string;
    orde2?: string;
    orde3?: string;
    orde4?: string;
    kode?: string;
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

    const [namaFilter, setNamaFilter] = useState('');
    const [orde1Filter, setOrde1Filter] = useState('');
    const [orde2Filter, setOrde2Filter] = useState('');
    const [orde3Filter, setOrde3Filter] = useState('');
    const [layerFilter, setLayerFilter] = useState<number | ''>('');

    /* ── OPTION SET ── (unik, diurutkan) */
    const namaOptions = useMemo(() => [...new Set(kategoris.map((k) => k.orde0).filter(Boolean))].sort(), [kategoris]);

    const orde1Options = useMemo(
        () =>
            [
                ...new Set(
                    kategoris
                        .filter((k) => !namaFilter || k.orde0 === namaFilter)
                        .map((k) => k.orde1)
                        .filter(Boolean),
                ),
            ].sort(),
        [kategoris, namaFilter],
    );

    const orde2Options = useMemo(
        () =>
            [
                ...new Set(
                    kategoris
                        .filter((k) => (!namaFilter || k.orde0 === namaFilter) && (!orde1Filter || k.orde1 === orde1Filter))
                        .map((k) => k.orde2)
                        .filter(Boolean),
                ),
            ].sort(),
        [kategoris, namaFilter, orde1Filter],
    );

    const orde3Options = useMemo(
        () =>
            [
                ...new Set(
                    kategoris
                        .filter(
                            (k) =>
                                (!namaFilter || k.orde0 === namaFilter) &&
                                (!orde1Filter || k.orde1 === orde1Filter) &&
                                (!orde2Filter || k.orde2 === orde2Filter),
                        )
                        .map((k) => k.orde3)
                        .filter(Boolean),
                ),
            ].sort(),
        [kategoris, namaFilter, orde1Filter, orde2Filter],
    );

    const layerOptions = useMemo(() => [...new Set(kategoris.map((k) => k.layer_order))].sort((a, b) => a - b), [kategoris]);

    // ──────────────────── FILTER & SORT
    const filtered = useMemo(
        () =>
            kategoris
                .slice()
                .sort((a, b) => a.layer_order - b.layer_order)
                .filter(
                    (k) =>
                        (k.orde0.toLowerCase().includes(search.toLowerCase()) ||
                            k.orde1?.toLowerCase().includes(search.toLowerCase()) ||
                            k.orde2?.toLowerCase().includes(search.toLowerCase()) ||
                            k.orde3?.toLowerCase().includes(search.toLowerCase()) ||
                            k.orde4?.toLowerCase().includes(search.toLowerCase())) &&
                        (!namaFilter || k.orde0 === namaFilter) &&
                        (!orde1Filter || k.orde1 === orde1Filter) &&
                        (!orde2Filter || k.orde2 === orde2Filter) &&
                        (!orde3Filter || k.orde3 === orde3Filter) &&
                        (!layerFilter || k.layer_order === layerFilter),
                ),
        [kategoris, search, namaFilter, orde1Filter, orde2Filter, orde3Filter, layerFilter],
    );

    // total halaman
    const pages = Math.ceil(filtered.length / perPage);

    // reset page ke 1 jika keyword berubah
    useEffect(() => setCurrentPage(1), [search, namaFilter, orde1Filter, orde2Filter, orde3Filter, layerFilter]);

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
                {/* ‑‑‑ filters ‑‑‑ */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    {/* Search Nama */}
                    <input
                        type="text"
                        placeholder="Cari nama kategori…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    />

                    <select
                        value={namaFilter}
                        onChange={(e) => {
                            setNamaFilter(e.target.value);
                            setOrde1Filter('');
                            setOrde2Filter('');
                            setOrde3Filter('');
                        }}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua Nama</option>
                        {namaOptions.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>

                    {/* Orde1 */}
                    <select
                        value={orde1Filter}
                        onChange={(e) => {
                            setOrde1Filter(e.target.value);
                            setOrde2Filter('');
                            setOrde3Filter('');
                        }}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua O1</option>
                        {orde1Options.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>

                    {/* Orde2 */}
                    <select
                        value={orde2Filter}
                        onChange={(e) => {
                            setOrde2Filter(e.target.value);
                            setOrde3Filter('');
                        }}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua O2</option>
                        {orde2Options.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>

                    {/* Orde3 */}
                    <select
                        value={orde3Filter}
                        onChange={(e) => setOrde3Filter(e.target.value)}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua O3</option>
                        {orde3Options.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>

                    {/* Urutan Layer */}
                    <select
                        value={layerFilter}
                        onChange={(e) => setLayerFilter(e.target.value ? Number(e.target.value) : '')}
                        className="rounded border px-3 py-2 shadow-sm dark:bg-gray-800"
                    >
                        <option value="">Semua Layer</option>
                        {layerOptions.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>
                </div>

                {/* table */}
                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="w-full table-auto border-collapse text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="border px-4 py-2 text-left">#</th>
                                <th className="border px-4 py-2 text-left">Nama Kategori</th>
                                <th className="border px-4 py-2">Kode</th>
                                <th className="border px-4 py-2">O1</th>
                                <th className="border px-4 py-2">O2</th>
                                <th className="border px-4 py-2">O3</th>
                                <th className="border px-4 py-2">O4</th>
                                <th className="border px-4 py-2 text-left">Kode Warna</th>
                                <th className="border px-4 py-2 text-left">Urutan Layer</th>
                                <th className="border px-4 py-2 text-left">Keterangan</th>
                                <th className="border px-4 py-2 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((k, i) => (
                                <tr key={k.id_kategori} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                    <td className="border px-4 py-2">{(currentPage - 1) * perPage + i + 1}</td>
                                    <td className="border px-4 py-2">{k.orde0}</td>
                                    <td className="border px-4 py-2">{k.kode || '-'}</td>
                                    <td className="border px-4 py-2">{k.orde1 || '-'}</td>
                                    <td className="border px-4 py-2">{k.orde2 || '-'}</td>
                                    <td className="border px-4 py-2">{k.orde3 || '-'}</td>
                                    <td className="border px-4 py-2">{k.orde4 || '-'}</td>
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
                            « First
                        </button>

                        {/* Prev */}
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            ‹ Prev
                        </button>

                        {/* window */}
                        {visiblePages.map((p) => (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`rounded border px-3 py-1 text-sm ${currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
                            Next ›
                        </button>

                        {/* Last */}
                        <button
                            onClick={() => goToPage(pages)}
                            disabled={currentPage === pages}
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                        >
                            Last »
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
