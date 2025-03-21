<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('report', function (Blueprint $table) {
            $table->id('id_report');
            $table->unsignedBigInteger('id_geojson');
            $table->foreign('id_geojson')->references('id_geojson')->on('geojson')->onDelete('cascade');
            $table->string('file_path');
            $table->text('description')->nullable();
            $table->string('nomor')->unique();
            $table->enum('sifat', ['Biasa', 'Rahasia', 'Penting', 'Segera'])->default('Biasa');
            $table->string('hal');
            $table->string('kepada');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('report');
    }
};
