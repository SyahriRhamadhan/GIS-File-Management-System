import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const GeojsonEdit = () => {
    const { geojson } = usePage<{ geojson: any }>().props;
    const { register, handleSubmit, setValue } = useForm();
    
    const [geojsonData, setGeojsonData] = useState<any>(geojson);

    useEffect(() => {
        setValue('geojson', geojsonData.geojson);
        setValue('id_user', geojsonData.id_user);
        setValue('id_region', geojsonData.id_region);
        setValue('id_owner', geojsonData.id_owner);
    }, [geojsonData, setValue]);

    const onSubmit = (data: any) => {
        // Mengirim data ke backend
        router.put(`/dashboard/geojson/${geojsonData.id_geojson}`, data);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
                { title: 'Edit Geojson', href: `/dashboard/geojson/${geojsonData.id_geojson}/edit` },
            ]}
        >
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Edit Geojson</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="geojson" className="block">Geojson</label>
                        <textarea
                            {...register('geojson')}
                            id="geojson"
                            rows={4}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="id_user" className="block">User ID</label>
                        <input
                            {...register('id_user')}
                            id="id_user"
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="id_region" className="block">Region ID</label>
                        <input
                            {...register('id_region')}
                            id="id_region"
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="id_owner" className="block">Owner ID</label>
                        <input
                            {...register('id_owner')}
                            id="id_owner"
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit('/dashboard/geojson')}
                            className="px-4 py-2 bg-gray-300 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default GeojsonEdit;
