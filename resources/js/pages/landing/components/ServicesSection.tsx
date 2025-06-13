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
    <section className="bg-white py-12">
        <div className="container mx-auto px-6">
            <h2 className="mb-8 text-center text-3xl font-bold text-blue-900">Layanan Kami</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {services.map((service, idx) => (
                    <div key={idx} className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-center shadow-sm">
                        <div className="mb-4 text-5xl">{service.icon}</div>
                        <h3 className="mb-2 text-xl font-semibold text-blue-800">{service.title}</h3>
                        <p className="text-blue-700">{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default ServicesSection;
