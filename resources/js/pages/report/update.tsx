import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

export default function UpdateReport() {
    const { report, geojsons } = usePage<{
        report: {
            id_report: number;
            id_geojson: number;
            file_path: string;
            description: string;
            nomor: string;
            sifat: string;
            hal: string;
            kepada: string;
        };
        geojsons: { id_geojson: number; source_name?: string }[];
    }>().props;

    const { data, setData, post, processing, errors } = useForm({
        id_geojson: String(report.id_geojson ?? ''),
        file_path: null as File | null,
        description: report.description ?? '',
        nomor: report.nomor ?? '',
        sifat: report.sifat ?? 'Biasa',
        hal: report.hal ?? '',
        kepada: report.kepada ?? '',
    });

    const [step, setStep] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        console.log('Form data:', data);
        post(route('dashboard.report.update', report.id_report), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setStep(1);
                setShowSuccessModal(true);
                toast.success('Laporan berhasil diperbarui!');
            },
            onError: () => toast.error('Gagal memperbarui laporan'),
        });
    };

    return (
        <AppLayout>
            <Head title="Update Laporan PDF" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="geojson" className="block font-medium">GeoJSON</label>
                    <select
                        id="geojson"
                        name="id_geojson"
                        value={data.id_geojson}
                        onChange={e => setData('id_geojson', e.target.value)}
                        className="input input-bordered w-full"
                        required
                    >
                        <option value="">Pilih GeoJSON</option>
                        {geojsons.map(g => (
                            <option key={g.id_geojson} value={g.id_geojson}>{g.source_name || `Geojson ${g.id_geojson}`}</option>
                        ))}
                    </select>
                    {errors.id_geojson && <div className="text-red-500 text-sm">{errors.id_geojson}</div>}
                </div>
                <div>
                    <label htmlFor="nomor" className="block font-medium">Nomor</label>
                    <input
                        id="nomor"
                        name="nomor"
                        type="text"
                        value={data.nomor}
                        onChange={e => setData('nomor', e.target.value)}
                        className="input input-bordered w-full"
                        placeholder={`Sebelumnya: ${report.nomor || ''}`}
                        required
                    />
                    {errors.nomor && <div className="text-red-500 text-sm">{errors.nomor}</div>}
                </div>
                <div>
                    <label htmlFor="sifat" className="block font-medium">Sifat</label>
                    <select
                        id="sifat"
                        name="sifat"
                        value={data.sifat}
                        onChange={e => setData('sifat', e.target.value)}
                        className="input input-bordered w-full"
                        required
                    >
                        <option value="Biasa">Biasa</option>
                        <option value="Segera">Segera</option>
                        <option value="Rahasia">Rahasia</option>
                    </select>
                    {errors.sifat && <div className="text-red-500 text-sm">{errors.sifat}</div>}
                </div>
                <div>
                    <label htmlFor="hal" className="block font-medium">Hal</label>
                    <input
                        id="hal"
                        name="hal"
                        type="text"
                        value={data.hal}
                        onChange={e => setData('hal', e.target.value)}
                        className="input input-bordered w-full"
                        placeholder={`Sebelumnya: ${report.hal || ''}`}
                        required
                    />
                    {errors.hal && <div className="text-red-500 text-sm">{errors.hal}</div>}
                </div>
                <div>
                    <label htmlFor="kepada" className="block font-medium">Kepada</label>
                    <input
                        id="kepada"
                        name="kepada"
                        type="text"
                        value={data.kepada}
                        onChange={e => setData('kepada', e.target.value)}
                        className="input input-bordered w-full"
                        placeholder={`Sebelumnya: ${report.kepada || ''}`}
                        required
                    />
                    {errors.kepada && <div className="text-red-500 text-sm">{errors.kepada}</div>}
                </div>
                <div>
                    <label htmlFor="description" className="block font-medium">Deskripsi</label>
                    <textarea
                        id="description"
                        name="description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        className="textarea textarea-bordered w-full"
                        placeholder={`Sebelumnya: ${report.description || ''}`}
                        required
                    />
                    {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                </div>
                <div>
                    <label htmlFor="file_path" className="block font-medium">File PDF (opsional, kosongkan jika tidak ingin mengganti)</label>
                    <input
                        id="file_path"
                        name="file_path"
                        type="file"
                        accept="application/pdf"
                        onChange={e => setData('file_path', e.target.files ? e.target.files[0] : null)}
                        className="file-input file-input-bordered w-full"
                    />
                    {report.file_path ? (
                        <div className="mt-2">
                            <span className="text-sm">File sebelumnya: </span>
                            <a href={report.file_path} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                {report.file_path.split('/').pop()}
                            </a>
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-gray-500">Tidak ada file sebelumnya</div>
                    )}
                    {errors.file_path && <div className="text-red-500 text-sm">{errors.file_path}</div>}
                </div>
                <div className="flex justify-end gap-2">
                    <button type="submit" className="btn btn-primary" disabled={processing}>Simpan Perubahan</button>
                </div>
            </form>
        </AppLayout>
    );
}
