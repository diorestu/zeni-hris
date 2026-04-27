<?php

namespace App\Http\Requests\Hris;

use App\Models\Position;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare request data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper((string) $this->input('code')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Position $position */
        $position = $this->route('position');
        $ownerId = $this->user()->accountOwnerId();

        return [
            'division_id' => [
                'nullable',
                'integer',
                Rule::exists('divisions', 'id')->where('user_id', $ownerId),
            ],
            'parent_position_id' => [
                'nullable',
                'integer',
                Rule::exists('positions', 'id')->where('user_id', $ownerId),
                Rule::notIn([$position->id]),
            ],
            'code' => [
                'required',
                'string',
                'min:2',
                'max:3',
                'regex:/^[A-Z0-9]+$/',
                Rule::unique('positions', 'code')
                    ->where('user_id', $ownerId)
                    ->ignore($position->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', Rule::in(['0', '1', '2', '3', '4', '5'])],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
