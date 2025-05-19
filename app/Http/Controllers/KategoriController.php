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

    /** FORM CREATE */
    public function create()
    {
        return Inertia::render('kategori/create');
    }

    /** STORE */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'orde0' => 'required|string|max:255',
            'orde1'         => 'nullable|string|max:255',
            'orde2'         => 'nullable|string|max:255',
            'orde3'         => 'nullable|string|max:255',
            'orde4'         => 'nullable|string|max:255',
            'kode'          => 'nullable|string|max:50|unique:kategori,kode',
            'kode_warna'    => ['required', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'ket_warna'     => 'nullable|string|max:255',
            'layer_order'   => 'required|integer|between:0,65535',
        ]);

        Kategori::create($validated);

        return redirect()
            ->route('dashboard.kategori.index')
            ->with('success', 'Kategori berhasil ditambahkan.');
    }

    /** SHOW (opsional) */
    public function show($id)
    {
        $kategori = Kategori::findOrFail($id);

        return Inertia::render('kategori/show', [
            'kategori' => $kategori,
        ]);
    }

    /** FORM EDIT */
    public function edit($id)
    {
        $kategori = Kategori::findOrFail($id);

        return Inertia::render('kategori/update', [
            'kategori' => $kategori,
        ]);
    }

    /** UPDATE */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'orde0' => 'required|string|max:255',
            'orde1'         => 'nullable|string|max:255',
            'orde2'         => 'nullable|string|max:255',
            'orde3'         => 'nullable|string|max:255',
            'orde4'         => 'nullable|string|max:255',
            'kode'          => 'nullable|string|max:50|unique:kategori,kode,' . $id . ',id_kategori',
            'kode_warna'    => ['required', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'ket_warna'     => 'nullable|string|max:255',
            'layer_order'   => 'required|integer|between:0,65535',
        ]);

        Kategori::findOrFail($id)->update($validated);

        return redirect()
            ->route('dashboard.kategori.index')
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    /** SOFT‑DELETE */
    public function destroy($id)
    {
        Kategori::findOrFail($id)->delete();

        return redirect()
            ->route('dashboard.kategori.index')
            ->with('success', 'Kategori berhasil dihapus.');
    }
}
