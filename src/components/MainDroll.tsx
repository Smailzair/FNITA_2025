import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

export const MainDroll = () => {
  return createPortal(
    <div className="fixed top-14 right-5 z-50">
      <div
        className="w-40 origin-top-right rounded-md bg-gray-600 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-white"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        <div className="py-1" role="none">
          <Link
            to="/Login"
            className="flex items-center hover:bg-gray-700 px-4 py-2 text-sm gap-2"
            role="menuitem"
            id="menu-item-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 ml-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Login
          </Link>
          <Link
            to="/Register"
            className="flex items-center hover:bg-gray-700 px-4 py-2 text-sm gap-2"
            role="menuitem"
            id="menu-item-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 ml-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
            Nouveau
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
};
