import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface PageProps {
    [key: string]: any;
    geojson: {
        id_geojson: number;
        geojson: any;
        id_region?: number;
        id_owner?: number;
    };
    user_name: string;
    user_id: number;
    regions: { id_region: number; name: string }[];
    owner: { id_owner: number; name: string }[];
    flash?: { success?: string; error?: string };
}

interface FormValues {
    geojson: string;
    geojson_file: FileList;
    id_region: string;
    id_owner: string;
}

export default function GeojsonEdit() {
    const { geojson, user_name, user_id, regions, owner, flash } = usePage<PageProps>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<FormValues>({
        defaultValues: {
            geojson: JSON.stringify(geojson.geojson, null, 2),
            id_region: geojson.id_region?.toString() ?? '',
            id_owner: geojson.id_owner?.toString() ?? '',
        },
    });

    useEffect(() => {
        setValue('geojson', JSON.stringify(geojson.geojson, null, 2));
        setValue('id_region', geojson.id_region?.toString() ?? '');
        setValue('id_owner', geojson.id_owner?.toString() ?? '');
    }, [geojson, setValue]);

    const onSubmit = (data: FormValues) => {
        const formData = new FormData();
        if (data.geojson_file?.length) {
            formData.append('geojson_file', data.geojson_file[0]);
        } else {
            try {
                const obj = JSON.parse(data.geojson);
                formData.append('geojson', JSON.stringify(obj));
            } catch {
                alert('Format GeoJSON teks tidak valid');
                return;
            }
        }
        formData.append('_method', 'PUT');
        formData.append('id_user', user_id.toString());
        if (data.id_region) formData.append('id_region', data.id_region);
        if (data.id_owner) formData.append('id_owner', data.id_owner);

        router.post(`/dashboard/geojson/${geojson.id_geojson}`, formData);
    };

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
                    <div>
                        <label htmlFor="geojson" className="mb-1 block">
                            GeoJSON (Text Format)
                        </label>
                        <textarea
                            id="geojson"
                            {...register('geojson')}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson && <p className="mt-1 text-sm text-red-500">{String(errors.geojson.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="geojson_file" className="mb-1 block">
                            GeoJSON (File Upload)
                        </label>
                        <input
                            id="geojson_file"
                            type="file"
                            accept=".geojson"
                            {...register('geojson_file')}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson_file && <p className="mt-1 text-sm text-red-500">{String(errors.geojson_file.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="id_user" className="mb-1 block">
                            User
                        </label>
                        <input
                            id="id_user"
                            value={user_name}
                            readOnly
                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div>
                        <label htmlFor="id_region" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Region
                        </label>
                        <select
                            id="id_region"
                            {...register('id_region')}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {regions.map((r) => (
                                <option key={r.id_region} value={r.id_region}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        {errors.id_region && <p className="mt-1 text-sm text-red-500">{String(errors.id_region.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="id_owner" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Owner
                        </label>
                        <select
                            id="id_owner"
                            {...register('id_owner')}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {owner.map((o) => (
                                <option key={o.id_owner} value={o.id_owner}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                        {errors.id_owner && <p className="mt-1 text-sm text-red-500">{String(errors.id_owner.message)}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Link
                            href="/dashboard/geojson"
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
