import { Head } from '@inertiajs/react';
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

    return (
        <>
            <Head title="Peta Publik - Dinas PUPR Kabupaten Bintan">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <MapView geojsonData={geojsonData} readOnly fetchGeojsonBatch={fetchGeojsonBatch} />
        </>
    );
};

export default Welcome;
