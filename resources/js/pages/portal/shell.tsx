import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    House,
    Plus,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import type { PortalLinkMap } from './lib';

type PortalShellProps = PropsWithChildren<{
    title: string;
    eyebrow: string;
    description?: string;
    active: 'home' | 'attendance' | 'leaves' | 'overtimes' | 'payroll';
    links: PortalLinkMap;
    headerAction?: ReactNode;
}>;

const navItems = [
    { key: 'home', label: 'Home', icon: House, href: '/portal' },
    { key: 'attendance', label: 'Shift', icon: Clock3 },
    { key: 'leaves', label: 'Leave', icon: CalendarDays },
    { key: 'payroll', label: 'Payroll', icon: Wallet },
] as const;

export function PortalShell({
    children,
    title,
    eyebrow,
    description,
    active,
    links,
    headerAction,
}: PortalShellProps) {
    const [quickActionOpen, setQuickActionOpen] = useState(false);

    return (
        <>
            <Head title={title}>
                <meta name="theme-color" content="#ffffff" />
                <link rel="manifest" href="/manifest.webmanifest" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white text-slate-900">
                <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white px-4 pb-28 pt-4 sm:max-w-lg">
                    <header className="mb-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                            {eyebrow}
                        </p>
                        <div className="mt-2 flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
                                    {title}
                                </h1>
                                {description ? (
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                            {headerAction ? <div>{headerAction}</div> : null}
                        </div>
                    </header>

                    <main className="flex-1">{children}</main>

                    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4 sm:max-w-lg">
                        <div className="relative grid grid-cols-5 gap-2 rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                            {quickActionOpen ? (
                                <div className="absolute inset-x-8 bottom-20 rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                                    <div className="grid gap-2">
                                        <a
                                            href={links.leaves ?? '#'}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan cuti
                                        </a>
                                        <a
                                            href={`${links.leaves ?? '/portal/leaves'}?type=sick`}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan sakit
                                        </a>
                                        <a
                                            href={links.overtimes ?? '#'}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan lembur
                                        </a>
                                    </div>
                                </div>
                            ) : null}
                            {navItems.slice(0, 2).map((item) => {
                                const href =
                                    item.key === 'home'
                                        ? item.href
                                        : links[
                                              item.key as keyof PortalLinkMap
                                          ] ?? '#';
                                const isActive = active === item.key;

                                return (
                                    <a
                                        key={item.key}
                                        href={href}
                                        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] ${
                                            isActive
                                                ? 'bg-slate-950 text-white'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        <item.icon className="size-4" />
                                        <span className="text-[11px] font-semibold">
                                            {item.label}
                                        </span>
                                    </a>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() =>
                                    setQuickActionOpen((current) => !current)
                                }
                                className="-mt-8 inline-flex size-16 items-center justify-center self-start justify-self-center rounded-full bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.28)]"
                            >
                                <Plus className="size-6" />
                            </button>
                            {navItems.slice(2).map((item) => {
                                const href =
                                    item.key === 'home'
                                        ? item.href
                                        : links[
                                              item.key as keyof PortalLinkMap
                                          ] ?? '#';
                                const isActive = active === item.key;

                                return (
                                    <a
                                        key={item.key}
                                        href={href}
                                        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] ${
                                            isActive
                                                ? 'bg-slate-950 text-white'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        <item.icon className="size-4" />
                                        <span className="text-[11px] font-semibold">
                                            {item.label}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
