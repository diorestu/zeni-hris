<?php

namespace App\Support;

class UserPassword
{
    public static function defaultFromPhone(string $phone): string
    {
        $normalized = WhatsAppPhone::normalize($phone);

        if ($normalized === '') {
            return 'password';
        }

        return $normalized;
    }
}
