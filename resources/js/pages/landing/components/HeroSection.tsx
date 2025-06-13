import { useEffect, useState } from 'react';

type Holiday = {
    holiday_name: string;
    holiday_date: string;
    is_national_holiday?: boolean;
    description?: string;
};

const newsTicker = [
    { title: 'Janji Pulang di Idulfitri', image: 'https://via.placeholder.com/100x100' },
    { title: 'Meriah Raya Kilau Pelita', image: 'https://via.placeholder.com/100x100' },
    { title: 'Cahaya Cinta Berkumandang', image: 'https://via.placeholder.com/100x100' },
];

const featuredNews = {
    date: 'Jumat, 17 Januari 2025',
    category: 'Acara',
    title: 'HIMA PBSI Gelar Festival Bulan Bahasa Dan Kenalkan Budaya Ke Generasi Muda',
    image: 'https://via.placeholder.com/800x400',
};

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
}

const HeroSection = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

    useEffect(() => {
        setLoading(true);
        setSelectedHoliday(null);
        fetch(`https://api-harilibur.vercel.app/api?month=${selectedMonth + 1}&year=${selectedYear}`)
            .then((res) => res.json())
            .then((data: Holiday[]) => {
                setHolidays(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedMonth, selectedYear]);

    // Build calendar grid
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendarRows: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            calendarRows.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        calendarRows.push(week);
    }

    // Map holidays by date string
    const holidayMap: { [key: number]: Holiday } = {};
    holidays.forEach((h) => {
        const d = new Date(h.holiday_date);
        if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
            holidayMap[d.getDate()] = h;
        }
    });

    return (
        <section className="bg-gray-50 py-6 dark:bg-[#18181b]">
            {/* News Ticker */}
            <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
                {newsTicker.map((item, idx) => (
                    <div key={idx} className="flex w-full items-center gap-2 rounded bg-white p-2 shadow sm:w-1/3 dark:bg-[#232323]">
                        <img src={item.image} alt="news" className="h-12 w-16 rounded object-cover" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{item.title}</span>
                    </div>
                ))}
            </div>
            {/* Main Featured News */}
            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:flex-row">
                <div className="relative flex-1">
                    <img src={featuredNews.image} alt="featured" className="h-56 w-full rounded object-cover sm:h-80" />
                    {/* Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end rounded bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                        <div className="mb-2 text-sm text-gray-200">
                            {featuredNews.category} / {featuredNews.date}
                        </div>
                        <h2 className="mb-4 text-xl font-bold text-white drop-shadow-lg sm:text-2xl">{featuredNews.title}</h2>
                    </div>
                    {/* Navigation arrows */}
                    <button className="absolute top-1/2 left-2 -translate-y-1/2 rounded-none bg-transparent p-2 text-xl font-bold text-yellow-500 shadow outline-2 outline-yellow-500 transition hover:bg-yellow-50/10 hover:text-yellow-600">
                        &#60;
                    </button>
                    <button className="absolute top-1/2 right-2 -translate-y-1/2 rounded-none bg-transparent p-2 text-xl font-bold text-yellow-500 shadow outline-2 outline-yellow-500 transition hover:bg-yellow-50/10 hover:text-yellow-600">
                        &#62;
                    </button>
                </div>
                {/* Kalender Akademik (Hari Libur Nasional) */}
                <div className="mt-8 hidden w-full flex-shrink-0 rounded bg-white p-4 shadow md:mt-0 md:block md:w-72 dark:bg-[#232323]">
                    <div className="mb-2 rounded bg-yellow-500 py-2 text-center text-lg font-semibold text-white dark:bg-yellow-600">
                        Hari Libur Nasional
                    </div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <select
                            className="rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-[#18181b] dark:text-white"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {monthNames.map((m, i) => (
                                <option key={i} value={i} className="text-black dark:text-white">
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-[#18181b] dark:text-white"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {[2024, 2025, 2026].map((y) => (
                                <option key={y} value={y} className="text-black dark:text-white">
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                    <table className="w-full border-separate text-center text-xs" style={{ borderSpacing: '6px 6px' }}>
                        <thead>
                            <tr className="text-yellow-500 dark:text-yellow-400">
                                <th>Sun</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calendarRows.map((week, i) => (
                                <tr key={i}>
                                    {week.map((day, j) => {
                                        if (!day) return <td key={j}></td>;
                                        const isHoliday = holidayMap[day];
                                        return (
                                            <td
                                                key={j}
                                                className={
                                                    isHoliday
                                                        ? 'cursor-pointer rounded border border-yellow-500 bg-yellow-500 font-semibold text-white transition hover:bg-yellow-600 dark:border-yellow-600 dark:bg-yellow-600'
                                                        : 'cursor-pointer rounded border border-yellow-200 bg-gray-50 text-gray-700 transition dark:border-yellow-700 dark:bg-[#18181b] dark:text-white'
                                                }
                                                title={isHoliday ? isHoliday.holiday_name : undefined}
                                                onClick={() => setSelectedHoliday(isHoliday ? isHoliday : null)}
                                                style={{ minWidth: 32, minHeight: 32, verticalAlign: 'middle' }}
                                            >
                                                {day}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="mt-2 text-xs text-gray-500">Memuat hari libur...</div>}
                    {!loading && holidays.length === 0 && <div className="mt-2 text-xs text-gray-500">Tidak ada hari libur nasional bulan ini.</div>}
                    {selectedHoliday && (
                        <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900 dark:border-yellow-700 dark:bg-[#232323] dark:text-yellow-200">
                            <div className="font-semibold">{selectedHoliday.holiday_name}</div>
                            <div>Tanggal: {selectedHoliday.holiday_date}</div>
                            {selectedHoliday.is_national_holiday && <div>Libur Nasional</div>}
                            {selectedHoliday.description && <div>Keterangan: {selectedHoliday.description}</div>}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
