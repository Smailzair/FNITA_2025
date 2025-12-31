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
    totalVets: 0,
    totalAyantsDroit: 0,
    totalAdmins: 0,
    animalsBySpecies: [] as { espece: string; count: number }[],
  });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: getInitialStartDate(),
    endDate: getInitialEndDate(),
    wilaya: "all",
  });

  function getInitialStartDate() {
    const today = new Date();
    const lastYear = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );
    return lastYear.toISOString().split("T")[0];
  }
  function getInitialEndDate() {
    return new Date().toISOString().split("T")[0];
  }
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
      let vetsQuery = supabase
        .from("tb_login")
        .select("id", { count: "exact", head: true })
        .eq("type", "Vétérinaire");
      let ayantsDroitQuery = supabase
        .from("tb_login")
        .select("id", { count: "exact", head: true })
        .eq("type", "Ayant droit");
      let adminsQuery = supabase
        .from("tb_login")
        .select("id", { count: "exact", head: true })
        .eq("type", "Administrateur");

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
        vetsQuery = vetsQuery.eq("wilaya", filters.wilaya);
        ayantsDroitQuery = ayantsDroitQuery.eq("wilaya", filters.wilaya);
        adminsQuery = adminsQuery.eq("wilaya", filters.wilaya);
      }

      const [
        { data: animalsData, error: animalsError },
        { count: totalUsers, error: usersError },
        { count: totalVets, error: vetsError },
        { count: totalAyantsDroit, error: ayantsDroitError },
        { count: totalAdmins, error: adminsError },
      ] = await Promise.all([
        animalsQuery,
        usersQuery,
        vetsQuery,
        ayantsDroitQuery,
        adminsQuery,
      ]);

      if (animalsError) throw animalsError;
      if (usersError) throw usersError;
      if (vetsError || ayantsDroitError || adminsError)
        throw new Error("Failed to fetch user role counts.");

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
        totalVets: totalVets || 0,
        totalAyantsDroit: totalAyantsDroit || 0,
        totalAdmins: totalAdmins || 0,
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
    <div className="flex flex-col w-screen h-screen bg-gray-50 print:h-auto print:bg-white">
      <div className="print:hidden">
        <PgHeader2 />
      </div>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto print:overflow-visible print:p-2">
        <div className="max-w-7xl mx-auto" id="report-content">
          {/* --- Professional Print Header --- */}
          <div className="print:block hidden mb-8">
            <div className="flex items-center justify-between border-b-2 border-gray-700 pb-4">
              <div className="flex items-center">
                <img
                  src="/LOGO_ALG.png"
                  alt="Logo"
                  className="h-20 w-20 mr-4"
                />
                <div>
                  <p className="font-bold text-gray-800">
                    République Algérienne Démocratique et Populaire
                  </p>
                  <p className="text-sm text-gray-700">
                    Ministère de l'Agriculture et du Développement Rural
                  </p>
                  <p className="text-xs text-gray-600">
                    Fichier National d'Identification et Traçabilité Animale
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-800">
                  Rapport Statistique
                </h1>
                <p className="text-sm text-gray-600">
                  {filters.wilaya !== "all"
                    ? `Wilaya de ${filters.wilaya}`
                    : "Toutes les Wilayas"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">
              Généré le: {new Date().toLocaleDateString("fr-FR")}
            </p>
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
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      if (filters.endDate && newStartDate > filters.endDate) {
                        setFilters({
                          ...filters,
                          startDate: newStartDate,
                          endDate: newStartDate,
                        });
                      } else {
                        setFilters({ ...filters, startDate: newStartDate });
                      }
                    }}
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
                    min={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="mt-1 p-2 border rounded-md w-full text-gray-900 appearance-none disabled:bg-gray-200"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
                <StatCard
                  title="Nombre de Vétérinaires"
                  value={stats.totalVets}
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                />
                <StatCard
                  title="Nombre d'Ayants Droit"
                  value={stats.totalAyantsDroit}
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
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.246.99-4.659.99-7.132A8 8 0 008 4a8 8 0 00-8 8c0 1.431.376 2.786 1.037 3.969"
                      />
                    </svg>
                  }
                />
                <StatCard
                  title="Nombre d'Administrateurs"
                  value={stats.totalAdmins}
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
        {/* --- Print Footer --- */}
        <div className="print:block hidden text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          Rapport généré par le Fichier National d'Identification et Traçabilité
          Animale - RancoSoft™
        </div>
      </main>
      <div className="print:hidden">
        <PgFooter />
      </div>
    </div>
  );
}
