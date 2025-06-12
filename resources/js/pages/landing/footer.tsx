const year = new Date().getFullYear();

export default function Footer() {
    return (
        <footer className="mt-auto bg-[#1b1b18] py-8 text-white">
            <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
                {/* Left: Copyright */}
                <div className="text-center text-sm md:text-left">&copy; {year} Dinas PUPR Kabupaten Bintan. Semua hak dilindungi.</div>
                {/* Middle: Link Navigasi */}
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="#" className="text-yellow-500 transition hover:text-yellow-600">
                        Tentang Kami
                    </a>
                    <a href="#" className="text-yellow-500 transition hover:text-yellow-600">
                        Kontak
                    </a>
                    <a href="#" className="text-yellow-500 transition hover:text-yellow-600">
                        Privasi
                    </a>
                </div>
                {/* Right: Social Media (Optional, hapus kalau tidak pakai) */}
                <div className="flex justify-center gap-3">
                    {/* Contoh ikon pakai SVG, bisa ganti atau hapus */}
                    <a href="#" aria-label="Instagram" className="transition hover:text-yellow-500">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12,2.2c3.2,0,3.6,0,4.8,0.1c1.2,0.1,2,0.2,2.5,0.4c0.6,0.2,1,0.5,1.5,0.9c0.4,0.4,0.7,0.9,0.9,1.5
                c0.2,0.5,0.3,1.3,0.4,2.5C21.8,8.2,21.8,8.6,21.8,12s0,3.6-0.1,4.8c-0.1,1.2-0.2,2-0.4,2.5c-0.2,0.6-0.5,1-0.9,1.5
                c-0.4,0.4-0.9,0.7-1.5,0.9c-0.5,0.2-1.3,0.3-2.5,0.4C15.6,21.8,15.2,21.8,12,21.8s-3.6,0-4.8-0.1c-1.2-0.1-2-0.2-2.5-0.4
                c-0.6-0.2-1-0.5-1.5-0.9c-0.4-0.4-0.7-0.9-0.9-1.5c-0.2-0.5-0.3-1.3-0.4-2.5C2.2,15.8,2.2,15.4,2.2,12s0-3.6,0.1-4.8
                c0.1-1.2,0.2-2,0.4-2.5c0.2-0.6,0.5-1,0.9-1.5c0.4-0.4,0.9-0.7,1.5-0.9c0.5-0.2,1.3-0.3,2.5-0.4C8.4,2.2,8.8,2.2,12,2.2z
                M12,0C8.7,0,8.3,0,7.1,0.1c-1.3,0.1-2.2,0.3-3,0.6C3.2,1,2.3,1.7,1.7,2.3C1.1,2.9,0.4,3.8,0.1,5.1C-0.1,5.9-0.1,6.7-0.1,12
                s0,6.1,0.1,6.9c0.3,1.3,1,2.2,1.6,2.9c0.6,0.7,1.5,1.4,2.8,1.7c0.9,0.2,1.7,0.2,7,0.2s6.1,0,6.9-0.1c1.3-0.3,2.2-1,2.8-1.7
                c0.7-0.6,1.4-1.5,1.7-2.8c0.2-0.9,0.2-1.7,0.2-7s0-6.1-0.1-6.9c-0.3-1.3-1-2.2-1.7-2.8c-0.6-0.7-1.5-1.4-2.8-1.7
                C17.3,0.1,16.5,0.1,12,0.1S6.7,0.1,5.9,0.1z"
                            />
                            <circle cx="12" cy="12" r="3.2" />
                            <circle cx="17.5" cy="6.5" r="0.9" />
                        </svg>
                    </a>
                    {/* Tambahkan icon lain di sini */}
                </div>
            </div>
        </footer>
    );
}
