import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import { PgHeader2 } from "../../components/PgHeader2";
import PgFooter from "../../components/PgFooter";
import { Table, type Column } from "../../components/Table";
import UserEditPanel from "./UserEditPanel"; // Import the new component

// Define the type for a user based on your tb_login table
type User = {
  id: string;
  created_at: Date;
  fam_nme: string;
  nme: string;
  email: string;
  phone: string | null; // Changed to allow null
  validated: boolean | null; // Changed to allow null
  confirmed: boolean;
  wilaya: string | null; // Changed to allow null
  city: string | null; // Changed to allow null
  asking_to_delete: boolean;
};

type UserType = "Vétérinaire" | "Ayant droit" | "Administrateur";

type FilterStatus = "all" | "validated" | "not_validated" | "asked_for_delete";

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserType, setCurrentUserType] =
    useState<UserType>("Vétérinaire");
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedVetIds, setSelectedVetIds] = useState<string[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteRequestNotification, setShowDeleteRequestNotification] =
    useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_login")
        .select(
          "id, created_at, fam_nme, nme, email, phone, validated,confirmed, wilaya, city, asking_to_delete"
        )
        .eq("type", currentUserType);

      if (fetchError) {
        throw fetchError;
      }

      const vetsAskingForDelete = (data || []).filter(
        (v) => v.asking_to_delete
      ).length;
      if (vetsAskingForDelete > 0) {
        setShowDeleteRequestNotification(true);
      } else {
        setShowDeleteRequestNotification(false);
      }
      // Process data to convert created_at string to Date object
      const processedData = (data || []).map((user) => ({
        ...user,
        created_at: new Date(user.created_at),
      }));
      setUsers(processedData);
    } catch (err: unknown) {
      setError(`Impossible de charger les données des ${currentUserType}s.`);
      console.error(`Error fetching ${currentUserType}s:`, err);
    } finally {
      setLoading(false);
    }
  }, [currentUserType]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleValidationToggle = useCallback(
    async (id: string, currentStatus: boolean | null) => {
      // Ensure at least one administrator remains validated
      if (currentUserType === "Administrateur" && currentStatus === true) {
        const validatedAdminsCount = users.filter((u) => u.validated).length;
        if (validatedAdminsCount <= 1) {
          alert("Action refusée : Il doit rester au moins un administrateur validé.");
          return;
        }
      }

      try {
        const { error: updateError } = await supabase
          .from("tb_login")
          .update({ validated: !currentStatus })
          .eq("id", id);

        if (updateError) {
          throw updateError;
        }

        // Update local state to reflect the change immediately
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, validated: !currentStatus } : user
          )
        );
      } catch (err: unknown) {
        alert("Erreur lors de la mise à jour du statut.");
        console.error("Error updating validation status:", err);
      }
    },
    [currentUserType, users]
  );

  const processedUsers = useMemo(() => {
    const filtered = users
      .filter((user) => {
        if (filterStatus === "validated") return user.validated;
        if (filterStatus === "not_validated") return !user.validated;
        if (filterStatus === "asked_for_delete") return user.asking_to_delete;
        return true;
      })
      .filter(
        (user) =>
          `${user.fam_nme} ${user.nme}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.wilaya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return filtered;
  }, [users, searchTerm, filterStatus]);

  useEffect(() => {
    // If the selected vet is no longer in the processed list (due to filtering),
    // or if the list is empty, deselect it and hide the form.
    const newSelectedIds = selectedVetIds.filter((id) =>
      processedUsers.some((v) => v.id === id)
    );
    if (newSelectedIds.length !== selectedVetIds.length) {
      setSelectedVetIds(newSelectedIds);
    }
    if (newSelectedIds.length === 0) {
      setShowEditForm(false);
    }
  }, [processedUsers, selectedVetIds]);

  const selectionStatus = useMemo(() => {
    if (selectedVetIds.length === 0) {
      return { canValidate: false, canInvalidate: false };
    }
    const selectedUsersData = users.filter((u) =>
      selectedVetIds.includes(u.id)
    );
    const canValidate = selectedUsersData.some((u) => !u.validated);
    const canInvalidate = selectedUsersData.some((u) => u.validated);
    return {
      canValidate,
      canInvalidate,
    };
  }, [selectedVetIds, users]); // Corrected dependency from 'vets' to 'users'

  useEffect(() => {
    // Prevent background scroll when modal is open
    if (showEditForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    // Cleanup on component unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showEditForm]);

  const handleRowSelect = useCallback(
    (id: string | number, isMulti: boolean) => {
      const strId = String(id);
      if (isMulti || isMultiSelectMode) {
        setSelectedVetIds((prev) =>
          prev.includes(strId)
            ? prev.filter((i) => i !== strId)
            : [...prev, strId]
        );
      } else {
        setSelectedVetIds((prev) =>
          prev.length === 1 && prev[0] === strId ? [] : [strId]
        );
      }
      setShowEditForm(false); // Hide form if a new row is selected or deselected
    },
    [isMultiSelectMode]
  );

  const handleSelectAll = useCallback(
    (areAllSelected: boolean) => {
      if (areAllSelected) {
        setSelectedVetIds(processedUsers.map((v) => v.id));
      } else {
        setSelectedVetIds([]);
      }
    },
    [processedUsers]
  );

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

  const handleBulkStatusChange = useCallback(
    async (newStatus: boolean) => {
      if (selectedVetIds.length === 0) return;

      // Ensure at least one administrator remains validated
      if (currentUserType === "Administrateur" && newStatus === false) {
        const validatedAdminsCount = users.filter((u) => u.validated).length;
        const selectedValidatedAdminsCount = users.filter(
          (u) => selectedVetIds.includes(u.id) && u.validated
        ).length;

        if (validatedAdminsCount - selectedValidatedAdminsCount < 1) {
          alert("Action refusée : Il doit rester au moins un administrateur validé.");
          return;
        }
      }

      try {
        const { error: updateError } = await supabase
          .from("tb_login")
          .update({ validated: newStatus })
          .in("id", selectedVetIds);

        if (updateError) throw updateError;

        fetchUsers(); // Refresh data
      } catch (err) {
        alert("Erreur lors de la mise à jour du statut.");
        console.error("Error updating validation status:", err);
      }
    },
    [selectedVetIds, fetchUsers, currentUserType, users]
  );

  const handleDeleteClick = useCallback(async () => {
    // Ensure at least one administrator remains validated
    if (currentUserType === "Administrateur") {
      const validatedAdminsCount = users.filter((u) => u.validated).length;
      const selectedValidatedAdminsCount = users.filter(
        (u) => selectedVetIds.includes(u.id) && u.validated
      ).length;

      if (validatedAdminsCount - selectedValidatedAdminsCount < 1) {
        alert("Suppression refusée : Il doit rester au moins un administrateur validé.");
        return;
      }
    }

    if (
      selectedVetIds.length > 0 &&
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedVetIds.length} utilisateur(s) ?`
      )
    ) {
      try {
        const { error: deleteError } = await supabase
          .from("tb_login")
          .delete()
          .in("id", selectedVetIds);

        if (deleteError) {
          throw deleteError;
        }
        setSelectedVetIds([]);
        fetchUsers(); // Refresh the list
      } catch (err: unknown) {
        alert("Erreur lors de la suppression de l'utilisateur.");
        console.error("Error deleting user:", err);
      }
    }
  }, [selectedVetIds, fetchUsers, currentUserType, users]);

  const handleEditFormClose = useCallback(() => {
    setShowEditForm(false);
    setSelectedVetIds([]); // Deselect all rows when form closes
    fetchUsers(); // Refresh data after potential save
  }, [fetchUsers]);

  const columns: Column<User>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "created_at",
        sortable: true,
        render: (user) => (
          <div className="text-sm font-medium text-gray-900">
            {user.created_at.toLocaleDateString("fr-FR")}
          </div>
        ),
      },
      {
        header: "Nom",
        accessor: "fam_nme",
        sortable: true,
        render: (user) => (
          <div className="text-sm font-medium text-gray-900">
            {user.fam_nme} {user.nme}
          </div>
        ),
      },
      {
        header: "Email & Téléphone",
        accessor: "email",
        sortable: true,
        render: (user) => (
          <>
            <div className="text-sm text-gray-900">{user.email}</div>
            <div className="text-sm text-gray-500">{user.phone}</div>
          </>
        ),
      },
      {
        header: "Localisation",
        accessor: "wilaya",
        sortable: true,
        render: (user) => `${user.city || ""}, ${user.wilaya || ""}`,
        cellStyle: { color: "rgb(107 114 128)" },
      },
      {
        header: "Statut",
        accessor: "validated", // Keep accessor for sorting
        sortable: true,
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center" },
        render: (user) => (
          <div className="flex flex-col items-center gap-2">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.validated
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {user.validated ? "Validé" : "Non validé"}
            </span>
            <ValidationToggle
              user={user}
              onToggle={handleValidationToggle}
            />
          </div>
        ),
      },
    ],
    [handleValidationToggle, currentUserType]
  );

  const TABS: { label: string; type: UserType }[] = [
    { label: "Vétérinaires", type: "Vétérinaire" },
    { label: "Ayants droit", type: "Ayant droit" },
    { label: "Administrateurs", type: "Administrateur" },
  ];

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => setCurrentUserType(tab.type)}
                  className={`${tab.type === currentUserType
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Gestion des {currentUserType}s
          </h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`font-semibold py-2 px-5 rounded-full transition-colors duration-200 ${isMultiSelectMode ? "bg-cyan-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-800"}`}
            >
              Sélection Multiple
            </button>
            <div className="h-8 border-l border-gray-300 mx-2" />
            <button
              onClick={handleModifyClick}
              disabled={
                selectedVetIds.length !== 1 || processedUsers.length === 0
              }
              className="bg-blue-500 hover:bg-blue-600  text-white font-semibold py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800"
            >
              Modifier
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={
                selectedVetIds.length === 0 || processedUsers.length === 0
              }
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800"
            >
              Supprimer
            </button>
            <div className="h-8 border-l border-gray-300 mx-2" />
            <button
              onClick={() => handleBulkStatusChange(true)}
              disabled={
                !selectionStatus.canValidate || processedUsers.length === 0
              }
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800"
            >
              Valider
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              disabled={
                !selectionStatus.canInvalidate ||
                processedUsers.length === 0
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800"
            >
              Invalider
            </button>

            {showDeleteRequestNotification && filterStatus === "all" && (
              <label
                onClick={() => setFilterStatus("asked_for_delete")}
                // className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
                className="text-orange-500 hover:text-orange-600 font-italic py-2 px-4 cursor-pointer"
              >
                Demandes de suppression (
                {users.filter((v) => v.asking_to_delete).length})
              </label>
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
            data={processedUsers} // Pass the processed (filtered/searched) data
            isLoading={loading}
            error={error}
            emptyStateMessage={`Aucun ${currentUserType} trouvé.`}
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
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 p-4"
          onClick={handleEditFormClose} // Close when clicking on the overlay
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <UserEditPanel
              userId={selectedVetIds[0]}
              onClose={handleEditFormClose}
              onSave={handleEditFormClose}
            />
          </div>
        </div>
      )}

      <PgFooter />
    </div>
  );
}

const ValidationToggle = ({
  user,
  onToggle,
}: {
  user: User;
  onToggle: (id: string, currentStatus: boolean | null) => void;
}) => (
  <label
    htmlFor={`toggle-${user.id}`}
    className="flex items-center justify-center cursor-pointer"
  >
    <div className="relative">
      <input
        type="checkbox"
        id={`toggle-${user.id}`}
        className="sr-only"
        checked={!!user.validated}
        onChange={() => onToggle(user.id, user.validated)}
      />
      <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
      <div
        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${user.validated ? "translate-x-6" : ""
          }`}
      ></div>
    </div>
  </label>
);
