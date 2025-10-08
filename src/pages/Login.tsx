import { useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { PgHeader } from "../components/PgHeader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorr, setError] = useState<string | null>(null);



  // const [EmailVal, setEmailVal] = useState("");
  // const [loading, setLoading] = useState(false);

  const EmailInput = useRef<HTMLInputElement>(null);
  const PassInput = useRef<HTMLInputElement>(null);
  const ForgottenLink = useRef<HTMLAnchorElement>(null);
  const NewUserLink = useRef<HTMLAnchorElement>(null);

  const [ShowPass, SetshowPass] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) { setError(error.message); console.log(errorr) }
    else navigate("/dashboard");
  };

  // return (
  //   <div style={{ maxWidth: 400, margin: "auto" }}>
  //     <h2>Login</h2>
  //     <form onSubmit={handleLogin}>
  //       <input
  //         type="email"
  //         placeholder="Email"
  //         onChange={(e) => setEmail(e.target.value)}
  //         required
  //       />
  //       <input
  //         type="password"
  //         placeholder="Password"
  //         onChange={(e) => setPassword(e.target.value)}
  //         required
  //       />
  //       <button type="submit">Login</button>
  //     </form>
  //     {error && <p style={{ color: "red" }}>{error}</p>}
  //   </div>
  // );

  const HandleTxtChng = () => {
    EmailInput.current?.classList.remove("bg-red-400");
    PassInput.current?.classList.remove("bg-red-400");
    if (ForgottenLink.current) ForgottenLink.current.hidden = true;
    if (NewUserLink.current) NewUserLink.current.hidden = true;

    setEmail(EmailInput.current ? EmailInput.current.value : "");
    setPassword(PassInput.current ? PassInput.current.value : "");
  };

  return (
    <>
      <PgHeader />
      <div className="flex justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          className="bg-stone-500 flex items-center justify-around flex-col h-fit w-fit p-2 rounded-lg"
          onSubmit={handleLogin}
        >
          <ul className="flex flex-col items-end pt-2">
            <li>
              <span>Email : </span>
              <input
                className="m-1 rounded-md text-black pl-1"
                type="email"
                placeholder="Email"
                required={true}
                ref={EmailInput}
                onChange={HandleTxtChng}
              ></input>
            </li>

            <li className="flex flex-row justify-end">
              <span>Mot de passe : </span>
              <input
                ref={PassInput}
                className="m-1 rounded-md text-black pl-1"
                type={ShowPass ? "text" : "password"}
                placeholder="Mot de passe"
                required={false}
                onChange={HandleTxtChng}
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
                  SetshowPass(true);
                  PassInput.current?.focus();
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${ShowPass ? 'hidden' : ''}`}
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
                  SetshowPass(false);
                  PassInput.current?.focus();
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${!ShowPass ? 'hidden' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
            </li>
          </ul>
          <Link
            to={`/Pages/NewUser/${email}`}
            className="text-yellow-400 underline underline-offset-2"
            hidden={true}
            ref={NewUserLink}
          >
            Compte non existe, créer un compte?
          </Link>
          <div className="flex flex-row justify-end items-center w-full">
            <div className="flew flex-col">
              <Link
                to={`/Pages/PassForget/${email}`}
                className="text-red-700 font-semibold underline mr-10"
                hidden={true}
                ref={ForgottenLink}
              >
                Oublié?
              </Link>
              <h1 className="text-green-400 text-sm">  {/*hidden={!loading}> */}
                Vieullez Patienter ..
              </h1>
            </div>

            <button className="bg-cyan-700 outline-white outline-none hover:outline-black hover:text-black rounded-full pr-2 pl-2 m-2 mr-10 w-28">
              Se Connecter
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
