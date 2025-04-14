<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Geojson;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('report/index', [
            'reports' => Report::with('geojson')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('report/create', [
            'geojsons' => Geojson::all(['id_geojson', 'source_name']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_geojson' => 'required|exists:geojson,id_geojson',
            'file_path' => 'required|file|mimes:pdf|max:2048', // max 2MB
            'description' => 'nullable|string',
            'nomor' => 'required|string|max:255|unique:report,nomor',
            'sifat' => 'required|string|max:255',
            'hal' => 'required|string|max:255',
            'kepada' => 'required|string|max:255',
        ]);

        $path = $request->file('file_path')->store('reports', 'public');

        Report::create([
            'id_geojson' => $request->id_geojson,
            'file_path' => $path, // simpan path relatif
            'description' => $request->description,
            'nomor' => $request->nomor,
            'sifat' => $request->sifat,
            'hal' => $request->hal,
            'kepada' => $request->kepada,
        ]);

        return redirect()->route('dashboard/tambah-pdf.index')->with('success', 'Report berhasil ditambahkan.');
    }


    public function edit(Report $report)
    {
        return Inertia::render('report/edit', [
            'report' => $report,
            'geojsons' => Geojson::all(['id_geojson', 'source_name']),
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $request->validate([
            'id_geojson' => 'required|exists:geojson,id_geojson',
            'file_path' => 'required|string|max:255',
            'description' => 'nullable|string',
            'nomor' => 'required|string|max:255|unique:report,nomor,' . $report->id_report . ',id_report',
            'sifat' => 'required|string|max:255',
            'hal' => 'required|string|max:255',
            'kepada' => 'required|string|max:255',
        ]);

        $report->update($request->all());

        return redirect()->route('dashboard/tambah-pdf.index')->with('success', 'Report berhasil diperbarui.');
    }

    public function destroy(Report $report)
    {
        $report->delete();

        return redirect()->route('dashboard/tambah-pdf.index')->with('success', 'Report berhasil dihapus.');
    }
}
