<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Owner;
use Illuminate\Support\Facades\Validator;

class OwnerController extends Controller
{
    /**
     * Store a newly created owner in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'wali' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $owner = Owner::create([
                'name' => $request->name,
                'wali' => $request->wali,
                'type' => $request->type,
                'no_hp' => $request->no_hp,
            ]);

            return redirect()->back()->with('success', 'Owner berhasil ditambahkan');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan owner: ' . $e->getMessage());
        }
    }
}
