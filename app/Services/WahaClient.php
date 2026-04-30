<?php

namespace App\Services;

use App\Support\WhatsAppPhone;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class WahaClient
{
    private const SESSION_NAME = 'ZeniConsulting';

    public function sendTextToPhone(string $phone, string $text): array
    {
        return $this->sendText(WhatsAppPhone::toChatId($phone), $text);
    }

    /**
     * @return array<string, mixed>
     */
    public function sendFileToPhone(
        string $phone,
        string $filename,
        string $contents,
        string $caption = '',
        string $mimetype = 'application/pdf',
    ): array {
        return $this->sendFile(WhatsAppPhone::toChatId($phone), $filename, $contents, $caption, $mimetype);
    }

    /**
     * @return array<string, mixed>
     */
    public function sendText(string $chatId, string $text): array
    {
        if (! config('services.waha.enabled')) {
            throw new RuntimeException('WAHA integration is disabled.');
        }

        $payload = [
            'chatId' => $chatId,
            'reply_to' => null,
            'text' => $text,
            'linkPreview' => true,
            'linkPreviewHighQuality' => false,
            'session' => self::SESSION_NAME,
        ];

        return $this->postWithRetry('/api/sendText', $payload, 'send_text', $chatId);
    }

    /**
     * @return array<string, mixed>
     */
    public function sendFile(
        string $chatId,
        string $filename,
        string $contents,
        string $caption = '',
        string $mimetype = 'application/pdf',
    ): array {
        if (! config('services.waha.enabled')) {
            throw new RuntimeException('WAHA integration is disabled.');
        }

        $payload = [
            'session' => self::SESSION_NAME,
            'chatId' => $chatId,
            'caption' => $caption,
            'file' => [
                'mimetype' => $mimetype,
                'filename' => $filename,
                'data' => base64_encode($contents),
            ],
        ];

        return $this->postWithRetry('/api/sendFile', $payload, 'send_file', $chatId);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function sessionSnapshot(): ?array
    {
        if (! config('services.waha.enabled')) {
            return null;
        }

        try {
            $response = $this->request()
                ->get('/api/sessions', ['all' => 'false']);

            if (! $response->successful()) {
                return [
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                ];
            }

            $sessions = $response->json();

            if (! is_array($sessions)) {
                return null;
            }

            foreach ($sessions as $session) {
                if (($session['name'] ?? null) === self::SESSION_NAME) {
                    return $session;
                }
            }

            return ['name' => self::SESSION_NAME, 'status' => 'NOT_FOUND'];
        } catch (ConnectionException $exception) {
            return [
                'name' => self::SESSION_NAME,
                'status' => 'UNREACHABLE',
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl((string) config('services.waha.base_url'))
            ->acceptJson()
            ->withHeader('X-Api-Key', (string) config('services.waha.api_key'))
            ->timeout((int) config('services.waha.timeout', 15));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function postWithRetry(string $endpoint, array $payload, string $logAction, string $chatId): array
    {
        $response = null;
        $lastException = null;

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $response = $this->request()->post($endpoint, $payload);

                if ($response->successful()) {
                    $body = $response->json() ?? [];

                    Log::info('waha.'.$logAction.'.sent', [
                        'session' => self::SESSION_NAME,
                        'chat_id' => $chatId,
                        'attempt' => $attempt,
                        'message_id' => data_get($body, 'key.id'),
                        'message_status' => data_get($body, 'status'),
                    ]);

                    return $body;
                }

                if (! $this->shouldRetryResponse($response) || $attempt === 3) {
                    break;
                }

                Log::warning('waha.'.$logAction.'.retry', [
                    'session' => self::SESSION_NAME,
                    'chat_id' => $chatId,
                    'attempt' => $attempt,
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                ]);
            } catch (ConnectionException $exception) {
                $lastException = $exception;

                if ($attempt === 3) {
                    break;
                }

                Log::warning('waha.'.$logAction.'.retry', [
                    'session' => self::SESSION_NAME,
                    'chat_id' => $chatId,
                    'attempt' => $attempt,
                    'error' => $exception->getMessage(),
                ]);
            }

            usleep($attempt * 300000);
        }

        $snapshot = $this->sessionSnapshot();

        Log::error('waha.'.$logAction.'.failed', [
            'session' => self::SESSION_NAME,
            'chat_id' => $chatId,
            'status' => $response?->status(),
            'body' => $response?->json() ?? $response?->body(),
            'session_snapshot' => $snapshot,
            'error' => $lastException?->getMessage(),
        ]);

        throw new RuntimeException('Gagal mengirim pesan WhatsApp melalui WAHA.');
    }

    private function shouldRetryResponse(Response $response): bool
    {
        return $response->serverError() || $response->status() === 429;
    }
}
