<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role_filter') && $request->role_filter !== 'all') {
            $query->where('role', $request->role_filter);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        $allowedSorts = ['name', 'email', 'role', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Pagination
        $pageSize = $request->get('page_size', 10);
        $users = $query->paginate($pageSize)->withQueryString();

        // Get unique roles for filter
        $roles = User::distinct()->pluck('role')->filter()->values();

        return Inertia::render('user/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $request->search,
                'role_filter' => $request->role_filter,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'page_size' => $pageSize,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('user/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:superadmin,admin',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('dashboard.users.index')
            ->with('success', 'User berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return Inertia::render('user/show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return Inertia::render('user/edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        // Prevent changing superadmin role
        if ($user->role === 'superadmin' && $request->role !== 'superadmin') {
            return redirect()->route('dashboard.users.index')
                ->with('error', 'Role superadmin tidak dapat diubah.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:superadmin,admin',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('dashboard.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting the current user
        $currentUser = Auth::user();
        if ($currentUser && $user->id === $currentUser->id) {
            return redirect()->route('dashboard.users.index')
                ->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        // Prevent deleting if it would leave less than 3 superadmins
        if ($user->role === 'superadmin') {
            $superadminCount = User::where('role', 'superadmin')->count();
            if ($superadminCount <= 3) {
                return redirect()->route('dashboard.users.index')
                    ->with('error', 'Tidak dapat menghapus superadmin. Sistem harus memiliki minimal 3 akun superadmin.');
            }
        }

        $user->delete();

        return redirect()->route('dashboard.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    /**
     * Bulk delete users.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:users,id',
        ]);

        // Additional check for empty array
        if (empty($validated['ids'])) {
            return redirect()->route('dashboard.users.index')
                ->with('error', 'Tidak ada user yang dipilih untuk dihapus.');
        }

        $currentUser = Auth::user();
        $currentUserId = $currentUser ? $currentUser->id : null;

        // Count current superadmins and superadmins in deletion list
        $totalSuperadmins = User::where('role', 'superadmin')->count();
        $superadminsToDelete = User::whereIn('id', $validated['ids'])
            ->where('role', 'superadmin')
            ->count();

        // Calculate remaining superadmins after deletion
        $remainingSuperadmins = $totalSuperadmins - $superadminsToDelete;

        // Filter out current user
        $idsToDelete = collect($validated['ids'])->filter(function ($id) use ($currentUserId, $remainingSuperadmins) {
            $user = User::find($id);

            // Cannot delete current user
            if ($id == $currentUserId) {
                return false;
            }

            // Cannot delete superadmin if it would leave less than 3
            if ($user && $user->role === 'superadmin' && $remainingSuperadmins < 3) {
                return false;
            }

            return $user !== null;
        });

        if ($idsToDelete->isEmpty()) {
            return redirect()->route('dashboard.users.index')
                ->with('error', 'Tidak ada user yang dapat dihapus. Sistem harus memiliki minimal 3 akun superadmin.');
        }

        $deletedCount = User::whereIn('id', $idsToDelete)->delete();

        return redirect()->route('dashboard.users.index')
            ->with('success', "{$deletedCount} user berhasil dihapus.");
    }

    /**
     * Restore a soft deleted user.
     */
    public function restore(User $user)
    {
        $user->restore();

        return redirect()->route('dashboard.users.index')
            ->with('success', 'User berhasil dipulihkan.');
    }

    /**
     * Force delete a user permanently.
     */
    public function forceDelete(User $user)
    {

        // Prevent force deleting the current user
        $currentUser = Auth::user();
        if ($currentUser && $user->id === $currentUser->id) {
            return redirect()->route('dashboard.users.index')
                ->with('error', 'Anda tidak dapat menghapus akun sendiri secara permanen.');
        }

        // Prevent force deleting if it would leave less than 3 superadmins
        if ($user->role === 'superadmin') {
            $superadminCount = User::where('role', 'superadmin')->count();
            if ($superadminCount <= 3) {
                return redirect()->route('dashboard.users.index')
                    ->with('error', 'Tidak dapat menghapus superadmin secara permanen. Sistem harus memiliki minimal 3 akun superadmin.');
            }
        }

        $user->forceDelete();

        return redirect()->route('dashboard.users.index')
            ->with('success', 'User berhasil dihapus secara permanen.');
    }
}