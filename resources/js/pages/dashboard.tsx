import MapView from '@/components/MapView';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line,
    AreaChart, Area
} from 'recharts';
import { Map, Layers, Users, FileText, Building2, FolderTree, BarChart3 } from 'lucide-react';
import { useState } from 'react';

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
    recentGeojsons
}: DashboardProps) => {
    const [activeTab, setActiveTab] = useState('statistics');
    const geojsonData = Array.isArray(geojsons) ? geojsons : [];

    // Format category data for pie chart
    const categoryData = byCategory.map((item) => ({
        name: item.orde1,
        value: item.total,
        color: item.kode_warna || '#3388ff'
    }));

    // Format owner type data
    const ownerTypeColors: Record<string, string> = {
        'PT': '#0088FE',
        'CV': '#00C49F',
        'Yayasan/Lembaga': '#FFBB28',
        'Perorangan': '#FF8042'
    };

    const ownerTypeData = byOwnerType.map((item) => ({
        name: item.type,
        value: item.total,
        color: ownerTypeColors[item.type] || '#8884D8'
    }));

    // Format sifat data
    const sifatColors: Record<string, string> = {
        'Biasa': '#82CA9D',
        'Penting': '#FFC658',
        'Segera': '#FF8042',
        'Rahasia': '#8884D8'
    };

    const sifatData = reportBySifat.map((item) => ({
        name: item.sifat,
        value: item.total,
        color: sifatColors[item.sifat] || '#3388ff'
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
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total GeoJSON</CardTitle>
                                    <Map className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_geojsons.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Fitur spasial dalam database</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_kategoris}</div>
                                    <p className="text-xs text-muted-foreground">Kategori layer</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Wilayah</CardTitle>
                                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_regions}</div>
                                    <p className="text-xs text-muted-foreground">Lokasi geografis</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Laporan PDF</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_reports}</div>
                                    <p className="text-xs text-muted-foreground">Dokumen yang dihasilkan</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Pemilik</CardTitle>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_owners}</div>
                                    <p className="text-xs text-muted-foreground">Pemilik lahan/sumber daya</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-xs text-muted-foreground">Pengguna sistem</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Category Distribution */}
                            <Card>
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
                            <Card>
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
                            <Card>
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
                                <Card>
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
                            <Card>
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
                                <Card>
                                    <CardHeader>
                                        <CardTitle>10 Kontributor Teratas</CardTitle>
                                        <CardDescription>Pengguna dengan fitur GeoJSON terbanyak</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {topUsers.map((user, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{user.total} fitur</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent GeoJSON */}
                            <Card>
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
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            <span className="rounded bg-blue-100 px-2 py-0.5 dark:bg-blue-900">{item.category}</span>
                                                            <span>{item.region}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{item.created_at}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">Oleh {item.user}</p>
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
                                    <MapView geojsonData={geojsonData} initialVisibleIds={selectedIds ?? []} />
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
