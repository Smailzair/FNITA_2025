import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import { Table, type Column } from "../../components/Table";

type Animal = {
  id: string;
  created_at: Date;
  nme: string | null;
  num_ident: string | null;
  num_passport: string | null;
  propr_id: string | null;
  owner_name: string | null; // Added for displaying owner's name
  espece: string | null;
  race: string | null;
  sexe: string | null;
  niss_date: Date | null;
  robe: string | null;
  is_radiated: boolean | null;
};

type FilterOptions = {
  espece: string;
  race: string;
  sexe: string;
  is_radiated: "all" | "true" | "false";
  propr_id: string | "all";
};

type Owner = {
  id: string;
  nme: string;
};

export default function AnimalsManage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    espece: "all",
    race: "all",
    sexe: "all",
    is_radiated: "all",
    propr_id: "all",
  });
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from("tb_animals")
        .select(`
          id, created_at, nme, num_ident, num_passport, propr_id,
          espece, race, sexe, niss_date, robe, is_radiated,
          propr_id(nme)
        `);

      if (fetchError) {
        throw fetchError;
      }

      const processedData = (data || []).map((animal) => ({
        ...animal,
        created_at: new Date(animal.created_at),
        niss_date: animal.niss_date ? new Date(animal.niss_date) : null,
        owner_name: animal.propr_id
          ? (animal.propr_id as unknown as Owner).nme
          : null,
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
      const { data, error } = await supabase.from("tb_props").select("id, nme");
      if (error) throw error;
      setOwners(data || []);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
    fetchOwners(); // Fetch owners when the component mounts
  }, [fetchAnimals, fetchOwners]);

  const filteredAnimals = useMemo(() => {
    return animals
      .filter((animal) => {
        const { espece, race, sexe, is_radiated, propr_id } = filters;
        if (espece !== "all" && animal.espece !== espece) return false;
        if (race !== "all" && animal.race !== race) return false;
        if (sexe !== "all" && animal.sexe !== sexe) return false;
        if (is_radiated !== "all") {
          if (is_radiated === "true" && !animal.is_radiated) return false;
          if (is_radiated === "false" && animal.is_radiated) return false;
        }
        if (propr_id !== "all" && animal.propr_id !== propr_id) return false; // Filter by owner
        return true;
      })
      .filter(
        (animal) =>
          animal.nme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.num_ident?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.num_passport
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          animal.espece?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.race?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.robe?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSelectAll = useCallback(
    (areAllSelected: boolean) => {
      setSelectedAnimalIds(
        areAllSelected ? filteredAnimals.map((a) => a.id) : []
      );
    },
    [filteredAnimals]
  );

  const columns: Column<Animal>[] = useMemo(
    () => [
      {
        header: "Nom",
        accessor: "nme",
        sortable: true,
      },
      {
        header: "N° Identification",
        accessor: "num_ident",
        sortable: true,
      },
      {
        header: "Espèce",
        accessor: "espece",
        sortable: true,
      },
      {
        header: "Race",
        accessor: "race",
        sortable: true,
      },
      {
        header: "Sexe",
        accessor: "sexe",
        sortable: true,
      },
      {
        header: "Propriétaire",
        accessor: "owner_name",
        sortable: true,
      },
      {
        header: "Date de Naissance",
        accessor: "niss_date",
        sortable: true,
        render: (animal) =>
          animal.niss_date
            ? animal.niss_date.toLocaleDateString("fr-FR")
            : "N/A",
      },
      {
        header: "Robe",
        accessor: "robe",
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
            Gestion des Animaux
          </h1>

          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full">
              Ajouter un Animal
            </button>
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`font-semibold py-2 px-5 rounded-full transition-colors duration-200 ${
                isMultiSelectMode
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Sélection Multiple
            </button>
            {/* Add other bulk action buttons here */}
          </div>

          <div className="mb-6 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Rechercher..."
              className="flex-grow text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Propriétaire Filter Dropdown */}
            <select
              value={filters.propr_id}
              onChange={(e) =>
                setFilters({ ...filters, propr_id: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">Tous les Propriétaires</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.nme}
                </option>
              ))}
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
            onSelectAll={handleSelectAll}
          />
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
