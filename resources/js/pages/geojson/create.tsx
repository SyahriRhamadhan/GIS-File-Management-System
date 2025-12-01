import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Select from 'react-select';
import OwnerSearchInput from '@/components/OwnerSearchInput';
import RegionSearchInput from '@/components/RegionSearchInput';
import { saveAs } from 'file-saver';
import shp from 'shpjs';
import JSZip from 'jszip';
import * as toGeoJSON from '@tmcw/togeojson';

const CATEGORY_SELECTION_DISABLED = true;

// Custom styles for React Select to support dark/light mode
const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    
    const selectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: isDark ? '#374151' : '#ffffff',
            borderColor: state.isFocused ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#4b5563' : '#d1d5db'),
            color: isDark ? '#f3f4f6' : '#111827',
            '&:hover': {
                borderColor: isDark ? '#4b5563' : '#d1d5db',
            },
        }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: isDark ? '#374151' : '#ffffff',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? (isDark ? '#4b5563' : '#f3f4f6') 
                : state.isFocused 
                    ? (isDark ? '#4b5563' : '#f3f4f6') 
                    : (isDark ? '#374151' : '#ffffff'),
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: isDark ? '#9ca3af' : '#6b7280',
        }),
        input: (provided: any) => ({
            ...provided,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
    };

interface GeojsonFormProps {
    user_name: string;
    user_id: number;
    regions: { 
        id_region: number; 
        name: string;
        provinsi?: string;
        kabupaten?: string;
        kecamatan?: string;
        desa?: string;
        detail?: string;
        link?: string;
    }[];
    owner: { 
        id_owner: number; 
        name: string; 
        wali?: string; 
        type?: string; 
        no_hp?: string; 
    }[];
    kategoris: {
        orde1: string;
        orde2: string;
        orde3: string;
        orde4: string;
        id_kategori: number;
        orde0: string;
        kode_warna: string;
        ket_warna: string;
    }[];
}

interface FormValues {
    geojson?: string;
    geojson_file?: FileList;
    id_region?: string;
    id_owner?: string;
    id_kategori?: string;
    main_category?: string;
}

export default function GeojsonCreate({ user_name, user_id, regions, owner, kategoris }: GeojsonFormProps) {
    const { flash } = usePage().props as { flash?: { upload_errors?: string[] } };
    const [fileList, setFileList] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingShp, setIsDraggingShp] = useState(false);
    const [isDraggingKml, setIsDraggingKml] = useState(false);
    const shpInputRef = useRef<HTMLInputElement | null>(null);
    const kmlInputRef = useRef<HTMLInputElement | null>(null);
    
    // SHP/KML/KMZ to GeoJSON states
    const [shpGeojson, setShpGeojson] = useState<any>(null);
    const [previewGeojsons, setPreviewGeojsons] = useState<any[]>([]);
    const [convertedFilename, setConvertedFilename] = useState<string>('converted.geojson');
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [isApplyingAll, setIsApplyingAll] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Helper function to calculate file size in MB
    const getFileSizeInMB = (data: any): number => {
        const jsonString = JSON.stringify(data);
        const sizeInBytes = new Blob([jsonString]).size;
        return sizeInBytes / (1024 * 1024); // Convert to MB
    };

    // Helper function to check if file is too large (>10MB)
    const isFileTooLarge = (data: any): boolean => {
        return getFileSizeInMB(data) > 10;
    };

    useEffect(() => {
        if (flash?.upload_errors) {
            flash.upload_errors.forEach((msg) => toast.error(msg));
        }
    }, [flash]);



    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>();

    const [selectedKat, setSelectedKat] = useState<any>(null);

    // Always get file from react-hook-form
    const files = watch('geojson_file');

    // Sync fileList state for UI, always after file input changes
    useEffect(() => {
        if (files && files.length > 0) {
            setFileList(Array.from(files));
        } else {
            setFileList([]);
        }
    }, [files]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setValue('geojson_file', e.target.files);
            // state fileList diatur otomatis oleh useEffect di atas
        }
    };

    const handleRemoveFile = (idx: number) => {
        if (!files) return;
        const fileArr = Array.from(files);
        fileArr.splice(idx, 1);
        // update file input via DataTransfer
        const dataTransfer = new DataTransfer();
        fileArr.forEach((file) => dataTransfer.items.add(file));
        if (inputRef.current) inputRef.current.files = dataTransfer.files;
        setValue('geojson_file', dataTransfer.files.length ? dataTransfer.files : undefined);
        // fileList diupdate otomatis oleh useEffect di atas
    };

    const handleRemoveAll = () => {
        if (inputRef.current) inputRef.current.value = '';
        setValue('geojson_file', undefined);
        // fileList diupdate otomatis oleh useEffect di atas
    };

    // Drag and Drop handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            // Filter only .geojson files
            const geojsonFiles = Array.from(droppedFiles).filter(file =>
                file.name.toLowerCase().endsWith('.geojson')
            );

            if (geojsonFiles.length === 0) {
                toast.error('Hanya file .geojson yang diperbolehkan');
                return;
            }

            // Combine with existing files if any
            const existingFiles = files ? Array.from(files) : [];
            const allFiles = [...existingFiles, ...geojsonFiles];

            // Update file input via DataTransfer
            const dataTransfer = new DataTransfer();
            allFiles.forEach(file => dataTransfer.items.add(file));

            if (inputRef.current) {
                inputRef.current.files = dataTransfer.files;
            }

            setValue('geojson_file', dataTransfer.files);
            toast.success(`${geojsonFiles.length} file ditambahkan`);
        }
    };

    // SHP Drag and Drop handlers
    const handleShpDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingShp(true);
    };

    const handleShpDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingShp(false);
    };

    const handleShpDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleShpDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingShp(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            // Validate file types
            const validExtensions = ['.zip', '.shp', '.dbf', '.shx', '.prj', '.cpg'];
            const shpFiles = Array.from(droppedFiles).filter(file => {
                const ext = '.' + file.name.split('.').pop()?.toLowerCase();
                return validExtensions.includes(ext);
            });

            if (shpFiles.length === 0) {
                toast.error('Format file tidak valid. Upload file .zip atau SHP files');
                return;
            }

            // Create FileList-like object
            const dataTransfer = new DataTransfer();
            shpFiles.forEach(file => dataTransfer.items.add(file));

            // Trigger the upload handler
            const event = {
                target: { files: dataTransfer.files }
            } as React.ChangeEvent<HTMLInputElement>;

            handleShpUpload(event);
        }
    };

    // KML/KMZ Drag and Drop handlers
    const handleKmlDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingKml(true);
    };

    const handleKmlDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingKml(false);
    };

    const handleKmlDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleKmlDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingKml(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const kmlFiles = Array.from(droppedFiles).filter(file =>
                file.name.toLowerCase().endsWith('.kml') || file.name.toLowerCase().endsWith('.kmz')
            );

            if (kmlFiles.length === 0) {
                toast.error('Hanya file .kml atau .kmz yang diperbolehkan');
                return;
            }

            // Take only the first file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(kmlFiles[0]);

            // Trigger the upload handler
            const event = {
                target: { files: dataTransfer.files }
            } as React.ChangeEvent<HTMLInputElement>;

            handleKmlKmzUpload(event);
        }
    };

    // Helper function to group SHP files by basename
    const groupShpFiles = (files: FileList) => {
        const groups: { [key: string]: { [ext: string]: File } } = {};
        
        Array.from(files).forEach(file => {
            const name = file.name;
            const lastDot = name.lastIndexOf('.');
            const basename = lastDot > 0 ? name.substring(0, lastDot) : name;
            const extension = lastDot > 0 ? name.substring(lastDot + 1).toLowerCase() : '';
            
            if (!groups[basename]) {
                groups[basename] = {};
            }
            groups[basename][extension] = file;
        });
        
        return groups;
    };

    // Helper function to validate SHP file group
    const validateShpGroup = (group: { [ext: string]: File }) => {
        const hasShp = 'shp' in group;
        const hasDbf = 'dbf' in group;
        const hasShx = 'shx' in group;
        
        return {
            isValid: hasShp && hasDbf,
            hasShp,
            hasDbf,
            hasShx,
            hasPrj: 'prj' in group,
            hasCpg: 'cpg' in group
        };
    };

    // Helper function to create ArrayBuffer from individual SHP files
    const createShpArrayBuffer = async (group: { [ext: string]: File }) => {
        const shpBuffer = await group.shp.arrayBuffer();
        const dbfBuffer = await group.dbf.arrayBuffer();
        const shxBuffer = group.shx ? await group.shx.arrayBuffer() : null;
        const prjBuffer = group.prj ? await group.prj.arrayBuffer() : null;
        
        // Create a simple object structure that shpjs can understand
        const shpData: any = {
            shp: shpBuffer,
            dbf: dbfBuffer
        };
        
        if (shxBuffer) shpData.shx = shxBuffer;
        if (prjBuffer) shpData.prj = prjBuffer;
        
        return shpData;
    };

    // Normalize: convert closed LineString/MultiLineString to Polygon/MultiPolygon
    const normalizeClosedLinesToPolygons = (geojson: any) => {
        const isClosed = (coords: number[][]) => {
            if (!coords || coords.length < 4) return false;
            const a = coords[0];
            const b = coords[coords.length - 1];
            const dx = Math.abs((a?.[0] ?? 0) - (b?.[0] ?? 0));
            const dy = Math.abs((a?.[1] ?? 0) - (b?.[1] ?? 0));
            return dx < 1e-7 && dy < 1e-7;
        };
        const stripZ = (coords: any): any => Array.isArray(coords)
            ? coords.map((c: any) => Array.isArray(c) && typeof c[0] === 'number' ? [c[0], c[1]] : stripZ(c))
            : coords;

        const convert = (f: any) => {
            if (!f?.geometry) return f;
            const g = f.geometry;
            if (g.type === 'LineString' && isClosed(g.coordinates)) {
                return { ...f, geometry: { type: 'Polygon', coordinates: [stripZ(g.coordinates)] } };
            }
            if (g.type === 'MultiLineString') {
                const rings = (g.coordinates || []).filter((r: any) => isClosed(r));
                if (rings.length === (g.coordinates?.length || 0) && rings.length > 0) {
                    if (rings.length === 1) {
                        return { ...f, geometry: { type: 'Polygon', coordinates: [stripZ(rings[0])] } };
                    }
                    return { ...f, geometry: { type: 'MultiPolygon', coordinates: rings.map((r: any) => [stripZ(r)]) } };
                }
            }
            // also strip Z for polygons
            if (g.type === 'Polygon') {
                return { ...f, geometry: { type: 'Polygon', coordinates: stripZ(g.coordinates) } };
            }
            if (g.type === 'MultiPolygon') {
                return { ...f, geometry: { type: 'MultiPolygon', coordinates: stripZ(g.coordinates) } };
            }
            return f;
        };

        if (geojson?.type === 'FeatureCollection') {
            return { ...geojson, features: geojson.features.map(convert) };
        }
        if (geojson?.type === 'Feature') {
            return convert(geojson);
        }
        return geojson;
    };

    const extractFeaturesFromGeoJSON = (geojson: any): any[] => {
        if (!geojson) return [];

        if (Array.isArray(geojson)) {
            return geojson.reduce<any[]>((acc, item) => {
                acc.push(...extractFeaturesFromGeoJSON(item));
                return acc;
            }, []);
        }

        if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
            return geojson.features;
        }

        if (geojson.type === 'Feature') {
            return [geojson];
        }

        if (Array.isArray(geojson.features)) {
            return geojson.features;
        }

        return [];
    };

    // KML/KMZ to GeoJSON conversion helpers
    const parseKmlTextToGeoJSON = (kmlText: string) => {
        const dom = new DOMParser().parseFromString(kmlText, 'text/xml');
        const gj = toGeoJSON.kml(dom);
        return gj;
    };

    const handleKmlKmzUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setIsConverting(true);
        try {
            const file = files[0];
            const lower = file.name.toLowerCase();
            if (lower.endsWith('.kml')) {
                const text = await file.text();
                const gj = normalizeClosedLinesToPolygons(parseKmlTextToGeoJSON(text));
                setShpGeojson(gj);
                setPreviewGeojsons([]);
                setConvertedFilename(`${file.name.replace(/\.[^/.]+$/, '')}.geojson`);
                toast.success('Berhasil mengkonversi KML ke GeoJSON');
            } else if (lower.endsWith('.kmz')) {
                const buf = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(buf);
                const kmlEntry = zip.file(/doc\.kml$/i)[0] || zip.file(/\.kml$/i)[0];
                if (!kmlEntry) throw new Error('KMZ tidak berisi file KML');
                const kmlText = await kmlEntry.async('text');
                const gj = normalizeClosedLinesToPolygons(parseKmlTextToGeoJSON(kmlText));
                setShpGeojson(gj);
                setPreviewGeojsons([]);
                setConvertedFilename(`${file.name.replace(/\.[^/.]+$/, '')}.geojson`);
                toast.success('Berhasil mengkonversi KMZ ke GeoJSON');
            } else {
                toast.error('Format tidak dikenali. Pilih file .kml atau .kmz');
            }
        } catch (err: any) {
            toast.error(`Gagal mengkonversi KML/KMZ: ${err?.message || err}`);
        } finally {
            setIsConverting(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    // SHP to GeoJSON conversion functions
    const handleShpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        setIsConverting(true);
        try {
            // Check if it's a ZIP file
            if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                // Handle ZIP file (existing logic)
                const arrayBuffer = await files[0].arrayBuffer();
                const result = await shp(arrayBuffer);

                // Multiple parts case
                if (Array.isArray(result) && result.length > 1) {
                    const previewData = result.map((fc: any) => {
                        const name = fc.fileName
                            ? `${fc.fileName.replace(/\.[^/.]+$/, '')}.geojson`
                            : `${files[0].name.replace(/\.[^/.]+$/, '')}_part.geojson`;

                        return {
                            filename: name,
                            data: fc,
                        };
                    });
                    setPreviewGeojsons(previewData);
                    setShpGeojson(null);
                    toast.success(`Berhasil mengkonversi ${previewData.length} file GeoJSON dari ZIP`);
                }
                // Single file case
                else {
                    const fc = Array.isArray(result) ? result[0] : result;
                    setShpGeojson(fc);
                    const name = fc.fileName 
                        ? `${fc.fileName.replace(/\.[^/.]+$/, '')}.geojson` 
                        : `${files[0].name.replace(/\.[^/.]+$/, '')}.geojson`;
                    setConvertedFilename(name);
                    setPreviewGeojsons([]);
                    toast.success('Berhasil mengkonversi SHP ke GeoJSON dari ZIP');
                }
            } else {
                // Handle individual SHP files
                const groups = groupShpFiles(files);
                const validGroups: Array<{ basename: string; group: { [ext: string]: File } }> = [];
                const invalidGroups: string[] = [];

                // Validate each group
                for (const [basename, group] of Object.entries(groups)) {
                    const validation = validateShpGroup(group);
                    if (validation.isValid) {
                        validGroups.push({ basename, group });
                    } else {
                        const missing = [];
                        if (!validation.hasShp) missing.push('.shp');
                        if (!validation.hasDbf) missing.push('.dbf');
                        invalidGroups.push(`${basename} (missing: ${missing.join(', ')})`);
                    }
                }

                if (invalidGroups.length > 0) {
                    toast.error(`File tidak lengkap: ${invalidGroups.join(', ')}`);
                    return;
                }

                if (validGroups.length === 0) {
                    toast.error('Tidak ada file SHP yang valid ditemukan');
                    return;
                }

                // Convert valid groups
                const results = [];
                for (const { basename, group } of validGroups) {
                    try {
                        const shpData = await createShpArrayBuffer(group);
                        const result = await shp(shpData);
                        
                        const fc = Array.isArray(result) ? result[0] : result;
                        // Add fileName property for consistency with ZIP file processing
                        fc.fileName = basename;
                        results.push({
                            filename: `${basename}.geojson`,
                            data: fc
                        });
                    } catch (err) {
                        toast.error(`Gagal mengkonversi ${basename}: ${err}`);
                    }
                }

                if (results.length === 1) {
                    // Single result
                    setShpGeojson(results[0].data);
                    setConvertedFilename(results[0].filename);
                    setPreviewGeojsons([]);
                    toast.success(`Berhasil mengkonversi ${results[0].filename}`);
                } else if (results.length > 1) {
                    // Multiple results
                    setPreviewGeojsons(results);
                    setShpGeojson(null);
                    toast.success(`Berhasil mengkonversi ${results.length} file GeoJSON`);
                }
            }
        } catch (err) {
            toast.error('Gagal mengkonversi file: ' + err);
        } finally {
            setIsConverting(false);
        }
    };

    const handleUseConvertedGeoJSON = (geojsonData: any, filename: string) => {
        const payload =
            geojsonData && typeof geojsonData === 'object'
                ? { ...geojsonData }
                : geojsonData;

        if (payload && typeof payload === 'object' && !payload.fileName) {
            payload.fileName = filename;
        }

        setValue('geojson', JSON.stringify(payload, null, 2));
        toast.success(`GeoJSON "${filename}" siap untuk disimpan`);
    };

    const handleUseAllConvertedGeoJSON = async () => {
        if (!previewGeojsons.length) {
            toast.error('Tidak ada GeoJSON hasil konversi yang tersedia.');
            return;
        }

        setIsApplyingAll(true);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        try {
            const combinedFeatures: any[] = [];

            previewGeojsons.forEach((file) => {
                const items = extractFeaturesFromGeoJSON(file.data);
                items.forEach((feature) => {
                    const properties =
                        feature && typeof feature === 'object' && feature.properties && typeof feature.properties === 'object'
                            ? feature.properties
                            : {};

                    combinedFeatures.push({
                        ...feature,
                        properties: {
                            ...properties,
                            __source_filename: file.filename,
                        },
                    });
                });
            });

            if (!combinedFeatures.length) {
                toast.error('Tidak ada fitur GeoJSON valid dari hasil konversi.');
                return;
            }

            const combinedCollection = {
                type: 'FeatureCollection',
                features: combinedFeatures,
                fileName:
                    previewGeojsons.length === 1
                        ? previewGeojsons[0].filename
                        : `${previewGeojsons.length}-files-batch.geojson`,
            };

            setValue('geojson', JSON.stringify(combinedCollection, null, 2));
            toast.success(
                `Semua GeoJSON (${previewGeojsons.length} file, ${combinedFeatures.length} fitur) siap untuk disimpan`
            );
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan saat menggabungkan seluruh GeoJSON.');
        } finally {
            setIsApplyingAll(false);
        }
    };

    const handleDownloadGeoJSON = (geojsonData: any, filename: string) => {
        const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/json' });
        saveAs(blob, filename);
    };

    const handleDownloadAllGeoJSON = () => {
        if (previewGeojsons.length > 0) {
            previewGeojsons.forEach(({ filename, data }) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                saveAs(blob, filename);
            });
            toast.success(`${previewGeojsons.length} file berhasil didownload`);
        } else if (shpGeojson) {
            const blob = new Blob([JSON.stringify(shpGeojson, null, 2)], { type: 'application/json' });
            saveAs(blob, convertedFilename);
            toast.success('File berhasil didownload');
        }
    };

    const handleClearConversion = () => {
        setShpGeojson(null);
        setPreviewGeojsons([]);
        setConvertedFilename('converted.geojson');
    };

    const onSubmit = (data: FormValues) => {
        const formData = new FormData();

        if (data.geojson_file?.length) {
            Array.from(data.geojson_file).forEach((file) => formData.append('geojson_file[]', file));
        } else if (data.geojson) {
            try {
                const obj = JSON.parse(data.geojson);
                formData.append('geojson', JSON.stringify(obj));
            } catch {
                toast.error('Format GeoJSON teks tidak valid');
                return;
            }
        } else {
            toast.error('Harus pilih file .geojson atau isi teks GeoJSON');
            return;
        }

        formData.append('id_user', user_id.toString());
        if (data.id_region) formData.append('id_region', data.id_region);
        if (data.id_owner) formData.append('id_owner', data.id_owner);
        if (data.id_kategori) formData.append('id_kategori', data.id_kategori);
        if (data.main_category) formData.append('main_category', data.main_category);

        router.post('/dashboard/geojson', formData, {
            onStart: () => setIsSubmitting(true),
            onError: (errs) => {
                Object.values(errs || {}).forEach((msg) => {
                    if (typeof msg === 'string') toast.error(msg);
                });
                toast.error('Gagal menyimpan GeoJSON');
            },
            onSuccess: () => {
                toast.success('Semua fitur berhasil disimpan');
                router.visit('/dashboard/geojson');
            },
            onFinish: () => setIsSubmitting(false),
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // Format for React Select
    const categoryOptions = kategoris.map((k) => ({
        value: k.id_kategori,
        label: `${k.orde0} / ${k.orde1} / ${k.orde2} / ${k.orde3} / ${k.orde4}`,
        ...k,
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Geojson', href: '/dashboard/geojson' },
                { title: 'Create Geojson', href: '/dashboard/geojson/create' },
            ]}
        >
            <div className="bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <h1 className="mb-4 text-2xl font-bold">Create Geojson</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    
                    {/* Region */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Region</label>
                        <Controller
                            name="id_region"
                            control={control}
                            render={({ field, fieldState }) => (
                                <RegionSearchInput
                                    regions={regions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    placeholder="Cari atau pilih region..."
                                />
                            )}
                        />
                    </div>

                    {/* Owner */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Owner</label>
                        <Controller
                            name="id_owner"
                            control={control}
                            render={({ field, fieldState }) => (
                                <OwnerSearchInput
                                    owners={owner}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    placeholder="Cari atau pilih owner..."
                                />
                            )}
                        />
                    </div>

                    {/* SHP to GeoJSON Converter */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                            SHP to GeoJSON Converter
                        </h3>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Upload file ZIP yang berisi SHP atau file-file SHP individual untuk dikonversi ke GeoJSON dan langsung digunakan dalam form ini.
                        </p>
                        
                        <div className="space-y-4">
                            {/* SHP Upload with Drag and Drop */}
                            <div>
                                <label htmlFor="shpUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Upload File SHP
                                </label>

                                <div
                                    onDragEnter={handleShpDragEnter}
                                    onDragLeave={handleShpDragLeave}
                                    onDragOver={handleShpDragOver}
                                    onDrop={handleShpDrop}
                                    className={`mt-2 rounded-lg border-2 border-dashed transition-all ${
                                        isDraggingShp
                                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                                            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                                    } ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        id="shpUpload"
                                        type="file"
                                        accept=".zip,.shp,.dbf,.shx,.prj,.cpg"
                                        multiple
                                        onChange={handleShpUpload}
                                        disabled={isConverting}
                                        ref={shpInputRef}
                                        className="hidden"
                                    />

                                    <label
                                        htmlFor="shpUpload"
                                        className={`flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center ${isConverting ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <svg
                                            className={`mb-2 h-10 w-10 transition-colors ${
                                                isDraggingShp
                                                    ? 'text-blue-500 dark:text-blue-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {isDraggingShp ? (
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    Drop SHP files di sini
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        Click untuk upload
                                                    </span>{' '}
                                                    atau drag and drop
                                                </>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            ZIP, SHP, DBF, SHX, PRJ, CPG
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* KML/KMZ to GeoJSON with Drag and Drop */}
                            <div className="mt-6">
                                <h4 className="mb-2 text-md font-semibold text-gray-800 dark:text-gray-200">KML/KMZ to GeoJSON</h4>
                                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Unggah file .kml atau .kmz untuk dikonversi.</p>

                                <div
                                    onDragEnter={handleKmlDragEnter}
                                    onDragLeave={handleKmlDragLeave}
                                    onDragOver={handleKmlDragOver}
                                    onDrop={handleKmlDrop}
                                    className={`rounded-lg border-2 border-dashed transition-all ${
                                        isDraggingKml
                                            ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                                            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                                    } ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        id="kmlKmzUpload"
                                        type="file"
                                        accept=".kml,.kmz"
                                        onChange={handleKmlKmzUpload}
                                        disabled={isConverting}
                                        ref={kmlInputRef}
                                        className="hidden"
                                    />

                                    <label
                                        htmlFor="kmlKmzUpload"
                                        className={`flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center ${isConverting ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <svg
                                            className={`mb-2 h-10 w-10 transition-colors ${
                                                isDraggingKml
                                                    ? 'text-green-500 dark:text-green-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {isDraggingKml ? (
                                                <span className="text-green-600 dark:text-green-400">
                                                    Drop KML/KMZ file di sini
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        Click untuk upload
                                                    </span>{' '}
                                                    atau drag and drop
                                                </>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            File KML atau KMZ
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {isConverting && (
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                    <span className="text-sm">Mengkonversi file...</span>
                                </div>
                            )}

                            {/* Single GeoJSON Result */}
                            {shpGeojson && (
                                <div className="rounded border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                {convertedFilename}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                                ({getFileSizeInMB(shpGeojson).toFixed(2)} MB)
                                            </span>
                                            {isFileTooLarge(shpGeojson) && (
                                                <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                                    ⚠️ File lebih dari 10MB, hanya bisa download
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            {!isFileTooLarge(shpGeojson) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUseConvertedGeoJSON(shpGeojson, convertedFilename)}
                                                    disabled={isApplyingAll || isConverting || isSubmitting}
                                                    className={`rounded px-3 py-1 text-xs font-semibold text-white transition ${
                                                        isApplyingAll || isConverting || isSubmitting
                                                            ? 'bg-green-400 cursor-not-allowed opacity-70'
                                                            : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                    title="Gunakan GeoJSON ini di form"
                                                >
                                                    {isApplyingAll ? 'Memproses...' : 'Gunakan'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadGeoJSON(shpGeojson, convertedFilename)}
                                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                title="Download file GeoJSON"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Multiple GeoJSON Results */}
                            {previewGeojsons.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {previewGeojsons.length} file GeoJSON berhasil dikonversi
                                            </span>
                                            {(() => {
                                                const largeFiles = previewGeojsons.filter(file => isFileTooLarge(file.data));
                                                return largeFiles.length > 0 && (
                                                    <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                                        ⚠️ {largeFiles.length} file lebih dari 10MB
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const hasLargeFiles = previewGeojsons.some(file => isFileTooLarge(file.data));
                                                return !hasLargeFiles && (
                                                    <button
                                                        type="button"
                                                        onClick={handleUseAllConvertedGeoJSON}
                                                        disabled={isApplyingAll || isConverting || isSubmitting}
                                                        className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold text-white transition ${
                                                            isApplyingAll || isConverting || isSubmitting
                                                                ? 'bg-green-400 cursor-not-allowed opacity-70'
                                                                : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                        title="Gunakan semua GeoJSON di form"
                                                    >
                                                        {isApplyingAll ? (
                                                            <>
                                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                                                Menggabungkan...
                                                            </>
                                                        ) : (
                                                            'Gunakan Semua'
                                                        )}
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                type="button"
                                                onClick={handleDownloadAllGeoJSON}
                                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                title="Download semua file GeoJSON"
                                            >
                                                Download Semua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearConversion}
                                                className="rounded bg-gray-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-gray-600"
                                                title="Hapus semua hasil konversi"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    {isApplyingAll && (
                                        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200">
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></span>
                                            <span>Menggabungkan semua data GeoJSON...</span>
                                        </div>
                                    )}
                                    {previewGeojsons.map((file, index) => {
                                        const fileSizeMB = getFileSizeInMB(file.data);
                                        const isTooLarge = isFileTooLarge(file.data);

                                        return (
                                            <div key={index} className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                                {file.filename}
                                                            </span>
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                ({fileSizeMB.toFixed(2)} MB)
                                                            </span>
                                                        </div>
                                                        {isTooLarge && (
                                                            <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                                                ⚠️ File lebih dari 10MB, hanya bisa download
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        {!isTooLarge && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUseConvertedGeoJSON(file.data, file.filename)}
                                                                disabled={isApplyingAll || isConverting || isSubmitting}
                                                                className={`rounded px-3 py-1 text-xs font-semibold text-white transition ${
                                                                    isApplyingAll || isConverting || isSubmitting
                                                                        ? 'bg-green-400 cursor-not-allowed opacity-70'
                                                                        : 'bg-green-600 hover:bg-green-700'
                                                                }`}
                                                                title="Gunakan GeoJSON ini di form"
                                                            >
                                                                {isApplyingAll ? 'Memproses...' : 'Gunakan'}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadGeoJSON(file.data, file.filename)}
                                                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                            title="Download file GeoJSON"
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {(shpGeojson || previewGeojsons.length > 0) && (
                                <button
                                    type="button"
                                    onClick={handleClearConversion}
                                    className="w-full rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
                                >
                                    Clear Semua Konversi
                                </button>
                            )}
                        </div>
                    </div>

                    {/* GeoJSON Text */}
                    <div>
                        <label htmlFor="geojson" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                            GeoJSON (Text Format)
                        </label>
                        <textarea
                            id="geojson"
                            {...register('geojson')}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        {errors.geojson && <p className="mt-1 text-sm text-red-600">{errors.geojson.message}</p>}
                    </div>

                    {/* GeoJSON File */}
                    <div>
                        <label htmlFor="geojson_file" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                            GeoJSON (File Upload)
                        </label>

                        {/* Drag and Drop Zone */}
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`relative rounded-lg border-2 border-dashed transition-all ${
                                isDragging
                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                            }`}
                        >
                            <input
                                id="geojson_file"
                                type="file"
                                accept=".geojson"
                                multiple
                                {...register('geojson_file')}
                                ref={inputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <label
                                htmlFor="geojson_file"
                                className="flex cursor-pointer flex-col items-center justify-center px-6 py-8 text-center"
                            >
                                <svg
                                    className={`mb-3 h-12 w-12 transition-colors ${
                                        isDragging
                                            ? 'text-blue-500 dark:text-blue-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {isDragging ? (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            Drop file di sini
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-blue-600 dark:text-blue-400">
                                                Click untuk upload
                                            </span>{' '}
                                            atau drag and drop
                                        </>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    File GeoJSON (.geojson) - Multiple files diperbolehkan
                                </p>
                            </label>
                        </div>

                        {errors.geojson_file && <p className="mt-1 text-sm text-red-600">{errors.geojson_file.message}</p>}

                        {/* List nama file yang sudah dipilih */}
                        {fileList.length > 0 && (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {fileList.length} file dipilih
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveAll}
                                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-red-700"
                                    >
                                        Hapus Semua
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {fileList.map((file, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <svg
                                                    className="h-5 w-5 flex-shrink-0 text-blue-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                                    {file.name}
                                                </span>
                                                <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                                    ({(file.size / 1024).toFixed(2)} KB)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="flex-shrink-0 rounded bg-red-100 p-1.5 text-red-600 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                                                title="Hapus file"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* User (readonly) */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">User</label>
                        <input
                            value={user_name}
                            readOnly
                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>


                    {/* Category with live-preview */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Category</label>

                        <Controller
                            name="id_kategori"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Select<(typeof categoryOptions)[0]>
                                    {...field}
                                    options={categoryOptions}
                                    value={categoryOptions.find((opt) => opt.value.toString() === field.value)}
                                    onChange={(opt) => {
                                        if (CATEGORY_SELECTION_DISABLED) return;
                                        field.onChange(opt?.value.toString() ?? '');
                                        setSelectedKat(opt);
                                    }}
                                    getOptionLabel={(e) => e.label}
                                    getOptionValue={(e) => e.value.toString()}
                                    placeholder={
                                        CATEGORY_SELECTION_DISABLED ? 'Pemilihan kategori sedang dikunci' : '— Select Category —'
                                    }
                                    isDisabled={CATEGORY_SELECTION_DISABLED}
                                    styles={selectStyles}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            )}
                        />

                        {CATEGORY_SELECTION_DISABLED ? (
                            <p className="mt-2 text-sm text-amber-600">
                                Pemilihan kategori sementara dinonaktifkan oleh administrator. Gunakan field lain seperti Main
                                Category untuk klasifikasi sementara.
                            </p>
                        ) : (
                            selectedKat && (
                                <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                                    <span className="block h-6 w-6 flex-shrink-0 rounded" style={{ backgroundColor: selectedKat.kode_warna }} />
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedKat.orde0}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Orde 1 = {selectedKat.orde1}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Orde 2 = {selectedKat.orde2}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Orde 3 = {selectedKat.orde3}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Orde 4 = {selectedKat.orde4}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">*Ket {selectedKat.ket_warna}</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Main Category */}
                    <div>
                        <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Main Category</label>
                        <Controller
                            name="main_category"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={[
                                        { value: 'RDTR', label: 'RDTR (Rencana Detail Tata Ruang)' },
                                        { value: 'RTRW', label: 'RTRW (Rencana Tata Ruang Wilayah)' },
                                        { value: 'KKPR', label: 'KKPR (Kawasan Konservasi dan Perlindungan)' },
                                        { value: 'GANTI RUGI', label: 'GANTI RUGI' },
                                    ]}
                                    value={
                                        field.value
                                            ? { value: field.value, label: field.value === 'RDTR' ? 'RDTR (Rencana Detail Tata Ruang)' : field.value === 'RTRW' ? 'RTRW (Rencana Tata Ruang Wilayah)' : field.value === 'KKPR' ? 'KKPR (Kawasan Konservasi dan Perlindungan)' : 'GANTI RUGI' }
                                            : null
                                    }
                                    onChange={(opt) => field.onChange(opt?.value ?? '')}
                                    placeholder="— Select Main Category —"
                                    styles={selectStyles}
                                    isClearable
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            )}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => router.visit('/dashboard/geojson')}
                            className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isConverting || isApplyingAll}
                            className={`inline-flex items-center gap-2 rounded px-4 py-2 text-white transition ${
                                isSubmitting || isConverting || isApplyingAll
                                    ? 'bg-blue-400 cursor-not-allowed opacity-70'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
