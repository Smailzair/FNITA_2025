import React, { useEffect, useState, useRef } from "react";
import { PgHeader2 } from "../../components/PgHeader2";
import PgFooter from "../../components/PgFooter";
import WilayaComboBox from "../../components/WilayaComboBox";
import { supabase } from "../../api/supabaseClient";

export default function AdminVaccinesStock() {
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);

    // receive form
    const [rVaccineName, setRVaccineName] = useState("");
    const [rBatchNo, setRBatchNo] = useState("");
    const [rExpiry, setRExpiry] = useState<string>(() => new Date().toISOString().slice(0, 10)); // default to today YYYY-MM-DD
    const rExpiryRef = useRef<HTMLInputElement | null>(null);
    const [rQty, setRQty] = useState<number | "">("");
    const [rWilaya, setRWilaya] = useState("");

    // distribute form
    const [dVaccineName, setDVaccineName] = useState("");
    const [dFrom, setDFrom] = useState("");
    const [dTo, setDTo] = useState("");
    const [dQty, setDQty] = useState<number | "">("");
    const [dDate, setDDate] = useState<string>(() => new Date().toISOString().slice(0, 10)); // default today YYYY-MM-DD
    const dDateRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchInventory();
        fetchMovements();
    }, []);

    async function fetchInventory() {
        setLoading(true);
        const { data, error } = await supabase
            .from("inventory")
            .select("*, vaccines(name)")
            .order("quantity", { ascending: false });

        if (!error) {
            // supabase returns joined column as vaccines.name; normalize it
            const normalized = (data ?? []).map((row: any) => ({
                ...row,
                vaccine_name: row.vaccines?.name ?? "",
            }));
            setInventory(normalized);
        } else {
            console.error(error);
        }
        setLoading(false);
    }

    // Stock movements (journal)
    const [movements, setMovements] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function fetchMovements() {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*, vaccines(name)')
            .order('date', { ascending: false })
            .limit(200);
        if (!error) {
            setMovements(data ?? []);
        } else {
            console.error('Error loading movements:', error);
        }
    }

    async function adjustInventory(wilaya: string | null | undefined, vaccineId: string | null | undefined, delta: number) {
        if (!wilaya || !vaccineId) return;
        const { data: inv } = await supabase.from('inventory').select('*').match({ vaccine_id: vaccineId, wilaya }).maybeSingle();
        if (inv && inv.id) {
            const newQty = Math.max(0, Number(inv.quantity) + delta);
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date().toISOString() }).eq('id', inv.id);
        } else if (delta > 0) {
            await supabase.from('inventory').insert([{ vaccine_id: vaccineId, wilaya, quantity: delta }]);
        }
    }

    async function handleDeleteMovement(id: string) {
        const mv = movements.find((m: any) => m.id === id);
        if (!mv) return;

        const confirmMsg = `Confirmez-vous la suppression du mouvement (${mv.movement_type}) du ${new Date(mv.date).toLocaleString('fr-FR')} ?`;
        if (!window.confirm(confirmMsg)) return;

        setDeletingId(id);
        try {
            const qty = Number(mv.quantity || 0);
            const vaccineId = mv.vaccine_id;

            if (mv.movement_type === 'receive') {
                // reverse receive: subtract inventory and reduce batch remaining
                await adjustInventory(mv.wilaya, vaccineId, -qty);
                if (mv.batch_id) {
                    const { data: batch } = await supabase.from('vaccine_batches').select('*').eq('id', mv.batch_id).maybeSingle();
                    if (batch && batch.id) {
                        const newRem = Math.max(0, Number(batch.remaining_quantity) - qty);
                        await supabase.from('vaccine_batches').update({ remaining_quantity: newRem }).eq('id', batch.id);
                    }
                }
            } else if (mv.movement_type === 'distribute' || mv.movement_type === 'transfer') {
                // reverse distribute/transfer: decrement destination, increment source
                await adjustInventory(mv.to_wilaya, vaccineId, -qty);
                await adjustInventory(mv.wilaya, vaccineId, qty);
            } else if (mv.movement_type === 'waste') {
                // reverse waste: add back quantity
                await adjustInventory(mv.wilaya, vaccineId, qty);
            } else if (mv.movement_type === 'adjust') {
                const ok = window.confirm("Ce mouvement est un ajustement. La suppression n'effectuera pas de correction automatique de l'inventaire. Continuer ?");
                if (!ok) { setDeletingId(null); return; }
            }

            const { error: delErr } = await supabase.from('stock_movements').delete().eq('id', id);
            if (delErr) throw delErr;

            await fetchInventory();
            await fetchMovements();
            alert('Mouvement supprimé avec succès.');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression du mouvement. Voir la console.');
        } finally {
            setDeletingId(null);
        }
    }

    // RECEIVE: create vaccine if needed, batch, update inventory, insert movement
    async function handleReceive(e: React.FormEvent) {
        e.preventDefault();
        if (!rVaccineName || !rWilaya || !rQty || Number(rQty) <= 0) return alert("Veuillez remplir tous les champs requis et saisir une quantité valide.");

        setLoading(true);

        try {
            // upsert vaccine by name (name has UNIQUE constraint in migration)
            const { data: vaccineData, error: upsertErr } = await supabase
                .from("vaccines")
                .upsert({ name: rVaccineName }, { onConflict: "name", returning: "representation" })
                .select()
                .maybeSingle(); // or .single() if you expect it to always exist

            if (upsertErr) throw upsertErr;
            const vaccineId = vaccineData?.id;

            // insert batch
            const { data: batchData, error: batchErr } = await supabase
                .from("vaccine_batches")
                .insert([{
                    vaccine_id: vaccineId,
                    batch_no: rBatchNo || `batch-${Date.now()}`,
                    expiry_date: rExpiry || null,
                    received_quantity: Number(rQty),
                    remaining_quantity: Number(rQty),
                }])
                .select();

            if (batchErr) throw batchErr;
            const batchId = batchData[0].id;

            // upsert inventory (wilaya + vaccine_id)
            const { data: invExisting } = await supabase
                .from("inventory")
                .select("*")
                .match({ vaccine_id: vaccineId, wilaya: rWilaya })
                .single();

            if (invExisting && invExisting.id) {
                const newQty = Number(invExisting.quantity) + Number(rQty);
                await supabase
                    .from("inventory")
                    .update({ quantity: newQty, last_updated: new Date().toISOString() })
                    .eq("id", invExisting.id);
            } else {
                await supabase
                    .from("inventory")
                    .insert([{ vaccine_id: vaccineId, wilaya: rWilaya, quantity: Number(rQty) }]);
            }

            // insert stock_movement
            await supabase.from("stock_movements").insert([{
                movement_type: "receive",
                wilaya: rWilaya,
                vaccine_id: vaccineId,
                batch_id: batchId,
                quantity: Number(rQty),
                note: `Received via UI`,
            }]);

            // refresh
            await fetchInventory();

            // reset form
            setRVaccineName("");
            setRBatchNo("");
            setRExpiry("");
            setRQty("");
            setRWilaya("");
        } catch (err) {
            console.error(err);
            alert("Échec de la réception. Consultez la console pour plus de détails.");
        } finally {
            setLoading(false);
        }
    }

    // DISTRIBUTE: subtract from source, add to destination, add movement
    async function handleDistribute(e: React.FormEvent) {
        e.preventDefault();
        if (!dVaccineName || !dFrom || !dTo || !dDate || !dQty || Number(dQty) <= 0) return alert("Veuillez remplir tous les champs requis (y compris la date) et saisir une quantité valide.");

        setLoading(true);
        try {
            // find vaccine by name
            const { data: vData } = await supabase
                .from("vaccines")
                .select("*")
                .match({ name: dVaccineName })
                .single();

            if (!vData) return alert("Vaccin introuvable. Réceptionnez-le d'abord.");

            const vaccineId = vData.id;

            // check source inventory
            const { data: fromInv } = await supabase
                .from("inventory")
                .select("*")
                .match({ vaccine_id: vaccineId, wilaya: dFrom })
                .single();

            if (!fromInv || Number(fromInv.quantity) < Number(dQty)) {
                return alert("Stock insuffisant dans la wilaya source.");
            }

            // decrement source
            await supabase
                .from("inventory")
                .update({ quantity: Number(fromInv.quantity) - Number(dQty), last_updated: new Date().toISOString() })
                .eq("id", fromInv.id);

            // increment destination (upsert)
            const { data: toInv } = await supabase
                .from("inventory")
                .select("*")
                .match({ vaccine_id: vaccineId, wilaya: dTo })
                .single();

            if (toInv && toInv.id) {
                await supabase
                    .from("inventory")
                    .update({ quantity: Number(toInv.quantity) + Number(dQty), last_updated: new Date().toISOString() })
                    .eq("id", toInv.id);
            } else {
                await supabase
                    .from("inventory")
                    .insert([{ vaccine_id: vaccineId, wilaya: dTo, quantity: Number(dQty) }]);
            }

            // insert movement (transfer/distribute)
            await supabase.from("stock_movements").insert([{
                movement_type: "distribute",
                date: dDate,
                wilaya: dFrom,
                to_wilaya: dTo,
                vaccine_id: vaccineId,
                quantity: Number(dQty),
                note: `Distribué via UI`,
            }]);

            // refresh & reset
            await fetchInventory();
            setDVaccineName("");
            setDFrom("");
            setDTo("");
            setDQty("");
            setDDate(new Date().toISOString().slice(0, 10));
        } catch (err) {
            console.error(err);
            alert("Échec de la distribution. Consultez la console pour plus de détails.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col w-screen h-screen bg-gray-50">
            <PgHeader2 />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">Stock de vaccins</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inventory table */}
                        <div className="bg-white p-4 rounded shadow">
                            <h2 className="font-semibold mb-2 text-gray-800">Inventaire courant</h2>
                            {loading ? (
                                <p className="text-gray-800">Chargement...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500">
                                                <th className="p-2">Wilaya</th>
                                                <th className="p-2">Vaccine</th>
                                                <th className="p-2">Quantité</th>
                                                <th className="p-2">Dernière mise à jour</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.map((row) => (
                                                <tr key={row.id} className="border-t">
                                                    <td className="p-2 text-gray-800">{row.wilaya}</td>
                                                    <td className="p-2 text-gray-800">{row.vaccine_name ?? row.vaccine_id}</td>
                                                    <td className="p-2 text-gray-800">{row.quantity}</td>
                                                    <td className="p-2 text-gray-800">{new Date(row.last_updated || row.created_at || Date.now()).toLocaleString('fr-FR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Actions: receive / distribute */}
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded shadow">
                                <h2 className="font-semibold mb-2 text-gray-800">Réceptionner un lot</h2>
                                <form onSubmit={handleReceive} className="space-y-2">
                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Nom du vaccin" value={rVaccineName} onChange={(e) => setRVaccineName(e.target.value)} />
                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Lot (optionnel)" value={rBatchNo} onChange={(e) => setRBatchNo(e.target.value)} />
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={rExpiryRef}
                                            id="rExpiry"
                                            className="w-full border p-2 text-gray-800 placeholder-gray-500"
                                            type="date"
                                            value={rExpiry}
                                            onChange={(e) => setRExpiry(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                rExpiryRef.current?.focus();
                                                // showPicker() available in some browsers
                                                if ((rExpiryRef.current as any)?.showPicker) {
                                                    (rExpiryRef.current as any).showPicker();
                                                }
                                            }}
                                            className="p-2 bg-gray-100 border rounded text-gray-700"
                                            aria-label="Ouvrir le sélecteur de date"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" type="number" placeholder="Quantité" value={rQty} onChange={(e) => setRQty(Number(e.target.value))} />
                                    <div className="flex items-center">
                                        <WilayaComboBox value={rWilaya} onChange={setRWilaya} />
                                    </div>
                                    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>Réceptionner</button>
                                </form>
                            </div>

                            <div className="bg-white p-4 rounded shadow">
                                <h2 className="font-semibold mb-2 text-gray-800">Distribuer</h2>
                                <form onSubmit={handleDistribute} className="space-y-2">
                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Nom du vaccin (existant)" value={dVaccineName} onChange={(e) => setDVaccineName(e.target.value)} />
                                    <div className="flex gap-2">
                                        <div className="flex flex-col w-1/2">
                                            <label className="text-gray-700 mb-1">De :</label>
                                            <WilayaComboBox value={dFrom} onChange={setDFrom} />
                                        </div>
                                        <div className="flex flex-col w-1/2">
                                            <label className="text-gray-700 mb-1">A :</label>
                                            <WilayaComboBox value={dTo} onChange={setDTo} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1">
                                            <label className="text-gray-700 mb-1 block">Date :</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={dDateRef}
                                                    id="dDate"
                                                    className="w-full border p-2 text-gray-800 placeholder-gray-500"
                                                    type="date"
                                                    value={dDate}
                                                    onChange={(e) => setDDate(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        dDateRef.current?.focus();
                                                        if ((dDateRef.current as any)?.showPicker) {
                                                            (dDateRef.current as any).showPicker();
                                                        }
                                                    }}
                                                    className="p-2 bg-gray-100 border rounded text-gray-700"
                                                    aria-label="Ouvrir le sélecteur de date"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" type="number" placeholder="Quantité" value={dQty} onChange={(e) => setDQty(Number(e.target.value))} />
                                    <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>Distribuer</button>
                                </form>
                            </div>

                            <div className="bg-white p-3 rounded text-xs text-gray-600">
                                Astuce : Utilisez le formulaire "Réceptionner" pour ajouter de nouveaux vaccins (le nom sera créé si nécessaire).
                            </div>
                        </div>
                    </div>

                    {/* Stock movements journal */}
                    <div className="bg-white p-4 rounded shadow mt-6">
                        <h2 className="font-semibold mb-2 text-gray-800">Journal des mouvements</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-800">
                                <thead>
                                    <tr className="text-left">
                                        <th className="p-2 text-gray-700">Date</th>
                                        <th className="p-2 text-gray-700">Type</th>
                                        <th className="p-2 text-gray-700">Wilaya</th>
                                        <th className="p-2 text-gray-700">À</th>
                                        <th className="p-2 text-gray-700">Vaccin</th>
                                        <th className="p-2 text-gray-700">Quantité</th>
                                        <th className="p-2 text-gray-700">Note</th>
                                        <th className="p-2 text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map((mv) => (
                                        <tr key={mv.id} className="border-t">
                                            <td className="p-2 text-gray-800">{new Date(mv.date).toLocaleString('fr-FR')}</td>
                                            <td className="p-2 text-gray-800">{(() => {
                                                switch (mv.movement_type) {
                                                    case 'receive': return 'Réception';
                                                    case 'distribute': return 'Distribution';
                                                    case 'transfer': return 'Transfert';
                                                    case 'adjust': return 'Ajustement';
                                                    case 'waste': return 'Perte';
                                                    default: return mv.movement_type;
                                                }
                                            })()}</td>
                                            <td className="p-2 text-gray-800">{mv.wilaya}</td>
                                            <td className="p-2 text-gray-800">{mv.to_wilaya ?? '-'}</td>
                                            <td className="p-2 text-gray-800">{mv.vaccines?.name ?? mv.vaccine_id}</td>
                                            <td className="p-2 text-gray-800">{mv.quantity}</td>
                                            <td className="p-2 text-gray-800">{mv.note ?? ''}</td>
                                            <td className="p-2">
                                                <button
                                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                    onClick={() => handleDeleteMovement(mv.id)}
                                                    disabled={deletingId === mv.id}
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <PgFooter />
        </div>
    );
}