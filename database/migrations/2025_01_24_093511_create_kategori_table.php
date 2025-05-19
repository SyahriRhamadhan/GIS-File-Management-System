<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kategori', function (Blueprint $table) {
            $table->id('id_kategori');
            $table->string('orde0');
            $table->string('orde1')->nullable();
            $table->string('orde2')->nullable();
            $table->string('orde3')->nullable();
            $table->string('orde4')->nullable();
            $table->string('kode')->nullable();
            $table->string('kode_warna', 7);
            $table->string('ket_warna')->nullable();
            $table->unsignedSmallInteger('layer_order')
                ->default(0)
                ->index()
                ->comment('Urutan rendering layer/polygon pada peta GeoJSON');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kategori');
    }
};
