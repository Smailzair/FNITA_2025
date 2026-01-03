import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2"; // Ensure this path is correct
import DashboardButton from "../../components/DashboardButton";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Tableau de Bord Administrateur
          </h1>
          <div className="flex flex-wrap gap-8 justify-center md:justify-start">
            <DashboardButton
              to="/managevets"
              icon={<UsersIcon />}
              title="Gestion des Utilisateurs"
              description="Gérer les comptes des ayants droit et autres utilisateurs."
            />
            <DashboardButton
              to="/admin/animals"
              icon={<AnimalIcon />}
              title="Gestion des Animaux"
              description="Consulter et gérer les fiches de tous les animaux."
            />
            <DashboardButton
              to="/ownersmanage"
              icon={<OwnerIcon />}
              title="Gestion des Propriétaires"
              description="Consulter et gérer les fiches des propriétaires."
            />
            <DashboardButton
              to="/admin/declarations"
              icon={<ReportDiseaseIcon />}
              title="Gestion des Déclarations"
              description="Suivre et gérer les déclarations de maladies."
            />
            <DashboardButton
              to="/admin/vaccines"
              icon={<VaccineIcon />}
              title="Stock de vaccins"
              description="Gérer la distribution du stock de vaccins par wilaya."
            />
            <DashboardButton
              to="/underdevelopment"
              icon={<LabIcon />}
              title="Laboratoires"
              description=""
            />
            <DashboardButton
              to="/stats"
              icon={<StatsIcon />}
              title="Statistiques"
              description="Visualiser les statistiques et les rapports d'activité."
            />
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}

// --- SVG Icons for the buttons ---

const UsersIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM17 9.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0ZM21.435 22.492A9.502 9.502 0 0 0 12 15a9.502 9.502 0 0 0-9.435 7.492l-.995-1.99a11.5 11.5 0 0 1 20.86 0l-.995 1.99Z" />
  </svg>
);

const StatsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7.5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm9-10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-4.5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
    <path d="M5.1 16a1 1 0 0 0-1.042.93l-1 5A1 1 0 0 0 4 23h16a1 1 0 0 0 .942-1.07l-3-10A1 1 0 0 0 17 11H3a1 1 0 0 0-.942 1.07l2 5A1 1 0 0 0 5.1 16ZM11.5 8a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h7.5a1 1 0 0 0 1-1Z" />
  </svg>
);

const AnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5c-2.42 0-4.5-1.03-4.5-3.5S7.58 7.5 10 7.5s4.5 1.03 4.5 3.5-2.08 6.5-4.5 6.5zm6.5-3.5c0 2.47-2.08 3.5-4.5 3.5s-4.5-1.03-4.5-3.5 2.08-3.5 4.5-3.5 4.5 1.03 4.5 3.5z" />
  </svg>
);

const OwnerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-3.87 0-7 1.79-7 4v2h14v-2c0-2.21-3.13-4-7-4z" />
  </svg>
);

const ReportDiseaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const VaccineIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.95 4.05c-2.25-2.25-5.89-2.25-8.14 0L4.05 11.81c-2.25 2.25-2.25 5.89 0 8.14 2.25 2.25 5.89 2.25 8.14 0l7.76-7.76c2.25-2.25 2.25-5.89 0-8.14zM11 18.17l-5.66-5.66 1.41-1.41 1.41 1.41 1.41-1.41 1.42 1.41 1.41-1.41 1.41 1.41L18.17 13l-7.17 5.17z" />
  </svg>
);

const LabIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 2a.5.5 0 0 1 .5.5V3h2V2.5a.5.5 0 0 1 1 0V3h2.293l-3.427 3.427A6.98 6.98 0 0 1 13 10.83V18h3.5a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1H11v-7.17a6.98 6.98 0 0 1 .134-4.403L7.707 3H10v-.5a.5.5 0 0 1 .5-.5zM8.414 4 11.414 7h1.172l3-3H13v.5a.5.5 0 0 1-1 0V4h-1.586zM12 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-3 5a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"
    />
  </svg>
);
