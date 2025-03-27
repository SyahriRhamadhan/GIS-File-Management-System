import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

interface GeojsonFormProps {
    user_name: string;
    user_id: number; // The authenticated user's ID
    // user_id: number;
    regions: { id_region: number; name: string }[];
    owner: { id_owner: number; name: string }[];
}

const GeojsonCreate: React.FC<GeojsonFormProps> = ({ user_name, user_id, regions, owner }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = (data: any) => {
        // Ensure geojson is a valid JSON object
        try {
            const geojsonObject = JSON.parse(data.geojson); // Parsing the geojson string into an object
            const requestData = {
                ...data,
                geojson: JSON.stringify(geojsonObject),
                id_user: user_id, // Use the authenticated user's ID
            };
            router.post('/dashboard/geojson', requestData);
        } catch (error) {
            console.error('Invalid GeoJSON:', error);
        }
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
                            Geojson
                        </label>
                        <textarea
                            id="geojson"
                            {...register('geojson', { required: 'Geojson is required' })}
                            rows={4}
                            className="w-full rounded-md border px-3 py-2"
                        />
                        {errors.geojson && <p className="text-sm text-red-500">{String(errors.geojson.message)}</p>}
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
                        <select
                            id="id_region"
                            {...register('id_region', { required: 'Region is required' })}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Pilih Region</option>
                            {regions.map((region) => (
                                <option key={region.id_region} value={region.id_region}>
                                    {region.name}
                                </option>
                            ))}
                        </select>
                        {errors.id_region && <p className="mt-1 text-sm text-red-500">{String(errors.id_region.message)}</p>}
                    </div>

                    <div>
                        <label htmlFor="id_owner" className="block">
                            Owner ID
                        </label>
                        <select
                            id="id_owner"
                            {...register('id_owner', { required: 'Owner is required' })}
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Pilih Owner</option>
                            {owner.map((owner) => (
                                <option key={owner.id_owner} value={owner.id_owner}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                        {errors.id_owner && <p className="text-sm text-red-500">{String(errors.id_owner.message)}</p>}
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
