const ContactSection = () => (
    <section className="bg-blue-900 py-12 text-white">
        <div className="container mx-auto max-w-3xl px-6">
            <h2 className="mb-6 text-center text-3xl font-bold">Kontak Kami</h2>
            <div className="mb-8 text-center">
                <p>DINAS PUPRP KABUPATEN BINTAN</p>
                <p>Jl. Raya Tanjung Uban - Tanjungpinang, Bintan</p>
                <p>Email: info@puprpbintan.go.id | Telp: (0771) 123456</p>
            </div>
            <form className="space-y-4 rounded-lg bg-white p-6 text-blue-900 shadow-md">
                <div>
                    <label className="mb-1 block font-semibold">Nama</label>
                    <input type="text" className="w-full rounded border px-3 py-2" placeholder="Nama Anda" />
                </div>
                <div>
                    <label className="mb-1 block font-semibold">Email</label>
                    <input type="email" className="w-full rounded border px-3 py-2" placeholder="Email Anda" />
                </div>
                <div>
                    <label className="mb-1 block font-semibold">Pesan</label>
                    <textarea className="w-full rounded border px-3 py-2" rows={4} placeholder="Tulis pesan Anda..." />
                </div>
                <button type="submit" className="rounded bg-blue-700 px-6 py-2 font-semibold text-white hover:bg-blue-800">
                    Kirim
                </button>
            </form>
        </div>
    </section>
);

export default ContactSection;
