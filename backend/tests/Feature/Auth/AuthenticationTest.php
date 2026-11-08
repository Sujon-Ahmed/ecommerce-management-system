<?php

use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

it('logs an active user in and returns a bearer token', function () {
    $user = shopOwnerUser();

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'Password@123!',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'token',
                'token_type',
                'user' => ['id', 'name', 'email', 'is_active', 'roles'],
            ],
        ]);

    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
    expect($response->json('data.user.roles'))->toContain('shop_owner');
});

it('normalizes the email casing during login', function () {
    $user = shopOwnerUser(['email' => 'owner.case@example.com']);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'OWNER.CASE@example.com',
        'password' => 'Password@123!',
    ])->assertOk()->assertJsonPath('data.user.email', 'owner.case@example.com');
});

it('rejects invalid credentials', function () {
    $user = shopOwnerUser();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])
        ->assertStatus(401)
        ->assertJsonPath('success', false)
        ->assertJsonPath('code', 'INVALID_CREDENTIALS');
});

it('rejects deactivated users', function () {
    $user = shopOwnerUser(['is_active' => false]);

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'Password@123!',
    ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'ACCOUNT_INACTIVE');
});

it('validates the login payload', function () {
    $this->postJson('/api/v1/auth/login', [])
        ->assertStatus(422)
        ->assertJsonPath('code', 'VALIDATION_ERROR')
        ->assertJsonValidationErrors(['email', 'password']);
});

it('requires authentication for protected endpoints', function () {
    $this->getJson('/api/v1/auth/me')
        ->assertStatus(401)
        ->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('returns the authenticated user', function () {
    $user = adminUser();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.roles.0', 'admin');
});

it('blocks deactivated users holding a valid token', function () {
    $user = shopOwnerUser();
    Sanctum::actingAs($user);
    $user->update(['is_active' => false]);

    $this->getJson('/api/v1/auth/me')
        ->assertStatus(403)
        ->assertJsonPath('code', 'ACCOUNT_INACTIVE');
});

it('revokes the current token on logout', function () {
    $user = shopOwnerUser();
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();

    expect($user->tokens()->count())->toBe(0);
});

it('updates the authenticated profile', function () {
    $user = adminUser();
    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/profile', [
        'name' => 'Updated Administrator',
        'phone' => '+8801700000099',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Administrator')
        ->assertJsonPath('data.phone', '+8801700000099');

    expect($user->fresh()->name)->toBe('Updated Administrator');
});

it('updates the password and revokes other tokens', function () {
    $user = shopOwnerUser();
    $current = $user->createToken('current')->plainTextToken;
    $user->createToken('other');

    $this->withHeader('Authorization', 'Bearer '.$current)
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'Password@123!',
            'password' => 'NewPassword@456!',
            'password_confirmation' => 'NewPassword@456!',
        ])
        ->assertOk();

    expect(Hash::check('NewPassword@456!', $user->fresh()->password))->toBeTrue()
        ->and($user->tokens()->count())->toBe(1);
});

it('rejects an incorrect current password', function () {
    $user = shopOwnerUser();
    $token = $user->createToken('current')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'not-the-password',
            'password' => 'NewPassword@456!',
            'password_confirmation' => 'NewPassword@456!',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'INVALID_CURRENT_PASSWORD');
});
