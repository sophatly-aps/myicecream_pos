import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import {
    BadgeDollarSign,
    LayoutGrid,
    Package,
    ClipboardCheck,
    Layers2,
    Users,
    UserPlus,
    Users2,
    Settings,
    BugPlay,
    BugPlayIcon,
    PaintRoller,
    FileText,
    Shield,
    PackageSearch,
    ShoppingCart,
    LockKeyhole,
    DatabaseBackup,
    FolderClock,
    HandCoins,
    Banknote,
    DollarSignIcon,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebar() {
    const { t } = useTranslation();

    const { props }: any = usePage();
    const permissions = props.auth?.permissions || [];
    const roles = props.auth?.roles || [];

    const can = (perm?: string) => {
        if (!perm) return true;
        if (roles.includes('admin')) return true;
        return permissions.includes(perm);
    };

    const mainNavItems: NavItem[] = [
        {
            title: t('sidebar.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: t('sidebar.sale (POS)'),
            href: '/sales',
            icon: BadgeDollarSign,
            permission: 'sales.create',
        },
        {
            title: t('sidebar.sales history'),
            icon: ClipboardCheck,
            href: '/sales-history',
            permission: 'sales.view',
        },
        {
            title: t('sidebar.account_receivable'),
            icon: PackageSearch,
            href: '/account-receivable',
            permission: 'account_receivable.view',
        },
        {
            title: t('sidebar.customers'),
            href: '/customers',
            icon: UserPlus,
            permission: 'customers.view',
        },
        {
            title: t('sidebar.categories'),
            href: '/categories',
            icon: Layers2,
            permission: 'categories.view',
        },
        {
            title: t('sidebar.products'),
            href: '/products',
            icon: PackageSearch,
            permission: 'products.view',
        },

        {
            title: t('sidebar.suppliers'),
            href: '/suppliers',
            icon: Users,
            permission: 'suppliers.view',
        },

        {
            title: t('sidebar.purchase_item'),
            href: '/purchase-item',
            icon: ShoppingCart,
            permission: 'purchase_items.view',
        },

        {
            title: t('sidebar.purchase'),
            href: '/purchase',
            icon: BugPlayIcon,
            permission: 'purchases.create',
        },

        {
            title: t('sidebar.purchase_history'),
            href: '/purchase-history',
            icon: FolderClock,
            permission: 'purchases.view',
        },
        {
            title: t('sidebar.account_payable') || 'Account Payable',
            icon: PackageSearch,
            href: '/account-payable',
            permission: 'purchases.view',
        },

        {
            title: t('sidebar.expense'),
            href: '/expense',
            icon: PaintRoller,
            permission: 'expenses.view',
        },
        {
            title: t('sidebar.income_statement'),
            href: '/income-statement',
            icon: FileText,
            permission: 'income_statements.view',
        },
        {
            title: t('sidebar.employees'),
            href: '/employees',
            icon: Users2,
            permission: 'employees.view',
        },
        {
            title: t('sidebar.employee_absence'),
            href: '/absences',
            icon: DollarSignIcon,
            permission: 'absences.view',
        },
        {
            title: t('sidebar.advance_salary'),
            href: '/advance-salary',
            icon: HandCoins,
            permission: 'advance_salaries.view',
        },
        {
            title: t('sidebar.payslips'),
            href: '/payslips',
            icon: Banknote,
            permission: 'payslips.view',
        },
        {
            title: t('sidebar.users'),
            href: '/users',
            icon: UserPlus,
            permission: 'users.view',
        },
        {
            title: t('sidebar.roles'),
            href: '/roles',
            icon: Shield,
            permission: 'roles.view',
        },
        {
            title: t('sidebar.permissions'),
            href: '/permissions',
            icon: LockKeyhole,
            permission: 'permissions.view',
        },

        {
            title: t('sidebar.settings'),
            href: '/settings',
            icon: Settings,
            permission: 'settings.view',
        },
    ];

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={mainNavItems.filter((item) => can(item.permission))}
                />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                {/* <NavUser /> */}
            </SidebarFooter>
        </Sidebar>
    );
}
