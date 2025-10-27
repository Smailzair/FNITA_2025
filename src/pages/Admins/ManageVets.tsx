import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import { PgHeader2 } from "../../components/PgHeader2";
import PgFooter from "../../components/PgFooter";
import { Table, type Column } from "../../components/Table";
import UserEditPanel from "./UserEditPanel"; // Import the new component

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
  asking_to_delete: boolean;
};

type FilterStatus = "all" | "validated" | "not_validated" | "asked_for_delete";

export default function ManageVets() {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedVetIds, setSelectedVetIds] = useState<string[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteRequestNotification, setShowDeleteRequestNotification] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const fetchVets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_login")
        .select(
          "id, created_at, fam_nme, nme, email, phone, validated,confirmed, wilaya, city, asking_to_delete"
        )
        .eq("type", "Vétérinaire");

      if (fetchError) {
        throw fetchError;
      }

      const vetsAskingForDelete = (data || []).filter(v => v.asking_to_delete).length;
      if (vetsAskingForDelete > 0) {
        setShowDeleteRequestNotification(true);
      } else {
        setShowDeleteRequestNotification(false);
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
        if (filterStatus === "asked_for_delete") return vet.asking_to_delete;
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

  useEffect(() => {
    // If the selected vet is no longer in the processed list (due to filtering),
    // or if the list is empty, deselect it and hide the form.
    const newSelectedIds = selectedVetIds.filter(id => processedVets.some(v => v.id === id));
    if (newSelectedIds.length !== selectedVetIds.length) {
      setSelectedVetIds(newSelectedIds);
    }
    if (newSelectedIds.length === 0) {
      setShowEditForm(false);
    }
  }, [processedVets, selectedVetIds]);

  const selectionStatus = useMemo(() => {
    if (selectedVetIds.length === 0) {
      return { canValidate: false, canInvalidate: false };
    }
    const selectedVets = vets.filter(v => selectedVetIds.includes(v.id));
    const canValidate = selectedVets.some(v => !v.validated);
    const canInvalidate = selectedVets.some(v => v.validated);
    return {
      canValidate,
      canInvalidate,
    };
  }, [selectedVetIds, vets]);

  useEffect(() => {
    // Prevent background scroll when modal is open
    if (showEditForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup on component unmount
    return () => { document.body.style.overflow = 'auto'; };
  }, [showEditForm]);

  const handleRowSelect = useCallback((id: string | number, isMulti: boolean) => {
    const strId = String(id);
    if (isMulti || isMultiSelectMode) {
      setSelectedVetIds(prev =>
        prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]
      );
    } else {
      setSelectedVetIds(prev => (prev.length === 1 && prev[0] === strId) ? [] : [strId]);
    }
    setShowEditForm(false); // Hide form if a new row is selected or deselected
  }, [isMultiSelectMode]);

  const handleSelectAll = useCallback((areAllSelected: boolean) => {
    if (areAllSelected) {
      setSelectedVetIds(processedVets.map(v => v.id));
    } else {
      setSelectedVetIds([]);
    }
  }, [processedVets]);

  const handleRowDoubleClick = useCallback((id: string | number) => {
    if (isMultiSelectMode) return; // Disable double-click in multi-select mode
    setSelectedVetIds([String(id)]);
    setShowEditForm(true);
  }, []);

  const handleModifyClick = useCallback(() => {
    if (selectedVetIds.length === 1) {
      setShowEditForm(true);
    }
  }, [selectedVetIds]);

  const handleBulkStatusChange = useCallback(async (newStatus: boolean) => {
    if (selectedVetIds.length === 0) return;
    const statusText = newStatus ? 'valider' : 'invalider';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${statusText} ${selectedVetIds.length} utilisateur(s) ?`)) return;

    try {
      const { error: updateError } = await supabase
        .from("tb_login")
        .update({ validated: newStatus })
        .in("id", selectedVetIds);

      if (updateError) throw updateError;

      alert(`${selectedVetIds.length} utilisateur(s) mis à jour avec succès.`);
      fetchVets(); // Refresh data
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut.");
      console.error("Error updating validation status:", err);
    }
  }, [selectedVetIds, fetchVets]);

  const handleDeleteClick = useCallback(async () => {
    if (selectedVetIds.length > 0 && window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedVetIds.length} vétérinaire(s) ?`)) {
      try {
        const { error: deleteError } = await supabase
          .from("tb_login")
          .delete()
          .in("id", selectedVetIds);

        if (deleteError) {
          throw deleteError;
        }
        alert(`${selectedVetIds.length} vétérinaire(s) supprimé(s) avec succès.`);
        setSelectedVetIds([]);
        fetchVets(); // Refresh the list
      } catch (err: unknown) {
        alert("Erreur lors de la suppression du vétérinaire.");
        console.error("Error deleting veterinarian:", err);
      }
    }
  }, [selectedVetIds, fetchVets]);

  const handleEditFormClose = useCallback(() => {
    setShowEditForm(false);
    setSelectedVetIds([]); // Deselect all rows when form closes
    fetchVets(); // Refresh data after potential save
  }, [fetchVets]);

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
        accessor: "validated", // Keep accessor for sorting
        sortable: true,
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center" },
        render: (vet) => (
          <div className="flex flex-col items-center gap-2">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vet.validated
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {vet.validated ? "Validé" : "Non validé"}
            </span>
            <ValidationToggle vet={vet} onToggle={handleValidationToggle} />
          </div>
        ),
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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`font-bold py-2 px-4 rounded-lg ${isMultiSelectMode ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Sélection Multiple
            </button>
            <div className="h-8 border-l border-gray-300 mx-2"></div>
            <button
              onClick={handleModifyClick}
              disabled={selectedVetIds.length !== 1 || processedVets.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Modifier
            </button>
            <button
              onClick={() => handleBulkStatusChange(true)}
              disabled={!selectionStatus.canValidate || processedVets.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Valider
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              disabled={!selectionStatus.canInvalidate || processedVets.length === 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Invalider
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={selectedVetIds.length === 0 || processedVets.length === 0}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Supprimer
            </button>
            {showDeleteRequestNotification && (
              <button
                onClick={() => setFilterStatus("asked_for_delete")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Demandes de suppression ({vets.filter(v => v.asking_to_delete).length})
              </button>
            )}

          </div>

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
              <option value="asked_for_delete" className="bg-orange-100">
                Demandes de suppression
              </option>
            </select>
          </div>

          {/* Data View */}
          <Table
            columns={columns}
            data={processedVets} // Pass the processed (filtered/searched) data
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucun vétérinaire trouvé."
            initialSortColumn="created_at"
            selectedItemIds={selectedVetIds} // Pass selectedVetId to highlight the row
            onRowSelect={handleRowSelect} // Handle row selection
            onRowDoubleClick={handleRowDoubleClick} // Handle double-click
            isMultiSelect={isMultiSelectMode}
            onSelectAll={handleSelectAll}
          />
          <div className="border-t-3 border-gray-400 w-[80%] m-auto mt-4" />
        </div>
      </main>

      {/* Modal Overlay for User Edit Panel */}
      {showEditForm && selectedVetIds.length === 1 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" onClick={(e) => e.stopPropagation()}>
            <UserEditPanel userId={selectedVetIds[0]} onClose={handleEditFormClose} onSave={handleEditFormClose} />
          </div>
        </div>
      )}

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
