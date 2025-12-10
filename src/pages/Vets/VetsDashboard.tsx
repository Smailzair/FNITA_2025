import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import DashboardButton from "../../components/DashboardButton";

export default function VetsDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto pb-16"
        // To make the background more "HD", replace '/PagesBg/001.jpg' with a higher resolution image.
        style={{
          backgroundImage: "url(/PagesBg/001.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Semi-transparent white overlay for better content readability */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Tableau de Bord Vétérinaire
            </h1>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              <DashboardButton
                to="/ownersmanage"
                icon={<OwnerIcon />}
                title="Gestion des Propriétaires"
                description="Consulter et gérer les fiches des propriétaires."
              />
              <DashboardButton
                to="/animalsmanage"
                icon={<AnimalIcon />}
                title="Gestion des Animaux"
                description="Consulter, ajouter ou modifier les fiches des animaux."
              />
              <DashboardButton
                to="/vets/declarer-maladie"
                icon={<ReportDiseaseIcon />}
                title="Déclarer une Maladie"
                description="Signaler les cas de maladies à déclaration obligatoire."
              />
              <DashboardButton
                to="/DeclareAnimalLost"
                icon={<LostAnimalIcon />}
                title="Signaler un Animal Perdu"
                description="Aider à retrouver les animaux perdus en signalant un cas."
              />
              <DashboardButton
                to="/vets/animal-trouve"
                icon={<FoundAnimalIcon />}
                title="Signaler un Animal Trouvé"
                description="Enregistrer un animal trouvé pour retrouver son propriétaire."
              />
            </div>
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}

// --- SVG Icons for the buttons ---

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

const LostAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const FoundAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
);
