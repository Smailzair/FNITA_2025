import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { Table, type Column } from "../../components/Table";
import WilayaComboBox from "../../components/WilayaComboBox";
import { PgHeader2 } from "../../components/PgHeader2";

type Animal = {
  id: string;
  nme: string;
  espece: string;
};

type Declaration = {
  id: string;
  created_at: Date;
  disease_name: string;
  declaration_type: DeclarationType;
  status: string;
  animal_id: string | null;
  espece: string | null;
  wilaya: string | null;
  city: string | null;
  // For joining the animal's name
  tb_animals: { nme: string } | null;
};

type DeclarationType = "specific_animal" | "by_type" | "by_location";

export default function DeclareDiseasePage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [declarationType, setDeclarationType] =
    useState<DeclarationType>("specific_animal");

  // Form fields
  const [selectedAnimal, setSelectedAnimal] = useState("");
  const [selectedEspece, setSelectedEspece] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [diseaseName, setDiseaseName] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History Table State
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  const fetchVetAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié.");

      // Fetch animals whose owners were created by the current vet
      const { data, error } = await supabase
        .from("tb_animals")
        .select("id, nme, espece, propr_id!inner(created_by_email)")
        .eq("propr_id.created_by_email", user.email);

      if (error) throw error;

      setAnimals(data as Animal[]);
    } catch (err: any) {
      setError(
        "Impossible de charger la liste des animaux. " + (err.message || "")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVetAnimals();
  }, [fetchVetAnimals]);

  const fetchDeclarations = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié.");

      const { data, error: fetchError } = await supabase
        .from("tb_disease_declarations")
        .select("*, tb_animals(nme)")
        .eq("declared_by_vet_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const processedData = (data || []).map((d) => ({
        ...d,
        created_at: new Date(d.created_at),
      }));

      setDeclarations(processedData as Declaration[]);
    } catch (err: any) {
      setError("Impossible de charger l'historique. " + (err.message || ""));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDeclarations();
  }, [fetchDeclarations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !diseaseName ||
      !diagnosisDate ||
      (declarationType === "specific_animal" && !selectedAnimal) ||
      (declarationType === "by_type" && !selectedEspece) ||
      (declarationType === "by_location" && !selectedWilaya)
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const declarationData: any = {
      declaration_type: declarationType,
      disease_name: diseaseName,
      diagnosis_date: diagnosisDate,
      symptoms,
      notes,
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié.");

      declarationData.declared_by_vet_id = user.id;

      switch (declarationType) {
        case "specific_animal":
          declarationData.animal_id = selectedAnimal;
          break;
        case "by_type":
          declarationData.espece = selectedEspece;
          declarationData.wilaya = selectedWilaya;
          declarationData.city = selectedCity;
          break;
        case "by_location":
          declarationData.wilaya = selectedWilaya;
          declarationData.city = selectedCity;
          break;
      }

      const { error: insertError } = await supabase
        .from("tb_disease_declarations")
        .insert(declarationData);

      if (insertError) throw insertError;

      setSuccessMessage("La maladie a été déclarée avec succès !");
      // Reset form
      setSelectedAnimal("");
      setSelectedEspece("");
      setSelectedWilaya("");
      setSelectedCity("");
      setDiseaseName("");
      setSymptoms("");
      setNotes("");
      void fetchDeclarations(); // Refresh history table
    } catch (err: any) {
      setError("Erreur lors de la déclaration : " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDeclarations = useMemo(() => {
    return declarations
      .filter((declaration) => {
        if (historyStatusFilter === "all") return true;
        return declaration.status === historyStatusFilter;
      })
      .filter((declaration) => {
        const searchTerm = historySearchTerm.toLowerCase();
        return (
          declaration.disease_name.toLowerCase().includes(searchTerm) ||
          declaration.tb_animals?.nme.toLowerCase().includes(searchTerm) ||
          declaration.espece?.toLowerCase().includes(searchTerm) ||
          declaration.wilaya?.toLowerCase().includes(searchTerm)
        );
      });
  }, [declarations, historySearchTerm, historyStatusFilter]);

  const declarationColumns: Column<Declaration>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "created_at",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
        render: (d) => d.created_at.toLocaleDateString("fr-FR"),
      },
      {
        header: "Maladie",
        accessor: "disease_name",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)", fontWeight: "500" },
      },
      {
        header: "Détails de la Déclaration",
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
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center" },
        render: (d) => {
          const statusStyles: Record<string, string> = {
            Suspected: "bg-yellow-100 text-yellow-800",
            Confirmed: "bg-red-100 text-red-800",
            Resolved: "bg-green-100 text-green-800",
          };
          const statusTranslations: Record<string, string> = {
            Suspected: "Suspecté",
            Confirmed: "Confirmé",
            Resolved: "Résolu",
          };
          return (
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[d.status] || "bg-gray-100 text-gray-800"}`}
            >
              {statusTranslations[d.status] || d.status}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Déclarer une Maladie
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Déclaration <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="declarationType"
                    value="specific_animal"
                    checked={declarationType === "specific_animal"}
                    onChange={() => setDeclarationType("specific_animal")}
                    className="form-radio h-4 w-4 text-cyan-600"
                  />
                  <span className="ml-2 text-gray-700">Animal Spécifique</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="declarationType"
                    value="by_type"
                    checked={declarationType === "by_type"}
                    onChange={() => setDeclarationType("by_type")}
                    className="form-radio h-4 w-4 text-cyan-600"
                  />
                  <span className="ml-2 text-gray-700">Par Espèce</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="declarationType"
                    value="by_location"
                    checked={declarationType === "by_location"}
                    onChange={() => setDeclarationType("by_location")}
                    className="form-radio h-4 w-4 text-cyan-600"
                  />
                  <span className="ml-2 text-gray-700">Par Localisation</span>
                </label>
              </div>
            </div>

            {/* Conditional Fields */}
            {declarationType === "specific_animal" && (
              <div>
                <label
                  htmlFor="animal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Animal Concerné <span className="text-red-500">*</span>
                </label>
                <select
                  id="animal"
                  value={selectedAnimal}
                  onChange={(e) => setSelectedAnimal(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                  required
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading
                      ? "Chargement des animaux..."
                      : "Sélectionner un animal"}
                  </option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.nme} ({animal.espece})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {declarationType === "by_type" && (
              <div>
                <label
                  htmlFor="espece"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Espèce Concernée <span className="text-red-500">*</span>
                </label>
                <select
                  id="espece"
                  value={selectedEspece}
                  onChange={(e) => setSelectedEspece(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                  required
                >
                  <option value="">Sélectionner une espèce</option>
                  <option value="Ovin">Ovin</option>
                  <option value="Bovin">Bovin</option>
                  <option value="Caprin">Caprin</option>
                  <option value="Camelin">Camelin</option>
                  <option value="Equin">Equin</option>
                </select>
              </div>
            )}

            {(declarationType === "by_location" ||
              declarationType === "by_type") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wilaya <span className="text-red-500">*</span>
                  </label>
                  <WilayaComboBox
                    value={selectedWilaya}
                    onChange={setSelectedWilaya}
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cité / Commune
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="diseaseName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom de la Maladie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="diseaseName"
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label
                htmlFor="diagnosisDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date du Diagnostic <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="diagnosisDate"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Symptômes Observés
              </label>
              <textarea
                id="symptoms"
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes Supplémentaires
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && (
              <p className="text-green-600 text-sm">{successMessage}</p>
            )}

            <div className="text-right">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {isSaving ? "Déclaration en cours..." : "Déclarer"}
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-md mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Historique des Déclarations
          </h2>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher par maladie, animal, espèce..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            >
              <option value="all">Tous les Statuts</option>
              <option value="Suspected">Suspecté</option>
              <option value="Confirmed">Confirmé</option>
              <option value="Resolved">Résolu</option>
            </select>
          </div>

          <Table
            columns={declarationColumns}
            data={filteredDeclarations}
            isLoading={historyLoading}
            error={null} // Main page error is sufficient
            emptyStateMessage="Aucune déclaration trouvée."
            initialSortColumn="created_at"
          />
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
