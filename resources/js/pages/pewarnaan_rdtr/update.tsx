import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

export default function PewarnaanRdtrUpdate() {
  const { props } = usePage<{ item: Item; errors?: Record<string, string> }>();
  const { item } = props;
  const [form, setForm] = useState<Item>({ ...item });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>(props?.errors || {});

  useEffect(() => {
    setForm({ ...item });
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'kode_warna') {
      const m = /^#([0-9a-fA-F]{6})$/.exec(value.trim());
      if (m) {
        const int = parseInt(m[1], 16);
        const r = (int >> 16) & 255;
        const g = (int >> 8) & 255;
        const b = int & 255;
        const rf = r / 255, gf = g / 255, bf = b / 255;
        const max = Math.max(rf, gf, bf);
        const min = Math.min(rf, gf, bf);
        const d = max - min;
        let h = 0;
        if (d !== 0) {
          if (max === rf) h = ((gf - bf) / d) % 6;
          else if (max === gf) h = (bf - rf) / d + 2;
          else h = (rf - gf) / d + 4;
          h *= 60;
          if (h < 0) h += 360;
        }
        const s = max === 0 ? 0 : d / max;
        const v = max;
        const k = 1 - Math.max(rf, gf, bf);
        let c = 0, mC = 0, y = 0, kP = Math.round(k * 100);
        if (k !== 1) {
          c = Math.round(((1 - rf - k) / (1 - k)) * 100);
          mC = Math.round(((1 - gf - k) / (1 - k)) * 100);
          y = Math.round(((1 - bf - k) / (1 - k)) * 100);
        }
        setForm((p) => ({
          ...p,
          kode_warna: value,
          rgb: `${r} ${g} ${b}`,
          hsv: `${Math.round(h)} ${Math.round(s * 100)} ${Math.round(v * 100)}`,
          cmyk: `${c} ${mC} ${y} ${kP}`,
        }));
        return;
      }
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload: Record<string, any> = {
      kode: form.kode,
      sub_zona: form.sub_zona,
      cmyk: form.cmyk,
      rgb: form.rgb,
      hsv: form.hsv,
      kode_warna: form.kode_warna,
    };
    router.put(route('dashboard.pewarnaan_rdtr.update', item.id_pewarnaan_rdtr), payload, {
      onSuccess: () => {
        toast.success('Berhasil memperbarui data');
        setSubmitting(false);
      },
      onError: (errs: Record<string, string>) => {
        setErrors(errs || {});
        const first = errs && Object.values(errs)[0];
        toast.error(typeof first === 'string' ? first : 'Gagal menyimpan');
        setSubmitting(false);
      },
    });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Pewarnaan RDTR', href: '/dashboard/pewarnaan-rdtr' }, { title: 'Edit', href: `/dashboard/pewarnaan-rdtr/${item.id_pewarnaan_rdtr}/edit` }]}>
      <Head title={`Edit ${item.kode}`} />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Pewarnaan RDTR</h1>
          <Link href={route('dashboard.pewarnaan_rdtr.index')} className="rounded bg-gray-200 px-3 py-1">
            Kembali
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Kode</label>
            <input name="kode" value={form.kode} onChange={handleChange} className={`w-full rounded border px-3 py-2 ${errors?.kode ? 'border-red-500' : ''}`} required />
            {errors?.kode && <p className="mt-1 text-sm text-red-600">{errors.kode}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Sub Zona</label>
            <input name="sub_zona" value={form.sub_zona || ''} onChange={handleChange} className={`w-full rounded border px-3 py-2 ${errors?.sub_zona ? 'border-red-500' : ''}`} />
            {errors?.sub_zona && <p className="mt-1 text-sm text-red-600">{errors.sub_zona}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">CMYK</label>
              <input name="cmyk" value={form.cmyk || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled />
              {errors?.cmyk && <p className="mt-1 text-sm text-red-600">{errors.cmyk}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">RGB</label>
              <input name="rgb" value={form.rgb || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled />
              {errors?.rgb && <p className="mt-1 text-sm text-red-600">{errors.rgb}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">HSV</label>
              <input name="hsv" value={form.hsv || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled />
              {errors?.hsv && <p className="mt-1 text-sm text-red-600">{errors.hsv}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Warna (hex)</label>
            <div className="flex items-center gap-3">
              <input type="color" name="kode_warna" value={form.kode_warna || '#000000'} onChange={handleChange} className="h-8 w-12" />
              <input name="kode_warna" value={form.kode_warna || ''} onChange={handleChange} className={`w-full rounded border px-3 py-2 ${errors?.kode_warna ? 'border-red-500' : ''}`} />
            </div>
            {errors?.kode_warna && <p className="mt-1 text-sm text-red-600">{errors.kode_warna}</p>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-blue-300">
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}