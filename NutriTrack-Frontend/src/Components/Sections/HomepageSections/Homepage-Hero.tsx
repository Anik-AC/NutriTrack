"use client";
import { useState, useContext} from "react";
import { motion } from "framer-motion";
import { HeroPic } from "../../../assets/index.ts";
import {AuthModal} from "../index.ts";
import { UserContext } from "../../../contexts/UserContext.tsx";

export default function HomepageHero() {
  const [openSignUp, setOpenSignUp] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const userContext = useContext(UserContext);
  const loggedUser = userContext?.loggedUser || null;
  return (
    <div className="relative flex justify-center overflow-hidden min-h-screen max-h-screen px-8 pt-10 md:pt-20 bg-[var(--dark-green)]">
      <div className="flex flex-col items-center text-center gap-6 md:gap-8 max-w-6xl max-h-screen overflow-hidden">
        <motion.h1
          className="font-[Deacon,sans-serif] font-extrabold text-[clamp(4rem,10vw,22rem)] leading-[80%] text-[var(--soft-white)]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          NUTRITRACK
        </motion.h1>

        <motion.h2
          className="relative z-[8] font-[Deacon,sans-serif] font-extrabold text-[clamp(4rem,10vw,8rem)] leading-[60%] text-[var(--bright-green)]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          SHAPE YOUR FUTURE
        </motion.h2>

        <motion.p
          className="relative z-[9] max-w-2xl pt-4 text-base md:text-lg leading-[130%] font-[Rubik,sans-serif] font-normal text-[var(--soft-white)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          Take control of your nutrition journey with personalized insights, smart tracking, and expert guidance — all in one place. Whether you're aiming for better health, peak performance, or balanced living, NutriTrack is your companion every step of the way.
        </motion.p>
        {!loggedUser ? (
          <motion.button
            className="relative z-10 rounded-[6px] px-8 py-6 font-[Rubik,sans-serif] font-semibold bg-[var(--bright-green)] text-[var(--dark-green)] hover:bg-[rgb(119,228,110)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            tabIndex={0}
            role="link"
            aria-label="Sign up"
            onClick={() => setOpenSignUp(true)}
          >
            SIGN UP
          </motion.button>
        ) : (
          <motion.button
            className="relative z-10 rounded-[6px] px-8 py-6 font-[Rubik,sans-serif] font-semibold bg-[var(--bright-green)] text-[var(--dark-green)] hover:bg-[rgb(119,228,110)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            tabIndex={0}
            role="link"
            aria-label="Sign up"
          >
            <a href="/dashboard">
              User Dashboard
            </a>
          </motion.button>
        )}
      </div>
      <div className="absolute left-0 bottom-0 z-0 flex w-full overflow-hidden">
        <img
          src={HeroPic}
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </div>
      {/* ✅ Centralized Authentication Modals */}
      <AuthModal
        openSignIn={openSignIn}
        setOpenSignIn={setOpenSignIn}
        openSignUp={openSignUp}
        setOpenSignUp={setOpenSignUp}
      />
    </div>

  );
}
