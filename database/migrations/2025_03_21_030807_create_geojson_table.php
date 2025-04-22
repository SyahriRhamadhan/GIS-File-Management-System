<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('geojson', function (Blueprint $table) {
            $table->id('id_geojson');
            $table->json('geojson');
            $table->softDeletes();

            $table->string('source_name')->nullable();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');

            $table->unsignedBigInteger('id_region');
            $table->foreign('id_region')->nullable()->references('id_region')->on('region')->onDelete('cascade');

            $table->unsignedBigInteger('id_owner');
            $table->foreign('id_owner')->nullable()->references('id_owner')->on('owner')->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('geojson');
    }
};
