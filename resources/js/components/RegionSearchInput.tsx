import React, { useState, useEffect, useRef } from 'react';
import { IoAdd, IoSearch, IoClose, IoLocationOutline } from 'react-icons/io5';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface Region {
    id_region: number;
    name: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
    detail?: string;
    link?: string;
}

interface RegionSearchInputProps {
    regions: Region[];
    value?: string;
    onChange: (regionId: string) => void;
    error?: string;
    placeholder?: string;
}

interface NewRegionForm {
    name: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    detail: string;
    link: string;
}

export default function RegionSearchInput({ 
    regions, 
    value, 
    onChange, 
    error, 
    placeholder = "Cari atau pilih region..." 
}: RegionSearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newRegionForm, setNewRegionForm] = useState<NewRegionForm>({
        name: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        detail: '',
        link: ''
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected region when value changes
    useEffect(() => {
        if (value) {
            const region = regions.find(r => r.id_region.toString() === value);
            setSelectedRegion(region || null);
        } else {
            setSelectedRegion(null);
        }
    }, [value, regions]);

    // Filter regions based on search term
    const filteredRegions = regions.filter(region =>
        region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (region.provinsi && region.provinsi.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (region.kabupaten && region.kabupaten.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (region.kecamatan && region.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (region.desa && region.desa.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectRegion = (region: Region) => {
        setSelectedRegion(region);
        onChange(region.id_region.toString());
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClearSelection = () => {
        setSelectedRegion(null);
        onChange('');
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const handleAddNewRegion = async () => {
        if (!newRegionForm.name.trim()) {
            toast.error('Nama region harus diisi');
            return;
        }

        if (!newRegionForm.provinsi.trim() || !newRegionForm.kabupaten.trim() || 
            !newRegionForm.kecamatan.trim() || !newRegionForm.desa.trim()) {
            toast.error('Provinsi, Kabupaten, Kecamatan, dan Desa harus diisi');
            return;
        }

        setIsSubmitting(true);
        
        // Submit via Inertia with preserveState to avoid full page refresh
        router.post('/dashboard/region', {
            name: newRegionForm.name,
            provinsi: newRegionForm.provinsi,
            kabupaten: newRegionForm.kabupaten,
            kecamatan: newRegionForm.kecamatan,
            desa: newRegionForm.desa,
            detail: newRegionForm.detail,
            link: newRegionForm.link,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // Check for flash messages
                const flashData = page.props.flash as any;
                if (flashData?.success) {
                    toast.success(flashData.success);
                } else {
                    toast.success('Region berhasil ditambahkan');
                }
                
                // Create new region object with temporary ID (will be replaced by server data)
                const newRegion: Region = {
                    id_region: Date.now(), // Temporary ID
                    name: newRegionForm.name,
                    provinsi: newRegionForm.provinsi,
                    kabupaten: newRegionForm.kabupaten,
                    kecamatan: newRegionForm.kecamatan,
                    desa: newRegionForm.desa,
                    detail: newRegionForm.detail,
                    link: newRegionForm.link
                };
                
                // Set the new region as selected (using the form data)
                setSelectedRegion(newRegion);
                setSearchTerm(newRegion.name);
                onChange(newRegion.id_region.toString());
                
                // Close modal and reset form
                setShowAddModal(false);
                setNewRegionForm({
                    name: '',
                    provinsi: '',
                    kabupaten: '',
                    kecamatan: '',
                    desa: '',
                    detail: '',
                    link: ''
                });
                setIsOpen(false);
            },
            onError: (errors) => {
                console.error('Error adding region:', errors);
                // Handle validation errors
                if (errors.name) {
                    toast.error(errors.name);
                } else if (errors.desa) {
                    toast.error(errors.desa);
                } else {
                    toast.error('Gagal menambahkan region');
                }
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Input */}
            <div className="relative">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={selectedRegion ? selectedRegion.name : searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                                if (selectedRegion) {
                                    setSelectedRegion(null);
                                    onChange('');
                                }
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder={placeholder}
                            className={`w-full rounded-md border px-3 py-2 pr-20 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                                error ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        
                        {/* Icons */}
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                            {selectedRegion ? (
                                <button
                                    type="button"
                                    onClick={handleClearSelection}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                                >
                                    <IoClose size={16} />
                                </button>
                            ) : (
                                <IoSearch className="text-gray-400" size={16} />
                            )}
                        </div>
                    </div>
                    
                    {/* Add New Button */}
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="ml-2 flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <IoAdd size={16} />
                        <span className="hidden sm:inline">Tambah</span>
                    </button>
                </div>
                
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                    {filteredRegions.length > 0 ? (
                        filteredRegions.map((region) => (
                            <div
                                key={region.id_region}
                                onClick={() => handleSelectRegion(region)}
                                className="cursor-pointer border-b border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {region.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {region.provinsi && region.kabupaten && region.kecamatan && region.desa && 
                                        `${region.provinsi}, ${region.kabupaten}, ${region.kecamatan}, ${region.desa}`
                                    }
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'Tidak ada region yang ditemukan' : 'Ketik untuk mencari region'}
                        </div>
                    )}
                </div>
            )}

            {/* Add New Region Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Tambah Region Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <IoClose size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Nama Region */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama Region *
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.name}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Masukkan nama region"
                                />
                            </div>

                            {/* Provinsi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Provinsi *
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.provinsi}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, provinsi: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Masukkan provinsi"
                                />
                            </div>

                            {/* Kabupaten */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kabupaten *
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.kabupaten}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, kabupaten: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Masukkan kabupaten"
                                />
                            </div>

                            {/* Kecamatan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kecamatan *
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.kecamatan}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, kecamatan: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Masukkan kecamatan"
                                />
                            </div>

                            {/* Desa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Desa *
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.desa}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, desa: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Masukkan desa"
                                />
                            </div>

                            {/* Detail */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Detail
                                </label>
                                <input
                                    type="text"
                                    value={newRegionForm.detail}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, detail: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Detail tambahan (opsional)"
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Link
                                </label>
                                <input
                                    type="url"
                                    value={newRegionForm.link}
                                    onChange={(e) => setNewRegionForm(prev => ({ ...prev, link: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="https://example.com (opsional)"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleAddNewRegion}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                <IoLocationOutline size={16} />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}