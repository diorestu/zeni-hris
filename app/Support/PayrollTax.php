<?php

namespace App\Support;

class PayrollTax
{
    public static function floorRupiah(float $amount): int
    {
        return (int) floor($amount);
    }

    public static function grossUpAllowance(float $taxableGross, float $rateFraction): int
    {
        if ($rateFraction <= 0 || $rateFraction >= 1) {
            return 0;
        }

        $allowance = self::floorRupiah($taxableGross * $rateFraction / (1 - $rateFraction));

        while ($allowance > 0 && self::floorRupiah(($taxableGross + ($allowance - 1)) * $rateFraction) <= $allowance - 1) {
            $allowance--;
        }

        return $allowance;
    }
}
