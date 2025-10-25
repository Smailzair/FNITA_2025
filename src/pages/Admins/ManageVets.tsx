import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import { PgHeader2 } from "../../components/PgHeader2";
import PgFooter from "../../components/PgFooter";
import { Table, type Column } from "../../components/Table";
// import { Table, Column } from "../../components/Table";

// Define the type for a veterinarian based on your tb_login table
type Veterinarian = {
  id: string;
  created_at: Date;
  fam_nme: string;
  nme: string;
  email: string;
  phone: string;
  validated: boolean;
  confirmed: boolean;
  wilaya: string;
  city: string;
};

type FilterStatus = "all" | "validated" | "not_validated";

export default function ManageVets() {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const fetchVets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_login")
        .select(
          "id, created_at, fam_nme, nme, email, phone, validated,confirmed, wilaya, city"
        )
        .eq("type", "Vétérinaire");

      if (fetchError) {
        throw fetchError;
      }

      // Process data to convert created_at string to Date object
      const processedData = (data || []).map((vet) => ({
        ...vet,
        created_at: new Date(vet.created_at),
      }));
      setVets(processedData);
    } catch (err: unknown) {
      setError("Impossible de charger les données des vétérinaires.");
      console.error("Error fetching veterinarians:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  const handleValidationToggle = useCallback(
    async (id: string, currentStatus: boolean) => {
      try {
        const { error: updateError } = await supabase
          .from("tb_login")
          .update({ validated: !currentStatus })
          .eq("id", id);

        if (updateError) {
          throw updateError;
        }

        // Update local state to reflect the change immediately
        setVets((prevVets) =>
          prevVets.map((vet) =>
            vet.id === id ? { ...vet, validated: !currentStatus } : vet
          )
        );
      } catch (err: unknown) {
        alert("Erreur lors de la mise à jour du statut.");
        console.error("Error updating validation status:", err);
      }
    },
    []
  );

  const processedVets = useMemo(() => {
    const filtered = vets
      .filter((vet) => {
        if (filterStatus === "validated") return vet.validated;
        if (filterStatus === "not_validated") return !vet.validated;
        return true;
      })
      .filter(
        (vet) =>
          `${vet.fam_nme} ${vet.nme}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vet.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vet.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vet.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vet.city.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return filtered;
  }, [vets, searchTerm, filterStatus]);

  const columns: Column<Veterinarian>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "created_at",
        sortable: true,
        render: (vet) => (
          <div className="text-sm font-medium text-gray-900">
            {vet.created_at.toLocaleDateString("fr-FR")}
          </div>
        ),
      },
      {
        header: "Nom",
        accessor: "fam_nme",
        sortable: true,
        render: (vet) => (
          <div className="text-sm font-medium text-gray-900">
            {vet.fam_nme} {vet.nme}
          </div>
        ),
      },
      {
        header: "Email & Téléphone",
        accessor: "email",
        sortable: true,
        render: (vet) => (
          <>
            <div className="text-sm text-gray-900">{vet.email}</div>
            <div className="text-sm text-gray-500">{vet.phone}</div>
          </>
        ),
      },
      {
        header: "Localisation",
        accessor: "wilaya",
        sortable: true,
        render: (vet) => `${vet.city}, ${vet.wilaya}`,
        cellStyle: { color: "rgb(107 114 128)" },
      },
      {
        header: "Statut",
        accessor: "validated",
        sortable: true,
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center" },
        render: (vet) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vet.validated
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
              }`}
          >
            {vet.validated ? "Validé" : "Non validé"}
          </span>
        ),
      },
      {
        header: "Valider",
        accessor: (vet) => (
          <ValidationToggle vet={vet} onToggle={handleValidationToggle} />
        ),
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center" },
      },
    ],
    [handleValidationToggle]
  );

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="flex flex-row items-center text-2xl font-bold text-gray-800 mb-6 gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-1 0 19 19"
              width="27"
              height="27"
              fill="currentColor"
            >
              <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-3.193-.767a1.588 1.588 0 1 0-1.999 1.534v1.515a2.014 2.014 0 0 1-4.027 0v-.334a2.676 2.676 0 0 0 2.262-2.64v-2.14a1.244 1.244 0 0 0-.506-1.002.894.894 0 1 0-.395.754.424.424 0 0 1 .08.248v2.14a1.851 1.851 0 1 1-3.703 0v-2.14a.422.422 0 0 1 .1-.273.895.895 0 1 0-.356-.77 1.245 1.245 0 0 0-.565 1.043v2.14a2.676 2.676 0 0 0 2.262 2.64v.334a2.835 2.835 0 1 0 5.67 0v-1.515a1.59 1.59 0 0 0 1.177-1.534zm-.821 0a.767.767 0 1 1-.767-.767.768.768 0 0 1 .767.767z"></path>
            </svg>
            Gestion des Vétérinaires
          </h1>

          {/* Controls: Search and Filter */}
          <div className="flex flex-row md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher ..."
              className="flex-grow text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className=" text-xs text-black border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">Tous</option>
              <option value="validated" className="bg-green-100">
                Validés
              </option>
              <option value="not_validated" className="bg-red-100">
                Non Validés
              </option>
            </select>
          </div>

          {/* Data View */}
          <Table
            columns={columns}
            data={processedVets}
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucun vétérinaire trouvé."
            initialSortColumn="created_at"
          />
          <div className="border-t-3 border-gray-400 w-[80%] m-auto mt-4" />
        </div>
      </main>
      <PgFooter />
    </div>
  );
}

const ValidationToggle = ({
  vet,
  onToggle,
}: {
  vet: Veterinarian;
  onToggle: (id: string, currentStatus: boolean) => void;
}) => (
  <label
    htmlFor={`toggle-${vet.id}`}
    className="flex items-center justify-center cursor-pointer"
  >
    <div className="relative">
      <input
        type="checkbox"
        id={`toggle-${vet.id}`}
        className="sr-only"
        checked={vet.validated}
        onChange={() => onToggle(vet.id, vet.validated)}
      />
      <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
      <div
        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${vet.validated ? "translate-x-6" : ""
          }`}
      ></div>
    </div>
  </label>
);
