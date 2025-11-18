<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('geojson', function (Blueprint $table) {
            $table->json('properties_snapshot')->nullable()->after('geojson_size');
            $table->json('geojson_bbox')->nullable()->after('properties_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('geojson', function (Blueprint $table) {
            $table->dropColumn(['properties_snapshot', 'geojson_bbox']);
        });
    }
};
