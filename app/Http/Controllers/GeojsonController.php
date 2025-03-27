<?php

namespace App\Http\Controllers;

use App\Models\Geojson;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Region;
use App\Models\Owner;

class GeojsonController extends Controller
{
    public function index()
    {
        $geojsons = Geojson::all();
        $regions = Region::all();
        $user = Auth::user();

        return Inertia::render('geojson/index', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'user' => $user,
        ]);
    }
    
    public function create()
    {
        $user_name = Auth::user()->name;
        $regions = Region::all();
        $owners = Owner::all();
        $user_id = Auth::id();


        return Inertia::render('geojson/create', [
            'user_name' => $user_name,
            'regions' => $regions,
            'owner' => $owners,
            'user_id' => $user_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'geojson' => 'required|json',
            'id_user' => 'required|exists:users,id',
            'id_region' => 'required|exists:region,id_region',
            'id_owner' => 'required|exists:owner,id_owner',
        ]);

        $geojson = json_decode($validated['geojson'], true);

        // Pastikan formatnya FeatureCollection
        if ($geojson['type'] !== 'FeatureCollection' || !isset($geojson['features'])) {
            return back()->withErrors(['geojson' => 'GeoJSON harus berupa FeatureCollection.']);
        }

        foreach ($geojson['features'] as $feature) {
            Geojson::create([
                'geojson' => $feature,
                'source_name' => $geojson['name'],
                'id_user' => $validated['id_user'],
                'id_region' => $validated['id_region'],
                'id_owner' => $validated['id_owner'],
            ]);
        }

        return redirect()->route('geojson.index')->with('success', 'Seluruh fitur berhasil disimpan sebagai record terpisah.');
    }



    public function edit($id)
    {
        $geojson = Geojson::findOrFail($id);

        return Inertia::render('geojson/edit', [
            'geojson' => $geojson,
        ]);
    }

    public function update(Request $request, $id)
    {
        $geojson = Geojson::findOrFail($id);

        $validated = $request->validate([
            'geojson' => 'required|json',
            'id_user' => 'required|exists:users,id',
            'id_region' => 'required|exists:region,id_region',
            'id_owner' => 'required|exists:owner,id_owner',
        ]);

        $geojson->update([
            'geojson' => $validated['geojson'],
            'id_user' => $validated['id_user'],
            'id_region' => $validated['id_region'],
            'id_owner' => $validated['id_owner'],
        ]);

        return redirect()->route('geojson.index')->with('success', 'Geojson updated successfully.');
    }

    public function destroy($id)
    {
        $geojson = Geojson::findOrFail($id);

        $geojson->delete();

        return redirect()->route('geojson.index')->with('success', 'Geojson deleted successfully.');
    }
}
