import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

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
    ].filter((group) => group.items.length > 0);

    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);

    React.useEffect(() => {
        if (isCollapsed) {
            setOpenIndex(null);
        } else {
            setOpenIndex(0);
        }
    }, [isCollapsed]);

    const handleOpenChange = (idx: number, open: boolean) => {
        setOpenIndex(open ? idx : null);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            {navGroups.map((group, idx) => {
                const open = isCollapsed || openIndex === idx;
                return (
                    <Collapsible key={group.label} open={open} onOpenChange={(open) => handleOpenChange(idx, open)}>
                        <div
                            className={`mb-2 flex items-center justify-between rounded-md transition-colors duration-200 ${open ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                        >
                            <SidebarGroupLabel className={`text-1xl ${open ? 'font-bold' : ''}`}>{!isCollapsed && group.label}</SidebarGroupLabel>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className={`ml-2 rounded p-1 transition-colors duration-200 ${open ? 'text-sidebar-accent-foreground' : ''} hover:bg-gray-100 dark:hover:bg-gray-700`}
                                    aria-label="Toggle Menu"
                                >
                                    {!isCollapsed && (open ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                </button>
                            </CollapsibleTrigger>
                        </div>
                        {open && (
                            <CollapsibleContent forceMount>
                                <SidebarMenu className={isCollapsed ? '' : 'ms-5'}>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <a
                                                href={item.href}
                                                className="flex w-full items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors duration-200"
                                                {...(isCollapsed ? { title: item.title } : {})}
                                            >
                                                {item.icon && <item.icon className="h-4 w-4" />}
                                                {!isCollapsed && <span>{item.title}</span>}
                                            </a>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </CollapsibleContent>
                        )}
                    </Collapsible>
                );
            })}
        </SidebarGroup>
    );
}
