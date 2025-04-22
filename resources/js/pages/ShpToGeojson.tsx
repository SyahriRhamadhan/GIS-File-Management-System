import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { saveAs } from 'file-saver';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import shp from 'shpjs';

export default function ShpClientFullscreen() {
    const [geojson, setGeojson] = useState<any>(null);
    const [previewGeojsons, setPreviewGeojsons] = useState<any[]>([]); // Untuk menyimpan preview GeoJSON
    const [filename, setFilename] = useState<string>('converted.geojson');
    const geoJsonLayerRef = useRef<any>(null);
    const mapRef = useRef<any>(null);

    const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const zipFile = files[0];
        setFilename(zipFile.name.replace(/\.[^/.]+$/, '') + '.geojson');

        try {
            const arrayBuffer = await zipFile.arrayBuffer();
            const result = await shp(arrayBuffer);

            if (Array.isArray(result) && result.length > 1) {
                // Pisahkan hasil menjadi preview GeoJSON dan simpan untuk di-download nanti
                const previewData = result.map((featureCollection, index) => ({
                    filename: `${filename.replace('.geojson', '')}_part${index + 1}.geojson`,
                    data: featureCollection,
                }));
                setPreviewGeojsons(previewData); // Menyimpan preview GeoJSON
            } else {
                setGeojson(result);
            }
        } catch (error) {
            alert('Gagal mengonversi file: ' + error);
        }
    };

    const handleDownload = () => {
        if (previewGeojsons.length > 0) {
            // Jika ada banyak file GeoJSON, unduh semuanya
            previewGeojsons.forEach(({ filename, data }) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                saveAs(blob, filename);
            });
        } else if (geojson) {
            // Jika hanya ada satu file GeoJSON
            const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
            saveAs(blob, filename);
        }
    };

    const handleGeoJsonReady = (layer: any) => {
        geoJsonLayerRef.current = layer;
        if (mapRef.current && layer) {
            mapRef.current.fitBounds(layer.getBounds());
        }
    };

    const [isFormVisible, setIsFormVisible] = useState(true);
    const toggleFormVisibility = () => {
        setIsFormVisible(!isFormVisible);
    };

    function PreviewGeoJSON({ data }: { data: any }) {
        const map = useMap();
        useEffect(() => {
            // Buat layer manual supaya bisa hitung bounds + bind popup
            const layer = L.geoJSON(data, { onEachFeature });
            const bounds = layer.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
        }, [data, map]);

        // Render GeoJSON dengan popup
        return <GeoJSON data={data} onEachFeature={onEachFeature} />;
    }

    const downloadSingle = (file: { filename: string; data: any }) => {
        const blob = new Blob([JSON.stringify(file.data, null, 2)], {
            type: 'application/json',
        });
        saveAs(blob, file.filename);
    };

    const onEachFeature = (feature: any, layer: any) => {
        if (feature.properties) {
            let popupContent = '<div>';
            Object.entries(feature.properties).forEach(([key, value]) => {
                popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
            });
            popupContent += '</div>';
            layer.bindPopup(popupContent);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'SHP to GeoJSON Client', href: '#' },
            ]}
        >
            <Head title="Full Map SHP Viewer" />

            <div className="relative z-0 h-[calc(100vh-64px)] w-full">
                <div className="absolute z-[999] ms-4 mt-20 flex flex-col space-y-4 rounded bg-white/90 p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <button onClick={toggleFormVisibility} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                            <span className="text-sm font-semibold">{isFormVisible ? <FaEye /> : <FaEyeSlash />}</span>
                            {isFormVisible ? <FaChevronLeft /> : <FaChevronRight />}
                        </button>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out ${isFormVisible ? 'translate-x-0' : '-translate-x-full'}`}
                        style={{ maxWidth: '400px' }}
                    >
                        {isFormVisible && (
                            <div>
                                <div>
                                    <label htmlFor="zipUpload" className="block text-sm font-semibold text-gray-700">
                                        Upload File ZIP
                                    </label>
                                    <input
                                        id="zipUpload"
                                        type="file"
                                        accept=".zip"
                                        onChange={handleZipUpload}
                                        className="mt-2 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 focus:outline-none"
                                        title="Unggah file ZIP yang berisi .shp, .shx, .dbf. Opsional: .prj, .cpg"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Format yang diperbolehkan: <code>.zip</code> berisi <code>.shp</code>, <code>.shx</code>, <code>.dbf</code>.
                                        (Opsional: <code>.prj</code>, <code>.cpg</code>)
                                    </p>
                                </div>

                                {/* Preview GeoJSON jika ada lebih dari satu */}

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleDownload}
                                        className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {previewGeojsons.length > 0 ? 'Download All GeoJSON' : 'Download GeoJSON'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <MapContainer
                    className="relative z-0 h-[500px] w-full"
                    ref={mapRef}
                    center={[1, 104.521117]}
                    zoom={11}
                    scrollWheelZoom
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {previewGeojsons.length > 0
                        ? previewGeojsons.map((file, idx) => (
                              <GeoJSON
                                  key={idx}
                                  data={file.data}
                                  onEachFeature={onEachFeature}
                                  eventHandlers={{ add: (e) => handleGeoJsonReady(e.target) }}
                              />
                          ))
                        : geojson && (
                              <GeoJSON data={geojson} onEachFeature={onEachFeature} eventHandlers={{ add: (e) => handleGeoJsonReady(e.target) }} />
                          )}
                </MapContainer>

                {previewGeojsons.length > 0 && (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-5 h-auto flex-1 space-y-4 overflow-hidden rounded-xl border p-5 md:min-h-min">
                        <div>
                            <h4 className="justify-content-center text-start text-xl font-semibold">Preview GeoJSON</h4>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleDownload}
                                    className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {previewGeojsons.length > 0 ? 'Download All GeoJSON' : 'Download GeoJSON'}
                                </button>
                            </div>
                        </div>
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {previewGeojsons.map((file, index) => (
                                <li key={index} className="flex flex-col overflow-hidden rounded-lg bg-white shadow-md">
                                    {/* Header kartu: nama file & tombol */}
                                    <div className="flex items-center justify-between border-b px-4 py-2">
                                        <span className="truncate text-sm font-medium text-gray-800">{file.filename}</span>
                                        <button
                                            onClick={() => downloadSingle(file)}
                                            className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                                        >
                                            Download
                                        </button>
                                    </div>

                                    {/* Konten kartu: peta */}
                                    <div className="flex-1">
                                        <MapContainer style={{ height: '300px', width: '100%' }} scrollWheelZoom>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            {/* Ini yang menampilkan popup saat klik feature */}
                                            <PreviewGeoJSON data={file.data} />
                                        </MapContainer>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <br />
            </div>
        </AppLayout>
    );
}
