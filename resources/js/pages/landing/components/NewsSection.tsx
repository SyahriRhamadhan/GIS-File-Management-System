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
    <section className="bg-white px-4 py-12 sm:px-6 dark:bg-[#18181b]">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-yellow-500 dark:text-yellow-400">Berita Terbaru</h2>
            <p className="text-gray-600 dark:text-gray-300">Berita dan informasi terkini dari DINAS PUPRP KAB. BINTAN</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {newsData.map((news, idx) => (
                <div key={idx} className="flex flex-col overflow-hidden rounded-lg bg-white shadow-lg dark:bg-[#232323]">
                    <img className="h-40 w-full object-cover" src={news.image} alt="news image" />
                    <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400">{news.title}</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{news.description}</p>
                        <Link href={news.link} className="mt-4 inline-block font-semibold text-yellow-500 transition hover:text-yellow-600">
                            Baca selengkapnya
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </section>
);

export default NewsSection;
