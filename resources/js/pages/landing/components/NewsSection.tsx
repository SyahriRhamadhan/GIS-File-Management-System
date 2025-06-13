import { Link } from '@inertiajs/react';

const newsData = [
    {
        title: 'Pembangunan Infrastruktur Jalan di Bintan',
        description: 'Kami sedang melakukan pembangunan jalan utama yang menghubungkan kota Bintan...',
        image: 'https://via.placeholder.com/600x400',
        link: '#',
    },
    {
        title: 'Proyek Pembangunan Jembatan Baru',
        description: 'Proyek ini akan meningkatkan konektivitas antara daerah-daerah yang lebih...',
        image: 'https://via.placeholder.com/600x400',
        link: '#',
    },
    {
        title: 'Sosialisasi Program Renovasi Rumah',
        description: 'Dinas PUPR Kabupaten Bintan mengadakan acara sosialisasi mengenai renovasi rumah untuk masyarakat...',
        image: 'https://via.placeholder.com/600x400',
        link: '#',
    },
];

const NewsSection = () => (
    <section className="px-6 py-12">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold">Berita Terbaru</h2>
            <p className="text-gray-600">Berita dan informasi terkini dari DINAS PUPRP KAB. BINTAN</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {newsData.map((news, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg bg-white shadow-lg">
                    <img className="h-40 w-full object-cover" src={news.image} alt="news image" />
                    <div className="p-4">
                        <h3 className="text-xl font-semibold">{news.title}</h3>
                        <p className="mt-2 text-sm text-gray-600">{news.description}</p>
                        <Link href={news.link} className="mt-4 inline-block text-blue-500">
                            Baca selengkapnya
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </section>
);

export default NewsSection;
