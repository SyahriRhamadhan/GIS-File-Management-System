import { useEffect, useState } from 'react';

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
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`https://api-harilibur.vercel.app/api?month=${selectedMonth + 1}&year=${selectedYear}`)
            .then((res) => res.json())
            .then((data) => {
                setHolidays(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedMonth, selectedYear]);

    // Build calendar grid
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendarRows = [];
    let week = Array(firstDay).fill(null);
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
    const holidayMap = {};
    holidays.forEach((h: any) => {
        const d = new Date(h.holiday_date);
        if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
            Object.assign(holidayMap, { [d.getDate().toString()]: h });
        }
    });

    return (
        <section className="bg-gray-50 py-6">
            {/* News Ticker */}
            <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-4">
                {newsTicker.map((item, idx) => (
                    <div key={idx} className="flex w-1/3 items-center gap-2 rounded bg-white p-2 shadow">
                        <img src={item.image} alt="news" className="h-12 w-16 rounded object-cover" />
                        <span className="text-sm font-medium text-gray-800">{item.title}</span>
                    </div>
                ))}
            </div>
            {/* Main Featured News */}
            <div className="mx-auto flex max-w-5xl gap-6">
                <div className="relative flex-1">
                    <img src={featuredNews.image} alt="featured" className="h-80 w-full rounded object-cover" />
                    {/* Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end rounded bg-gradient-to-t from-black/80 to-transparent p-6">
                        <div className="mb-2 text-sm text-gray-200">
                            {featuredNews.category} / {featuredNews.date}
                        </div>
                        <h2 className="mb-4 text-2xl font-bold text-white drop-shadow-lg">{featuredNews.title}</h2>
                    </div>
                    {/* Navigation arrows */}
                    <button className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-xl font-bold text-gray-700 shadow hover:bg-white">
                        &#60;
                    </button>
                    <button className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-xl font-bold text-gray-700 shadow hover:bg-white">
                        &#62;
                    </button>
                </div>
                {/* Kalender Akademik (Hari Libur Nasional) */}
                <div className="hidden w-72 flex-shrink-0 rounded bg-white p-4 shadow md:block">
                    <div className="mb-2 rounded bg-blue-700 py-2 text-center text-lg font-semibold text-white">Hari Libur Nasional</div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <select
                            className="rounded border px-2 py-1 text-sm"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {monthNames.map((m, i) => (
                                <option key={i} value={i}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded border px-2 py-1 text-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {[2024, 2025, 2026].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                    <table className="w-full text-center text-xs">
                        <thead>
                            <tr className="text-blue-700">
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
                                        const isHoliday = holidayMap[day.toString() as keyof typeof holidayMap];
                                        return (
                                            <td
                                                key={j}
                                                className={
                                                    isHoliday
                                                        ? 'm-2 cursor-pointer border-blue-700 bg-blue-700 font-semibold text-white'
                                                        : 'm-2 border-blue-200 bg-gray-50 text-gray-700'
                                                }
                                                title={isHoliday ? (isHoliday as { holiday_name: string }).holiday_name : undefined}
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
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
