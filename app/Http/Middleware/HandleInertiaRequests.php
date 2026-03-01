<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'companyLogoUrl' => function () use ($request) {
                if (! $request->user()) {
                    return null;
                }

                $setting = CompanySetting::query()
                    ->select('logo_path')
                    ->where('user_id', $request->user()->accountOwnerId())
                    ->first();

                if (! $setting?->logo_path) {
                    return null;
                }

                return Storage::disk('public')->url($setting->logo_path);
            },
            'auth' => [
                'user' => $request->user(),
            ],
            'permissions' => [
                'can_manage_sub_users' => $request->user()?->canManageSubUsers() ?? false,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
