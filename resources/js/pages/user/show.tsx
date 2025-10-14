import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Mail, User, Calendar, Shield } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    user: User;
}

export default function UserShow({ user }: Props) {
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'destructive';
            case 'admin':
                return 'default';
            default:
                return 'outline';
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'Akses penuh ke semua fitur sistem';
            case 'admin':
                return 'Akses untuk mengelola konten dan data';
            default:
                return 'Role tidak dikenal';
        }
    };

    return (
        <AppLayout>
            <Head title={`Detail User - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('dashboard.users.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Detail User</h1>
                            <p className="text-gray-600">Informasi lengkap user</p>
                        </div>
                    </div>
                    <Link href={route('dashboard.users.edit', user.id)}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                        </Button>
                    </Link>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Pengguna
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Name */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nama Lengkap</p>
                                        <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Mail className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getRoleDescription(user.role)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Side Info */}
                    <div className="space-y-6">
                        {/* Account Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Detail Akun
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">ID User</p>
                                    <p className="font-semibold text-gray-900">#{user.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(user.created_at).toLocaleTimeString('id-ID')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(user.updated_at).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(user.updated_at).toLocaleTimeString('id-ID')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aksi Cepat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href={route('dashboard.users.edit', user.id)} className="block">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit User
                                    </Button>
                                </Link>
                                <Link href={route('dashboard.users.index')} className="block">
                                    <Button variant="outline" className="w-full justify-start">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Kembali ke Daftar
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}