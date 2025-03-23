<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
            'role' => 'superadmin',
            'password' => Hash::make('123'),
            'remember_token' => Str::random(10),
        ]);

        User::factory()->count(10)->create(); // Hanya jika menggunakan factory
    }
}
