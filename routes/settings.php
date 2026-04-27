<?php

use App\Http\Controllers\Settings\CompanySettingController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SubUserController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\WhatsappTestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin.access'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('settings/company', [CompanySettingController::class, 'update'])->name('company.update');
    Route::get('settings/users', [SubUserController::class, 'index'])->name('settings.users.index');
    Route::post('settings/users', [SubUserController::class, 'store'])->name('settings.users.store');
    Route::put('settings/users/{subUser}', [SubUserController::class, 'update'])->name('settings.users.update');
    Route::delete('settings/users/{subUser}', [SubUserController::class, 'destroy'])->name('settings.users.destroy');
    Route::get('settings/whatsapp', [WhatsappTestController::class, 'show'])->name('settings.whatsapp.show');
    Route::post('settings/whatsapp/send', [WhatsappTestController::class, 'send'])->name('settings.whatsapp.send');
});

Route::middleware(['auth', 'account.activated'])->group(function () {
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::post('settings/password/skip', [PasswordController::class, 'skipPrompt'])
        ->name('user-password.skip');
});

Route::middleware(['auth', 'account.activated', 'admin.access'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});
