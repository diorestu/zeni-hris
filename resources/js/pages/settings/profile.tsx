import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ImagePlus, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CompanySettingController from '@/actions/App/Http/Controllers/Settings/CompanySettingController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan profil',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    company,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    company: {
        name: string;
        details: string | null;
        logo_url: string | null;
    };
}) {
    const { auth } = usePage().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(
        company.logo_url,
    );
    const uploadedPreviewRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (uploadedPreviewRef.current) {
                URL.revokeObjectURL(uploadedPreviewRef.current);
            }
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan profil" />

            <h1 className="sr-only">Pengaturan profil</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Informasi profil"
                        description="Perbarui nama, alamat email, dan nomor WhatsApp Anda"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Alamat email</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Alamat email"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Nomor WhatsApp</Label>

                                    <Input
                                        id="phone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={
                                            (auth.user.phone as string | null | undefined) ??
                                            ''
                                        }
                                        name="phone"
                                        required
                                        autoComplete="tel"
                                        placeholder="081234567890"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.phone}
                                    />

                                    {(auth.user.phone_verified_at as
                                        | string
                                        | null
                                        | undefined) === null ? (
                                        <p className="text-sm text-amber-600">
                                            Nomor WhatsApp belum terverifikasi.
                                        </p>
                                    ) : null}
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                 Alamat email Anda belum
                                                terverifikasi.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Klik di sini untuk mengirim
                                                    ulang verifikasi email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                     Tautan verifikasi baru
                                                     telah dikirim ke alamat
                                                     email Anda.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                             Tersimpan
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>

                    <Heading
                        variant="small"
                        title="Informasi perusahaan"
                        description="Perbarui nama dan detail perusahaan"
                    />

                    <Form
                        {...CompanySettingController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="company_name">
                                        Nama perusahaan
                                    </Label>

                                    <Input
                                        id="company_name"
                                        className="mt-1 block w-full"
                                        defaultValue={company.name}
                                        name="name"
                                        required
                                        placeholder="Nama perusahaan"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_details">
                                        Detail perusahaan
                                    </Label>

                                    <textarea
                                        id="company_details"
                                        className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={company.details ?? ''}
                                        name="details"
                                        placeholder="Alamat, NPWP, kontak, atau detail perusahaan lainnya"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.details}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_logo">
                                        Logo perusahaan
                                    </Label>

                                    <label
                                        htmlFor="company_logo"
                                        className="block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100"
                                    >
                                        <input
                                            id="company_logo"
                                            name="logo"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0];

                                                if (!file) {
                                                    if (
                                                        uploadedPreviewRef.current
                                                    ) {
                                                        URL.revokeObjectURL(
                                                            uploadedPreviewRef.current,
                                                        );
                                                        uploadedPreviewRef.current =
                                                            null;
                                                    }
                                                    setLogoPreview(
                                                        company.logo_url,
                                                    );
                                                    return;
                                                }

                                                if (uploadedPreviewRef.current) {
                                                    URL.revokeObjectURL(
                                                        uploadedPreviewRef.current,
                                                    );
                                                }

                                                const previewUrl =
                                                    URL.createObjectURL(file);
                                                uploadedPreviewRef.current =
                                                    previewUrl;
                                                setLogoPreview(previewUrl);
                                            }}
                                        />

                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm">
                                                <Upload className="size-5 text-slate-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-800">
                                                    Klik untuk upload atau drag
                                                    file logo
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    PNG/JPG/WEBP. Akan
                                                    dikonversi ke WEBP dan
                                                    dikompres maks 150KB.
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <div className="rounded-md border bg-white p-3">
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Preview logo aktif
                                        </p>
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Pratinjau logo perusahaan"
                                                className="h-16 w-16 rounded-md border object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-slate-50">
                                                <ImagePlus className="size-5 text-slate-400" />
                                            </div>
                                        )}
                                    </div>

                                    <InputError
                                        className="mt-2"
                                        message={errors.logo}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        Simpan Perusahaan
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Tersimpan
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
