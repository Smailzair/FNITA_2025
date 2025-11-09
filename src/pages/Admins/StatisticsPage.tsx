import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// A component for a single statistic card
const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center print:shadow-none print:border print:border-gray-300">
    <div className="bg-cyan-500 text-white p-3 rounded-full mr-4 print:hidden">
      {icon}
    </div>
    <div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

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

type Wilaya = {
  name: string;
};

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalUsers: 0,
    animalsBySpecies: [] as { espece: string; count: number }[],
  });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    wilaya: "all",
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // We need to fetch the owner's wilaya to filter by it.
      let animalsQuery = supabase
        .from("tb_animals")
        .select("id, espece, created_at, propr_id!inner(wilaya)");
      let usersQuery = supabase
        .from("tb_login")
        .select("id", { count: "exact", head: true });

      if (filters.startDate) {
        animalsQuery = animalsQuery.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        // Add 1 day to endDate to include the whole day
        const nextDay = new Date(filters.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        animalsQuery = animalsQuery.lt(
          "created_at",
          nextDay.toISOString().split("T")[0]
        );
      }
      if (filters.wilaya !== "all") {
        animalsQuery = animalsQuery.eq("propr_id.wilaya", filters.wilaya);
        usersQuery = usersQuery.eq("wilaya", filters.wilaya);
      }

      const [
        { data: animalsData, error: animalsError },
        { count: totalUsers, error: usersError },
      ] = await Promise.all([animalsQuery, usersQuery]);

      if (animalsError) throw animalsError;
      if (usersError) throw usersError;

      const speciesCounts: Record<string, number> = {};
      for (const { espece } of (animalsData as any[]) || []) {
        if (espece) {
          speciesCounts[espece] = (speciesCounts[espece] || 0) + 1;
        }
      }
      const animalsBySpecies = Object.entries(speciesCounts)
        .map(([espece, count]) => ({ espece, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalAnimals: animalsData?.length || 0,
        totalUsers: totalUsers || 0,
        animalsBySpecies,
      });
    } catch (err: any) {
      setError("Impossible de charger les statistiques.");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchWilayas = useCallback(async () => {
    // Use the full static list of wilayas for the filter
    const allWilayas = ALGERIAN_WILAYAS.map((w) => ({
      name: w,
    }));
    setWilayas(allWilayas);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWilayas();
  }, [fetchStats, fetchWilayas]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-2">
        <div className="max-w-7xl mx-auto" id="report-content">
          <div className="print:block hidden mb-4">
            <div className="flex items-center justify-between">
              <img src="/logo.png" alt="Logo" className="h-16" />
              <div className="text-right">
                <h1 className="text-2xl font-bold">
                  Rapport Statistique
                  {filters.wilaya !== "all" && ` - Wilaya de ${filters.wilaya}`}
                </h1>
                <p>Généré le: {new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <hr className="my-4" />
          </div>
          <div className="flex justify-between items-center mb-8 print:mb-4">
            <h1 className="text-3xl font-bold text-gray-800 print:hidden">
              Statistiques et Rapports
            </h1>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-full print:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                  clipRule="evenodd"
                />
              </svg>
              Imprimer le Rapport
            </button>
          </div>

          {loading && <p>Chargement des statistiques...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 print:hidden">
            <fieldset className="flex flex-wrap items-end gap-4">
              <legend className="text-lg font-medium text-gray-800 mb-2">
                Filtres
              </legend>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date de début
                </label>
                <div className="relative">
                  <input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="mt-1 p-2 border rounded-md w-full text-gray-900 appearance-none"
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
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date de fin
                </label>
                <div className="relative">
                  <input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="mt-1 p-2 border rounded-md w-full text-gray-900 appearance-none"
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
                  htmlFor="wilaya"
                  className="block text-sm font-medium text-gray-700"
                >
                  Wilaya
                </label>
                <select
                  id="wilaya"
                  value={filters.wilaya}
                  onChange={(e) =>
                    setFilters({ ...filters, wilaya: e.target.value })
                  }
                  className="mt-1 p-2 border rounded-md w-full text-gray-900"
                >
                  <option value="all">Toutes les Wilayas</option>
                  {wilayas.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          </div>

          {!loading && !error && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Nombre total d'animaux"
                  value={stats.totalAnimals}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.5 10.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM8.5 10.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM12 14c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  }
                />
                <StatCard
                  title="Nombre total d'utilisateurs"
                  value={stats.totalUsers}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-2.377M12 6a3 3 0 11-6 0 3 3 0 016 0zm-2 9a5 5 0 00-4.546 2.916"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none print:border print:border-gray-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Répartition par Espèce
                </h2>
                {stats.animalsBySpecies.length > 0 ? (
                  <Bar
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top" as const,
                        },
                        title: {
                          display: true,
                          text: "Nombre d'animaux par espèce",
                        },
                      },
                    }}
                    data={{
                      labels: stats.animalsBySpecies.map((s) => s.espece),
                      datasets: [
                        {
                          label: "Nombre d'animaux",
                          data: stats.animalsBySpecies.map((s) => s.count),
                          backgroundColor: "rgba(34, 211, 238, 0.6)",
                        },
                      ],
                    }}
                  />
                ) : (
                  <p>Aucune donnée à afficher pour la période sélectionnée.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
