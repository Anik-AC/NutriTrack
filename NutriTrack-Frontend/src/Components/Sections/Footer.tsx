import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { sm_logo } from "../../assets/index.ts";
import {footerLinks } from "../../Constants";
import { Separator } from "../ui/separator";

const Logo = () => {
  return (
    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img src={sm_logo} alt="NutriTrack" className="w-[80px] h-[40px]" />
    </a>
  );
};

const socialButtonClasses =
  "inline-flex items-center justify-center text-[14px] font-[Rubik,sans-serif] font-normal bg-[var(--dark-green)] text-[var(--soft-white)] border-2 border-[var(--soft-white)] px-[16px] py-[9px] rounded-[50px] hover:bg-[rgba(25,50,25,0.8)] focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2";

export default function Footer() {
  return (
    <div className="bg-[var(--dark-green)] text-gray-200 w-screen">
      <div className="flex flex-col max-w-full py-10 px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[2fr_2fr_1fr_1fr] gap-8">
          <div className="flex flex-row gap-6 flex-1">
            <div>
              <Logo />
            </div>
            <div className="pt-6">
              <p className="text-[24px] font-normal text-[#F3EDE4] font-[Rubik,sans-serif]">
                Get in touch
              </p>
              <a
                href="mailto:hello@mailgun.onixpace.com"
                className="text-[24px] font-normal text-[#F3EDE4] font-[Graphik,sans-serif] underline hover:no-underline"
              >
                hello@mailgun.onixpace.com
              </a>
            </div>
          </div>
          <div className="flex-1 hidden xl:flex" />
          <div className="flex flex-col gap-2 flex-1 text-[var(--off-white)]">
            <p className="text-sm font-bold">
              2025 NutriTrack Ltd
            </p>
            <p className="text-sm">ECE 651 - Project </p>
            <p className="text-sm">
              Street No. 1, XYZ Building, 101 University Avenue, Waterloo, N2J XXX
            </p>
          </div>
          <div className="flex flex-col items-start justify-end">
            {footerLinks.map((nav) => {
              return (
                <a key={nav.id} href={`/${nav.id}`} style={{ textDecoration: 'none' }}>
                  <div className="font-[Rubik,sans-serif] text-[var(--soft-white)] hover:text-white text-base text-center w-full">
                    {nav.title}
                  </div>
                </a>
              );
            })}

            <div className="flex flex-row justify-end gap-6 flex-1">
              {/* LinkedIn Button */}
              <a href="#" tabIndex={0} role="link" aria-label="LinkedIn" className={socialButtonClasses}>
                <FaLinkedin size={20} />
              </a>

              {/* Instagram Button */}
              <a href="#" tabIndex={0} role="link" aria-label="Instagram" className={socialButtonClasses}>
                <FaInstagram size={20} />
              </a>

              {/* X (Twitter) Button */}
              <a href="#" tabIndex={0} role="link" aria-label="X (Twitter)" className={socialButtonClasses}>
                <FaXTwitter size={20} />
              </a>
            </div>
          </div>

        </div>
      </div>
      <Separator className="bg-[rgb(87,94,89)]" />
      <div className="text-sm mt-2 px-8 text-[var(--footer-color)] pt-8 pb-5">
        <p className="text-sm">© 2025 NutriTrack Ltd. All rights reserved</p>
        <span className="font-bold">NutriTrack Limited</span> is a project developed for ECE 651 by Group 3 during the Winter 2025 term.
      </div>
    </div>
  )
}
