import { useRef, useState, type FormEvent } from "react";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";
import SearchDropdown from "../components/SearchDropdown";

export default function Register() {
  const [loading, setLoading] = useState(false);

  const EmailInput = useRef<HTMLInputElement | null>(null);
  const PassInput = useRef<HTMLInputElement | null>(null);
  const PassInput2 = useRef<HTMLInputElement | null>(null);

  const [FamnmeInput_val, setFamnmeInputVal] = useState("");
  const [NmeInput_val, setNmeInputVal] = useState("");
  const [EmailInput_val, setEmailInputVal] = useState("");
  const [PassInput_val, setPassInputVal] = useState("");
  const [PassInput2_val, setPassInput2Val] = useState("");
  const [TelNum_val, setTelNumVal] = useState("");
  const [Addr_val, setAddrVal] = useState("");
  const [Cityy_val, setCityyVal] = useState("");
  const [CNI_val, setCNIVal] = useState("");
  const [ANV_val, setANVVal] = useState("");

  const [ShowPass, SetshowPass] = useState(true);
  const [ShowPass2, SetshowPass2] = useState(true);
  const [SelectedRadio, setSelectedRadio] = useState("Vétérinaire");
  const [SelectedWilaya, setSelectedWilaya] = useState<string | null>(null);

  const CptExist = useRef<HTMLLabelElement | null>(null);

  const options = [
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
  function HandleSubmit(event: FormEvent<HTMLFormElement>): void {
    console.log("ok");
    setLoading(true);
    event.preventDefault();
    console.log(
      FamnmeInput_val,
      NmeInput_val,
      EmailInput_val,
      PassInput_val,
      PassInput2_val,
      TelNum_val
    );
    console.log(
      Addr_val,
      Cityy_val,
      CNI_val,
      ANV_val,
      SelectedWilaya,
      SelectedRadio
    );
    setLoading(false);
  }

  function HandleTxtChng() {
    console.log("ok");
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          className="bg-stone-500 flex flex-row flex-wrap items-center justify-center p-2 rounded-lg min-w-80 max-w-2xl"
          onSubmit={HandleSubmit}
        >
          <h1 className="text-slate-300 text-center items-center w-fit text-2xl font-bold mb-4">
            Nouveau utilisateur
          </h1>
          <div className="row flex w-full justify-center items-center space-x-3">
            <label>
              <input
                type="radio"
                value="Vétérinaire"
                checked={SelectedRadio === "Vétérinaire"}
                onChange={() => setSelectedRadio("Vétérinaire")}
                className="mr-1"
              ></input>
              Vétérinaire
            </label>
            <label>
              <input
                type="radio"
                value="Ayant-Droit"
                checked={SelectedRadio === "Ayant-Droit"}
                onChange={() => setSelectedRadio("Ayant-Droit")}
                className="mr-1"
              ></input>
              Ayant-Droit
            </label>
            <label>
              <input
                type="radio"
                value="Propriétaire"
                checked={SelectedRadio === "Propriétaire"}
                onChange={() => setSelectedRadio("Propriétaire")}
                className="mr-1"
              ></input>
              Propriétaire
            </label>
          </div>
          <div className="border-t-0 border-2 border-gray-400 w-full m-2"></div>

          {/* --------------------------Proprietaire -------------------------- */}
          <div className="flex flex-wrap justify-center">
            <label className="flex w-72 items-center justify-end">
              Nom :
              <input
                className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                type="text"
                placeholder="Nom"
                // ref={FamnmeInput}
                required={true}
                onChange={(ee) => setFamnmeInputVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label className="flex w-72 items-center justify-end">
              Prénom :
              <input
                className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                type="text"
                placeholder="Prénom"
                required={true}
                //ref={NmeInput}
                onChange={(ee) => setNmeInputVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label className="flex w-72 items-center justify-end">
              N° Tél :
              <input
                className="m-1 rounded-md text-black pl-1 w-30"
                type="text"
                placeholder="N° Tél"
                //ref={TelNum}
                onChange={(ee) => setTelNumVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label className="flex w-72 items-center justify-end">
              Wilaya :
              <SearchDropdown
                options={options}
                placeholder={"Wilaya"}
                handleChangetoparent={(SelectedWilaya) => {
                  setSelectedWilaya(SelectedWilaya);
                }}
              />
            </label>
            <label className="flex w-72 items-center justify-end">
              Cité :
              <input
                className="m-1 rounded-md text-black pl-1 w-30"
                type="text"
                placeholder="Cité"
                //ref={Cityy}
                onChange={(ee) => setCityyVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label className="flex w-72 items-center justify-end">
              Adresse :
              <input
                className="m-1 rounded-md text-black pl-1 w-30"
                type="text"
                placeholder="Adresse"
                //ref={Addr}
                onChange={(ee) => setAddrVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label className="flex w-72 items-center justify-end">
              N° CNI :
              <input
                className="m-1 rounded-md text-black pl-1 w-30"
                type="text"
                placeholder="N° Carte Nationale d'Identité"
                //ref={CNI}
                onChange={(ee) => setCNIVal(ee.currentTarget.value)}
              ></input>
            </label>
            <label
              className={
                "flex w-72 items-center justify-end " +
                (SelectedRadio === "Vétérinaire" ? "visible" : "invisible")
              }
            >
              ANV :
              <input
                className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                type="text"
                placeholder="Code Autorité Vétérinaire Nationale"
                //ref={ANV}
                onChange={(ee) => setANVVal(ee.currentTarget.value)}
                required={SelectedRadio === "Vétérinaire"}
              ></input>
            </label>
          </div>
          {/* -------------------------------------------------------- */}
          <div className="border-t-2 border-gray-400 w-full m-2"></div>
          <div className="flex flex-wrap justify-center">
            <div className="flex flex-col items-center justify-center">
              <label className="flex w-72 items-center justify-end">
                Email :
                <input
                  className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                  type="email"
                  placeholder="Email"
                  required={true}
                  ref={EmailInput}
                  onChange={(ee) => {
                    setEmailInputVal(ee.currentTarget.value);
                    HandleTxtChng();
                  }}
                ></input>
              </label>
              <label
                className="w-72 items-center justify-end pr-6 text-sm text-red-400 hidden"
                ref={CptExist}
              >
                Compte déja existe.
              </label>
            </div>

            <div>
              <label className="flex w-72 items-center justify-end">
                Mot de passe :
                <input
                  className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                  type={ShowPass ? "password" : "text"}
                  placeholder="Mot de passe"
                  required={true}
                  //ref={PassInput}
                  onChange={(ee) => setPassInputVal(ee.currentTarget.value)}
                ></input>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  onClick={() => {
                    SetshowPass(false);
                    PassInput.current?.focus();
                  }}
                  style={{ display: ShowPass ? "block" : "none" }}
                  className="mt-1 mr-1 absolute text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  onClick={() => {
                    SetshowPass(true);
                    PassInput.current?.focus();
                  }}
                  style={{ display: ShowPass ? "none" : "block" }}
                  className="mt-1 mr-1 absolute text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  ></path>
                </svg>
              </label>

              <label className="flex w-72 items-center justify-end">
                Confirmer :
                <input
                  className="m-1 rounded-md text-black pl-1 w-30 bg-orange-200"
                  type={ShowPass2 ? "password" : "text"}
                  placeholder="Confirmer"
                  required={true}
                  //ref={PassInput2}
                  onChange={(ee) => setPassInput2Val(ee.currentTarget.value)}
                ></input>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  onClick={() => {
                    SetshowPass2(false);
                    PassInput2.current?.focus();
                  }}
                  style={{ display: ShowPass2 ? "block" : "none" }}
                  className="mt-1 mr-1 absolute text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  onClick={() => {
                    SetshowPass2(true);
                    PassInput2.current?.focus();
                  }}
                  style={{ display: ShowPass2 ? "none" : "block" }}
                  className="mt-1 mr-1 absolute text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  ></path>
                </svg>
              </label>
            </div>
          </div>
          <div className="border-t-2 border-gray-400 w-full m-2"></div>
          <div className="flex w-full items-center">
            <label className="w-fit text-xs h-4 bg-orange-200 text-orange-200 border-slate-800 rounded-lg mr-1 justify-center items-center">
              ***
            </label>
            <label className="text-white w-fit text-xs justify-center items-center">
              Champs obligés
            </label>
            <h1 className="text-green-400 text-sm pl-24" hidden={!loading}>
              Vieullez Patienter ..
            </h1>
          </div>

          <div className="row w-full flex justify-center ">
            <button
              type="submit"
              className="bg-green-800 text-white outline-white outline-none hover:outline-black hover:text-black rounded-full pr-2 pl-2 m-2 mr-10 w-28"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
      <PgFooter />
    </div>
  );
}
