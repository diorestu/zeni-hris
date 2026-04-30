import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    FileText,
    Filter,
    PackageCheck,
    Pencil,
    Plus,
    Trash2,
    UserPlus,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    destroy as assetsDestroy,
    index as assetsIndex,
    store as assetsStore,
    update as assetsUpdate,
} from './routes';

type AssetAssignment = {
    id: number;
    employee_label: string;
    issued_at: string;
    returned_at: string | null;
    condition_out: string;
    condition_in: string | null;
    notes: string | null;
};

type CompanyAsset = {
    id: number;
    asset_code: string;
    name: string;
    category: string | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    purchase_date: string | null;
    purchase_price: string;
    purchase_proof_url: string | null;
    purchase_proof_original_name: string | null;
    condition: string;
    status: string;
    useful_life_months: number;
    salvage_value: string;
    notes: string | null;
    active_assignment: {
        employee_id: number;
        employee_label: string;
        issued_at: string;
        condition_out: string;
        notes: string | null;
    } | null;
    assignments: AssetAssignment[];
    depreciation: {
        monthly_depreciation: number;
        accumulated_depreciation: number;
        book_value: number;
        age_months: number;
    };
};

type EmployeeOption = {
    id: number;
    label: string;
};

type AssetFormData = {
    asset_code: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    serial_number: string;
    purchase_date: string;
    purchase_price: string;
    purchase_proof: File | null;
    condition: string;
    status: string;
    useful_life_months: string;
    salvage_value: string;
    notes: string;
    employee_id: string;
    issued_at: string;
    returned_at: string;
    condition_out: string;
    condition_in: string;
    assignment_notes: string;
};

type PageProps = {
    filters: {
        search: string;
        status: string;
        category: string;
    };
    assets: CompanyAsset[];
    employeeOptions: EmployeeOption[];
    categories: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Asset Management',
        href: assetsIndex.url(),
    },
];

const statusLabels: Record<string, string> = {
    available: 'Tersedia',
    assigned: 'Dipakai',
    maintenance: 'Maintenance',
    retired: 'Pensiun',
    lost: 'Hilang',
};

const conditionLabels: Record<string, string> = {
    new: 'Baru',
    good: 'Baik',
    fair: 'Cukup',
    damaged: 'Rusak',
};

const formatCurrency = (value: null | number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): AssetFormData => ({
    asset_code: '',
    name: '',
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: today(),
    purchase_price: '0',
    purchase_proof: null,
    condition: 'good',
    status: 'available',
    useful_life_months: '36',
    salvage_value: '0',
    notes: '',
    employee_id: '',
    issued_at: today(),
    returned_at: '',
    condition_out: 'good',
    condition_in: '',
    assignment_notes: '',
});

