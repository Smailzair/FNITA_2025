import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../api/supabaseClient";
import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";
import { Table, type Column } from "../components/Table";
import OwnerForm from "./Vets/OwnerForm"; // Reusing the owner form

type Owner = {
  id: string;
  created_at: Date;
  sexe: string;
  fam_nme: string;
  nme: string;
  num_cni: string | null;
  email: string | null;
  tel: string | null;
  wilaya: string | null;
  city: string | null;
  adresse: string | null;
  code_postal: string | null;
  descr: string | null;
};

export default function OwnersManage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Partial<Owner> | null>(null);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_props")
        .select("*");

      if (fetchError) {
        throw fetchError;
      }

      const processedData = (data || []).map((owner) => ({
        ...owner,
        created_at: new Date(owner.created_at),
      }));
      setOwners(processedData);
    } catch (err: unknown) {
      setError("Impossible de charger les données des propriétaires.");
      console.error("Error fetching owners:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const filteredOwners = useMemo(() => {
    return owners.filter(
      (owner) =>
        owner.nme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.fam_nme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.num_cni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.tel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [owners, searchTerm]);

  const handleRowSelect = useCallback(
    (id: string | number, isMulti: boolean) => {
      const strId = String(id);
      if (isMulti || isMultiSelectMode) {
        setSelectedOwnerIds((prev) =>
          prev.includes(strId)
            ? prev.filter((i) => i !== strId)
            : [...prev, strId]
        );
      } else {
        setSelectedOwnerIds((prev) =>
          prev.length === 1 && prev[0] === strId ? [] : [strId]
        );
      }
    },
    [isMultiSelectMode]
  );

  const handleAddClick = () => {
    setEditingOwner(null);
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    if (selectedOwnerIds.length !== 1) return;
    const ownerToEdit = owners.find((o) => o.id === selectedOwnerIds[0]);
    if (ownerToEdit) {
      setEditingOwner(ownerToEdit);
      setIsModalOpen(true);
    }
  };

  const handleRowDoubleClick = useCallback(
    (id: string | number) => {
      const ownerToEdit = owners.find((o) => o.id === String(id));
      if (ownerToEdit) {
        setEditingOwner(ownerToEdit);
        setIsModalOpen(true);
      }
    },
    [owners]
  );

  const handleSelectAll = useCallback(
    (areAllSelected: boolean) => {
      setSelectedOwnerIds(
        areAllSelected ? filteredOwners.map((o) => o.id) : []
      );
    },
    [filteredOwners]
  );

  const handleDelete = async () => {
    if (selectedOwnerIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedOwnerIds.length} propriétaire(s) ? Cette action est irréversible.`
    );

    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("tb_props")
          .delete()
          .in("id", selectedOwnerIds);

        if (error) throw error;

        alert("Propriétaire(s) supprimé(s) avec succès.");
        setSelectedOwnerIds([]);
        fetchOwners();
      } catch (err: any) {
        setError(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  };

  const columns: Column<Owner>[] = useMemo(
    () => [
      {
        header: "Nom Complet",
        accessor: "fam_nme",
        sortable: true,
        render: (owner) => `${owner.fam_nme} ${owner.nme}`,
        cellStyle: { color: "rgb(17 24 39)", fontWeight: "500" },
      },
      {
        header: "N° CNI",
        accessor: "num_cni",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Contact",
        accessor: "email",
        sortable: true,
        render: (owner) => (
          <div>
            <div className="text-sm text-gray-900">{owner.email}</div>
            <div className="text-sm text-gray-500">{owner.tel}</div>
          </div>
        ),
      },
      {
        header: "Localisation",
        accessor: "wilaya",
        sortable: true,
        render: (owner) => `${owner.city || ""}, ${owner.wilaya || ""}`,
        cellStyle: { color: "rgb(107 114 128)" },
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
            Gestion des Propriétaires
          </h1>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleAddClick}
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full"
              >
                Ajouter
              </button>
              <button
                onClick={handleEditClick}
                disabled={selectedOwnerIds.length !== 1}
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Modifier
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={selectedOwnerIds.length === 0}
                className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Supprimer
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
              placeholder="Rechercher par nom, CNI, contact..."
              className="flex-grow text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table
            columns={columns}
            data={filteredOwners}
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucun propriétaire trouvé."
            initialSortColumn="created_at"
            selectedItemIds={selectedOwnerIds}
            onRowSelect={handleRowSelect}
            isMultiSelect={isMultiSelectMode}
            onRowDoubleClick={handleRowDoubleClick}
            onSelectAll={handleSelectAll}
          />
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-4">
            {/* This is a simplified version. The actual OwnerForm might need more props */}
            <OwnerForm
              owner={editingOwner}
              onClose={() => setIsModalOpen(false)}
              onSave={() => {
                setIsModalOpen(false);
                fetchOwners();
              }}
            />
          </div>
        )}
      </main>
      <PgFooter />
    </div>
  );
}
