<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('region', function (Blueprint $table) {
            $table->id('id_region');
            $table->string('name');
            $table->string('provinsi');
            $table->string('kabupaten');
            $table->string('kecamatan');
            $table->string('desa');
            $table->string('detail')->nullable();
            $table->string('link')->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['provinsi', 'kabupaten', 'kecamatan', 'desa'], 'unique_region_combination');
        });
    }

    public function down()
    {
        Schema::dropIfExists('region');
    }
};
