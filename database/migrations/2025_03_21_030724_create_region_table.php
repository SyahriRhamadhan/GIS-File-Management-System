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
            $table->enum('type', ['provinsi', 'kabupaten', 'kecamatan', 'desa']);
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('link');
            $table->string('alamat');


            $table->foreign('parent_id')->references('id_region')->on('region')->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('region');
    }
};
