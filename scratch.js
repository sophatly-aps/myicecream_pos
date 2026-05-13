const fs = require('fs');

let content = fs.readFileSync('resources/js/pages/account_receivable/index.tsx', 'utf8');

// 1. Component Name and props
content = content.replace('export default function History({ orders, filters, settings, grandTotal }: any) {', 'export default function AccountReceivable({ orders, filters, settings, totalDue }: any) {');

// 2. Remove trash from PRESETS
content = content.replace("    { value: 'trash', label: 'Trash' },\n", "");

// 3. Rename states for filters
content = content.replace('const [invoiceNo, setInvoiceNo] = useState(filters?.invoice_no || \'\');', 'const [search, setSearch] = useState(filters?.search || \'\');');

// 4. applyFilters logic
content = content.replace(/router\.get\('\/sales-history'[\s\S]*?}, \{/, "router.get('/account-receivable', {\n            search: search || undefined,\n            preset: preset || undefined,\n            from_date: preset === 'custom' && fromDate ? fromDate : undefined,\n            to_date: preset === 'custom' && toDate ? toDate : undefined,\n            page: 1\n        }, {");

// 5. Columns: Add Due Amount, Remove actions we don't need (trash/restore)
content = content.replace(/columnHelper\.accessor\('paid_amount', \{[\s\S]*?\}\),/, "columnHelper.accessor('paid_amount', {\n            header: t('sales.paid_amount'),\n            cell: info => <span className=\"font-bold text-green-700\">{currency}{formatMoney(info.getValue())}</span>,\n        }),\n        columnHelper.accessor('due_amount', {\n            header: 'Due Amount',\n            cell: info => {\n                const total = Number(info.row.original.total_amount || 0);\n                const paid = Number(info.row.original.paid_amount || 0);\n                return <span className=\"font-bold text-red-600\">{currency}{formatMoney(total - paid)}</span>;\n            },\n        }),");

// 6. Fix Actions cell: remove preset === 'trash' check and just leave View and Edit
content = content.replace(/\{preset === 'trash' \? \([\s\S]*?\) : \(/, "(");
content = content.replace(/<Button[\s\S]*?Trash2 \/>[\s\S]*?<\/Button>/, "");
// also need to remove the closing } for the ternary, wait, this might break. Let's do it safer.

fs.writeFileSync('resources/js/pages/account_receivable/index.tsx', content);
console.log('Done replacement part 1');
