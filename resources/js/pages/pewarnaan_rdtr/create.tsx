import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

function hexToRgb(hex: string) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return { r, g, b };
}

function rgbToHsv(r: number, g: number, b: number) {
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
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rf - k) / (1 - k);
  const m = (1 - gf - k) / (1 - k);
  const y = (1 - bf - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}

export default function PewarnaanRdtrCreate() {
  const { props } = usePage<{ errors?: Record<string, string> }>();
  const [form, setForm] = useState({
    kode: '',
    sub_zona: '',
    cmyk: '',
    rgb: '',
    hsv: '',
    kode_warna: '#000000',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>(props?.errors || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'kode_warna') {
      const rgb = hexToRgb(value);
      if (rgb) {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        setForm((p) => ({
          ...p,
          kode_warna: value,
          rgb: `${rgb.r} ${rgb.g} ${rgb.b}`,
          hsv: `${hsv.h} ${hsv.s} ${hsv.v}`,
          cmyk: `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`,
        }));
        return;
      }
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const rgb = hexToRgb(form.kode_warna);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
      setForm((p) => ({
        ...p,
        rgb: `${rgb.r} ${rgb.g} ${rgb.b}`,
        hsv: `${hsv.h} ${hsv.s} ${hsv.v}`,
        cmyk: `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`,
      }));
    }
  }, []);

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
    router.post(route('dashboard.pewarnaan_rdtr.store'), payload, {
      onSuccess: () => {
        toast.success('Berhasil menambahkan data');
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
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Pewarnaan RDTR', href: '/dashboard/pewarnaan-rdtr' }, { title: 'Tambah', href: '/dashboard/pewarnaan-rdtr/create' }]}>
      <Head title="Tambah Pewarnaan RDTR" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tambah Pewarnaan RDTR</h1>
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
            <input name="sub_zona" value={form.sub_zona} onChange={handleChange} className={`w-full rounded border px-3 py-2 ${errors?.sub_zona ? 'border-red-500' : ''}`} />
            {errors?.sub_zona && <p className="mt-1 text-sm text-red-600">{errors.sub_zona}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">CMYK</label>
              <input name="cmyk" value={form.cmyk} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled />
              {errors?.cmyk && <p className="mt-1 text-sm text-red-600">{errors.cmyk}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">RGB</label>
              <input name="rgb" value={form.rgb} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="e.g. 151 219 242" disabled />
              {errors?.rgb && <p className="mt-1 text-sm text-red-600">{errors.rgb}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">HSV</label>
              <input name="hsv" value={form.hsv} onChange={handleChange} className="w-full rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled />
              {errors?.hsv && <p className="mt-1 text-sm text-red-600">{errors.hsv}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Warna (hex)</label>
            <div className="flex items-center gap-3">
              <input type="color" name="kode_warna" value={form.kode_warna} onChange={handleChange} className="h-8 w-12" />
              <input name="kode_warna" value={form.kode_warna} onChange={handleChange} className={`w-full rounded border px-3 py-2 ${errors?.kode_warna ? 'border-red-500' : ''}`} />
            </div>
            {errors?.kode_warna && <p className="mt-1 text-sm text-red-600">{errors.kode_warna}</p>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={submitting} className="rounded bg-green-600 px-4 py-2 text-white disabled:bg-green-300">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}