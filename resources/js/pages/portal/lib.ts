export type MobileResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

export type PortalLinkMap = {
    attendance: string;
    leaves: string;
    overtimes: string;
    payroll: string;
    dashboard?: string;
};

export async function requestApi<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>,
): Promise<MobileResponse<T>> {
    const browserTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Timezone': browserTimezone,
            ...(xsrfCookie
                ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) }
                : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json()) as MobileResponse<T>;

    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Request failed.');
    }

    return payload;
}

export const chips: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-900',
    late: 'bg-amber-100 text-amber-900',
    on_leave: 'bg-sky-100 text-sky-900',
    absent: 'bg-rose-100 text-rose-900',
    pending: 'bg-stone-200 text-stone-800',
    approved: 'bg-emerald-100 text-emerald-900',
    rejected: 'bg-rose-100 text-rose-900',
    cancelled: 'bg-stone-200 text-stone-800',
    saved: 'bg-zinc-900 text-white',
    draft: 'bg-stone-200 text-stone-800',
};

export const formatTime = (value: string | null) => {
    if (!value) {
        return '--:--';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date);
};

export const formatDate = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date);
};

export const formatCurrency = (value: string | number | null) => {
    if (value === null || value === '') {
        return 'Belum tersedia';
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return String(value);
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericValue);
};