export default function AssetsPage() {
    const { filters, assets, employeeOptions, categories } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState(filters);
    const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);
    const [assetDialogOpen, setAssetDialogOpen] = useState(false);
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

    const assetForm = useForm<AssetFormData>(emptyForm());

    const summary = useMemo(
        () => ({
            totalAssets: assets.length,
            assignedAssets: assets.filter((asset) => asset.status === 'assigned')
                .length,
            totalValue: assets.reduce(
                (sum, asset) => sum + Number(asset.purchase_price ?? 0),
                0,
            ),
            bookValue: assets.reduce(
                (sum, asset) => sum + Number(asset.depreciation.book_value ?? 0),
                0,
            ),
        }),
        [assets],
    );

    const resetForm = () => {
        setEditingAsset(null);
        setAssetDialogOpen(false);
        setAssignmentDialogOpen(false);
        assetForm.clearErrors();
        assetForm.setData(emptyForm());
    };

    const applyFilters = () => {
        router.get(assetsIndex.url(), filterState, {
            preserveScroll: true,
            replace: true,
        });
    };

    const openCreateAssetDialog = () => {
        setEditingAsset(null);
        assetForm.clearErrors();
        assetForm.setData(emptyForm());
        setAssetDialogOpen(true);
    };

    const fillAssetForm = (asset: CompanyAsset) => {
        setEditingAsset(asset);
        assetForm.clearErrors();
        assetForm.setData({
            asset_code: asset.asset_code,
            name: asset.name,
            category: asset.category ?? '',
            brand: asset.brand ?? '',
            model: asset.model ?? '',
            serial_number: asset.serial_number ?? '',
            purchase_date: asset.purchase_date ?? '',
            purchase_price: String(Number(asset.purchase_price ?? 0)),
            purchase_proof: null,
            condition: asset.condition,
            status: asset.status,
            useful_life_months: String(asset.useful_life_months),
            salvage_value: String(Number(asset.salvage_value ?? 0)),
            notes: asset.notes ?? '',
            employee_id: asset.active_assignment
                ? String(asset.active_assignment.employee_id)
                : '',
            issued_at: asset.active_assignment?.issued_at ?? today(),
            returned_at: '',
            condition_out:
                asset.active_assignment?.condition_out ?? asset.condition,
            condition_in: '',
            assignment_notes: asset.active_assignment?.notes ?? '',
        });
    };

    const openEditAssetDialog = (asset: CompanyAsset) => {
        fillAssetForm(asset);
        setAssetDialogOpen(true);
    };

    const openAssignmentDialog = (asset: CompanyAsset) => {
        fillAssetForm(asset);
        setAssignmentDialogOpen(true);
    };

    const submitAssetForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingAsset) {
            assetForm.transform((data) => ({ ...data, _method: 'put' }));
            assetForm.post(assetsUpdate.url(editingAsset.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: resetForm,
            });
            return;
        }

        assetForm.post(assetsStore.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    const submitAssignmentForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingAsset) {
            return;
        }

        assetForm.transform((data) => ({ ...data, _method: 'put' }));
        assetForm.post(assetsUpdate.url(editingAsset.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    const removeAsset = (asset: CompanyAsset) => {
        router.delete(assetsDestroy.url(asset.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asset Management" />

            <div className="space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackageCheck className="size-4" />
                            Asset Management
                        </CardTitle>
                        <CardDescription>
                            Kelola inventaris perusahaan, assignment karyawan,
                            tanggal keluar masuk, bukti pembelian, dan nilai
                            depresiasi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-4">
                            <SummaryTile label="Total Asset" value={summary.totalAssets} />
                            <SummaryTile label="Sedang Dipakai" value={summary.assignedAssets} />
                            <SummaryTile label="Nilai Beli" value={formatCurrency(summary.totalValue)} />
                            <SummaryTile label="Nilai Buku" value={formatCurrency(summary.bookValue)} />
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grid min-w-[220px] gap-2">
                                <Label htmlFor="asset_search">Cari</Label>
                                <Input
                                    id="asset_search"
                                    value={filterState.search}
                                    onChange={(event) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            search: event.target.value,
                                        }))
                                    }
                                    placeholder="Kode, nama, serial"
                                />
                            </div>
                            <div className="grid w-[180px] gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={filterState.status || '__all'}
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            status: value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">Semua</SelectItem>
                                        {Object.entries(statusLabels).map(
                                            ([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid w-[200px] gap-2">
                                <Label>Kategori</Label>
                                <Select
                                    value={filterState.category || '__all'}
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            category:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">Semua</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={applyFilters}
                            >
                                <Filter className="size-4" />
                                Terapkan
                            </Button>
                            <Button type="button" onClick={openCreateAssetDialog}>
                                <Plus className="size-4" />
                                Tambah Asset
                            </Button>
                        </div>

                        <div className="rounded-lg border">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1180px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-2">Asset</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">Pemegang</th>
                                            <th className="px-3 py-2">Tanggal</th>
                                            <th className="px-3 py-2">Nilai</th>
                                            <th className="px-3 py-2">Depresiasi</th>
                                            <th className="px-3 py-2">Riwayat</th>
                                            <th className="px-3 py-2 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assets.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="px-3 py-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada data asset.
                                                </td>
                                            </tr>
                                        )}
                                        {assets.map((asset) => (
                                            <tr
                                                key={asset.id}
                                                className="border-b align-top"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="font-medium">
                                                        {asset.asset_code} -{' '}
                                                        {asset.name}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {[asset.category, asset.brand, asset.model]
                                                            .filter(Boolean)
                                                            .join(' / ') || '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        SN:{' '}
                                                        {asset.serial_number || '-'}
                                                    </p>
                                                    {asset.purchase_proof_url && (
                                                        <a
                                                            href={
                                                                asset.purchase_proof_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                                                        >
                                                            <FileText className="size-3" />
                                                            {asset.purchase_proof_original_name ??
                                                                'Bukti pembelian'}
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge variant="outline">
                                                        {statusLabels[
                                                            asset.status
                                                        ] ?? asset.status}
                                                    </Badge>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Kondisi:{' '}
                                                        {conditionLabels[
                                                            asset.condition
                                                        ] ?? asset.condition}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {asset.active_assignment
                                                        ?.employee_label ?? '-'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p>
                                                        Beli:{' '}
                                                        {asset.purchase_date ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Keluar:{' '}
                                                        {asset.active_assignment
                                                            ?.issued_at ?? '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p>
                                                        {formatCurrency(
                                                            asset.purchase_price,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Residu{' '}
                                                        {formatCurrency(
                                                            asset.salvage_value,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p>
                                                        Buku{' '}
                                                        {formatCurrency(
                                                            asset.depreciation
                                                                .book_value,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Akumulasi{' '}
                                                        {formatCurrency(
                                                            asset.depreciation
                                                                .accumulated_depreciation,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {asset.depreciation.age_months}{' '}
                                                        /{' '}
                                                        {asset.useful_life_months}{' '}
                                                        bulan
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {asset.assignments.length ===
                                                        0 && '-'}
                                                    <div className="space-y-1">
                                                        {asset.assignments.map(
                                                            (assignment) => (
                                                                <div
                                                                    key={
                                                                        assignment.id
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    <span className="font-medium">
                                                                        {
                                                                            assignment.employee_label
                                                                        }
                                                                    </span>
                                                                    <div className="text-muted-foreground">
                                                                        {
                                                                            assignment.issued_at
                                                                        }{' '}
                                                                        -{' '}
                                                                        {assignment.returned_at ??
                                                                            'aktif'}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditAssetDialog(
                                                                    asset,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                openAssignmentDialog(
                                                                    asset,
                                                                )
                                                            }
                                                        >
                                                            <UserPlus className="size-3.5" />
                                                            Assignment
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        'Hapus asset ini beserta riwayat assignment?',
                                                                    )
                                                                ) {
                                                                    removeAsset(
                                                                        asset,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={assetDialogOpen}
                onOpenChange={(open) => {
                    setAssetDialogOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAsset ? 'Edit Asset' : 'Tambah Asset'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi data inventaris, bukti pembelian, dan parameter
                            depresiasi asset.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitAssetForm} className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-4">
                            <Field
                                label="Kode Asset"
                                error={assetForm.errors.asset_code}
                            >
                                <Input
                                    value={assetForm.data.asset_code}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'asset_code',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="AST-001"
                                />
                            </Field>
                            <Field
                                label="Nama Asset"
                                error={assetForm.errors.name}
                            >
                                <Input
                                    value={assetForm.data.name}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Laptop operasional"
                                />
                            </Field>
                            <Field
                                label="Kategori"
                                error={assetForm.errors.category}
                            >
                                <Input
                                    value={assetForm.data.category}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="IT, Kendaraan"
                                />
                            </Field>
                            <Field
                                label="Brand / Model"
                                error={
                                    assetForm.errors.brand ||
                                    assetForm.errors.model
                                }
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={assetForm.data.brand}
                                        onChange={(event) =>
                                            assetForm.setData(
                                                'brand',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Brand"
                                    />
                                    <Input
                                        value={assetForm.data.model}
                                        onChange={(event) =>
                                            assetForm.setData(
                                                'model',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Model"
                                    />
                                </div>
                            </Field>
                            <Field
                                label="Serial Number"
                                error={assetForm.errors.serial_number}
                            >
                                <Input
                                    value={assetForm.data.serial_number}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'serial_number',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                            </Field>
                            <Field
                                label="Tanggal Beli"
                                error={assetForm.errors.purchase_date}
                            >
                                <Input
                                    type="date"
                                    value={assetForm.data.purchase_date}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'purchase_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Harga Beli"
                                error={assetForm.errors.purchase_price}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={assetForm.data.purchase_price}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'purchase_price',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Bukti Pembelian"
                                error={assetForm.errors.purchase_proof}
                            >
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'purchase_proof',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Kondisi"
                                error={assetForm.errors.condition}
                            >
                                <SimpleSelect
                                    value={assetForm.data.condition}
                                    options={conditionLabels}
                                    onChange={(value) =>
                                        assetForm.setData('condition', value)
                                    }
                                />
                            </Field>
                            <Field label="Status" error={assetForm.errors.status}>
                                <SimpleSelect
                                    value={assetForm.data.status}
                                    options={statusLabels}
                                    onChange={(value) =>
                                        assetForm.setData('status', value)
                                    }
                                />
                            </Field>
                            <Field
                                label="Umur Manfaat (bulan)"
                                error={assetForm.errors.useful_life_months}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    value={assetForm.data.useful_life_months}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'useful_life_months',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Nilai Residu"
                                error={assetForm.errors.salvage_value}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={assetForm.data.salvage_value}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'salvage_value',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Catatan Asset" error={assetForm.errors.notes}>
                            <Input
                                value={assetForm.data.notes}
                                onChange={(event) =>
                                    assetForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Catatan inventaris"
                            />
                        </Field>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    assetForm.processing ||
                                    assetForm.data.asset_code === '' ||
                                    assetForm.data.name === ''
                                }
                            >
                                {assetForm.processing
                                    ? 'Menyimpan...'
                                    : editingAsset
                                      ? 'Update Asset'
                                      : 'Tambah Asset'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={assignmentDialogOpen}
                onOpenChange={(open) => {
                    setAssignmentDialogOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Assignment Asset</DialogTitle>
                        <DialogDescription>
                            Kelola karyawan pemegang asset, tanggal keluar,
                            tanggal masuk, dan kondisi saat serah terima.
                        </DialogDescription>
                    </DialogHeader>

                    {editingAsset && (
                        <div className="rounded-md border px-3 py-2 text-sm">
                            <p className="font-medium">
                                {editingAsset.asset_code} - {editingAsset.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {[editingAsset.category, editingAsset.brand, editingAsset.model]
                                    .filter(Boolean)
                                    .join(' / ') || '-'}
                            </p>
                        </div>
                    )}

                    <form onSubmit={submitAssignmentForm} className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <Field
                                label="Assign ke Karyawan"
                                error={assetForm.errors.employee_id}
                            >
                                <SearchableSelect
                                    value={
                                        assetForm.data.employee_id === ''
                                            ? '__none'
                                            : assetForm.data.employee_id
                                    }
                                    onValueChange={(value) =>
                                        assetForm.setData(
                                            'employee_id',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                    placeholder="Pilih karyawan"
                                    searchPlaceholder="Cari karyawan..."
                                    options={[
                                        {
                                            value: '__none',
                                            label: 'Tidak di-assign',
                                        },
                                        ...employeeOptions.map((employee) => ({
                                            value: String(employee.id),
                                            label: employee.label,
                                        })),
                                    ]}
                                />
                            </Field>
                            <Field
                                label="Tanggal Keluar"
                                error={assetForm.errors.issued_at}
                            >
                                <Input
                                    type="date"
                                    value={assetForm.data.issued_at}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'issued_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Tanggal Masuk"
                                error={assetForm.errors.returned_at}
                            >
                                <Input
                                    type="date"
                                    value={assetForm.data.returned_at}
                                    onChange={(event) =>
                                        assetForm.setData(
                                            'returned_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Kondisi Keluar / Masuk"
                                error={
                                    assetForm.errors.condition_out ||
                                    assetForm.errors.condition_in
                                }
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    <SimpleSelect
                                        value={assetForm.data.condition_out}
                                        options={conditionLabels}
                                        onChange={(value) =>
                                            assetForm.setData(
                                                'condition_out',
                                                value,
                                            )
                                        }
                                    />
                                    <SimpleSelect
                                        value={
                                            assetForm.data.condition_in ||
                                            '__none'
                                        }
                                        options={{
                                            __none: 'Belum masuk',
                                            ...conditionLabels,
                                        }}
                                        onChange={(value) =>
                                            assetForm.setData(
                                                'condition_in',
                                                value === '__none' ? '' : value,
                                            )
                                        }
                                    />
                                </div>
                            </Field>
                        </div>

                        <Field
                            label="Catatan Assignment"
                            error={assetForm.errors.assignment_notes}
                        >
                            <Input
                                value={assetForm.data.assignment_notes}
                                onChange={(event) =>
                                    assetForm.setData(
                                        'assignment_notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Kelengkapan, nomor BAST, dll"
                            />
                        </Field>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={assetForm.processing}>
                                {assetForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Assignment'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function SummaryTile({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function SimpleSelect({
    value,
    options,
    onChange,
}: {
    value: string;
    options: Record<string, string>;
    onChange: (value: string) => void;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(options).map(([optionValue, label]) => (
                    <SelectItem key={optionValue} value={optionValue}>
                        {label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
