import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ReactCountryFlag from "react-country-flag";

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props as any;

    const { i18n, t } = useTranslation();

    const [language, setLanguage] = useState(i18n.language || 'en');

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        i18n.changeLanguage(value);
        localStorage.setItem('lang', value);
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-4">
                <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-9 w-[140px] border-slate-200 text-xs font-medium">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">
                            <ReactCountryFlag countryCode="US" style={{ width: '1.5em', height: '1.5em' }} />
                            {t('dashboard.English')}
                        </SelectItem>
                        <SelectItem value="kh">
                            <ReactCountryFlag countryCode="KH" style={{ width: '1.5em', height: '1.5em' }} />
                            {t('dashboard.Khmer')}
                        </SelectItem>
                    </SelectContent>
                </Select>

                <button className="relative p-2 text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-full transition-colors ml-2">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                {auth?.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 pl-3 pr-2 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors focus:outline-none ml-2">
                            <UserInfo user={auth.user} showRole={true} />
                            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
