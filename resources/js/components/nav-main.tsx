import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NavGroup {
    label: string;
    items: NavItem[];
}

interface NavMainProps {
    items: NavItem[];
    secondNavItems?: NavItem[];
}

export function NavMain({ items, secondNavItems = [] }: NavMainProps) {
    const navGroups: NavGroup[] = [
        { label: 'WebGis', items },
        { label: 'Artikel', items: secondNavItems },
    ].filter(group => group.items.length > 0);

    const [openIndex, setOpenIndex] = React.useState<number | null>(0);

    const handleOpenChange = (idx: number, open: boolean) => {
        setOpenIndex(open ? idx : null);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            {navGroups.map((group, idx) => (
                <Collapsible key={group.label} open={openIndex === idx} onOpenChange={(open) => handleOpenChange(idx, open)}>
                    <div
                        className={`flex items-center justify-between mb-2 rounded-md transition-colors duration-200 ${openIndex === idx ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                    >
                        <SidebarGroupLabel className={`text-1xl ${openIndex === idx ? 'font-bold' : ''}`}>{group.label}</SidebarGroupLabel>
                        <CollapsibleTrigger asChild>
                            <button type="button" className={`ml-2 rounded p-1 transition-colors duration-200 ${openIndex === idx ? 'text-sidebar-accent-foreground' : ''}`} aria-label="Toggle Menu">
                                {openIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </CollapsibleTrigger>
                    </div>
                    {openIndex === idx && (
                        <CollapsibleContent forceMount>
                            <SidebarMenu className="ms-5">
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <a href={item.href} className="flex items-center gap-2 w-full">
                                            {item.icon && <item.icon className="w-4 h-4" />}
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            ))}
        </SidebarGroup>
    );
}
