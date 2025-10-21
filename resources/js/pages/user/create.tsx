import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

type UserFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

export default function UserCreate() {
    const { data, setData, post, processing, errors } = useForm<UserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('dashboard.users.store'));
    };

    return (
        <AppLayout>
            <Head title="Tambah User" />

            <div className="space-y-6 m-5">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('dashboard.users.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tambah User</h1>
                        <p className="text-gray-600">Buat akun pengguna baru</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Lengkap *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Masukkan alamat email"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password"
                                        className={errors.password ? 'border-red-500' : ''}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        Password minimal 8 karakter
                                    </p>
                                </div>

                                {/* Password Confirmation */}
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Konfirmasi Password *</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password"
                                        className={errors.password_confirmation ? 'border-red-500' : ''}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                        <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* <SelectItem value="admin">Admin</SelectItem> */}
                                            <SelectItem value="superadmin">Superadmin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="text-sm text-red-600">{errors.role}</p>
                                    )}
                                    {/* <div className="text-sm text-gray-500 space-y-1">
                                        <p><strong>User:</strong> Akses terbatas untuk melihat dan mengelola data sendiri</p>
                                        <p><strong>Moderator:</strong> Akses untuk mengelola konten dan data</p>
                                        <p><strong>Admin:</strong> Akses penuh ke semua fitur sistem</p>
                                    </div> */}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center gap-4 pt-6 border-t">
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Menyimpan...' : 'Simpan User'}
                                </Button>
                                <Link href={route('dashboard.users.index')}>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}