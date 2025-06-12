import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Announcement = {
    id: number;
    title: string;
    date: string;
    description: string;
    file?: string | null;
};

// Dummy data, ganti dengan props/data dari backend jika perlu
const announcements: Announcement[] = [
    {
        id: 1,
        title: 'Pemberitahuan Libur Nasional dan Cuti Bersama',
        date: '2025-06-11',
        description: 'Layanan Dinas PUPRP libur 16-17 Juni 2025.',
        file: '/files/surat-edaran-libur.pdf',
    },
    {
        id: 2,
        title: 'Penerimaan Pengaduan Online',
        date: '2025-06-01',
        description: 'Pengaduan layanan infrastruktur kini bisa online.',
        file: null,
    },
    {
        id: 3,
        title: 'Pengumuman Tender Proyek Jalan Baru',
        date: '2025-05-28',
        description: 'Tender pembangunan jalan Bintan Utara telah dibuka.',
        file: '/files/tender-jalan-baru.pdf',
    },
];

export default function PengumumanCarousel() {
    const [active, setActive] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-slide logic
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setActive((prev) => (prev + 1) % announcements.length);
        }, 5000); // Geser setiap 5 detik

        // Cleanup interval saat unmount
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [active]);

    if (announcements.length === 0) {
        return (
            <div className="flex items-center gap-2 bg-[#f4f4f4] px-4 py-2 text-gray-500">
                <span className="font-semibold text-[#1656b9]">Pengumuman</span>
                <span className="ml-4">Belum ada pengumuman.</span>
            </div>
        );
    }

    const current = announcements[active];

    const next = () => setActive((prev) => (prev + 1) % announcements.length);
    const prev = () => setActive((prev) => (prev - 1 + announcements.length) % announcements.length);

    return (
        <div className="flex w-full items-center border-b border-[#ededed] bg-[#f4f4f4] px-3 py-2">
            {/* Label */}
            <span className="min-w-max px-2 font-bold text-[#ebe129]">Pengumuman</span>

            {/* Tombol kiri */}
            <button
                onClick={prev}
                className="mx-2 rounded p-1 transition hover:bg-gray-200"
                aria-label="Sebelumnya"
            >
                <ChevronLeft size={20} />
            </button>

            {/* Isi pengumuman */}
            <div className="flex-1 overflow-x-auto px-1 text-sm whitespace-nowrap">
                <span className="font-medium">{current.title}</span>
                <span className="mx-2 text-[#393e41]">|</span>
                <span className="text-gray-600">{current.description}</span>
            </div>

            {/* Unduh/tanggal */}
            {current.file ? (
                <a
                    href={current.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 flex items-center gap-1 rounded bg-[#ebe129] px-3 py-1 text-xs font-semibold text-[#393e41] transition hover:bg-[#d9cc00]"
                >
                    <Download size={16} />
                    Unduh
                </a>
            ) : (
                <span className="ml-2 min-w-max text-xs text-gray-500">
                    {new Date(current.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            )}

            {/* Tombol kanan */}
            <button
                onClick={next}
                className="ml-2 rounded p-1 transition hover:bg-gray-200"
                aria-label="Selanjutnya"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
