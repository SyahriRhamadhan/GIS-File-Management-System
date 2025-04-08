import AppLayout from '@/layouts/app-layout';
import { Link, usePage } from '@inertiajs/react';

const GeojsonIndex = () => {
    const { geojsons, regions, users, owners } = usePage<{
        geojsons: Array<{ id_geojson: number; geojson: any; id_user: number; id_region: number; id_owner: number }>;
        regions: Array<{ id_region: number; name: string }>;
        users: Array<{ id: number; name: string }>;
        owners: Array<{ id_owner: number; name: string }>;
    }>().props;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
            ]}
        >
            <div className="container mx-auto px-4 py-6">
                <h1 className="mb-4 text-3xl font-semibold">Daftar Geojson</h1>
                <Link href="/dashboard/geojson/create" className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                    Tambah Geojson
                </Link>

                <table className="mt-4 w-full table-auto">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">#</th>
                            <th className="border px-4 py-2">User</th>
                            <th className="border px-4 py-2">Region</th>
                            <th className="border px-4 py-2">Owner</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {geojsons.map((geojson: any) => {
                            const userData = users.find((u) => u.id === geojson.id_user); 
                            const regionData = regions.find((r) => r.id_region === geojson.id_region);
                            const ownerData = owners.find((o) => o.id_owner === geojson.id_owner); 

                            return (
                                <tr key={geojson.id_geojson}>
                                    <td className="border px-4 py-2">{geojson.id_geojson}</td>
                                    <td className="border px-4 py-2">{userData?.name ?? 'Unknown User'}</td>
                                    <td className="border px-4 py-2">{regionData?.name ?? 'Unknown Region'}</td>
                                    <td className="border px-4 py-2">{ownerData?.name ?? 'Unknown Owner'}</td>
                                    <td className="border px-4 py-2">
                                        <Link
                                            href={`/dashboard/geojson/${geojson.id_geojson}/edit`}
                                            className="rounded-md bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                                        >
                                            Edit
                                        </Link>
                                        <form action={`/dashboard/geojson/${geojson.id_geojson}`} method="POST" className="ml-2 inline-block">
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button type="submit" className="rounded-md bg-red-500 px-2 py-1 text-white hover:bg-red-600">
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default GeojsonIndex;
