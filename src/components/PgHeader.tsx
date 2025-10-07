// import Link from "next/link";
// import React, { useEffect, useState } from "react";
// import { MainDroll } from "./MainDroll";
// import Cookies from "js-cookie";
// import Image from "next/image";

import { Link } from "react-router-dom";

// export const PgHeader2 = () => {
//   //const [Drollmenue, Setdrollmenue] = useState(false);
//   return (
//     <nav className="bg-teal-900">
//       <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
//         <div className="relative flex h-20 items-center justify-between">
//           <div className="flex flex-grow items-center justify-center sm:justify-star">
//             <div className="items-center min-w-fit">
// <Link href={".."}>
//   <Image
//     width={360}
//     height={360}
//     className="h-16 w-16 min-w-full"
//     src="/LOGO_ALG.png"
//     alt="LOGO_ALG"
//   />
// </Link>
//             </div>
// <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
//   <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
//     République algérienne démocratique et populaire
//     <br />
//     Ministère de l&apos;Agriculture et du Développement Rural
//     <br />
//     Fichier National d&apos;Identification et Traçabilité Animale
//   </p>
// </div>
// <div className="absolute inset-y-0 right-0 flex items-center pr-2 max-sm:hidden min-w-fit">
//   <Link href={"/Pages/NewUser"}>
//     <button
//       type="button"
//       className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white hover:outline hover:outline-3 hover:outline-gray-800"
//     >
//       <svg
//         className="w-9 h-9"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth={1}
//         viewBox="0 0 24 24"
//         xmlns="http://www.w3.org/2000/svg"
//         aria-hidden="true"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
//         />
//       </svg>
//     </button>
//   </Link>
//   <Link href={"/Pages/Login"}>
//     <button
//       type="button"
//       className="ml-1 relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white hover:outline hover:outline-3 hover:outline-gray-800"
//     >
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         fill="none"
//         viewBox="0 0 24 24"
//         //strokeWidth="1"
//         stroke="currentColor"
//         className="w-10 h-10"
//       >
//         <path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
//       </svg>
//     </button>
//   </Link>
// </div>

//             <div className="min-md:block inset-y-0 right-0 flex items-center pr-2">
//               <button
//                 type="button"
//                 className="rounded-full bg-gray-800 p-1 text-gray-400  hover:text-white hover:outline hover:outline-3 hover:outline-gray-800"
//                 // onMouseEnter={() => Setdrollmenue(true)}
//                 // onClick={() => Setdrollmenue(!Drollmenue)}
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   //strokeWidth="1.5"
//                   stroke="currentColor"
//                   className="w-6 h-6"
//                 >
//                   <path d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
//                 </svg>
//               </button>
//             </div>
//             {/* <div
//               className="float-right"
//               onMouseLeave={() => Setdrollmenue(false)}
//             >
//               {Drollmenue && <MainDroll />}
//             </div> */}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

export const PgHeader = () => {
  return (
    <nav className="bg-teal-900">
      <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
        <div className="relative flex h-20 items-center justify-between">
          <div className="flex flex-grow items-center justify-center sm:justify-star">
            <div className="items-center min-w-fit">
              <Link to={".."}>
                <img
                  src="/LOGO_ALG.png"
                  alt="LOGO_ALG"
                  width={360}
                  height={360}
                  className="h-16 w-16 min-w-full"
                />
              </Link>
            </div>
            <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
              <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
                République algérienne démocratique et populaire
                <br />
                Ministère de l&apos;Agriculture et du Développement Rural
                <br />
                Fichier National d&apos;Identification et Traçabilité Animale
              </p>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 max-sm:hidden min-w-fit">
              <Link to={"/Pages/NewUser"}>
                <img
                  src="/icons/021.svg"
                  className="h-11 w-11 bg-transparent p-1 text-gray-400 hover:text-white hover:outline-3 hover:outline-gray-800 rounded-full"
                />
              </Link>
              <Link to={"/Pages/Login"}>
                <button
                  type="button"
                  className="ml-1 relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white hover:outline hover:outline-3 hover:outline-gray-800"
                >
                  <span className="material-icons-outlined"></span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
