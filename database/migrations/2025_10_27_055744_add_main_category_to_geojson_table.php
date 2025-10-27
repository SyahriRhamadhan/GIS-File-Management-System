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
        Schema::table('geojson', function (Blueprint $table) {
            $table->enum('main_category', ['RDTR', 'RTRW', 'KKPR', 'GANTI RUGI'])
                ->nullable()
                ->after('source_name')
                ->comment('Kategori induk wilayah: RDTR, RTRW, KKPR, GANTI RUGI');

            $table->index('main_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('geojson', function (Blueprint $table) {
            $table->dropIndex(['main_category']);
            $table->dropColumn('main_category');
        });
    }
};
