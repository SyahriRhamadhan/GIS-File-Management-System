import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

interface Item {
  id_pewarnaan_rdtr: number;
  kode: string;
  sub_zona?: string;
  cmyk?: string;
  rgb?: string;
  hsv?: string;
  kode_warna?: string;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

export default function PewarnaanRdtrIndex() {
  const { props } = usePage<{ items: Paginated<Item>; filters?: { search?: string; per_page?: number }; flash?: { success?: string; error?: string } }>();
  const { items, filters, flash } = props;

  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState<number>(filters?.per_page || items?.per_page || 10);
  const [sortBy, setSortBy] = useState<'kode' | 'sub_zona'>('kode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let data = [...(items?.data || [])];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((it) =>
        (it.kode || '').toLowerCase().includes(q) || (it.sub_zona || '').toLowerCase().includes(q),
      );
    }
    data.sort((a, b) => {
      const av = (a[sortBy] || '').toString().toLowerCase();
      const bv = (b[sortBy] || '').toString().toLowerCase();
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [items, search, sortBy, sortDirection]);

  const toggleSort = (col: 'kode' | 'sub_zona') => {
    if (sortBy === col) setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDirection('asc');
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowConfirm(true);
  };
  const handleConfirmDelete = () => {
    if (selectedId !== null) {
      router.delete(route('dashboard.pewarnaan_rdtr.destroy', selectedId), {
        onSuccess: () => {
          toast.success('Berhasil dihapus');
          setShowConfirm(false);
          setSelectedId(null);
        },
        onError: () => toast.error('Gagal menghapus'),
      });
    }
  };

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const submitSearch = () => {
    router.get(route('dashboard.pewarnaan_rdtr.index'), { search, per_page: perPage }, { preserveState: true });
  };

  const changePage = (page: number) => {
    router.get(route('dashboard.pewarnaan_rdtr.index'), { search, per_page: perPage, page }, { preserveState: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Pewarnaan RDTR', href: '/dashboard/pewarnaan-rdtr' }]}>
      <Head title="Pewarnaan RDTR" />
      <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Pewarnaan RDTR</h1>
          <div className="flex items-center gap-2">
            <Link href={route('dashboard.pewarnaan_rdtr.create')} className="rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700">
              + Tambah
            </Link>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                placeholder="Cari kode atau sub zona..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => {
                setSearch('');
                router.get(route('dashboard.pewarnaan_rdtr.index'), { per_page: perPage }, { preserveState: true });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:bg-gray-600 dark:hover:bg-gray-700"
              title="Hapus semua filter"
            >
              Clear Filters
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pengaturan Tampilan</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Per Page</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 10;
                    setPerPage(v);
                    router.get(route('dashboard.pewarnaan_rdtr.index'), { search, per_page: v }, { preserveState: true });
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Aksi</label>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-blue-700" onClick={submitSearch}>Cari</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full min-w-[800px] border text-sm">
            <thead className="bg-gray-100">
              <tr className="dark:bg-gray-700">
                <th className="border px-3 py-2 text-left">#</th>
                <th className="cursor-pointer border px-3 py-2 text-left" onClick={() => toggleSort('kode')}>
                  Kode {sortBy === 'kode' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="cursor-pointer border px-3 py-2 text-left" onClick={() => toggleSort('sub_zona')}>
                  Sub Zona {sortBy === 'sub_zona' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="border px-3 py-2 text-left">CMYK</th>
                <th className="border px-3 py-2 text-left">RGB</th>
                <th className="border px-3 py-2 text-left">HSV</th>
                <th className="border px-3 py-2 text-left">Warna</th>
                <th className="border px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id_pewarnaan_rdtr} className="bg-white even:bg-gray-50 dark:bg-gray-800 dark:even:bg-gray-700">
                  <td className="border px-3 py-2">{(items.current_page - 1) * items.per_page + idx + 1}</td>
                  <td className="border px-3 py-2">{it.kode}</td>
                  <td className="border px-3 py-2">{it.sub_zona || '-'}</td>
                  <td className="border px-3 py-2">{it.cmyk || '-'}</td>
                  <td className="border px-3 py-2">{it.rgb || '-'}</td>
                  <td className="border px-3 py-2">{it.hsv || '-'}</td>
                  <td className="border px-3 py-2">
                    {it.kode_warna ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: it.kode_warna }} />
                        {it.kode_warna}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    <Link
                      href={route('dashboard.pewarnaan_rdtr.edit', it.id_pewarnaan_rdtr)}
                      className="mr-2 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                    >
                      Edit
                    </Link>
                    <button
                      className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                      onClick={() => confirmDelete(it.id_pewarnaan_rdtr)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded bg-white p-4 shadow dark:bg-gray-800 dark:text-gray-100">
              <p className="mb-4">Yakin hapus data?</p>
              <div className="flex justify-end gap-2">
                <button className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600" onClick={() => setShowConfirm(false)}>Batal</button>
                <button className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700" onClick={handleConfirmDelete}>Hapus</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">Menampilkan {(items.current_page - 1) * items.per_page + 1} hingga {Math.min(items.current_page * items.per_page, items.total)} dari {items.total} data</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                disabled={items.current_page <= 1}
                onClick={() => changePage(items.current_page - 1)}
              >
                Prev
              </button>
              <span className="text-sm">Halaman {items.current_page} / {items.last_page}</span>
              <button
                className="rounded border px-3 py-1 text-sm hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                disabled={items.current_page >= items.last_page}
                onClick={() => changePage(items.current_page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}