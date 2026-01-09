import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import DashboardButton from "../../components/DashboardButton";

export default function AyDroitDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto pb-16"
        style={{
          backgroundImage: "url(/PagesBg/003.jpg)",
          backgroundSize: "full",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Tableau de Bord Ayant Droit
            </h1>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              <DashboardButton
                to="/DeclareAnimalLost"
                icon={<LostAnimalIcon />}
                title="Signaler un Animal Perdu/Trouvé"
                description="Aider à retrouver les animaux perdus en signalant un cas."
              />
            </div>
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}

const LostAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);
