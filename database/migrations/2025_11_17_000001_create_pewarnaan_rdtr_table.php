<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pewarnaan_rdtr', function (Blueprint $table) {
            $table->id('id_pewarnaan_rdtr');
            $table->string('kode')->unique();
            $table->string('sub_zona')->nullable();
            $table->string('cmyk')->nullable();
            $table->string('rgb')->nullable();
            $table->string('hsv')->nullable();
            $table->string('kode_warna', 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pewarnaan_rdtr');
    }
};