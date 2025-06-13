const services = [
    {
        icon: '🏗️',
        title: 'Pembangunan Infrastruktur',
        description: 'Pelaksanaan pembangunan jalan, jembatan, dan fasilitas umum lainnya.',
    },
    {
        icon: '💧',
        title: 'Pengelolaan Sumber Daya Air',
        description: 'Pengelolaan irigasi, drainase, dan sumber daya air untuk masyarakat.',
    },
    {
        icon: '🏠',
        title: 'Penataan Ruang',
        description: 'Perencanaan tata ruang wilayah untuk pembangunan berkelanjutan.',
    },
    {
        icon: '🛠️',
        title: 'Pelayanan Publik',
        description: 'Layanan pengaduan, konsultasi, dan informasi publik.',
    },
];

const ServicesSection = () => (
    <section className="bg-white py-12 dark:bg-[#18181b]">
        <div className="container mx-auto px-4 sm:px-6">
            <h2 className="mb-8 text-center text-3xl font-bold text-yellow-500 dark:text-yellow-400">Layanan Kami</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((service, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center rounded-lg border border-yellow-100 bg-yellow-50 p-6 text-center shadow-sm dark:border-yellow-700 dark:bg-[#232323]"
                    >
                        <div className="mb-4 text-5xl">{service.icon}</div>
                        <h3 className="mb-2 text-xl font-semibold text-yellow-700 dark:text-yellow-400">{service.title}</h3>
                        <p className="text-yellow-800 dark:text-yellow-200">{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default ServicesSection;
