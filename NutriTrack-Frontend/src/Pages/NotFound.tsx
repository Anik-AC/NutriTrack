import {Navbar, Footer} from "../Components/Sections";
import { error } from "../assets/index";

export default function NotFoundPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
		<div className="fixed top-0 left-0 w-full z-50 bg-navbar">
      <Navbar />
    </div>
    <div className="flex flex-1 items-center justify-center bg-[var(--light-beige)] px-6">
      {/* Left Image (Slot Machine 404) */}
      <div className="flex flex-1 justify-center">
        <img
          src={error}
          alt="404 Error Slot Machine"
          className="max-w-[300px]"
        />
      </div>

      {/* Right Text Section */}
      <div className="flex-1 text-center">
        <p className="text-2xl font-bold text-gray-800">
          Uh oh. That page doesn't exist.
        </p>
        <p className="text-lg text-gray-600 mt-2">
          Head to our{" "}
          <a href="/" className="text-blue-500 underline">
            homepage
          </a>{" "}
          that does exist!
        </p>
        <button
          type="button"
          tabIndex={0}
          aria-label="Home"
          className="mt-6 rounded-[6px] px-[16px] py-[9px] text-[15px] font-[Rubik,sans-serif] font-semibold text-[var(--light-beige)] bg-[var(--dark-green)] hover:[outline:2px_solid_var(--bright-green)] hover:outline-offset-2 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
          onClick={() => window.location.href = "/"}
        >
          Home
        </button>
      </div>
    </div>
    <div className="w-full mt-auto bg-footer">
				<Footer />
			</div>
		</div>
  );
}
