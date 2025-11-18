<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('geojson', function (Blueprint $table) {
            $table->string('geojson_path')->nullable()->after('geojson');
            $table->unsignedBigInteger('geojson_size')->nullable()->after('geojson_path');
        });
    }

    public function down(): void
    {
        Schema::table('geojson', function (Blueprint $table) {
            $table->dropColumn(['geojson_path', 'geojson_size']);
        });
    }
};