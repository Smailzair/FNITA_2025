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
                to="/animalsmanage"
                icon={<AnimalIcon />}
                title="Gestion des Animaux"
                description="Consulter, ajouter ou modifier les fiches des animaux."
              />
              <DashboardButton
                to="/ownersmanage"
                icon={<OwnerIcon />}
                title="Gestion des Propriétaires"
                description="Consulter et gérer les fiches des propriétaires."
              />
              <DashboardButton
                to="/vets/vaccinations"
                icon={<VaccineIcon />}
                title="Carnets de Vaccination"
                description="Gérer les historiques de vaccination et les rappels."
              />
              <DashboardButton
                to="/vets/rendez-vous"
                icon={<CalendarIcon />}
                title="Visites & Rendez-vous"
                description="Planifier et gérer le calendrier des consultations."
              />
              <DashboardButton
                to="/vets/laboratoire"
                icon={<LabIcon />}
                title="Gestion de Laboratoire"
                description="Suivre les analyses et les résultats de laboratoire."
              />
              <DashboardButton
                to="/vets/declarer-maladie"
                icon={<ReportDiseaseIcon />}
                title="Déclarer une Maladie"
                description="Signaler les cas de maladies à déclaration obligatoire."
              />
              <DashboardButton
                to="/vets/animal-perdu"
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
              <DashboardButton
                to="/vets/stock"
                icon={<StockIcon />}
                title="Gestion des Stocks"
                description="Suivre les médicaments et le matériel disponible."
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

const VaccineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM5.88 21l-1.06-1.06 14.14-14.14 1.06 1.06L5.88 21zM12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
  </svg>
);

const LabIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 8c-1.54 0-2.94.81-3.75 2.03C11.94 8.81 10.54 8 9 8c-2.21 0-4 1.79-4 4s1.79 4 4 4c1.54 0 2.94-.81 3.75-2.03C13.56 17.19 14.96 18 16.5 18c2.21 0 4-1.79 4-4s-1.79-4-4-4zm-7.5 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.5 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
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

const StockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H9v-4h6v4zm0-6H9V8h6v4z" />
  </svg>
);
