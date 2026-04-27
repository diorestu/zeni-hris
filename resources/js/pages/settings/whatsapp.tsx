import { Head, useForm, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem } from '@/types';

type SessionSnapshot = {
    name?: string;
    status?: string;
    me?: {
        id?: string;
        pushName?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan',
        href: edit(),
    },
    {
        title: 'WhatsApp',
        href: '/settings/whatsapp',
    },
];

export default function WhatsappSettingsPage({
    defaultPhone,
    sessionSnapshot,
}: {
    defaultPhone: string | null;
    sessionSnapshot: SessionSnapshot | null;
}) {
    const form = useForm({
        phone: defaultPhone ?? '',
        message: 'Halo! Ini pesan uji coba dari PaperTime.',
    });
    const { flash } = usePage<{
        flash?: { success?: string | null; error?: string | null };
    }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uji WhatsApp" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Uji WhatsApp"
                        description="Kirim pesan percobaan langsung dari aplikasi menggunakan session WAHA aktif."
                    />

                    <div className="rounded-lg border p-4 text-sm">
                        <p className="font-medium text-slate-900">Session aktif</p>
                        <p className="mt-2 text-slate-600">
                            Nama session: <span className="font-medium">{sessionSnapshot?.name ?? 'ZeniConsulting'}</span>
                        </p>
                        <p className="text-slate-600">
                            Status: <span className="font-medium">{sessionSnapshot?.status ?? 'Tidak diketahui'}</span>
                        </p>
                        <p className="text-slate-600">
                            Nomor pengirim: <span className="font-medium">{sessionSnapshot?.me?.id ?? '-'}</span>
                        </p>
                    </div>

                    {flash?.success ? (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}

                    {flash?.error ? (
                        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {flash.error}
                        </div>
                    ) : null}

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/settings/whatsapp/send', {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-4 rounded-lg border p-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_phone">Nomor tujuan</Label>
                            <Input
                                id="whatsapp_phone"
                                type="tel"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                                placeholder="081234567890"
                            />
                            <InputError message={form.errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_message">Pesan</Label>
                            <textarea
                                id="whatsapp_message"
                                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.data.message}
                                onChange={(event) => form.setData('message', event.target.value)}
                            />
                            <InputError message={form.errors.message} />
                        </div>

                        <Button type="submit" disabled={form.processing}>
                            Kirim pesan uji
                        </Button>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
