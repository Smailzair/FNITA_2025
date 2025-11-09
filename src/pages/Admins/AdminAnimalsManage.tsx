import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import type { Animal } from "../animal";
import { Table, type Column } from "../../components/Table";
import AnimalForm from "../Vets/AnimalForm";

type FilterOptions = {
  espece: string;
  race: string;
  sexe: string;
  propr_id: string;
  is_radiated: "all" | "true" | "false";
  qr_code_status: "all" | "none" | "requested" | "available";
};

type Owner = {
  id: string;
  nme: string;
};

export default function AdminAnimalsManage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    espece: "all",
    race: "all",
    sexe: "all",
    propr_id: "all",
    is_radiated: "all",
    qr_code_status: "all",
  });
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Partial<Animal> | null>(
    null
  );
  const [isRadiateModalOpen, setIsRadiateModalOpen] = useState(false);
  const areAllSelectedRadiated = useMemo(
    () =>
      animals
        .filter((a) => selectedAnimalIds.includes(a.id))
        .every((a) => a.is_radiated),
    [animals, selectedAnimalIds]
  );

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin fetches ALL animals, no email filter
      const { data, error: fetchError } = await supabase
        .from("tb_animals")
        .select(`*, owner:propr_id ( nme )`);

      if (fetchError) {
        throw fetchError;
      }

      const processedData = (data || []).map((animal) => ({
        ...animal,
        owner_name: animal.owner ? animal.owner.nme : "N/A",
        created_at: new Date(animal.created_at),
        niss_date: animal.niss_date ? new Date(animal.niss_date) : null,
      }));
      setAnimals(processedData);
    } catch (err: unknown) {
      setError("Impossible de charger les données des animaux.");
      console.error("Error fetching animals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_props")
        .select("id, nme");
      if (fetchError) throw fetchError;
      setOwners(data || []);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
    fetchOwners();
  }, [fetchAnimals, fetchOwners]);

  const especes = useMemo(() => {
    const allEspeces = animals
      .map((animal) => animal.espece)
      .filter((e): e is string => e !== null && e !== "");
    return [...new Set(allEspeces)];
  }, [animals]);

  const races = useMemo(() => {
    const allRaces = animals
      .map((animal) => animal.race)
      .filter((r): r is string => r !== null && r !== "");
    return [...new Set(allRaces)];
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    return animals
      .filter((animal) => {
        const { espece, race, sexe, is_radiated, propr_id, qr_code_status } =
          filters;
        if (espece !== "all" && animal.espece !== espece) return false;
        if (race !== "all" && animal.race !== race) return false;
        if (sexe !== "all" && animal.sexe !== sexe) return false;
        if (is_radiated !== "all") {
          if (is_radiated === "true" && !animal.is_radiated) return false;
          if (is_radiated === "false" && animal.is_radiated) return false;
        }
        if (
          qr_code_status !== "all" &&
          animal.qr_code_status !== qr_code_status
        )
          return false;
        if (propr_id !== "all" && animal.propr_id !== propr_id) return false;
        return true;
      })
      .filter(
        (animal) =>
          animal.nme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.num_ident?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [animals, searchTerm, filters]);

  const handleRowSelect = useCallback(
    (id: string | number, isMulti: boolean) => {
      const strId = String(id);
      if (isMulti || isMultiSelectMode) {
        setSelectedAnimalIds((prev) =>
          prev.includes(strId)
            ? prev.filter((i) => i !== strId)
            : [...prev, strId]
        );
      } else {
        setSelectedAnimalIds((prev) =>
          prev.length === 1 && prev[0] === strId ? [] : [strId]
        );
      }
    },
    [isMultiSelectMode]
  );

  const handleEditClick = () => {
    if (selectedAnimalIds.length !== 1) return;
    const animalToEdit = animals.find((a) => a.id === selectedAnimalIds[0]);
    if (animalToEdit) {
      setEditingAnimal(animalToEdit);
      setIsModalOpen(true);
    }
  };

  const handleRowDoubleClick = useCallback(
    (id: string | number) => {
      const animalToEdit = animals.find((a) => a.id === String(id));
      if (animalToEdit) {
        setEditingAnimal(animalToEdit);
        setIsModalOpen(true);
      }
    },
    [animals]
  );

  const handleSelectAll = useCallback(
    (areAllSelected: boolean) => {
      setSelectedAnimalIds(
        areAllSelected ? filteredAnimals.map((a) => a.id) : []
      );
    },
    [filteredAnimals]
  );

  const handleRadiateClick = () => {
    if (selectedAnimalIds.length === 0) return;

    // If all selected are already radiated, we offer to un-radiate them.
    if (areAllSelectedRadiated) {
      if (
        window.confirm(
          `Voulez-vous marquer ${selectedAnimalIds.length} animal(aux) comme non-radié(s) ?`
        )
      ) {
        handleBulkUnRadiate();
      }
    } else {
      // Otherwise, open the modal to radiate them.
      setIsRadiateModalOpen(true);
    }
  };

  const handleBulkRadiate = async ({
    date,
    reason,
  }: {
    date: string;
    reason: string;
  }) => {
    if (selectedAnimalIds.length === 0) return;

    // Filter out animals that are already radiated
    const animalsToRadiate = selectedAnimalIds.filter(
      (id) => !animals.find((a) => a.id === id)?.is_radiated
    );

    try {
      const { error } = await supabase
        .from("tb_animals")
        .update({
          is_radiated: true,
          radiat_date: date,
          radiat_reason: reason,
        })
        .in("id", animalsToRadiate);

      if (error) throw error;

      alert(`${animalsToRadiate.length} animal(aux) marqué(s) comme radié(s).`);
      setSelectedAnimalIds([]);
      fetchAnimals();
    } catch (err: any) {
      setError(`Erreur lors de la radiation: ${err.message}`);
    }
  };

  const handleBulkUnRadiate = async () => {
    if (selectedAnimalIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("tb_animals")
        .update({
          is_radiated: false,
          radiat_date: null,
          radiat_reason: null,
        })
        .in("id", selectedAnimalIds);

      if (error) throw error;

      alert(
        `${selectedAnimalIds.length} animal(aux) marqué(s) comme non-radié(s).`
      );
      setSelectedAnimalIds([]);
      fetchAnimals();
    } catch (err: any) {
      setError(`Erreur lors de la mise à jour: ${err.message}`);
    }
  };

  const handleGenerateQrCode = async () => {
    if (selectedAnimalIds.length === 0) return;

    const animalsToUpdate = animals.filter((a) =>
      selectedAnimalIds.includes(a.id)
    );
    const animalsWithExistingQr = animalsToUpdate.filter(
      (a) => a.qr_code_identifier
    );

    let proceed = true;
    if (animalsWithExistingQr.length > 0) {
      proceed = window.confirm(
        `Attention : ${animalsWithExistingQr.length} animal(aux) sélectionné(s) ont déjà un code QR. Voulez-vous vraiment les remplacer ?`
      );
    }

    if (!proceed) {
      alert("Opération annulée.");
      return;
    }

    try {
      const updates = animalsToUpdate.map((animal) =>
        supabase
          .from("tb_animals")
          .update({
            qr_code_identifier: crypto.randomUUID(),
            qr_code_status: "available",
          })
          .eq("id", animal.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((res) => res.error);

      if (errors.length > 0)
        throw new Error(errors.map((e) => e.error?.message).join(", "));

      alert(
        `${animalsToUpdate.length} code(s) QR ont été généré(s) ou mis à jour avec succès.`
      );
      setSelectedAnimalIds([]);
      fetchAnimals();
    } catch (err: any) {
      setError(`Erreur lors de la génération des codes QR: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (selectedAnimalIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedAnimalIds.length} animal(aux) ? Cette action est irréversible.`
    );

    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("tb_animals")
          .delete()
          .in("id", selectedAnimalIds);

        if (error) throw error;

        alert("Animal(aux) supprimé(s) avec succès.");
        setSelectedAnimalIds([]); // Clear selection
        fetchAnimals(); // Refresh data
      } catch (err: any) {
        setError(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "requested":
        return "Demandé";
      default:
        return "Aucun";
    }
  };

  const columns: Column<Animal>[] = useMemo(
    () => [
      {
        header: "Nom",
        accessor: "nme",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "N° Identification",
        accessor: "num_ident",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Propriétaire",
        accessor: "owner_name",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Espèce",
        accessor: "espece",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Statut QR",
        accessor: "qr_code_status",
        sortable: true,
        render: (animal) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
              animal.qr_code_status
            )}`}
          >
            {getStatusText(animal.qr_code_status)}
          </span>
        ),
      },
      {
        header: "Radié",
        accessor: "is_radiated",
        sortable: true,
        render: (animal) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              animal.is_radiated
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {animal.is_radiated ? "Oui" : "Non"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Gestion des Animaux (Administration)
          </h1>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleEditClick}
                disabled={selectedAnimalIds.length !== 1}
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
                  />
                </svg>
                Modifier
              </button>
              <button
                onClick={handleRadiateClick}
                disabled={selectedAnimalIds.length === 0}
                className={`flex items-center justify-center font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap ${
                  areAllSelectedRadiated && selectedAnimalIds.length > 0
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {areAllSelectedRadiated && selectedAnimalIds.length > 0
                  ? "Marquer Non-Radié"
                  : "Radier"}
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={selectedAnimalIds.length === 0}
                className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Supprimer
              </button>
              <button
                onClick={() => void handleGenerateQrCode()}
                disabled={selectedAnimalIds.length === 0}
                className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 21h8v-8h-8v8zm2-6h4v4h-4v-4z" />
                </svg>
                Générer/Changer Code QR
              </button>
            </div>
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`flex items-center justify-center font-semibold py-2 px-5 rounded-full transition-colors duration-200 ${
                isMultiSelectMode
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Sélection Multiple
            </button>
          </div>

          <div className="mb-6 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Rechercher par nom, ID, propriétaire..."
              className="flex-grow text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filters.propr_id}
              onChange={(e) =>
                setFilters({ ...filters, propr_id: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Tous les Propriétaires</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.nme}
                </option>
              ))}
            </select>
            <select
              value={filters.espece}
              onChange={(e) =>
                setFilters({ ...filters, espece: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Toutes les espèces</option>
              {especes.map((espece) => (
                <option key={espece} value={espece}>
                  {espece}
                </option>
              ))}
            </select>
            <select
              value={filters.is_radiated}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  is_radiated: e.target.value as "all" | "true" | "false",
                })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Radié (Tous)</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
            <select
              value={filters.qr_code_status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  qr_code_status: e.target.value as
                    | "all"
                    | "none"
                    | "requested"
                    | "available",
                })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Statut QR (Tous)</option>
              <option value="none">Aucun</option>
              <option value="requested">Demandé</option>
              <option value="available">Disponible</option>
            </select>
          </div>

          <Table
            columns={columns}
            data={filteredAnimals}
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucun animal trouvé."
            initialSortColumn="created_at"
            selectedItemIds={selectedAnimalIds}
            onRowSelect={handleRowSelect}
            isMultiSelect={isMultiSelectMode}
            onRowDoubleClick={handleRowDoubleClick}
            onSelectAll={handleSelectAll}
          />
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-4">
            <AnimalForm
              animal={editingAnimal}
              owners={owners}
              animals={animals}
              onOwnerAdded={fetchOwners}
              onClose={() => setIsModalOpen(false)}
              onSave={() => {
                setIsModalOpen(false);
                fetchAnimals();
              }}
              onAnimalChange={(animal) => {
                setEditingAnimal(animal);
                setIsModalOpen(true);
              }}
            />
          </div>
        )}
        {isRadiateModalOpen && (
          <RadiateForm
            count={
              selectedAnimalIds.filter(
                (id) => !animals.find((a) => a.id === id)?.is_radiated
              ).length
            }
            onClose={() => setIsRadiateModalOpen(false)}
            onSave={handleBulkRadiate}
          />
        )}
      </main>
      <PgFooter />
    </div>
  );
}

const radiationReasons = [
  "Décès",
  "Vente",
  "Perdu",
  "Retrouvé par propriétaire",
  "Action administrative",
];

const RadiateForm = ({
  count,
  onClose,
  onSave,
}: {
  count: number;
  onClose: () => void;
  onSave: (data: { date: string; reason: string }) => Promise<void>;
}) => {
  const [reason, setReason] = useState(radiationReasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const finalReason = reason === "Autre" ? customReason : reason;
    if (!finalReason) {
      alert("Veuillez préciser un motif.");
      setIsSaving(false);
      return;
    }
    await onSave({
      date,
      reason: finalReason,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Radier {count} animal (animaux)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="radiate_date"
              className="block text-sm font-medium text-gray-700"
            >
              Date de radiation
            </label>
            <div className="relative">
              <input
                id="radiate_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 p-2 border rounded w-full text-gray-900 appearance-none"
                required
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 11H5V13H9V11ZM15 11H11V13H15V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="radiate_reason"
              className="block text-sm font-medium text-gray-700"
            >
              Motif de radiation
            </label>
            <select
              id="radiate_reason_select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 p-2 border rounded w-full text-gray-900"
              required
            >
              {radiationReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Autre">Autre...</option>
            </select>
            {reason === "Autre" && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Préciser le motif"
                className="mt-2 p-2 border rounded w-full text-gray-900"
                required
              />
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-300 rounded hover:bg-gray-400"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-yellow-300"
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement..." : "Confirmer la Radiation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
