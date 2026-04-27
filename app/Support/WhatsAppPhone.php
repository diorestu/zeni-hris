<?php

namespace App\Support;

class WhatsAppPhone
{
    public static function normalize(string $phone): string
    {
        $digits = preg_replace('/[^\d]/', '', $phone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '08')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        if (str_starts_with($digits, '628')) {
            return $digits;
        }

        return $digits;
    }

    public static function isValid(string $phone): bool
    {
        return (bool) preg_match('/^628\d{7,13}$/', self::normalize($phone));
    }

    public static function toChatId(string $phone): string
    {
        return self::normalize($phone).'@c.us';
    }
}
