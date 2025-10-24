import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";

export default function Dashboard() {
  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader2 />
      <div style={{ maxWidth: 400, margin: "auto" }}>
        <h2>Bienvenue !</h2>
        <p>(en train de developper)</p>
      </div>
      <PgFooter />
    </div>
  );
}
