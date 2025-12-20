import PgFooter from "../../components/PgFooter";
// import { PgHeader2 } from "../../components/PgHeader2";
import DashboardButton from "../../components/DashboardButton";

export default function DetentDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      {/* <PgHeader2 /> */}
      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto pb-16"
        style={{
          backgroundImage: "url(/PagesBg/002.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Semi-transparent white overlay */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gestion de mon Animal
            </h1>
            <p className="text-gray-600 mb-8">
              Effectuez des déclarations ou gérez les documents officiels de
              votre animal.
            </p>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              <DashboardButton
                to="/detent/declare-lost"
                icon={<LostAnimalIcon />}
                title="Déclarer Perdu"
                description="Signaler la perte de votre animal pour diffuser une alerte."
              />
              <DashboardButton
                to="/detent/declare-found"
                icon={<FoundAnimalIcon />}
                title="Déclarer Retrouvé"
                description="Indiquer que votre animal a été retrouvé."
              />
              <DashboardButton
                to="/detent/declare-dead"
                icon={<DeadAnimalIcon />}
                title="Déclarer Décès"
                description="Signaler le décès de l'animal aux services concernés."
              />
              <DashboardButton
                to="/detent/print-certificate"
                icon={<PrintIcon />}
                title="Imprimer Certificat"
                description="Télécharger ou imprimer la carte d'identification."
              />
            </div>
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}

// --- SVG Icons ---

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

const DeadAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

const PrintIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" />
    <circle cx="18" cy="11.5" r="1" />
  </svg>
);
