const Footer = () => {
    return (
        <footer className="w-full border-t border-gray-200 bg-white px-4 py-8 md:px-12 dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
                {/* Left: Title & Description */}
                <div className="min-w-[220px] flex-1">
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-yellow-400">
                        PUPRP <span className="text-gray-800 dark:text-white">KAB. BINTAN</span>
                    </h2>
                    <p className="mt-2 max-w-xs text-sm text-gray-600 dark:text-gray-300">
                        Dinas Pekerjaan Umum dan Penataan Ruang Perumahan Kabupaten Bintan. Melayani masyarakat dengan profesional, transparan, dan
                        akuntabel.
                    </p>
                    <div className="mt-4 flex gap-3">
                        <a href="#" className="text-gray-500 hover:text-blue-700 dark:hover:text-yellow-400">
                            <i className="fab fa-twitter"></i>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-blue-700 dark:hover:text-yellow-400">
                            <i className="fab fa-facebook"></i>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-blue-700 dark:hover:text-yellow-400">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-blue-700 dark:hover:text-yellow-400">
                            <i className="fab fa-linkedin"></i>
                        </a>
                    </div>
                </div>
                {/* Middle: Layanan */}
                <div className="min-w-[220px] flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">Layanan</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Perizinan', 'Pengaduan', 'Informasi Publik', 'Proyek', 'Kontak', 'Berita', 'Galeri'].map((layanan) => (
                            <span
                                key={layanan}
                                className="rounded border border-gray-400 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                {layanan}
                            </span>
                        ))}
                    </div>
                </div>
                {/* Quick Links */}
                <div className="min-w-[180px] flex-1">
                    <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">Tautan Cepat</h3>
                    <ul className="space-y-1">
                        <li>
                            <a href="#" className="text-gray-700 hover:text-blue-700 dark:text-gray-200 dark:hover:text-yellow-400">
                                Profil Dinas
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-gray-700 hover:text-blue-700 dark:text-gray-200 dark:hover:text-yellow-400">
                                Struktur Organisasi
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-gray-700 hover:text-blue-700 dark:text-gray-200 dark:hover:text-yellow-400">
                                Hubungi Kami
                            </a>
                        </li>
                    </ul>
                </div>
                {/* Logos */}
                <div className="flex min-w-[120px] flex-1 flex-col items-center md:items-start">
                    <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">Logo Dinas & Kabupaten</h3>
                    <div className="flex gap-3">
                        <img src="/logo-pu.png" alt="Logo Dinas PU" className="h-10 w-10 object-contain" />
                        {/* <img src="/logo-bintan.png" alt="Logo Kabupaten Bintan" className="h-10 w-10 object-contain" /> */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
