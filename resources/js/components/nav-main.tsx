import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [open, setOpen] = React.useState(true);
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarGroup className="px-2 py-0">
                <div
                    className={`flex items-center justify-between ${open ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} mb-2 rounded-md transition-colors duration-200`}
                >
                    <SidebarGroupLabel className="text-1xl font-bold">WebGis</SidebarGroupLabel>
                    <CollapsibleTrigger asChild>
                        <button type="button" className="ml-2 rounded p-1" aria-label="Toggle Menu">
                            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </CollapsibleTrigger>
                </div>
                {/* <div
                    className={`flex items-center justify-between ${open ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} mb-2 rounded-md transition-colors duration-200`}
                >
                    <SidebarGroupLabel className="text-1xl font-bold">Artikel</SidebarGroupLabel>
                    <CollapsibleTrigger asChild>
                        <button type="button" className="ml-2 rounded p-1" aria-label="Toggle Menu">
                            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </CollapsibleTrigger>
                </div> */}
                <CollapsibleContent>
                    <SidebarMenu className="ms-5">
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={item.href === page.url} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}
