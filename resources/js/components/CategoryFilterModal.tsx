interface CategoryFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { id_kategori: number; nama_kategori: string }[];
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
}

const CategoryFilterModal = ({ isOpen, onClose, categories, selectedCategory, onCategoryChange }: CategoryFilterModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-1/3 rounded-lg bg-white p-6">
                <h3 className="mb-4 text-xl font-bold">Filter Kategori</h3>
                <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className="mb-4 w-full rounded border px-3 py-2">
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                        <option key={category.id_kategori} value={category.id_kategori}>
                            {category.nama_kategori}
                        </option>
                    ))}
                </select>
                <div className="flex justify-end">
                    <button onClick={onClose} className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryFilterModal;
