import { useRef, useState } from "react";
import { emailExists, supabase } from "../api/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { PgHeader } from "../components/PgHeader";
import PgFooter from "../components/PgFooter";

export default function Login() {
  // const [errorr, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const EmailInput = useRef<HTMLInputElement>(null);
  const PassInput = useRef<HTMLInputElement>(null);
  const ForgottenLink = useRef<HTMLAnchorElement>(null);
  const NewUserLink = useRef<HTMLAnchorElement>(null);
  const notConfirmedEmail = useRef<HTMLHeadingElement>(null);

  const [ShowPass, SetshowPass] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EmailInput.current || EmailInput.current?.value === "") return;
    setLoading(true);
    //-------- Check if the email exists in the database
    const emailAdressExists = await emailExists(EmailInput.current.value);
    if (!emailAdressExists) {
      if (NewUserLink.current) {
        NewUserLink.current.hidden = false;
        EmailInput.current.classList.add("bg-orange-400");
        EmailInput.current.focus();
      }
      setLoading(false);
      return;
    }
    //---------------------------------------------

    const { error } = await supabase.auth.signInWithPassword({
      email: EmailInput.current.value,
      password: PassInput.current ? PassInput.current.value : "",
    });
    if (error) {
      // setError(error.message);
      if (error.message === "Email not confirmed") {
        // setError("Veuillez confirmer votre e-mail avant de vous connecter.");
        if (EmailInput.current && notConfirmedEmail.current) {
          EmailInput.current.classList.add("bg-orange-400");
          notConfirmedEmail.current.hidden = false;
          EmailInput.current.focus();
        }
      } else if (ForgottenLink.current) {
        ForgottenLink.current.hidden = false;
        if (PassInput.current) {
          PassInput.current.classList.add("bg-red-400");
          PassInput.current.focus();
          PassInput.current.select();
        }
      }
    } else navigate("/dashboard");
    setLoading(false);
  };

  const HandleTxtChng = () => {
    EmailInput.current?.classList.remove("bg-orange-400");
    PassInput.current?.classList.remove("bg-red-400");
    if (ForgottenLink.current) ForgottenLink.current.hidden = true;
    if (NewUserLink.current) NewUserLink.current.hidden = true;
  };

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          className="bg-stone-500 flex items-center justify-around flex-col h-fit w-fit p-2 rounded-lg"
          onSubmit={handleLogin}
        >
          <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-fit">
            Connexion
          </h1>
          <div className="border-t-1 border-gray-400 w-[80%] m-2 " />
          <ul className="flex flex-col items-end pt-2">
            <li>
              <span>Email : </span>
              <input
                className="m-1 rounded-md text-black bg-gray-300 pl-1"
                type="email"
                placeholder="Email"
                required={true}
                ref={EmailInput}
                onChange={HandleTxtChng}
              />
            </li>

            <li className="flex flex-row justify-end">
              <span>Mot de passe : </span>
              <input
                ref={PassInput}
                className="m-1 rounded-md text-black bg-gray-300 pl-1"
                type={ShowPass ? "text" : "password"}
                placeholder="Mot de passe"
                required={true}
                onChange={HandleTxtChng}
              />
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass(true);
                  PassInput.current?.focus();
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${
                  ShowPass ? "hidden" : ""
                }`}
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
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass(false);
                  PassInput.current?.focus();
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${
                  !ShowPass ? "hidden" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
            </li>
          </ul>

          <div className="flex flex-row justify-end items-center w-full">
            <div className="flew flex-col">
              <Link
                to={`/Register${
                  EmailInput.current ? "?email=" + EmailInput.current.value : ""
                }`}
                className="text-yellow-400 text-center text-xs flex font-semibold underline mr-10"
                hidden={true}
                ref={NewUserLink}
              >
                Email non enregistré
                <br />
                créer un compte?
              </Link>
              <Link
                to={`/password_forgot/${
                  EmailInput.current ? EmailInput.current.value : ""
                }`}
                className="text-red-400 text-center text-xs flex font-semibold underline mr-10"
                hidden={true}
                ref={ForgottenLink}
              >
                Mot de passe
                <br />
                oublié?
              </Link>
              <h1
                className="text-orange-400 text-center text-xs flex font-semibold underline mr-10"
                hidden={true}
                ref={notConfirmedEmail}
              >
                Veuillez confirmer votre e-mail
                <br />
                avant de vous connecter.
              </h1>
            </div>

            <button
              className="flex flex-row justify-center items-center bg-cyan-700 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-2 mt-2 mr-10 w-inherit"
              type="submit"
              disabled={loading}
            >
              Se Connecter
              {loading && (
                <div className="ml-2 animate-spin h-7 w-7 border-2 border-t-blue-500 border-gray-200 rounded-full mx-auto" />
              )}
            </button>
          </div>
        </form>
      </div>
      <PgFooter />
    </div>
  );
}
