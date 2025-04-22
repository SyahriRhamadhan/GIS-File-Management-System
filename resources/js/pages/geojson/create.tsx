import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

interface GeojsonFormProps {
    user_name: string;
    user_id: number; // The authenticated user's ID
    regions: { id_region: number; name: string }[];
    owner: { id_owner: number; name: string }[];
}

const GeojsonCreate: React.FC<GeojsonFormProps> = ({ user_name, user_id, regions, owner }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
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
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Create Geojson</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="geojson" className="block">
                            Geojson (Text Format)
                        </label>
                        <textarea id="geojson" {...register('geojson')} rows={4} className="w-full rounded-md border px-3 py-2" />
                        {errors.geojson && <p className="text-sm text-red-500">{String(errors.geojson.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="geojson_file" className="block">
                            Geojson (File Upload)
                        </label>
                        <input
                            id="geojson_file"
                            type="file"
                            accept=".geojson"
                            {...register('geojson_file')}
                            className="w-full rounded-md border px-3 py-2"
                        />
                        {errors.geojson_file && <p className="text-sm text-red-500">{String(errors.geojson_file.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="id_user" className="block">
                            User (Default)
                        </label>
                        <input id="id_user" value={user_name} readOnly className="w-full rounded-md border px-3 py-2" />
                    </div>

                    <div>
                        <label htmlFor="id_region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Region
                        </label>
                        <select id="id_region" {...register('id_region')} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
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
                        <label htmlFor="id_owner" className="block text-sm font-medium text-gray-700">
                            Owner
                        </label>
                        <select id="id_owner" {...register('id_owner')} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
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
                        <button type="button" onClick={() => router.visit('/dashboard/geojson')} className="rounded-md bg-gray-300 px-4 py-2">
                            Cancel
                        </button>
                        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default GeojsonCreate;
