import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

interface GeojsonFormProps {
    user_name: string;
    user_id: number; // The authenticated user's ID
    regions: { id_region: number; name: string }[];
    owner: { id_owner: number; name: string }[];
    kategoris: { id_kategori: number; nama_kategori: string }[];
}

const GeojsonCreate: React.FC<GeojsonFormProps> = ({ user_name, user_id, regions, owner, kategoris }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        // Removed unused setValue
    } = useForm();

    const onSubmit = (data: any) => {
        const formData = new FormData();

        if (data.geojson_file?.[0]) {
            formData.append('geojson_file', data.geojson_file[0]);
        } else {
            try {
                const geojsonObject = JSON.parse(data.geojson);
                formData.append('geojson', JSON.stringify(geojsonObject));
            } catch (error) {
                console.error('Invalid GeoJSON:', error);
                return;
            }
        }

        formData.append('id_user', user_id.toString());
        if (data.id_region) {
            formData.append('id_region', data.id_region);
        }
        if (data.id_owner) {
            formData.append('id_owner', data.id_owner);
        }
        if (data.id_kategori) {
            formData.append('id_kategori', data.id_kategori);
        }

        router.post('/dashboard/geojson', formData);
    };

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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* GeoJSON Text */}
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

                    {/* GeoJSON File */}
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

                    {/* User */}
                    <div>
                        <label htmlFor="id_user" className="mb-1 block">
                            User (Default)
                        </label>
                        <input
                            id="id_user"
                            value={user_name}
                            readOnly
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

                    {/* Owner */}
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
                    {/* Category */}
                    <div>
                        <label htmlFor="id_kategori" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Category
                        </label>
                        <select
                            id="id_kategori"
                            {...register('id_kategori')}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">— Tidak Memilih —</option>
                            {kategoris.map((k) => (
                                <option key={k.id_kategori} value={k.id_kategori}>
                                    {k.nama_kategori}
                                </option>
                            ))}
                        </select>
                        {errors.id_kategori && <p className="mt-1 text-sm text-red-500">{String(errors.id_kategori.message)}</p>}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit('/dashboard/geojson')}
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default GeojsonCreate;
