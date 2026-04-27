<?php

namespace App\Http\Controllers\Api\Mobile\V1\Concerns;

use App\Models\Employee;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

trait InteractsWithSelfService
{
    private function isSelfServiceUser(User $user): bool
    {
        return $user->role === 'user';
    }

    private function resolveSelfServiceEmployee(User $user): ?Employee
    {
        if (! $user->email) {
            return null;
        }

        return Employee::query()
            ->with(['division:id,name', 'position:id,name'])
            ->where('email', $user->email)
            ->first();
    }

    private function resolveRequiredSelfServiceEmployee(User $user): Employee
    {
        $employee = $this->resolveSelfServiceEmployee($user);

        if (! $employee) {
            throw new HttpException(422, 'Akun ini belum terhubung ke data karyawan.');
        }

        return $employee;
    }

    private function guardSelfServiceRecordOwnership(User $user, int $employeeId): void
    {
        if (! $this->isSelfServiceUser($user)) {
            return;
        }

        $employee = $this->resolveRequiredSelfServiceEmployee($user);

        abort_unless($employee->id === $employeeId, 404);
    }
}
