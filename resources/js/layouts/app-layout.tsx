import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { t } = useTranslation();

    const translateBreadcrumbs = breadcrumbs.map((breadcrumb) => ({
        ...breadcrumb,
        title: t(breadcrumb.title),
    }));
    return (
        <AppLayoutTemplate breadcrumbs={translateBreadcrumbs}>
            {children}
            <Toaster richColors position="top-right" />
        </AppLayoutTemplate>
    );
}
