export function BrandsGrid({ title }: { title?: string }) {
    return (
        <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title || "Marcas que amamos"}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                <div className="aspect-square bg-red-600 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-black text-xl italic tracking-wider">BRAHMA</span></div>
                <div className="aspect-square bg-blue-900 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-serif font-bold text-xl">Corona</span></div>
                <div className="aspect-square bg-yellow-400 rounded-2xl flex items-center justify-center p-4"><span className="text-red-600 font-black text-2xl tracking-tighter transform -rotate-6">SKOL</span></div>
                <div className="aspect-square bg-green-700 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-bold text-xl">Tanqueray</span></div>
                <div className="aspect-square bg-blue-700 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-bold text-lg tracking-widest">BEATS</span></div>
                <div className="aspect-square bg-yellow-600 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-serif text-center text-xs font-bold">JOHNNIE<br />WALKER</span></div>
            </div>
        </section>
    );
}
