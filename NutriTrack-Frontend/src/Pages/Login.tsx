import { useState} from "react";
import {Navbar, Footer} from "../Components/Sections";
import { motion } from "framer-motion";
//import styles from "../../style";
//import {SignInDialog, SignUpDialog} from "../Components/Sections/";
import {AuthModal} from "../Components/Sections/";

const Login = () => {
	const [openSignUp, setOpenSignUp] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
	return (
		<div className="w-full min-h-screen flex flex-col">

			{/* ✅ Fixed Navbar */}
			<div className="fixed top-0 left-0 w-full z-50 bg-navbar">
				<Navbar />
			</div>

    <div className="relative flex flex-1 justify-center overflow-hidden bg-[var(--light-beige)] px-8 pt-10 md:pt-20">
      <div className="flex flex-col items-center text-center gap-6 md:gap-8 max-w-6xl overflow-hidden">
      <motion.h1
        className="mt-[5vh] font-[Deacon,sans-serif] font-extrabold text-[clamp(4rem,10vw,22rem)] leading-[80%] text-[var(--dark-green)]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        NUTRITRACK
      </motion.h1>

      <motion.h2
        className="relative z-[8] font-[Deacon,sans-serif] font-extrabold text-[clamp(4rem,5vw,10rem)] leading-[60%] text-[var(--dark-green)]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Sign In to Continue
      </motion.h2>
      <motion.button
        className="relative z-10 mt-[5vh] rounded-[6px] px-8 py-6 font-[Rubik,sans-serif] font-semibold bg-[var(--bright-green)] text-[var(--dark-green)] hover:bg-[rgb(119,228,110)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5}}
        tabIndex={0}
        role="link"
        aria-label="Sign up"
        onClick={() => setOpenSignIn(true)}
      >
        SIGN IN
      </motion.button>

      </div>

      {/* ✅ Centralized Authentication Modals */}
      <AuthModal
        openSignIn={openSignIn}
        setOpenSignIn={setOpenSignIn}
        openSignUp={openSignUp}
        setOpenSignUp={setOpenSignUp}
      />
    </div>

			{/* ✅ Footer stays at bottom */}
			<div className="w-full mt-auto bg-footer">
				<Footer />
			</div>
		</div>
	);
};
export default Login;
