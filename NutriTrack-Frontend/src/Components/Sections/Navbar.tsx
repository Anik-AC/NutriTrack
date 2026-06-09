'use client'
import { useState, useContext, FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu as MenuIcon, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { logo } from "../../assets";
import { navLinks } from "../../Constants";

import {AuthModal} from "../../Components/Sections/";
import { UserContext } from "../../contexts/UserContext";
import { useDisclosure } from "../../hooks/use-disclosure";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { GrPowerShutdown } from "react-icons/gr";
import { RiAccountCircleFill } from "react-icons/ri";
import { RxDashboard } from "react-icons/rx";

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure()
  const [openSignUp, setOpenSignUp] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const userContext = useContext(UserContext);
  const loggedUser = userContext?.loggedUser || null;
  const logout = userContext?.logout || (() => {});

  return (
    <div>
      <div className="min-h-[60px] py-4 px-5 items-center justify-between hidden lg:flex">
          <div className="flex flex-1 justify-start">
            <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src={logo} alt="NutriTrack" className="w-[170px] h-[32px]" />
            </a>
          </div>

          <div className="flex flex-[2] mx-10 justify-center">
              <DesktopNav />
          </div>
          <div className="flex flex-row flex-1 justify-end gap-6">
            {!loggedUser ? (
            <>
              <button
                type="button"
                tabIndex={0}
                aria-label="Sign in to your account"
                className="text-[15px] font-[Rubik,sans-serif] font-semibold text-[var(--off-white)] bg-[var(--dark-green)] px-[16px] py-[12px] border border-[rgba(243,237,228,0.5)] rounded-[6px] hover:bg-[rgba(18,35,21,0.8)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
                onClick={() => setOpenSignIn(true)}>
                SIGN IN
              </button>
              <button
                type="button"
                tabIndex={0}
                aria-label="Sign up"
                className="text-[15px] font-[Rubik,sans-serif] font-semibold text-[var(--dark-green)] bg-[var(--bright-green)] px-[16px] py-[9px] rounded-[6px] hover:bg-[rgba(84,221,72,0.8)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
                onClick={() => setOpenSignUp(true)}>
                SIGN UP
              </button>
              </>
          ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label="User Avatar"
                    className="bg-transparent px-[16px] py-[12px] hover:bg-transparent"
                  >
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-[var(--bright-green)] text-[var(--dark-green)] font-semibold">
                        {getInitials(loggedUser?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a
                      href="/dashboard"
                      aria-label="Go to User Dashboard"
                      className="text-[14px] font-[Rubik,sans-serif] font-normal cursor-pointer"
                    >
                      <RxDashboard className="w-[25px] h-[25px] mr-[10px]" />
                      Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/dashboard"
                      aria-label="Go to User Account Details"
                      className="text-[14px] font-[Rubik,sans-serif] font-normal cursor-pointer"
                    >
                      <RiAccountCircleFill className="w-[25px] h-[25px] mr-[10px]" />
                      My Account
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    aria-label="Sign Out"
                    className="text-[14px] font-[Rubik,sans-serif] font-normal cursor-pointer"
                  >
                    <GrPowerShutdown className="w-[25px] h-[25px] mr-[10px]" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )}
          </div>
      </div>
      {/* Mobile Menu */}
      <div className="min-h-[60px] py-4 px-5 items-center justify-between flex lg:hidden">
          <div className="flex flex-1" />
          <div className="flex flex-1 justify-center">
              <img src={logo} alt="NutriTrack" className="w-[124px] h-[32px]" />
          </div>
          <div className="flex flex-1 justify-end px-2 items-center">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Toggle Navigation"
              className="flex items-center justify-center w-[50px] h-[50px] rounded-full bg-[var(--bright-green)] hover:bg-[rgba(84,221,72,0.8)]"
            >
              {isOpen
                ? <X className="w-4 h-4 text-[var(--dark-green)]" />
                : <MenuIcon className="w-6 h-6 text-[var(--dark-green)]" />}
            </button>
          </div>
      </div>
      {/* Mobile Nav */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <MobileNav loggedUser={loggedUser} logout={logout} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ✅ Centralized Authentication Modals */}
      <AuthModal
        openSignIn={openSignIn}
        setOpenSignIn={setOpenSignIn}
        openSignUp={openSignUp}
        setOpenSignUp={setOpenSignUp}
      />

    </div>
  )
}

const DesktopNav = () => {
  const location = useLocation();

  return (
    <div className="flex flex-row items-center gap-5">
      {navLinks.map((nav) => {
        const isActive = location.pathname === `/${nav.id}` || (location.pathname === "/" && nav.id === "home");

        return (
          <a key={nav.id} href={`/${nav.id}`} style={{ textDecoration: 'none' }}>
            <span
              className={`relative inline-flex items-center justify-center rounded-md px-3 py-2 text-[15px] font-[Rubik,sans-serif] text-[var(--soft-white)] hover:text-white hover:bg-white/10 text-center after:content-[''] after:absolute after:w-full after:h-[2px] after:bottom-[1px] after:left-0 after:transition-colors ${isActive ? 'after:bg-[var(--bright-green)]' : 'after:bg-transparent'}`}
            >
              {nav.title}
            </span>
          </a>
        );
      })}
    </div>
  );
};
interface MobileNavProps {
  loggedUser: any | null;
  logout: () => void;
}
const MobileNav: FC<MobileNavProps> = ({ loggedUser, logout }) => {
  const [openSignUp, setOpenSignUp] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const mobileItemClasses =
    "font-semibold text-[var(--soft-white)] font-[Rubik,sans-serif] text-[15px] uppercase text-center py-2 cursor-pointer";
  return (
    <div className="flex flex-col items-center gap-5 p-4 lg:hidden">
      {navLinks.map((nav) => (
        <a
          key={nav.id}
          href={nav.id ?? '#'}
          className="block py-2 w-full text-center hover:no-underline"
        >
          <span className={mobileItemClasses}>
            {nav.title}
          </span>
        </a>
      ))}

      {!loggedUser ? (
      <>
        <span className={mobileItemClasses} role="button" tabIndex={0} onClick={() => setOpenSignIn(true)}>
          SIGN IN
        </span>
        <span className={mobileItemClasses} role="button" tabIndex={0} onClick={() => setOpenSignUp(true)}>
          SIGN UP
        </span>
      </>
      ) : (
      <>
          <span className={mobileItemClasses}>
            <a href="/dashboard" style={{ alignItems: 'center' }}>
              Profile
            </a>
          </span>
          <span className={mobileItemClasses} role="button" tabIndex={0} onClick={logout}>
            LOG OUT
          </span>
      </>
      )}

      {/* ✅ Centralized Authentication Modals */}
      <AuthModal
        openSignIn={openSignIn}
        setOpenSignIn={setOpenSignIn}
        openSignUp={openSignUp}
        setOpenSignUp={setOpenSignUp}
      />
    </div>

  )
}
