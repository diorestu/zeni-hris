<?php

namespace Tests\Unit;

use App\Services\WahaClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class WahaClientTest extends TestCase
{
    public function test_send_text_retries_until_success(): void
    {
        config()->set('services.waha.enabled', true);
        config()->set('services.waha.base_url', 'https://waha.example.test');
        config()->set('services.waha.api_key', 'secret');

        Log::spy();

        Http::fake([
            'https://waha.example.test/api/sendText' => Http::sequence()
                ->push(['message' => 'temporarily unavailable'], 503)
                ->push(['message' => 'temporarily unavailable'], 503)
                ->push(['key' => ['id' => 'abc123'], 'status' => 'PENDING'], 200),
        ]);

        $result = app(WahaClient::class)->sendTextToPhone('081234567890', 'Halo');

        $this->assertSame('PENDING', $result['status']);

        Http::assertSentCount(3);
        Log::shouldHaveReceived('warning')->twice();
        Log::shouldHaveReceived('info')->once();
    }

    public function test_send_text_logs_failure_after_retries_are_exhausted(): void
    {
        config()->set('services.waha.enabled', true);
        config()->set('services.waha.base_url', 'https://waha.example.test');
        config()->set('services.waha.api_key', 'secret');

        Log::spy();

        Http::fake([
            'https://waha.example.test/api/sendText' => Http::response([
                'message' => 'offline',
            ], 503),
            'https://waha.example.test/api/sessions?all=false' => Http::response([
                ['name' => 'ZeniConsulting', 'status' => 'STOPPED'],
            ], 200),
        ]);

        $this->expectException(RuntimeException::class);

        try {
            app(WahaClient::class)->sendTextToPhone('081234567890', 'Halo');
        } finally {
            Http::assertSentCount(4);
            Log::shouldHaveReceived('error')->once();
        }
    }
}
