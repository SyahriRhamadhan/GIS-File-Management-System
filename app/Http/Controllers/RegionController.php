<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class RegionController extends Controller
{
    public function index()
    {
        $regions = Region::all();
        return Inertia::render('region/index', [
            'regions' => $regions,
        ]);
    }

    public function create()
    {
        return Inertia::render('region/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['provinsi', 'kabupaten', 'kecamatan', 'desa'])],
            'parent_id' => 'nullable|exists:region,id_region',
            'link' => 'required|string|max:255',
            'alamat' => 'required|string|max:255',
        ]);

        Region::create($validated);

        return redirect()->route('dashboard.region.index')->with('success', 'Data wilayah berhasil ditambahkan.');
    }

    public function show($id)
    {
        $region = Region::with('parent')->findOrFail($id);
        return Inertia::render('region/show', [
            'region' => $region,
        ]);
    }

    public function edit($id)
    {
        $region = Region::findOrFail($id);
        return Inertia::render('region/edit', [
            'region' => $region,
        ]);
    }

    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['provinsi', 'kabupaten', 'kecamatan', 'desa'])],
            'parent_id' => 'nullable|exists:region,id_region',
            'link' => 'required|string|max:255',
            'alamat' => 'required|string|max:255',
        ]);

        $region->update($validated);

        return redirect()->route('region.index')->with('success', 'Data wilayah berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $region = Region::findOrFail($id);
        $region->delete(); // Soft delete

        return redirect()->route('dashboard.region.index')->with('success', 'Data wilayah berhasil dihapus.');
    }
}
