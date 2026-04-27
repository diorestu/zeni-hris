<?php

/**
 * PTKP (Penghasilan Tidak Kena Pajak) Configuration
 * Tax-free income allowance for Indonesian PPh21 calculation
 * 
 * Values based on Indonesian tax regulations
 * Format: [category] => ['yearly' => amount, 'monthly' => amount]
 */

return [
    'categories' => [
        'TK/0' => [
            'description' => 'Tidak kawin, tanpa tanggungan',
            'yearly' => 54_000_000,
            'monthly' => 4_500_000,
        ],
        'TK/1' => [
            'description' => 'Tidak kawin, 1 tanggungan',
            'yearly' => 58_500_000,
            'monthly' => 4_875_000,
        ],
        'TK/2' => [
            'description' => 'Tidak kawin, 2 tanggungan',
            'yearly' => 63_000_000,
            'monthly' => 5_250_000,
        ],
        'TK/3' => [
            'description' => 'Tidak kawin, 3 tanggungan',
            'yearly' => 67_500_000,
            'monthly' => 5_625_000,
        ],
        'K/0' => [
            'description' => 'Kawin, tanpa tanggungan',
            'yearly' => 58_500_000,
            'monthly' => 4_875_000,
        ],
        'K/1' => [
            'description' => 'Kawin, 1 tanggungan',
            'yearly' => 63_000_000,
            'monthly' => 5_250_000,
        ],
        'K/2' => [
            'description' => 'Kawin, 2 tanggungan',
            'yearly' => 67_500_000,
            'monthly' => 5_625_000,
        ],
        'K/3' => [
            'description' => 'Kawin, 3 tanggungan',
            'yearly' => 72_000_000,
            'monthly' => 6_000_000,
        ],
    ],
];
