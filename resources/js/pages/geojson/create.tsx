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
}

export default function GeojsonCreate({ user_name, user_id, regions, owner, kategoris }: GeojsonFormProps) {
    const { flash } = usePage().props as { flash?: { upload_errors?: string[] } };
    const [fileList, setFileList] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    
    // SHP to GeoJSON states
    const [shpGeojson, setShpGeojson] = useState<any>(null);
    const [previewGeojsons, setPreviewGeojsons] = useState<any[]>([]);
    const [convertedFilename, setConvertedFilename] = useState<string>('converted.geojson');
    const [isConverting, setIsConverting] = useState<boolean>(false);

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
        // Convert GeoJSON object to string and set it to the form
        setValue('geojson', JSON.stringify(geojsonData, null, 2));
        toast.success(`GeoJSON "${filename}" siap untuk disimpan`);
    };

    const handleDownloadGeoJSON = (geojsonData: any, filename: string) => {
        const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/json' });
        saveAs(blob, filename);
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
        }

        formData.append('id_user', user_id.toString());
        if (data.id_region) formData.append('id_region', data.id_region);
        if (data.id_owner) formData.append('id_owner', data.id_owner);
        if (data.id_kategori) formData.append('id_kategori', data.id_kategori);

        router.post('/dashboard/geojson', formData);
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
                            <div>
                                <label htmlFor="shpUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Upload File SHP
                                </label>
                                <input
                                    id="shpUpload"
                                    type="file"
                                    accept=".zip,.shp,.dbf,.shx,.prj,.cpg"
                                    multiple
                                    onChange={handleShpUpload}
                                    disabled={isConverting}
                                    className="mt-2 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Format: <code>.zip</code> berisi SHP files, atau upload file individual <code>.shp</code>, <code>.dbf</code>, <code>.shx</code>, <code>.prj</code>, <code>.cpg</code>
                                </p>
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
                                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                            {convertedFilename}
                                        </span>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleUseConvertedGeoJSON(shpGeojson, convertedFilename)}
                                                className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                                            >
                                                Gunakan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadGeoJSON(shpGeojson, convertedFilename)}
                                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
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
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {previewGeojsons.length} file GeoJSON berhasil dikonversi:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleClearConversion}
                                            className="rounded bg-gray-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-gray-600"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {previewGeojsons.map((file, index) => (
                                        <div key={index} className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                    {file.filename}
                                                </span>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUseConvertedGeoJSON(file.data, file.filename)}
                                                        className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                                                    >
                                                        Gunakan
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadGeoJSON(file.data, file.filename)}
                                                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                        <input
                            id="geojson_file"
                            type="file"
                            accept=".geojson"
                            multiple
                            {...register('geojson_file')}
                            ref={inputRef}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            onChange={handleFileChange}
                        />
                        {errors.geojson_file && <p className="mt-1 text-sm text-red-600">{errors.geojson_file.message}</p>}

                        {/* List nama file yang sudah dipilih */}
                        {fileList.length > 0 && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                                <ul className="list-disc pl-6 text-xs text-gray-700 dark:text-gray-200">
                                    {fileList.map((file, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center justify-between gap-2 border-b border-dashed border-gray-200 py-1 last:border-0 dark:border-gray-700"
                                        >
                                            <span className="truncate">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                            >
                                                Cancel
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={handleRemoveAll}
                                    className="mt-3 rounded bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-red-700"
                                >
                                    Cancel Semua
                                </button>
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
                                        field.onChange(opt?.value.toString() ?? '');
                                        setSelectedKat(opt);
                                    }}
                                    getOptionLabel={(e) => e.label}
                                    getOptionValue={(e) => e.value.toString()}
                                    placeholder="— Select Category —"
                                    styles={selectStyles}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            )}
                        />

                        {selectedKat && (
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
                        )}
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
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
