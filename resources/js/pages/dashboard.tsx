import MapView from '@/components/MapView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, Building2, FileText, FolderTree, Layers, Map, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const FILTER_PER_PAGE_OPTIONS = [150, 500, 1000, 1500, 3000, 5000];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    geojsons: any;
    regions: any;
    user: any;
    selectedIds?: Array<string | number>;
    stats: {
        total_geojsons: number;
        total_kategoris: number;
        total_regions: number;
        total_reports: number;
        total_owners: number;
        total_users: number;
    };
    byCategory: Array<{ orde1: string; kode_warna: string; total: number }>;
    byRegion: Array<{ region_name: string; total: number }>;
    byOwnerType: Array<{ type: string; total: number }>;
    timeline: Array<{ date: string; total: number }>;
    topUsers: Array<{ name: string; total: number }>;
    reportBySifat: Array<{ sifat: string; total: number }>;
    recentGeojsons: Array<{
        id_geojson: number;
        source_name: string;
        category: string;
        region: string;
        owner: string;
        user: string;
        created_at: string;
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const Dashboard = ({
    geojsons,
    regions,
    user,
    selectedIds,
    stats,
    byCategory,
    byRegion,
    byOwnerType,
    timeline,
    topUsers,
    reportBySifat,
    recentGeojsons,
}: DashboardProps) => {
    const [activeTab, setActiveTab] = useState('statistics');
    const initialGeojsons = useMemo(() => (Array.isArray(geojsons) ? geojsons : []), [geojsons]);
    const [geojsonMeta, setGeojsonMeta] = useState(initialGeojsons);
    const [isLoadingMeta, setIsLoadingMeta] = useState(initialGeojsons.length === 0);
    const [metaError, setMetaError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const isFetchingMetaRef = useRef(false);
    const [perPage, setPerPage] = useState(FILTER_PER_PAGE_OPTIONS[0]);
    const [filterSearch, setFilterSearch] = useState('');
    const [filterPagination, setFilterPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
    });

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (initialGeojsons.length > 0) {
            setGeojsonMeta(initialGeojsons);
            setIsLoadingMeta(false);
            setMetaError(null);
            setFilterPagination((prev) => ({
                ...prev,
                total: initialGeojsons.length,
            }));
        }
    }, [initialGeojsons]);

    const fetchMetadataPage = useCallback(
        async (page: number = 1, search: string = '', perPageOverride?: number) => {
            const effectivePerPage = perPageOverride ?? perPage;
            if (isFetchingMetaRef.current) return;
            isFetchingMetaRef.current = true;
            if (isMountedRef.current) {
                setIsLoadingMeta(true);
                setMetaError(null);
                if (page === 1) {
                    setGeojsonMeta([]);
                }
            }

            try {
                const params = new URLSearchParams({
                    mode: 'meta',
                    per_page: effectivePerPage.toString(),
                    page: page.toString(),
                });
                if (search.trim() !== '') {
                    params.set('search', search.trim());
                }

                const response = await fetch(`/api/dashboard/geojsons?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Gagal memuat metadata GeoJSON.');
                }
                const payload = await response.json();
                const pageData = Array.isArray(payload?.data) ? payload.data : [];
                const meta = payload?.meta ?? {};

                if (isMountedRef.current) {
                    setGeojsonMeta(pageData);
                    setFilterPagination({
                        current_page: meta.current_page ?? page,
                        last_page: meta.last_page ?? page,
                        per_page: meta.per_page ?? effectivePerPage,
                        total: meta.total ?? pageData.length,
                    });
                    setMetaError(null);
                }
            } catch (error: any) {
                console.error(error);
                if (isMountedRef.current) {
                    setGeojsonMeta([]);
                    setMetaError(error?.message ?? 'Gagal memuat metadata GeoJSON.');
                }
            } finally {
                if (isMountedRef.current) {
                    setIsLoadingMeta(false);
                }
                isFetchingMetaRef.current = false;
            }
        },
        [perPage],
    );

    useEffect(() => {
        fetchMetadataPage(1, filterSearch);
    }, [fetchMetadataPage]);

    const handleSearchChange = useCallback(
        (value: string) => {
            setFilterSearch(value);
            fetchMetadataPage(1, value);
        },
        [fetchMetadataPage],
    );

    const handleFilterPageChange = useCallback(
        (page: number) => {
            if (page < 1 || page > filterPagination.last_page) {
                return;
            }
            fetchMetadataPage(page, filterSearch);
        },
        [fetchMetadataPage, filterPagination.last_page, filterSearch],
    );

    const handleReloadGeojsons = useCallback(() => {
        fetchMetadataPage(filterPagination.current_page, filterSearch);
    }, [fetchMetadataPage, filterPagination.current_page, filterSearch]);

    const handleFilterPerPageChange = useCallback(
        (value: number) => {
            if (value === perPage) return;
            setPerPage(value);
            fetchMetadataPage(1, filterSearch, value);
        },
        [fetchMetadataPage, filterSearch, perPage],
    );

    const fetchFullGeojsonBatch = useCallback(async (ids: Array<string | number>) => {
        if (!ids || ids.length === 0) return {};
        const params = new URLSearchParams({
            mode: 'full',
            ids: ids.join(','),
        });
        const response = await fetch(`/api/dashboard/geojsons?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Gagal memuat detail GeoJSON.');
        }
        const payload = await response.json();
        const map: Record<string, any> = {};
        (payload?.data ?? []).forEach((item: any) => {
            if (item?.id_geojson && item?.geojson) {
                map[String(item.id_geojson)] = item.geojson;
            }
        });
        return map;
    }, []);

    // Format category data for pie chart
    const categoryData = byCategory.map((item) => ({
        name: item.orde1,
        value: item.total,
        color: item.kode_warna || '#3388ff',
    }));

    // Format owner type data
    const ownerTypeColors: Record<string, string> = {
        PT: '#0088FE',
        CV: '#00C49F',
        'Yayasan/Lembaga': '#FFBB28',
        Perorangan: '#FF8042',
    };

    const ownerTypeData = byOwnerType.map((item) => ({
        name: item.type,
        value: item.total,
        color: ownerTypeColors[item.type] || '#8884D8',
    }));

    // Format sifat data
    const sifatColors: Record<string, string> = {
        Biasa: '#82CA9D',
        Penting: '#FFC658',
        Segera: '#FF8042',
        Rahasia: '#8884D8',
    };

    const sifatData = reportBySifat.map((item) => ({
        name: item.sifat,
        value: item.total,
        color: sifatColors[item.sifat] || '#3388ff',
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="statistics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Statistik
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            Peta
                        </TabsTrigger>
                    </TabsList>

                    {/* Statistics Tab */}
                    <TabsContent value="statistics" className="space-y-4">
                        {/* Statistics Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Map SHP</CardTitle>
                                    <Map className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_geojsons.toLocaleString()}</div>
                                    <p className="text-muted-foreground text-xs">Fitur spasial dalam database</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
                                    <Layers className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_kategoris}</div>
                                    <p className="text-muted-foreground text-xs">Kategori layer</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Wilayah</CardTitle>
                                    <FolderTree className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_regions}</div>
                                    <p className="text-muted-foreground text-xs">Lokasi geografis</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Laporan PDF</CardTitle>
                                    <FileText className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_reports}</div>
                                    <p className="text-muted-foreground text-xs">Dokumen yang dihasilkan</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Pemilik</CardTitle>
                                    <Building2 className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_owners}</div>
                                    <p className="text-muted-foreground text-xs">Pemilik lahan/sumber daya</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="m-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                                    <Users className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-muted-foreground text-xs">Pengguna sistem</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Category Distribution */}
                            <Card className="p-3">
                                <CardHeader>
                                    <CardTitle>GeoJSON per Kategori</CardTitle>
                                    <CardDescription>Distribusi fitur berdasarkan kategori</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Regional Distribution */}
                            <Card className="p-3">
                                <CardHeader>
                                    <CardTitle>GeoJSON per Wilayah</CardTitle>
                                    <CardDescription>10 wilayah teratas berdasarkan jumlah fitur</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={byRegion}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="total" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 2 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Owner Type Distribution */}
                            <Card className="p-3">
                                <CardHeader>
                                    <CardTitle>GeoJSON per Tipe Pemilik</CardTitle>
                                    <CardDescription>Distribusi berdasarkan kategori kepemilikan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={ownerTypeData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#82ca9d">
                                                {ownerTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Report by Sifat */}
                            {sifatData.length > 0 && (
                                <Card className="p-3">
                                    <CardHeader>
                                        <CardTitle>Laporan per Prioritas</CardTitle>
                                        <CardDescription>Distribusi dokumen berdasarkan tingkat urgensi</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={sifatData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {sifatData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Timeline Chart */}
                        {timeline.length > 0 && (
                            <Card className="p-3">
                                <CardHeader>
                                    <CardTitle>Tren Pembuatan GeoJSON</CardTitle>
                                    <CardDescription>Fitur yang dibuat dalam 30 hari terakhir</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={timeline}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Users & Recent GeoJSON */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Top Users */}
                            {topUsers.length > 0 && (
                                <Card className="p-3">
                                    <CardHeader>
                                        <CardTitle>10 Kontributor Teratas</CardTitle>
                                        <CardDescription>Pengguna dengan fitur GeoJSON terbanyak</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {topUsers.map((user, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                    <span className="text-muted-foreground text-sm">{user.total} fitur</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent GeoJSON */}
                            <Card className="p-3">
                                <CardHeader>
                                    <CardTitle>GeoJSON Terbaru</CardTitle>
                                    <CardDescription>10 fitur terakhir yang ditambahkan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentGeojsons.map((item) => (
                                            <div key={item.id_geojson} className="border-b pb-3 last:border-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">{item.source_name || `ID: ${item.id_geojson}`}</p>
                                                        <div className="text-muted-foreground flex gap-2 text-xs">
                                                            <span className="rounded bg-blue-100 px-2 py-0.5 dark:bg-blue-900">{item.category}</span>
                                                            <span>{item.region}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground text-xs">{item.created_at}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">Oleh {item.user}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Map Tab */}
                    <TabsContent value="map" className="space-y-4">
                        <Card>
                            {/* <CardHeader>
                                <CardTitle>Peta Interaktif</CardTitle>
                                <CardDescription>Visualisasi geografis dari semua fitur</CardDescription>
                            </CardHeader> */}
                            <CardContent className="p-0">
                                <div className="h-[calc(100vh-200px)] w-full">
                                    <div className="relative h-full w-full">
                                        {(isLoadingMeta || metaError) && (
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/80 p-6 text-center">
                                                {isLoadingMeta && (
                                                    <>
                                                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
                                                        <div className="text-sm text-gray-700">
                                                            <p className="font-semibold">Menyiapkan data peta...</p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Halaman {filterPagination.current_page} dari {filterPagination.last_page}
                                                                {filterPagination.total > 0 && (
                                                                    <> ? {filterPagination.total.toLocaleString()} hasil</>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                                {metaError && (
                                                    <>
                                                        <p className="text-sm text-red-600">{metaError}</p>
                                                        <button
                                                            type="button"
                                                            className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-60"
                                                            onClick={handleReloadGeojsons}
                                                            disabled={isLoadingMeta}
                                                        >
                                                            Muat ulang data
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <MapView
                                            geojsonData={geojsonMeta}
                                            initialVisibleIds={selectedIds ?? []}
                                            fetchGeojsonBatch={fetchFullGeojsonBatch}
                                            filterSearch={filterSearch}
                                            onFilterSearch={handleSearchChange}
                                            filterPagination={filterPagination}
                                            onFilterPageChange={handleFilterPageChange}
                                            filterPerPageOptions={FILTER_PER_PAGE_OPTIONS}
                                            onFilterPerPageChange={handleFilterPerPageChange}
                                            isMetaLoading={isLoadingMeta}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
