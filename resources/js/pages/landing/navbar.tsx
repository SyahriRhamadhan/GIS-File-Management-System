import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { name: 'Home', href: '/', exact: true },
    {
        name: 'Profil',
        dropdown: [
            { name: 'Visi & Misi', href: '/profil/visi-misi' },
            { name: 'Struktur Organisasi', href: '/profil/struktur' },
            { name: 'Tugas & Fungsi', href: '/profil/tugas-fungsi' },
            { name: 'Pejabat Struktural', href: '/profil/pejabat' },
        ],
    },
    {
        name: 'Informasi Publik',
        dropdown: [
            { name: 'Pengumuman', href: '/informasi/pengumuman' },
            { name: 'Berita', href: '/informasi/berita' },
            { name: 'Agenda', href: '/informasi/agenda' },
            { name: 'Galeri Foto', href: '/informasi/galeri' },
        ],
    },
    {
        name: 'Layanan',
        dropdown: [
            { name: 'Perizinan', href: '/layanan/perizinan' },
            { name: 'Pengaduan Masyarakat', href: '/layanan/pengaduan' },
            { name: 'Informasi Proyek', href: '/layanan/proyek' },
            { name: 'PPID', href: '/layanan/ppid' },
        ],
    },
    {
        name: 'Program & Kegiatan',
        dropdown: [
            { name: 'Program Prioritas', href: '/program/prioritas' },
            { name: 'Kegiatan Tahunan', href: '/program/kegiatan' },
            { name: 'Rencana Strategis', href: '/program/renstra' },
            { name: 'Dokumen Pembangunan', href: '/program/dokumen' },
        ],
    },
    {
        name: 'Data & Publikasi',
        dropdown: [
            { name: 'Statistik Infrastruktur', href: '/data/statistik' },
            { name: 'Dokumen Publikasi', href: '/data/publikasi' },
            { name: 'Unduhan', href: '/data/unduhan' },
        ],
    },
    { name: 'Kontak', href: '/kontak' },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [dropdownIdx, setDropdownIdx] = useState<number | null>(null);

    // currentPath bisa diambil dari usePage atau props, disini contoh statis "/"
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const { auth } = usePage<SharedData>().props;

    return (
        <header className="w-full border-b border-[#ededed] bg-[#f4f4f4]">
            {/* Logo & Judul */}
            <div className="hidden items-center gap-2 bg-[#f4f4f4] px-6 py-4 md:flex">
                <span className="text-4xl font-extrabold text-[#393e41]">DINAS</span>
                <span className="text-4xl font-extrabold text-[#ebe129]">PUPRP</span>
                <span className="text-4xl font-extrabold text-[#393e41]">KAB. BINTAN</span>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden border-t border-[#ededed] bg-white px-6 md:flex">
                <ul className="flex w-full items-center gap-2">
                    {menuItems.map((item, i) => (
                        <li key={item.name} className="relative">
                            {item.dropdown ? (
                                <div className="group" onMouseEnter={() => setDropdownIdx(i)} onMouseLeave={() => setDropdownIdx(null)}>
                                    <button
                                        className={`flex items-center gap-1 px-5 py-2 font-medium transition ${
                                            dropdownIdx === i ? 'bg-[#ebe129] text-white' : 'text-[#767676] hover:bg-[#e6eef9] hover:text-[#ebe129]'
                                        } `}
                                    >
                                        {item.name}
                                        <ChevronDown size={18} />
                                    </button>
                                    {dropdownIdx === i && (
                                        <div className="absolute top-full left-0 z-20 min-w-[200px] rounded border bg-white shadow-md">
                                            {item.dropdown.map((sub) => (
                                                <Link
                                                    key={sub.name}
                                                    href={sub.href}
                                                    className="block px-5 py-2 text-[#393e41] hover:bg-[#e6eef9] hover:text-[#ebe129]"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`px-5 py-2 font-medium transition ${
                                        currentPath === item.href || (item.exact && currentPath === '/')
                                            ? 'bg-[#ebe129] text-white'
                                            : 'text-[#767676] hover:bg-[#e6eef9] hover:text-[#ebe129]'
                                    } `}
                                >
                                    {item.name}
                                </Link>
                            )}
                        </li>
                    ))}
                    <li className="m-1 ml-auto flex items-center">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded border border-[#ebe129] px-5 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded border border-[#ebe129] px-5 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="ml-2 rounded border border-[#ebe129] px-5 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </li>
                </ul>
            </nav>

            {/* Mobile Navbar */}
            <nav className="relative border-t border-[#ededed] bg-white px-4 md:hidden">
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold text-[#393e41]">DINAS</span>
                        <span className="text-2xl font-extrabold text-[#ebe129]">PUPRP</span>
                        <span className="text-2xl font-extrabold text-[#393e41]">KAB. BINTAN</span>
                    </div>
                    <button onClick={() => setOpen(!open)} className="text-[#ebe129] focus:outline-none" aria-label="Toggle Menu">
                        {open ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
                {open && (
                    <ul className="flex flex-col gap-1 pb-2">
                        {menuItems.map((item, i) => (
                            <li key={item.name}>
                                {item.dropdown ? (
                                    <div>
                                        <button
                                            onClick={() => setDropdownIdx(dropdownIdx === i ? null : i)}
                                            className={`flex w-full items-center justify-between px-4 py-2 font-medium transition ${
                                                dropdownIdx === i
                                                    ? 'bg-[#ebe129] text-white'
                                                    : 'text-[#767676] hover:bg-[#e6eef9] hover:text-[#ebe129]'
                                            } `}
                                        >
                                            {item.name}
                                            <ChevronDown size={18} />
                                        </button>
                                        {dropdownIdx === i && (
                                            <div className="flex flex-col bg-[#f8f8f8]">
                                                {item.dropdown.map((sub) => (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className="px-6 py-2 text-[#393e41] hover:bg-[#e6eef9] hover:text-[#ebe129]"
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`block px-4 py-2 font-medium transition ${
                                            currentPath === item.href || (item.exact && currentPath === '/')
                                                ? 'bg-[#ebe129] text-white'
                                                : 'text-[#767676] hover:bg-[#e6eef9] hover:text-[#ebe129]'
                                        } `}
                                        onClick={() => setOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </li>
                        ))}
                        <li className="mt-2 m-1 flex flex-col gap-1">
                            {auth?.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="block rounded border border-[#ebe129] px-4 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                                    onClick={() => setOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="block rounded border border-[#ebe129] px-4 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                                        onClick={() => setOpen(false)}
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="block rounded border border-[#ebe129] px-4 py-2 font-medium text-[#ebe129] transition hover:bg-[#ebe129] hover:text-white"
                                        onClick={() => setOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </li>
                    </ul>
                )}
            </nav>
        </header>
    );
}
