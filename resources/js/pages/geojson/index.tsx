import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const GeojsonIndex = () => {
    const { geojsons, regions } = usePage<{ geojsons: Array<{ id_geojson: number; geojson: string; id_user: number; id_region: number; id_owner: number }>, regions: Array<{ id_region: number; name: string }> }>().props;

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
                            {/* <th className="border px-4 py-2">Geojson</th> */}
                            <th className="border px-4 py-2">User ID</th>
                            <th className="border px-4 py-2">Region ID</th>
                            <th className="border px-4 py-2">Owner ID</th>
                            <th className="border px-4 py-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {geojsons.map((geojson) => (
                            <tr key={geojson.id_geojson}>
                                {/* <td className="border px-4 py-2">{geojson.id_geojson}</td> */}
                                <td className="border px-4 py-2">{geojson.geojson}</td>
                                <td className="border px-4 py-2">{geojson.id_user}</td>
                                <td className="border px-4 py-2">
                                    <select
                                        value={geojson.id_region} 
                                        disabled
                                        className="w-full rounded-md border px-3 py-2"
                                    >
                                        {regions.map((region) => (
                                            <option key={region.id_region} value={region.id_region}>
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="border px-4 py-2">{geojson.id_owner}</td>
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
