<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KategoriController extends Controller
{
    // Display a listing of the resource
    public function index()
    {
        $kategoris = Kategori::all(); // Get all categories
        return Inertia::render('kategori/index', [
            'kategoris' => $kategoris,
        ]);
    }

    // Show the form for creating a new resource
    public function create()
    {
        return Inertia::render('kategori/create'); // Render form view
    }

    // Store a newly created resource in storage
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:255|unique:kategori,nama_kategori',
            'kode_warna' => 'required|string|max:7', // Assuming it's a hex color
            'ket_warna' => 'nullable|string|max:255'
        ]);

        // Create category
        Kategori::create($validated);

        return redirect()->route('dashboard.kategori.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    // Display the specified resourc
    public function show($id)
    {
        $kategori = Kategori::findOrFail($id);
        return Inertia::render('kategori/show', [
            'kategori' => $kategori,
        ]);
    }

    // Show the form for editing the specified resource
    public function edit($id)
    {
        $kategori = Kategori::findOrFail($id);
        return Inertia::render('kategori/update', [
            'kategori' => $kategori,
        ]);
    }

    // Update the specified resource in storage
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:255|unique:kategori,nama_kategori,' . $id . ',id_kategori',
            'kode_warna' => 'required|string|max:7', // Assuming it's a hex color
            'ket_warna' => 'nullable|string|max:255'
        ]);

        $kategori = Kategori::findOrFail($id);
        $kategori->update($validated);

        return redirect()->route('dashboard.kategori.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    // Remove the specified resource from storage
    public function destroy($id)
    {
        $kategori = Kategori::findOrFail($id);
        $kategori->delete(); // Soft delete

        return redirect()->route('dashboard.kategori.index')->with('success', 'Kategori berhasil dihapus.');
    }
}
