import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import { Table, type Column } from "../../components/Table";

type Declaration = {
  id: string;
  created_at: Date;
  disease_name: string;
  declaration_type: string;
  status: string;
  espece: string | null;
  wilaya: string | null;
  city: string | null;
  tb_animals: { nme: string } | null;
  tb_login: { fam_nme: string; nme: string } | null;
};

const ALGERIAN_WILAYAS = [
  "Adrar",
  "Aïn Defla",
  "Aïn Témouchent",
  "Alger",
  "Annaba",
  "Batna",
  "Béchar",
  "Béjaïa",
  "Béni Abbès",
  "Biskra",
  "Blida",
  "Bordj Badji Mokhtar",
  "Bordj Bou Arreridj",
  "Bouira",
  "Boumerdès",
  "Chlef",
  "Constantine",
  "Djanet",
  "Djelfa",
  "El Bayadh",
  "El Meniaa",
  "El M'Ghair",
  "El Oued",
  "El Tarf",
  "Ghardaïa",
  "Guelma",
  "Illizi",
  "In Guezzam",
  "In Salah",
  "Jijel",
  "Khenchela",
  "Laghouat",
  "Mascara",
  "Médéa",
  "Mila",
  "Mostaganem",
  "M'Sila",
  "Naâma",
  "Oran",
  "Ouargla",
  "Ouled Djellal",
  "Oum El Bouaghi",
  "Relizane",
  "Saïda",
  "Sétif",
  "Sidi Bel Abbès",
  "Skikda",
  "Souk Ahras",
  "Tamanrasset",
  "Tébessa",
  "Tiaret",
  "Timimoun",
  "Tindouf",
  "Tipaza",
  "Tissemsilt",
  "Tizi Ouzou",
  "Tlemcen",
  "Touggourt",
];

export default function ManageDeclarations() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    startDate: "",
    endDate: "",
    wilaya: "all",
    status: "all",
  });

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("tb_disease_declarations")
        .select("*, tb_animals(nme), declared_by_vet_id:tb_login(fam_nme, nme)")
        .order("created_at", { ascending: false });

      if (filters.startDate) query = query.gte("created_at", filters.startDate);
      if (filters.endDate) query = query.lte("created_at", filters.endDate);
      if (filters.wilaya !== "all") query = query.eq("wilaya", filters.wilaya);
      if (filters.status !== "all") query = query.eq("status", filters.status);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const processedData = (data || []).map((d) => ({
        ...d,
        created_at: new Date(d.created_at),
        tb_login: d.declared_by_vet_id, // Remap for consistency
      }));

      setDeclarations(processedData as Declaration[]);
    } catch (err: any) {
      setError(
        "Impossible de charger les déclarations. " + (err.message || "")
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchDeclarations();
  }, [fetchDeclarations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from("tb_disease_declarations")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      setDeclarations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
    } catch (err: any) {
      alert("Erreur lors de la mise à jour du statut: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette déclaration ?")
    ) {
      try {
        const { error: deleteError } = await supabase
          .from("tb_disease_declarations")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        setDeclarations((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        alert("Erreur lors de la suppression: " + err.message);
      }
    }
  };

  const filteredDeclarations = useMemo(() => {
    return declarations.filter((d) => {
      const searchTerm = filters.searchTerm.toLowerCase();
      return (
        d.disease_name.toLowerCase().includes(searchTerm) ||
        (d.tb_login &&
          `${d.tb_login.fam_nme} ${d.tb_login.nme}`
            .toLowerCase()
            .includes(searchTerm)) ||
        d.espece?.toLowerCase().includes(searchTerm)
      );
    });
  }, [declarations, filters.searchTerm]);

  const columns: Column<Declaration>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "created_at",
        sortable: true,
        render: (d) => d.created_at.toLocaleDateString("fr-FR"),
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Maladie",
        accessor: "disease_name",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)", fontWeight: "500" },
      },
      {
        header: "Vétérinaire",
        accessor: "tb_login",
        sortable: true,
        render: (d) =>
          d.tb_login ? `${d.tb_login.fam_nme} ${d.tb_login.nme}` : "N/A",
        cellStyle: { color: "rgb(55 65 81)" },
      },
      {
        header: "Détails",
        accessor: "declaration_type",
        cellStyle: { color: "rgb(55 65 81)" },
        render: (d) => {
          switch (d.declaration_type) {
            case "specific_animal":
              return `Animal: ${d.tb_animals?.nme || "N/A"}`;
            case "by_type":
              return `Espèce: ${d.espece} (${d.wilaya || ""})`;
            case "by_location":
              return `Localisation: ${d.city || ""}, ${d.wilaya || ""}`;
            default:
              return "N/A";
          }
        },
      },
      {
        header: "Statut",
        accessor: "status",
        sortable: true,
        render: (d) => (
          <select
            value={d.status}
            onChange={(e) => handleStatusChange(d.id, e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevent row selection
            className="p-1 border border-gray-300 rounded-md shadow-sm text-gray-900"
          >
            <option value="Suspected">Suspecté</option>
            <option value="Confirmed">Confirmé</option>
            <option value="Resolved">Résolu</option>
          </select>
        ),
      },
      {
        header: "Actions",
        accessor: "id", // Add a unique accessor
        render: (d) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(d.id);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Gestion des Déclarations de Maladies
          </h1>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Rechercher par maladie, véto..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              />
              <select
                value={filters.wilaya}
                onChange={(e) =>
                  setFilters({ ...filters, wilaya: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              >
                <option value="all">Toutes les Wilayas</option>
                {ALGERIAN_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              >
                <option value="all">Tous les Statuts</option>
                <option value="Suspected">Suspecté</option>
                <option value="Confirmed">Confirmé</option>
                <option value="Resolved">Résolu</option>
              </select>
              <div className="flex items-center gap-2 lg:col-span-2">
                <div className="relative w-full">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 appearance-none"
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
                <span className="text-gray-500">à</span>
                <div className="relative w-full">
                  <input
                    type="date"
                    value={filters.endDate}
                    min={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 appearance-none"
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
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredDeclarations}
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucune déclaration trouvée."
            initialSortColumn="created_at"
          />
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
