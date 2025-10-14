import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Earth, FileText, Folder, Layers2, LayoutGrid, MapPin, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'PDF',
        href: '/dashboard/tambah-pdf',
        icon: FileText,
    },
    {
        title: 'Region',
        href: '/dashboard/region',
        icon: MapPin,
    },
    {
        title: 'Tambah Map',
        href: '/dashboard/geojson',
        icon: Earth,
    },
    {
        title: 'Tambah Kategori',
        href: '/dashboard/kategori',
        icon: Layers2,
    },
    {
        title: 'User Management',
        href: '/dashboard/users',
        icon: Users,
    },
];

const secondNavItems: NavItem[] = [
    {
        title: 'Daftar Artikel',
        href: '/artikel',
        icon: FileText,
    },
    {
        title: 'Tambah Artikel',
        href: '/artikel/tambah',
        icon: Layers2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'SHP to GeoJson',
        href: '/convert-shp',
        icon: Folder,
    },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavMain secondNavItems={secondNavItems} items={[]} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
