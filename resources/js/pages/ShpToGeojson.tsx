import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { saveAs } from 'file-saver';
import 'leaflet/dist/leaflet.css';
import { useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import shp from 'shpjs';

export default function ShpClientFullscreen() {
    const [geojson, setGeojson] = useState<any>(null);
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
            setGeojson(result);
        } catch (error) {
            alert('Gagal mengonversi file: ' + error);
        }
    };

    const handleDownload = () => {
        if (!geojson) return;
        const blob = new Blob([JSON.stringify(geojson, null, 2)], {
            type: 'application/json',
        });
        saveAs(blob, filename);
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

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'SHP to GeoJSON Client', href: '#' },
            ]}
        >
            <Head title="Full Map SHP Viewer" />

            <div className="relative h-[calc(100vh-64px)] w-full">
                {' '}
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

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleDownload}
                                        className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Download GeoJSON
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Full Height Map */}
                <MapContainer ref={mapRef} center={[1, 104.521117]} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {geojson && (
                        <GeoJSON
                            data={geojson}
                            eventHandlers={{
                                add: (e) => handleGeoJsonReady(e.target),
                            }}
                        />
                    )}
                </MapContainer>
            </div>
        </AppLayout>
    );
}
