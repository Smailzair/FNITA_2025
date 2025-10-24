import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";

export default function AyDroitDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-16">
        <h1 className="text-2xl text-black font-bold mb-4">
          Dashboard AyDroit
        </h1>
        <p className="text-gray-600">Welcome to the AyDroit dashboard.</p>
      </main>
      <PgFooter />
    </div>
  );
}
