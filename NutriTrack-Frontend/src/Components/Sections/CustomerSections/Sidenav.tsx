'use client'
import { useContext } from "react";
import {
  FiMenu,
  FiBell,
  FiChevronDown,
} from 'react-icons/fi'
import { logo } from "../../../assets/index.ts";
import { DashNavLinks } from "../../../Constants/index.ts";
import { UserContext } from "../../../contexts/UserContext.tsx";
import { useDisclosure } from "../../../hooks/use-disclosure.ts";
import { GrPowerShutdown } from "react-icons/gr";
import { RiAccountCircleFill } from "react-icons/ri";
import { RxDashboard } from "react-icons/rx";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "../../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const SidebarInner = () => {
  return (
    <>
      <div className="flex h-20 items-center mx-8 justify-between">
        <a href="/">
          <img src={logo} alt="NutriTrack" width="150px" />
        </a>
      </div>
      {/* Navigation Links */}
      <div className="flex flex-col items-start gap-4">
        {DashNavLinks.map((nav) => {
          const isActive = location.pathname === `/${nav.id}` || (location.pathname === "/" && nav.id === "home");
          const NavIcon = nav.icon;

          return (
            <a
              key={nav.id}
              href={`/${nav.id}`}
              style={{ textDecoration: 'none' }}
              className="w-full"
            >
              <div
                className={`group flex items-center p-4 mx-4 rounded-lg cursor-pointer font-medium font-[Rubik,sans-serif] text-[15px] hover:bg-[var(--bright-green)] hover:text-[var(--dark-green)] ${
                  isActive
                    ? "bg-[var(--bright-green)] text-[var(--dark-green)]"
                    : "bg-transparent text-[var(--soft-white)]"
                }`}
              >
                <NavIcon
                  className={`mr-4 text-base group-hover:text-[var(--dark-green)] ${isActive ? "text-[var(--dark-green)]" : ""}`}
                />
                {nav.title}
              </div>
            </a>
          );
        })}
      </div>
    </>
  )
}

const SidebarContent = ({ className }: { className?: string }) => {
  return (
    <div
      className={`fixed h-full w-full md:w-60 bg-[var(--dark-green)] border-r border-gray-200 ${className || ''}`}
    >
      <SidebarInner />
    </div>
  )
}

const MobileNav = ({ onOpen }: { onOpen: () => void }) => {
  const userContext = useContext(UserContext);
  const loggedUser = userContext?.loggedUser || null;
  const logout = userContext?.logout || (() => {});
  return (
    <div className="flex ml-0 md:ml-60 px-4 h-20 items-center bg-[var(--dark-green)] border-b border-gray-200 justify-between md:justify-end">
      <button
        type="button"
        onClick={onOpen}
        aria-label="open menu"
        className="flex md:hidden items-center justify-center rounded-md border border-[var(--off-white)] p-2 text-[var(--off-white)] bg-transparent"
      >
        <FiMenu />
      </button>

      <div className="flex md:hidden">
        <a href="/">
          <img src={logo} alt="NutriTrack" width="150px" />
        </a>
      </div>

      <div className="flex flex-row items-center gap-0 md:gap-6">
        <button type="button" aria-label="notifications" className="bg-transparent p-2 text-[var(--off-white)] hover:bg-white/10 rounded-md">
          <FiBell />
        </button>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                tabIndex={0}
                aria-label="User Avatar"
                className="bg-transparent py-2 hover:bg-transparent"
              >
                <div className="flex flex-row items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="bg-[var(--bright-green)] text-[var(--dark-green)] font-semibold">
                      {getInitials(loggedUser?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start ml-2">
                    <span className="text-sm text-[var(--off-white)]">{loggedUser?.name || "User"}</span>
                  </div>
                  <div className="hidden md:flex text-[var(--off-white)]">
                    <FiChevronDown />
                  </div>
                </div>
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
                  className="text-[15px] font-[Rubik,sans-serif] font-normal cursor-pointer"
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
        </div>
      </div>
    </div>
  )
}

const Sidenav: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <div className="min-h-screen bg-gray-100">
      <SidebarContent className="hidden md:block" />
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="left" className="p-0 w-72 bg-[var(--dark-green)] border-0 text-[var(--soft-white)]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarInner />
        </SheetContent>
      </Sheet>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <div className="ml-0 md:ml-60 p-4">
        {children}
      </div>
    </div>
  )
}

export default Sidenav
