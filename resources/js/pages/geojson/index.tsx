import AppLayout from '@/layouts/app-layout';
import { Link, usePage } from '@inertiajs/react';

const GeojsonIndex = () => {
    const { geojsons, regions, user } = usePage<{
        geojsons: Array<{ id_geojson: number; geojson: any; id_user: number; id_region: number; id_owner: number }>;
        regions: Array<{ id_region: number; name: string }>;
        user: Array<{ id_user: number; name: string }>;
    }>().props;

    console.log(geojsons);

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
                            <th className="border px-4 py-2">Geojson</th>
                            <th className="border px-4 py-2">User ID</th>
                            <th className="border px-4 py-2">Region ID</th>
                            <th className="border px-4 py-2">Owner ID</th>
                            <th className="border px-4 py-2">GeoJSON Info</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {geojsons.map((geojson: any) => (
                            <tr key={geojson.id_geojson}>
                                <td className="border px-4 py-2">{geojson.id_geojson}</td>
                                <td className="border px-4 py-2">{geojson.geojson ? 'Valid GeoJSON' : 'No GeoJSON'}</td>
                                <td className="border px-4 py-2">{geojson.id_user}</td>
                                <td className="border px-4 py-2">{geojson.id_region}</td>
                                <td className="border px-4 py-2">{geojson.id_owner}</td>
                                <td className="border px-4 py-2">
                                    {/* Render specific feature properties */}
                                    {geojson.geojson && geojson.geojson.features && geojson.geojson.features.length > 0 ? (
                                        geojson.geojson.features.map((feature: any, index: number) => (
                                            <div key={index}>
                                                <p>
                                                    <strong>FID_POLARU:</strong> {feature.properties.FID_POLARU}
                                                </p>
                                                <p>
                                                    <strong>KLS_I:</strong> {feature.properties.KLS_I}
                                                </p>
                                                <p>
                                                    <strong>KLS_III:</strong> {feature.properties.KLS_III}
                                                </p>
                                                <p>
                                                    <strong>LUAS_Km2:</strong> {feature.properties.LUAS_Km2}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No features available</p>
                                    )}
                                </td>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default GeojsonIndex;
