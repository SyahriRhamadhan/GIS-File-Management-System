import { Head, Link, usePage } from '@inertiajs/react';
import MapView from '@/components/MapView';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Geometry } from 'geojson';

const Welcome = ({
    geojsons,
}: {
    geojsons: Array<{
        id_geojson: number | string;
        geojson: { geometry?: Geometry; properties: Record<string, any> };
        kode_warna: string;
        main_category?: string | null;
        kategori?: {
            layer_order: number;
            orde0?: string;
            kode_warna?: string;
            kode?: string;
        } | null;
        source_name: string;
        geojson_bbox?: {
            min_lng: number;
            min_lat: number;
            max_lng: number;
            max_lat: number;
        } | null;
    }>;
}) => {
    const { props } = usePage();
    const authUser = (props as any)?.auth?.user;
    const isFullscreen = Boolean((props as any)?.fullscreen);

    const baseData = useMemo(
        () =>
            Array.isArray(geojsons)
                ? geojsons.map((item) => ({
                      ...item,
                      kategori: item.kategori ?? undefined,
                  }))
                : [],
        [geojsons]
    );
    const [publicData, setPublicData] = useState<typeof baseData>([]);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const perPage = 300;
                let page = 1;
                const aggregated: any[] = [];
                let keepFetching = true;
                while (keepFetching) {
                    const res = await fetch(`/api/public/geojsons?mode=meta&per_page=${perPage}&page=${page}`);
                    if (!res.ok) break;
                    const json = await res.json();
                    const items = Array.isArray(json?.data) ? json.data : [];
                    aggregated.push(...items);
                    const meta = json?.meta ?? {};
                    const current = meta.current_page ?? page;
                    const last = meta.last_page ?? current;
                    if (!meta.last_page || current >= last) {
                        keepFetching = false;
                    } else {
                        page = current + 1;
                    }
                }
                if (mountedRef.current && aggregated.length > 0) {
                    const normalized = aggregated.map((item: any) => ({
                        id_geojson: item.id_geojson,
                        source_name: item.source_name,
                        main_category: item.main_category,
                        kategori: item.kategori ?? undefined,
                        geojson: item.geojson,
                        geojson_bbox: item.geojson_bbox ?? null,
                        kode_warna: item.kode_warna ?? '#3388ff',
                    })) as typeof baseData;
                    setPublicData(normalized);
                }
            } catch {
                // ignore
            }
        };
        fetchMetadata();
    }, []);

    const fetchGeojsonBatch = useCallback(async (ids: Array<string | number>) => {
        if (!ids || ids.length === 0) return {};
        try {
            const qs = encodeURIComponent(ids.map(String).join(','));
            const res = await fetch(`/api/public/geojsons?mode=full&ids=${qs}`);
            if (!res.ok) return {};
            const json = await res.json();
            const out: Record<string, any> = {};
            for (const item of json?.data || []) {
                const id = String(item.id_geojson);
                const feature = item.geojson;
                out[id] = feature && feature.geometry ? feature : null;
            }
            return out;
        } catch {
            return {};
        }
    }, []);

    const geojsonData = publicData.length > 0 ? publicData : baseData;

    if (isFullscreen) {
        return (
            <>
                <Head title="Peta Publik - Dinas PUPR Kabupaten Bintan">
                    <link rel="preconnect" href="https://fonts.bunny.net" />
                    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                </Head>
                <div className="min-h-screen bg-black">
                    <MapView geojsonData={geojsonData} readOnly fetchGeojsonBatch={fetchGeojsonBatch} />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Peta Publik - Dinas PUPR Kabupaten Bintan">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-slate-50">
                <header className="bg-white shadow-sm">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800">Dinas PUPR Kabupaten Bintan</h1>
                            <p className="text-sm text-slate-500">Sistem Informasi Peta RDTR & Infrastruktur</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('map.public.fullscreen')}
                                target="_blank"
                                className="rounded border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                                Peta Layar Penuh
                            </Link>
                            <Link
                                href={authUser ? route('dashboard') : route('login')}
                                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                            >
                                {authUser ? 'Ke Dashboard' : 'Masuk'}
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="bg-gradient-to-r from-blue-50 to-white py-12">
                    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 lg:flex-row lg:items-center">
                        <div className="flex-1">
                            <p className="text-sm uppercase text-blue-600">Informasi Publik</p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-800">Eksplorasi Peta RDTR Bintan</h2>
                            <p className="mt-3 text-slate-600">
                                Visualisasi interaktif rencana tata ruang dan infrastruktur. Akses cepat untuk masyarakat
                                dan pemangku kepentingan tanpa harus masuk ke sistem dashboard.
                            </p>
                        </div>
                        <div className="flex-1 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">Fitur Perkembangan</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Area ini disiapkan untuk modul informasi tambahan (berita, agenda, publikasi). Konten akan
                                diperbarui pada iterasi berikutnya.
                            </p>
                            <div className="mt-3 grid gap-3 text-sm text-slate-600 lg:grid-cols-2">
                                <div className="rounded border border-slate-200 p-3">
                                    <p className="text-xs uppercase text-slate-400">Berita</p>
                                    <p>Pengembangan modul berita lapangan.</p>
                                </div>
                                <div className="rounded border border-slate-200 p-3">
                                    <p className="text-xs uppercase text-slate-400">Agenda</p>
                                    <p>Rencana agenda publik segera tersedia.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 pb-8">
                    <div className="mx-auto max-w-6xl rounded-lg bg-white p-2 shadow">
                        <div className="h-[80vh] overflow-hidden rounded-md border">
                            <MapView geojsonData={geojsonData} readOnly fetchGeojsonBatch={fetchGeojsonBatch} />
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default Welcome;
