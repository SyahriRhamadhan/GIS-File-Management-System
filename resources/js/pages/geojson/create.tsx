// resources/js/Pages/Geojson/Create.tsx
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface GeojsonFormProps {
    user_name: string;
    user_id: number;
    regions: { id_region: number; name: string }[];
    owner: { id_owner: number; name: string }[];
    kategoris: {
        orde1: string;
        orde2: string;
        orde3: string;
        orde4: string;
        id_kategori: number;
        orde0: string;
        kode_warna: string;
        ket_warna: string;
    }[];
}

interface FormValues {
    geojson?: string;
    geojson_file?: FileList;
    id_region?: string;
    id_owner?: string;
    id_kategori?: string;
}

export default function GeojsonCreate({ user_name, user_id, regions, owner, kategoris }: GeojsonFormProps) {
    const { flash } = usePage().props as { flash?: { upload_errors?: string[] } };

    useEffect(() => {
        if (flash?.upload_errors) {
            flash.upload_errors.forEach((msg) => toast.error(msg));
        }
    }, [flash]);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>();

    const [selectedKat, setSelectedKat] = useState<any>(null);

    const selectedKatId = watch('id_kategori') || '';

    // Handle category change
    const handleCategoryChange = (selectedOption: any) => {
        setSelectedKat(selectedOption); // Set selected category
    };

    const onSubmit = (data: FormValues) => {
        const formData = new FormData();

        if (data.geojson_file?.length) {
            Array.from(data.geojson_file).forEach((file) => formData.append('geojson_file[]', file));
        } else if (data.geojson) {
            try {
                const obj = JSON.parse(data.geojson);
                formData.append('geojson', JSON.stringify(obj));
            } catch {
                toast.error('Format GeoJSON teks tidak valid');
                return;
            }
        }

        formData.append('id_user', user_id.toString());
        if (data.id_region) formData.append('id_region', data.id_region);
        if (data.id_owner) formData.append('id_owner', data.id_owner);
        if (data.id_kategori) formData.append('id_kategori', data.id_kategori);

        router.post('/dashboard/geojson', formData);
    };

    // Format for React Select
    const categoryOptions = kategoris.map((k) => ({
        value: k.id_kategori,
        label: `${k.orde0} / ${k.orde1} / ${k.orde2} / ${k.orde3} / ${k.orde4}`,
        ...k, // Attach the whole category data to the option
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
                { title: 'Create Geojson', href: '/dashboard/geojson/create' },
            ]}
        >
            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <h1 className="mb-4 text-2xl font-bold">Create Geojson</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* GeoJSON Text */}
                    <div>
                        <label htmlFor="geojson" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                            GeoJSON (Text Format)
                        </label>
                        <textarea
                            id="geojson"
                            {...register('geojson')}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson && <p className="mt-1 text-sm text-red-600">{errors.geojson.message}</p>}
                    </div>

                    {/* GeoJSON File */}
                    <div>
                        <label htmlFor="geojson_file" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                            GeoJSON (File Upload)
                        </label>
                        <input
                            id="geojson_file"
                            type="file"
                            accept=".geojson"
                            multiple
                            {...register('geojson_file')}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson_file && <p className="mt-1 text-sm text-red-600">{errors.geojson_file.message}</p>}
                    </div>

                    {/* User (readonly) */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">User</label>
                        <input
                            value={user_name}
                            readOnly
                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>

                    {/* Region */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Region</label>
                        <select
                            {...register('id_region')}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {regions.map((r) => (
                                <option key={r.id_region} value={r.id_region}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Owner */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Owner</label>
                        <select
                            {...register('id_owner')}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {owner.map((o) => (
                                <option key={o.id_owner} value={o.id_owner}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category with live-preview */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Category</label>

                        {/* ganti <Select> biasa dengan Controller */}
                        <Controller
                            name="id_kategori"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Select<typeof categoryOptions[0]>
                                    {...field}
                                    options={categoryOptions}
                                    value={categoryOptions.find(opt => opt.value.toString() === field.value)}
                                    onChange={(opt) => {
                                        field.onChange(opt?.value.toString() ?? '');
                                        setSelectedKat(opt);
                                    }}
                                    getOptionLabel={(e) => e.label}
                                    getOptionValue={(e) => e.value.toString()}
                                    placeholder="— Select Category —"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            )}
                        />

                        {selectedKat && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                                <span className="block h-6 w-6 flex-shrink-0 rounded" style={{ backgroundColor: selectedKat.kode_warna }} />
                                <div className="text-sm">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedKat.orde0}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Orde 1 = {selectedKat.orde1}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Orde 2 = {selectedKat.orde2}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Orde 3 = {selectedKat.orde3}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Orde 4 = {selectedKat.orde4}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">*Ket {selectedKat.ket_warna}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => router.visit('/dashboard/geojson')}
                            className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
