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
        title: 'Profile settings',
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
        employee_code_prefix: string;
        employee_code_digits: number;
        employee_code_next_number: number;
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
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name and email address"
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
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
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
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>

                    <Heading
                        variant="small"
                        title="Company information"
                        description="Update company name and company details"
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
                                        Company name
                                    </Label>

                                    <Input
                                        id="company_name"
                                        className="mt-1 block w-full"
                                        defaultValue={company.name}
                                        name="name"
                                        required
                                        placeholder="Company name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_details">
                                        Company details
                                    </Label>

                                    <textarea
                                        id="company_details"
                                        className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={company.details ?? ''}
                                        name="details"
                                        placeholder="Address, NPWP, contact, or other company details"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.details}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_code_prefix">
                                            Employee code prefix
                                        </Label>
                                        <Input
                                            id="employee_code_prefix"
                                            className="mt-1 block w-full"
                                            defaultValue={
                                                company.employee_code_prefix
                                            }
                                            name="employee_code_prefix"
                                            placeholder="EMP"
                                            required
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                errors.employee_code_prefix
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_code_digits">
                                            Number digits
                                        </Label>
                                        <Input
                                            id="employee_code_digits"
                                            type="number"
                                            min={1}
                                            max={8}
                                            className="mt-1 block w-full"
                                            defaultValue={
                                                company.employee_code_digits
                                            }
                                            name="employee_code_digits"
                                            required
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                errors.employee_code_digits
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_code_next_number">
                                            Next sequence
                                        </Label>
                                        <Input
                                            id="employee_code_next_number"
                                            type="number"
                                            min={1}
                                            className="mt-1 block w-full"
                                            defaultValue={
                                                company.employee_code_next_number
                                            }
                                            name="employee_code_next_number"
                                            required
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                errors.employee_code_next_number
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_logo">
                                        Company logo
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
                                                alt="Company logo preview"
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
                                        Save Company
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
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
