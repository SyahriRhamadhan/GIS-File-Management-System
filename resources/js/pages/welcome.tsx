import MapView from '@/components/MapView';
import Footer from '@/pages/landing/footer';
import Navbar from '@/pages/landing/navbar';
import { Head, Link } from '@inertiajs/react';
import Pengumuman from './landing/pengumuman';

const Welcome = ({ geojsons, regions, user }: { geojsons: any; regions: any; user: any }) => {
    const geojsonData = Array.isArray(geojsons) ? geojsons : [];
    console.log('GeoJSON Data:', geojsonData);
    return (
        <>
            <Head title="Dinas PUPR Kabupaten Bintan">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#F7F7F7] dark:bg-[#121212]">
                <Pengumuman />
                <Navbar />

                {/* Hero Section */}
                <section className="flex h-[400px] items-center justify-center bg-[url('https://example.com/path-to-image.jpg')] bg-cover bg-center text-white">
                    <div className="bg-opacity-50 rounded-lg bg-black p-6 text-center">
                        <h1 className="mb-4 text-4xl font-bold">Selamat Datang di Dinas PUPR Kabupaten Bintan</h1>
                        <p className="text-lg">Kami bekerja untuk pembangunan infrastruktur yang lebih baik di Kabupaten Bintan</p>
                    </div>
                </section>

                {/* News Section */}
                <section className="px-6 py-12">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-semibold">Berita Terbaru</h2>
                        <p className="text-gray-600">Berita dan informasi terkini dari Dinas PUPR Kabupaten Bintan</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {/* Example News Card */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                            <img className="h-40 w-full object-cover" src="https://via.placeholder.com/600x400" alt="news image" />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold">Pembangunan Infrastruktur Jalan di Bintan</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Kami sedang melakukan pembangunan jalan utama yang menghubungkan kota Bintan...
                                </p>
                                <Link href="#" className="mt-4 inline-block text-blue-500">
                                    Baca selengkapnya
                                </Link>
                            </div>
                        </div>
                        {/* Repeat similar news cards */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                            <img className="h-40 w-full object-cover" src="https://via.placeholder.com/600x400" alt="news image" />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold">Proyek Pembangunan Jembatan Baru</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Proyek ini akan meningkatkan konektivitas antara daerah-daerah yang lebih...
                                </p>
                                <Link href="#" className="mt-4 inline-block text-blue-500">
                                    Baca selengkapnya
                                </Link>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                            <img className="h-40 w-full object-cover" src="https://via.placeholder.com/600x400" alt="news image" />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold">Sosialisasi Program Renovasi Rumah</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Dinas PUPR Kabupaten Bintan mengadakan acara sosialisasi mengenai renovasi rumah untuk masyarakat...
                                </p>
                                <Link href="#" className="mt-4 inline-block text-blue-500">
                                    Baca selengkapnya
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
};

export default Welcome;
