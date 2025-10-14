import React, { useState, useEffect, useRef } from 'react';
import { IoAdd, IoSearch, IoClose, IoPersonAdd } from 'react-icons/io5';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface Owner {
    id_owner: number;
    name: string;
    wali?: string;
    type?: string;
    no_hp?: string;
}

interface OwnerSearchInputProps {
    owners: Owner[];
    value?: string;
    onChange: (ownerId: string) => void;
    error?: string;
    placeholder?: string;
}

interface NewOwnerForm {
    name: string;
    wali: string;
    type: string;
    no_hp: string;
}

export default function OwnerSearchInput({ 
    owners, 
    value, 
    onChange, 
    error, 
    placeholder = "Cari atau pilih owner..." 
}: OwnerSearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newOwnerForm, setNewOwnerForm] = useState<NewOwnerForm>({
        name: '',
        wali: '',
        type: 'Perorangan',
        no_hp: ''
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected owner when value changes
    useEffect(() => {
        if (value) {
            const owner = owners.find(o => o.id_owner.toString() === value);
            setSelectedOwner(owner || null);
        } else {
            setSelectedOwner(null);
        }
    }, [value, owners]);

    // Filter owners based on search term
    const filteredOwners = owners.filter(owner =>
        owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (owner.wali && owner.wali.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (owner.type && owner.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (owner.no_hp && owner.no_hp.includes(searchTerm))
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

    const handleSelectOwner = (owner: Owner) => {
        setSelectedOwner(owner);
        onChange(owner.id_owner.toString());
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClearSelection = () => {
        setSelectedOwner(null);
        onChange('');
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const handleAddNewOwner = async () => {
        if (!newOwnerForm.name.trim()) {
            toast.error('Nama owner harus diisi');
            return;
        }

        setIsSubmitting(true);
        
        // Submit via Inertia with preserveState to avoid full page refresh
        router.post('/dashboard/owner', {
            name: newOwnerForm.name,
            wali: newOwnerForm.wali,
            type: newOwnerForm.type,
            no_hp: newOwnerForm.no_hp,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // Check for flash messages
                const flashData = page.props.flash as any;
                if (flashData?.success) {
                    toast.success(flashData.success);
                } else {
                    toast.success('Owner berhasil ditambahkan');
                }
                
                // Create new owner object with temporary ID (will be replaced by server data)
                const newOwner: Owner = {
                    id_owner: Date.now(), // Temporary ID
                    name: newOwnerForm.name,
                    wali: newOwnerForm.wali,
                    type: newOwnerForm.type,
                    no_hp: newOwnerForm.no_hp
                };
                
                // Note: In a real app, you'd want to refresh the owners data from server
                // For now, we'll just select the new owner and let the parent handle the refresh
                
                // Set the new owner as selected (using the form data)
                setSelectedOwner(newOwner);
                setSearchTerm(newOwner.name);
                onChange(newOwner.id_owner.toString());
                
                // Close modal and reset form
                setShowAddModal(false);
                setNewOwnerForm({
                    name: '',
                    wali: '',
                    type: 'Perorangan',
                    no_hp: ''
                });
                setIsOpen(false);
            },
            onError: (errors) => {
                console.error('Error adding owner:', errors);
                // Handle validation errors
                if (errors.name) {
                    toast.error(errors.name);
                } else {
                    toast.error('Gagal menambahkan owner');
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
                            value={selectedOwner ? selectedOwner.name : searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                                if (selectedOwner) {
                                    setSelectedOwner(null);
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
                            {selectedOwner ? (
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
                    {filteredOwners.length > 0 ? (
                        filteredOwners.map((owner) => (
                            <div
                                key={owner.id_owner}
                                onClick={() => handleSelectOwner(owner)}
                                className="cursor-pointer border-b border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {owner.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {owner.type && <span className="mr-2">• {owner.type}</span>}
                                    {owner.wali && <span className="mr-2">• PIC: {owner.wali}</span>}
                                    {owner.no_hp && <span>• {owner.no_hp}</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'Tidak ada owner yang ditemukan' : 'Ketik untuk mencari owner'}
                        </div>
                    )}
                </div>
            )}

            {/* Add New Owner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Tambah Owner Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                            >
                                <IoClose size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama Owner *
                                </label>
                                <input
                                    type="text"
                                    value={newOwnerForm.name}
                                    onChange={(e) => setNewOwnerForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tipe
                                </label>
                                <select
                                    value={newOwnerForm.type}
                                    onChange={(e) => setNewOwnerForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                    <option value="PT">PT</option>
                                    <option value="CV">CV</option>
                                    <option value="Yayasan/Lembaga">Yayasan/Lembaga</option>
                                    <option value="Perorangan">Perorangan</option>
                                </select>
                            </div>

                            {/* PIC/Wali */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    PIC/Wali
                                </label>
                                <input
                                    type="text"
                                    value={newOwnerForm.wali}
                                    onChange={(e) => setNewOwnerForm(prev => ({ ...prev, wali: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    No. HP
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={newOwnerForm.no_hp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setNewOwnerForm(prev => ({ ...prev, no_hp: value }));
                                    }}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); handleAddNewOwner(); }}
                                    disabled={isSubmitting || !newOwnerForm.name.trim()}
                                    className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoPersonAdd size={16} />
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}