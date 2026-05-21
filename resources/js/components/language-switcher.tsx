import { usePage, Link } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { route } from 'ziggy-js';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
    const { globalSettings } = usePage().props as any;
    const currentLocale = globalSettings?.locale || 'en';

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'km', label: 'Khmer', flag: '🇰🇭' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 px-0">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} asChild>
                        <Link
                            href={route('language.switch', { locale: lang.code })}
                            className="flex w-full items-center gap-2 cursor-pointer"
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className={currentLocale === lang.code ? 'font-bold' : ''}>
                                {lang.label}
                            </span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
