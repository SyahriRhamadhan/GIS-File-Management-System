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

            $table->foreignId('id_region')
                ->nullable()
                ->constrained('region', 'id_region')
                ->onDelete('cascade');

            $table->foreignId('id_owner')
                ->nullable()
                ->constrained('owner', 'id_owner')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('geojson');
    }
};
