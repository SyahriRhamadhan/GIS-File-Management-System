<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('owner', function (Blueprint $table) {
            $table->id('id_owner');
            $table->string('name');
            $table->string('wali')->nullable();
            $table->enum('type', ['PT', 'CV', 'Yayasan/Lembaga', 'Perorangan']);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('owner');
    }
};
