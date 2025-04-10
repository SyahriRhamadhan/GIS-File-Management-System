import AppLayout from '@/layouts/app-layout';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type RegionEntry = { provinsi: string; kabupaten: string; kecamatan: string; desa: string };

export default function CreateRegion() {
    const { props } = usePage<{ regionOptions: RegionEntry[] }>();
    const { regionOptions } = props;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        detail: '',
        link: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('dashboard.region.store'));
    };

    const provinsiList = useMemo(() => [...new Set(regionOptions.map((r) => r.provinsi))], [regionOptions]);
    const kabupatenList = useMemo(
        () =>
            regionOptions
                .filter((r) => r.provinsi === data.provinsi)
                .map((r) => r.kabupaten)
                .filter((v, i, a) => a.indexOf(v) === i),
        [data.provinsi],
    );
    const kecamatanList = useMemo(
        () =>
            regionOptions
                .filter((r) => r.provinsi === data.provinsi && r.kabupaten === data.kabupaten)
                .map((r) => r.kecamatan)
                .filter((v, i, a) => a.indexOf(v) === i),
        [data.provinsi, data.kabupaten],
    );
    const desaList = useMemo(
        () =>
            regionOptions
                .filter((r) => r.provinsi === data.provinsi && r.kabupaten === data.kabupaten && r.kecamatan === data.kecamatan)
                .map((r) => r.desa)
                .filter((v, i, a) => a.indexOf(v) === i),
        [data.provinsi, data.kabupaten, data.kecamatan],
    );

    const useCombo = (field: keyof typeof data, options: string[]) => {
        const [query, setQuery] = useState('');
        const filtered = query === '' ? options : options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
        return { query, setQuery, options: filtered, onSelect: (val: string) => setData(field, val) };
    };

    const provCombo = useCombo('provinsi', provinsiList);
    const kabCombo = useCombo('kabupaten', kabupatenList);
    const kecCombo = useCombo('kecamatan', kecamatanList);
    const desaCombo = useCombo('desa', desaList);

    const labelWithStep: Record<string, string> = {
        provinsi: '1. Provinsi',
        kabupaten: '2. Kabupaten',
        kecamatan: '3. Kecamatan',
        desa: '4. Desa',
    };

    const renderCombobox = (field: keyof typeof data, combo: ReturnType<typeof useCombo>, disabled = false) => {
        const allowAddNew = combo.query && !combo.options.includes(combo.query);

        const handleSelect = (val: string) => {
            combo.onSelect(val);
            combo.setQuery('');
        };

        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{labelWithStep[field]}</label>
                <Combobox value={data[field] || ''} onChange={(val: string) => handleSelect(val)} by={(a, b) => a === b} disabled={disabled}>
                    <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-md border text-left shadow-sm focus:outline-none sm:text-sm">
                            <Combobox.Input
                                placeholder={
                                    disabled
                                        ? `Isi ${field === 'kabupaten' ? 'provinsi' : field === 'kecamatan' ? 'kabupaten' : 'kecamatan'} terlebih dahulu`
                                        : `Pilih ${labelWithStep[field].split('. ')[1]}`
                                }
                                className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:outline-none ${
                                    errors[field] ? 'border-red-500' : 'border-gray-300'
                                } dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                                onChange={(e) => combo.setQuery(e.target.value)}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </Combobox.Button>
                        </div>

                        <Combobox.Options className="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black focus:outline-none dark:bg-gray-800 dark:text-white">
                            {combo.options.map((item) => (
                                <Combobox.Option
                                    key={item}
                                    value={item}
                                    className={({ active }) => `cursor-pointer px-4 py-2 select-none ${active ? 'bg-indigo-600 text-white' : ''}`}
                                >
                                    {({ selected }) => (
                                        <span className="flex items-center justify-between">
                                            {item}
                                            {selected && <CheckIcon className="h-4 w-4" />}
                                        </span>
                                    )}
                                </Combobox.Option>
                            ))}

                            {allowAddNew && (
                                <Combobox.Option
                                    value={combo.query}
                                    className="cursor-pointer px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
                                >
                                    + Tambah "{combo.query}"
                                </Combobox.Option>
                            )}

                            {!combo.options.length && !allowAddNew && (
                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ditemukan</div>
                            )}
                        </Combobox.Options>
                    </div>
                </Combobox>
                {errors[field] && <p className="mt-1 text-sm text-red-500">{errors[field]}</p>}
            </div>
        );
    };

    useEffect(() => {
        setData('kabupaten', '');
        setData('kecamatan', '');
        setData('desa', '');
    }, [data.provinsi]);

    useEffect(() => {
        setData('kecamatan', '');
        setData('desa', '');
    }, [data.kabupaten]);

    useEffect(() => {
        setData('desa', '');
    }, [data.kecamatan]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Region', href: '/dashboard/region' },
                { title: 'Tambah Wilayah', href: '#' },
            ]}
        >
            <Head title="Tambah Wilayah" />
            <div className="mx-auto w-full max-w-screen-lg px-4 py-6 md:px-6">
                <h1 className="mb-2 text-2xl font-bold">Tambah Wilayah</h1>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Isi data wilayah secara berurutan dari <strong>Provinsi</strong> hingga <strong>Desa</strong>.
                </p>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:outline-none ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {renderCombobox('provinsi', provCombo)}
                    {renderCombobox('kabupaten', kabCombo, !data.provinsi)}
                    {renderCombobox('kecamatan', kecCombo, !data.kabupaten)}
                    {renderCombobox('desa', desaCombo, !data.kecamatan)}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Detail Alamat</label>
                        <input
                            type="text"
                            value={data.detail}
                            onChange={(e) => setData('detail', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:outline-none ${
                                errors.detail ? 'border-red-500' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.detail && <p className="mt-1 text-sm text-red-500">{errors.detail}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Google Maps</label>
                        <input
                            type="text"
                            value={data.link}
                            onChange={(e) => setData('link', e.target.value)}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:outline-none ${
                                errors.link ? 'border-red-500' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        />
                        {errors.link && <p className="mt-1 text-sm text-red-500">{errors.link}</p>}
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
