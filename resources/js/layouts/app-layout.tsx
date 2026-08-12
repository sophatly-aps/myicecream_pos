import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { t } = useTranslation();

    const { props } = usePage();
    const user = (props as any)?.auth?.user;
    const appName = import.meta.env.VITE_APP_NAME || 'Ice Cream POS';

    const translateBreadcrumbs = breadcrumbs.map((breadcrumb) => ({
        ...breadcrumb,
        title: t(breadcrumb.title),
    }));
    return (
        <>
            {/* Meta tags for print functionality */}
            <meta name="user-name" content={user?.name || 'System'} />
            <meta name="app-name" content={appName} />
            <meta name="app-year" content={new Date().getFullYear().toString()} />

            <AppLayoutTemplate breadcrumbs={translateBreadcrumbs}>
                {children}
                <Toaster richColors position="top-right" />
            </AppLayoutTemplate>
        </>
    );
}
