<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

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
        $regions = Region::select('provinsi', 'kabupaten', 'kecamatan', 'desa')->get();

        return Inertia::render('region/create', [
            'regionOptions' => $regions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'provinsi'  => 'required|string|max:255',
            'kabupaten' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'desa'      => 'required|string|max:255',
            'detail'    => 'nullable|string|max:255',
            'link'      => 'nullable|url|max:255',
        ]);

        $exists = Region::where('provinsi', $validated['provinsi'])
            ->where('kabupaten', $validated['kabupaten'])
            ->where('kecamatan', $validated['kecamatan'])
            ->where('desa', $validated['desa'])
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['desa' => 'Wilayah dengan kombinasi ini sudah terdaftar.'])
                ->withInput();
        }

        $region = Region::create($validated);

        // Check if this is an AJAX request from modal (for geojson create page)
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return redirect()->back()
                ->with('success', 'Region berhasil ditambahkan')
                ->with('new_region', $region);
        }

        // Default redirect for regular region management
        return redirect()->route('dashboard.region.index')->with('success', 'Data wilayah berhasil ditambahkan.');
    }


    public function show($id)
    {
        $region = Region::findOrFail($id);
        return Inertia::render('region/show', [
            'region' => $region,
        ]);
    }

    public function edit($id)
    {
        $region = Region::findOrFail($id);

        $regionOptions = Region::select('provinsi', 'kabupaten', 'kecamatan', 'desa')->get();

        return Inertia::render('region/update', [
            'region'        => $region,
            'regionOptions' => $regionOptions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'provinsi'  => 'required|string|max:255',
            'kabupaten' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'desa'      => 'required|string|max:255',
            'alamat'    => 'nullable|string|max:255',
            'link'      => 'nullable|url|max:255',
        ]);

        $duplicate = Region::where('id_region', '!=', $region->id_region)
            ->where('provinsi', $validated['provinsi'])
            ->where('kabupaten', $validated['kabupaten'])
            ->where('kecamatan', $validated['kecamatan'])
            ->where('desa', $validated['desa'])
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'desa' => 'Wilayah dengan kombinasi ini sudah terdaftar.',
            ]);
        }

        $region->update($validated);

        return redirect()
            ->route('dashboard.region.index')
            ->with('success', 'Data wilayah berhasil diperbarui.');
    }


    public function destroy($id)
    {
        $region = Region::findOrFail($id);
        $region->delete();

        return redirect()->route('dashboard.region.index')->with('success', 'Data wilayah berhasil dihapus.');
    }
}
