import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface Kategori {
    id_kategori: number;
    nama_kategori: string;
    kode_warna: string;
    ket_warna: string;
    orde1: string;
    orde2: string;
    orde3: string;
    orde4: string;
}

interface Region {
    id_region: number;
    name: string;
}

interface Owner {
    id_owner: number;
    name: string;
}

interface PageProps extends Record<string, any> {
    geojson: {
        id_geojson: number;
        geojson: any;
        id_region?: number;
        id_owner?: number;
        id_kategori?: number;
    };
    user_name: string;
    user_id: number;
    regions: Region[];
    owner: Owner[];
    kategoris: Kategori[];
    flash?: { success?: string; error?: string };
}

interface FormValues {
    geojson: string;
    geojson_file: FileList;
    id_region: string;
    id_owner: string;
    id_kategori: string;
    orde1?: string;
    orde2?: string;
    orde3?: string;
    orde4?: string;
}

export default function GeojsonEdit() {
    const { geojson, user_name, user_id, regions, owner, kategoris, flash } = usePage<PageProps>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            geojson: JSON.stringify(geojson.geojson, null, 2),
            id_region: geojson.id_region?.toString() || '',
            id_owner: geojson.id_owner?.toString() || '',
            id_kategori: geojson.id_kategori?.toString() || '',
        },
    });

    // State to hold the selected category and the filtered options for the orders
    const [selectedKat, setSelectedKat] = useState<Kategori | null>(null);

    const [selectedKatId, setSelectedKatId] = useState<string>(geojson.id_kategori?.toString() || '');
    const selectedKatOption = kategoris.find((k) => k.id_kategori.toString() === selectedKatId);

    useEffect(() => {
        if (selectedKatOption) {
            setSelectedKat(selectedKatOption);
            setValue('id_kategori', selectedKatOption.id_kategori.toString());
        }
    }, [selectedKatOption, setValue]);

    useEffect(() => {
        register('id_kategori', {
            onChange: (e: any) => setSelectedKatId(e.target.value),
        });
        return () => {};
    }, [register]);

    const onSubmit = (data: FormValues) => {
        const formData = new FormData();
        if (data.geojson_file?.length) {
            formData.append('geojson_file', data.geojson_file[0]);
        } else {
            try {
                formData.append('geojson', JSON.stringify(JSON.parse(data.geojson)));
            } catch {
                toast.error('Format GeoJSON teks tidak valid');
                return;
            }
        }
        formData.append('_method', 'PUT');
        formData.append('id_user', user_id.toString());
        if (data.id_region) formData.append('id_region', data.id_region);
        if (data.id_owner) formData.append('id_owner', data.id_owner);
        if (data.id_kategori) formData.append('id_kategori', data.id_kategori);

        router.post(`/dashboard/geojson/${geojson.id_geojson}`, formData, {
            onSuccess: () => toast.success('GeoJSON diperbarui!'),
        });
    };

    const handleDelete = () => {
        if (!confirm('Yakin hapus data ini?')) return;
        router.delete(`/dashboard/geojson/${geojson.id_geojson}`, {
            onSuccess: () => toast.success('GeoJSON berhasil dihapus'),
            onError: () => toast.error('Gagal menghapus GeoJSON'),
        });
    };

    // Format for React Select
    const categoryOptions = kategoris.map((k) => ({
        value: k.id_kategori,
        label: `${k.nama_kategori} / ${k.orde1} / ${k.orde2} / ${k.orde3} / ${k.orde4}`,
        ...k, // Attach the whole category data to the option
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
                { title: 'Edit Geojson', href: `/dashboard/geojson/${geojson.id_geojson}/edit` },
            ]}
        >
            <Head title="Edit Geojson" />

            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <h1 className="mb-4 text-2xl font-bold">Edit Geojson</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* GeoJSON Text */}
                    <div>
                        <label htmlFor="geojson" className="mb-1 block">
                            GeoJSON (Text Format)
                        </label>
                        <textarea
                            id="geojson"
                            rows={4}
                            {...register('geojson')}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson && <p className="mt-1 text-sm text-red-500">{errors.geojson.message}</p>}
                    </div>

                    {/* File Upload */}
                    <div>
                        <label htmlFor="geojson_file" className="mb-1 block">
                            GeoJSON (File Upload)
                        </label>
                        <input
                            id="geojson_file"
                            type="file"
                            accept=".geojson"
                            {...register('geojson_file')}
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson_file && <p className="mt-1 text-sm text-red-500">{errors.geojson_file.message}</p>}
                    </div>

                    {/* User (readonly) */}
                    <div>
                        <label htmlFor="id_user" className="mb-1 block">
                            User
                        </label>
                        <input
                            id="id_user"
                            readOnly
                            value={user_name}
                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>

                    {/* Region */}
                    <div>
                        <label htmlFor="id_region" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Region
                        </label>
                        <select
                            id="id_region"
                            {...register('id_region')}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {regions.map((r) => (
                                <option key={r.id_region} value={r.id_region}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        {errors.id_region && <p className="mt-1 text-sm text-red-500">{errors.id_region.message}</p>}
                    </div>

                    {/* Owner */}
                    <div>
                        <label htmlFor="id_owner" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Owner
                        </label>
                        <select
                            id="id_owner"
                            {...register('id_owner')}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {owner.map((o) => (
                                <option key={o.id_owner} value={o.id_owner}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                        <Select
                            options={categoryOptions}
                            value={categoryOptions.find((option) => option.value.toString() === selectedKatId)}
                            onChange={(selectedOption: any) => {
                                setSelectedKat(selectedOption);
                                setSelectedKatId(selectedOption.value.toString());
                                setValue('id_kategori', selectedOption.value.toString());
                            }}
                            getOptionLabel={(e: (typeof categoryOptions)[number]) => e.label}
                            getOptionValue={(e: { value: number }) => e.value.toString()}
                            placeholder="— Select Category —"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />

                        {selectedKat && (
                            <div className="mt-2 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                                <span className="block h-5 w-5 flex-shrink-0 rounded" style={{ backgroundColor: selectedKat.kode_warna }} />
                                <div className="text-sm">
                                    <p className="font-medium">{selectedKat.nama_kategori}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {selectedKat.ket_warna} ({selectedKat.kode_warna})
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={handleDelete} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
                            Delete
                        </button>

                        <Link
                            href="/dashboard/geojson"
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Updating…' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
