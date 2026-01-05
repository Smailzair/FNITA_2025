import React, { useEffect, useState, useRef } from "react";
import { PgHeader2 } from "../../components/PgHeader2";
import PgFooter from "../../components/PgFooter";
import WilayaComboBox from "../../components/WilayaComboBox";
import { supabase } from "../../api/supabaseClient";

// Helper type for input elements that may implement showPicker() in some browsers
type InputWithPicker = HTMLInputElement & { showPicker?: () => void };

// Common types moved here (previously in src/types/vaccines.ts)
export type MovementType =
    | "receive"
    | "distribute"
    | "adjust"
    | "transfer"
    | "waste";


// Types for inventory and movement rows returned from PostgREST
type InventoryRow = {
    id?: string;
    wilaya?: string;
    quantity?: number;
    last_updated?: string;
    created_at?: string;
    vaccine_name?: string;
};

type MovementRow = {
    id?: string;
    movement_type?: string;
    date?: string;
    created_at?: string;
    wilaya?: string;
    to_wilaya?: string;
    vaccine_name?: string;
    batch_no?: string;
    quantity?: number;
};

export default function AdminVaccinesStock() {
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryRow[]>([]);
    const [availableVaccines, setAvailableVaccines] = useState<string[]>([]);
    const [availableWilayas, setAvailableWilayas] = useState<string[]>([]);

    const [wilayaFilter, setWilayaFilter] = useState("");
    const [vaccineFilter, setVaccineFilter] = useState("");
    // dateFilter should be in YYYY-MM-DD format for <input type="date" />
    const [dateFilter, setDateFilter] = useState<string>(() => {
        const dt = new Date();
        dt.setDate(dt.getDate() + 1); // default to tomorrow
        return dt.toISOString().slice(0, 10);
    }); // default tomorrow YYYY-MM-DD
    const dateFilterRef = useRef<HTMLInputElement | null>(null);

    // receive form
    const [rVaccineName, setRVaccineName] = useState("");
    const [rBatchNo, setRBatchNo] = useState("");
    const [rQty, setRQty] = useState<number | "">("");
    const [rWilaya, setRWilaya] = useState("");
    const [rDate, setRDate] = useState<string>(() =>
        new Date().toISOString().slice(0, 10)
    );
    const rDateRef = useRef<HTMLInputElement | null>(null);

    // distribute form
    const [dVaccineName, setDVaccineName] = useState("");
    const [dFrom, setDFrom] = useState("");
    const [dTo, setDTo] = useState("");
    const [dQty, setDQty] = useState<number | "">("");
    const [dDate, setDDate] = useState<string>(() =>
        new Date().toISOString().slice(0, 10)
    );
    const dDateRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // Fetch current inventory derived from movements and the movements list
        fetchInventory();
        fetchMovements();
        fetchFilters();
    }, []);

    // Debug: log dDate changes and DOM input value
    useEffect(() => {
        console.debug('[AdminVaccinesStock] dDate changed ->', dDate, 'inputValue ->', dDateRef.current?.value);
    }, [dDate]);

    async function fetchFilters() {
        // Fetch distinct wilaya names from movements (both wilaya and to_wilaya)
        const wRes = await supabase.from("tb_vaccin_movements").select("wilaya,to_wilaya");
        if (wRes.data) {
            const arrAny = wRes.data || [];
            const names: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arrAny.forEach((r: any) => {
                if (r.wilaya) names.push(r.wilaya);
                if (r.to_wilaya) names.push(r.to_wilaya);
            });
            setAvailableWilayas([...new Set(names)]);
        }

        // Fetch available vaccine names from movements
        const vRes = await supabase.from("tb_vaccin_movements").select("vaccine_name");
        if (vRes.data) {
            const arrAny = vRes.data || [];
            const names: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arrAny.forEach((r: any) => { if (r.vaccine_name) names.push(r.vaccine_name); });
            setAvailableVaccines([...new Set(names)]);
        }
    }

    async function fetchInventory() {
        setLoading(true);
        // derive inventory by aggregating tb_vaccin_movements
        const { data, error } = await supabase
            .from("tb_vaccin_movements")
            .select("*");

        let result: InventoryRow[] = [];
        if (!error) {
            const rows = (data ?? []) as MovementRow[];
            // key = `${wilaya}||${vaccineName}`
            const map = new Map<string, InventoryRow & { last_updated: string }>();

            rows.forEach((mv) => {
                const vname = mv.vaccine_name ?? "";
                const date = mv.date ?? mv.created_at ?? new Date().toISOString();
                const addTo = (wilaya: string | undefined, qty: number) => {
                    if (!wilaya) return;
                    const key = `${wilaya}||${vname}`;
                    const cur = map.get(key) ?? ({ vaccine_name: vname, wilaya, quantity: 0, last_updated: date });
                    cur.quantity = (cur.quantity ?? 0) + qty;
                    // keep the most recent date
                    cur.last_updated = new Date(cur.last_updated) > new Date(date) ? cur.last_updated : date;
                    map.set(key, cur);
                };

                const qty = Number(mv.quantity || 0);
                switch (mv.movement_type) {
                    case "receive":
                        addTo(mv.wilaya, qty);
                        break;
                    case "distribute":
                    case "transfer":
                        addTo(mv.wilaya, -qty);
                        if (mv.to_wilaya) addTo(mv.to_wilaya, qty);
                        break;
                    case "waste":
                        addTo(mv.wilaya, -qty);
                        break;
                    case "adjust":
                        addTo(mv.wilaya, qty);
                        break;
                    default:
                        break;
                }
            });

            result = Array.from(map.values()).map((r) => ({ ...r }));
            setInventory(result);
        } else {
            console.error("Error deriving inventory:", error);
        }
        setLoading(false);
        return result;
    }

    // Stock movements (journal)
    const [movements, setMovements] = useState<MovementRow[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Movement filters
    const [mvWilayaFilter, setMvWilayaFilter] = useState("");
    const [mvVaccineFilter, setMvVaccineFilter] = useState("");
    const [mvDateFrom, setMvDateFrom] = useState<string>("");
    const [mvDateTo, setMvDateTo] = useState<string>("");
    const [mvDateEnabled, setMvDateEnabled] = useState<boolean>(false);

    // When the period filter is enabled, prefill sensible default dates (last 30 days)
    React.useEffect(() => {
        if (!mvDateEnabled) return;
        const today = new Date();
        const isoToday = today.toISOString().slice(0, 10);
        if (!mvDateTo) setMvDateTo(isoToday);
        if (!mvDateFrom) {
            const start = new Date();
            start.setDate(start.getDate() - 30);
            setMvDateFrom(start.toISOString().slice(0, 10));
        }
    }, [mvDateEnabled, mvDateFrom, mvDateTo]);

    async function fetchMovements() {
        const { data, error } = await supabase
            .from('tb_vaccin_movements')
            .select('*')
            .order('date', { ascending: false })
            .limit(500);
        if (!error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalized = (data ?? []).map((row: any) => ({
                ...row,
                vaccine_name: row.vaccine_name ?? "",
            }));
            setMovements(normalized);
        } else {
            console.error('Error loading movements:', error);
        }
    }



    async function handleDeleteMovement(id?: string) {
        if (!id) return;
        const mv = movements.find((m) => m.id === id);
        if (!mv) return;

        const confirmMsg = `Confirmez-vous la suppression du mouvement (${mv.movement_type}) du ${new Date(mv.date ?? '').toLocaleString('fr-FR')} ?`;
        if (!window.confirm(confirmMsg)) return;

        setDeletingId(id);
        try {


            // Deleting a movement: since inventory is derived from movements,
            // removing the movement is sufficient to revert its effect. We no longer maintain batch records.
            if (mv.movement_type === 'adjust') {
                const ok = window.confirm("Ce mouvement est un ajustement. La suppression n'effectuera pas de correction automatique de l'inventaire. Continuer ?");
                if (!ok) { setDeletingId(null); return; }
            }

            const { error: delErr } = await supabase.from('tb_vaccin_movements').delete().eq('id', id);
            if (delErr) throw delErr;

            await fetchInventory();
            await fetchMovements();
            await fetchFilters();
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
        if (!rVaccineName || !rWilaya || !rQty || !rDate || Number(rQty) <= 0) return alert("Veuillez remplir tous les champs requis et saisir une quantité valide.");

        setLoading(true);

        try {


            // Insert a receive movement directly (store vaccine name and batch info inside movement)
            await supabase.from("tb_vaccin_movements").insert([{
                movement_type: "receive",
                date: rDate,
                wilaya: rWilaya,
                vaccine_name: rVaccineName,
                batch_no: rBatchNo || `batch-${Date.now()}`,
                quantity: Number(rQty),
            }]);

            // refresh both tables
            await fetchInventory();
            await fetchMovements();
            await fetchFilters();

            // reset form
            setRVaccineName("");
            setRBatchNo("");
            setRQty("");
            setRWilaya("");
            setRDate(new Date().toISOString().slice(0, 10));
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
        if (dFrom === dTo) return alert("La wilaya source doit être différente de la wilaya de destination.");

        setLoading(true);
        try {
            // compute current inventory from movements, ensure source has enough
            const latestInv = await fetchInventory();
            const fromInv = latestInv.find(it => it.wilaya === dFrom && it.vaccine_name === dVaccineName);
            if (!fromInv || Number(fromInv.quantity) < Number(dQty)) {
                return alert("Stock insuffisant dans la wilaya source.");
            }

            // insert distribute movement (store vaccine name directly)
            await supabase.from("tb_vaccin_movements").insert([{
                movement_type: "distribute",
                date: dDate,
                wilaya: dFrom,
                to_wilaya: dTo,
                vaccine_name: dVaccineName,
                quantity: Number(dQty),
            }]);

            // refresh & reset (refresh movements too)
            await fetchInventory();
            await fetchMovements();
            await fetchFilters();
            setDVaccineName("");
            setDFrom("");
            setDTo("");
            setDQty("");
            // set default date to tomorrow
            const _dt = new Date();
            _dt.setDate(_dt.getDate() + 1);
            setDDate(_dt.toISOString().slice(0, 10));
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
                                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                                        <select
                                            className="border rounded-lg p-2 text-gray-800"
                                            value={wilayaFilter}
                                            onChange={(e) => setWilayaFilter(e.target.value)}
                                        >
                                            <option value="">Toutes les wilayas</option>
                                            {availableWilayas.map((wilaya) => (
                                                <option key={wilaya} value={wilaya}>
                                                    {wilaya}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="border rounded-lg p-2 text-gray-800"
                                            value={vaccineFilter}
                                            onChange={(e) => setVaccineFilter(e.target.value)}
                                        >
                                            <option value="">Tous les vaccins</option>
                                            {availableVaccines.map((vaccine) => (
                                                <option key={vaccine} value={vaccine}>
                                                    {vaccine}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-0">
                                            <label className="text-gray-700">Avant le : </label>
                                            <input
                                                ref={dateFilterRef}
                                                type="date"
                                                className="border p-2 text-gray-800"
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    dateFilterRef.current?.focus();
                                                    if ((dateFilterRef.current as InputWithPicker)?.showPicker) {
                                                        (dateFilterRef.current as InputWithPicker).showPicker();
                                                    }
                                                }}
                                                className="p-2 bg-gray-800 border rounded-lg text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600"
                                                aria-label="Ouvrir le sélecteur de date"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                                </svg>
                                            </button>
                                        </div>

                                    </div>

                                    {/* Filtered Inventory Table */}
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
                                            {inventory
                                                .filter((row) =>
                                                    // exclude zero quantities
                                                    Number(row.quantity) !== 0 &&
                                                    (wilayaFilter ? row.wilaya === wilayaFilter : true) &&
                                                    (vaccineFilter ? row.vaccine_name === vaccineFilter : true) &&
                                                    (dateFilter ? new Date(row.last_updated || row.created_at || Date.now()) <= new Date(dateFilter) : true)
                                                )
                                                .map((row) => (
                                                    <tr key={row.id} className="border-t">
                                                        <td className="p-2 text-gray-800">{row.wilaya}</td>
                                                        <td className="p-2 text-gray-800">{row.vaccine_name}</td>
                                                        <td className="p-2 text-gray-800">{row.quantity}</td>
                                                        <td className="p-2 text-gray-800">
                                                            {new Date(row.last_updated || row.created_at || Date.now()).toLocaleString('fr-FR')}
                                                        </td>
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
                                    <input list="vaccines-list" className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Nom du vaccin" value={rVaccineName} onChange={(e) => setRVaccineName(e.target.value)} aria-label="Nom du vaccin" />
                                    <datalist id="vaccines-list">
                                        {availableVaccines.map((v) => (
                                            <option key={v} value={v} />
                                        ))}
                                    </datalist>
                                    <input className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Lot (optionnel)" value={rBatchNo} onChange={(e) => setRBatchNo(e.target.value)} />

                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={rDateRef}
                                            type="date"
                                            className="w-full border p-2 text-gray-800 placeholder-gray-500"
                                            value={rDate}
                                            onChange={(e) => setRDate(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                rDateRef.current?.focus();
                                                if ((rDateRef.current as InputWithPicker)?.showPicker) {
                                                    (rDateRef.current as InputWithPicker).showPicker();
                                                }
                                            }}
                                            className="p-2 bg-gray-800 border rounded text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600"
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
                                    <input list="vaccines-list" className="w-full border p-2 text-gray-800 placeholder-gray-500" placeholder="Nom du vaccin (existant)" value={dVaccineName} onChange={(e) => setDVaccineName(e.target.value)} aria-label="Nom du vaccin (existant)" />
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
                                                        if ((dateFilterRef.current as InputWithPicker)?.showPicker) {
                                                            (dateFilterRef.current as InputWithPicker).showPicker();
                                                        }
                                                    }}
                                                    className="p-2 bg-gray-800 border rounded text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600"
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
                                    <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" type="submit" disabled={loading || (dFrom !== "" && dFrom === dTo)}>Distribuer</button>
                                    {(dFrom !== "" && dTo !== "" && dFrom === dTo) && <p className="text-red-600 text-sm mt-1">La wilaya source doit être différente de la wilaya de destination.</p>}
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

                        {/* Movement filters */}
                        <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
                            <select
                                className="border rounded-lg p-2 text-gray-800"
                                value={mvWilayaFilter}
                                onChange={(e) => setMvWilayaFilter(e.target.value)}
                            >
                                <option value="">Toutes les wilayas</option>
                                {availableWilayas.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>

                            <select
                                className="border rounded-lg p-2 text-gray-800"
                                value={mvVaccineFilter}
                                onChange={(e) => setMvVaccineFilter(e.target.value)}
                            >
                                <option value="">Tous les vaccins</option>
                                {availableVaccines.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>

                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={mvDateEnabled} onChange={(e) => setMvDateEnabled(e.target.checked)} />
                                <span className="text-gray-700">Période</span>
                            </label>

                            <input
                                type="date"
                                className={`border p-2 transition-colors ${mvDateEnabled ? 'text-gray-800 bg-white' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}
                                value={mvDateFrom}
                                onChange={(e) => setMvDateFrom(e.target.value)}
                                disabled={!mvDateEnabled}
                            />

                            <input
                                type="date"
                                className={`border p-2 transition-colors ${mvDateEnabled ? 'text-gray-800 bg-white' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}
                                value={mvDateTo}
                                onChange={(e) => setMvDateTo(e.target.value)}
                                disabled={!mvDateEnabled}
                            />
                        </div>

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
                                        <th className="p-2 text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements
                                        .filter((mv) =>
                                            (mvWilayaFilter ? mv.wilaya === mvWilayaFilter : true) &&
                                            (mvVaccineFilter ? (mv.vaccine_name ?? '') === mvVaccineFilter : true) &&
                                            (!mvDateEnabled ? true : ((mvDateFrom ? new Date(mv.date ?? '') >= new Date(mvDateFrom) : true) && (mvDateTo ? new Date(mv.date ?? '') <= new Date(mvDateTo) : true)))
                                        )
                                        .map((mv) => (
                                            <tr key={mv.id} className="border-t">
                                                <td className="p-2 text-gray-800">{new Date(mv.date ?? '').toLocaleString('fr-FR')}</td>
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
                                                <td className="p-2 text-gray-800">{mv.vaccine_name}</td>
                                                <td className="p-2 text-gray-800">{mv.quantity}</td>
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
            </main >
            <PgFooter />
        </div >
    );
}