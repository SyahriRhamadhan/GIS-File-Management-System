<?php

namespace App\Http\Controllers;

use App\Models\PewarnaanRdtr;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PewarnaanRdtrController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = (string) $request->input('search', '');

        $query = PewarnaanRdtr::query()->orderBy('kode');
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('sub_zona', 'like', "%{$search}%");
            });
        }

        $items = $query->paginate($perPage)->appends($request->except('page'));

        return Inertia::render('pewarnaan_rdtr/index', [
            'items' => $items,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'flash' => session('success') ? ['success' => session('success')] : null,
        ]);
    }

    public function create()
    {
        return Inertia::render('pewarnaan_rdtr/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:pewarnaan_rdtr,kode'],
            'sub_zona' => ['nullable', 'string', 'max:255'],
            'cmyk' => ['nullable', 'string', 'max:50'],
            'rgb' => ['nullable', 'string', 'max:50'],
            'hsv' => ['nullable', 'string', 'max:50'],
            'kode_warna' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
        ]);

        if (empty($data['kode_warna']) && !empty($data['rgb'])) {
            $parts = preg_split('/\s+/', trim($data['rgb']));
            if (count($parts) === 3) {
                $r = max(0, min(255, (int) $parts[0]));
                $g = max(0, min(255, (int) $parts[1]));
                $b = max(0, min(255, (int) $parts[2]));
                $data['kode_warna'] = sprintf('#%02x%02x%02x', $r, $g, $b);
            }
        }

        PewarnaanRdtr::create($data);

        return redirect()->route('dashboard.pewarnaan_rdtr.index')->with('success', 'Data pewarnaan RDTR berhasil ditambahkan');
    }

    public function edit($id)
    {
        $item = PewarnaanRdtr::findOrFail($id);
        return Inertia::render('pewarnaan_rdtr/update', [
            'item' => $item,
        ]);
    }

    public function update(Request $request, $id)
    {
        $item = PewarnaanRdtr::findOrFail($id);
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:pewarnaan_rdtr,kode,' . $item->id_pewarnaan_rdtr . ',id_pewarnaan_rdtr'],
            'sub_zona' => ['nullable', 'string', 'max:255'],
            'cmyk' => ['nullable', 'string', 'max:50'],
            'rgb' => ['nullable', 'string', 'max:50'],
            'hsv' => ['nullable', 'string', 'max:50'],
            'kode_warna' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
        ]);

        if (empty($data['kode_warna']) && !empty($data['rgb'])) {
            $parts = preg_split('/\s+/', trim($data['rgb']));
            if (count($parts) === 3) {
                $r = max(0, min(255, (int) $parts[0]));
                $g = max(0, min(255, (int) $parts[1]));
                $b = max(0, min(255, (int) $parts[2]));
                $data['kode_warna'] = sprintf('#%02x%02x%02x', $r, $g, $b);
            }
        }

        $item->update($data);
        return redirect()->route('dashboard.pewarnaan_rdtr.index')->with('success', 'Data pewarnaan RDTR berhasil diperbarui');
    }

    public function destroy($id)
    {
        $item = PewarnaanRdtr::findOrFail($id);
        $item->delete();
        return redirect()->route('dashboard.pewarnaan_rdtr.index')->with('success', 'Data pewarnaan RDTR berhasil dihapus');
    }
}