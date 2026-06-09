import {Navbar, Footer} from "../Components/Sections";
//import styles from "../../style";

const TermsAndConditions = () => {

  return (
    <div className="w-full min-h-screen flex flex-col">

      {/* ✅ Fixed Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-navbar">
        <Navbar />
      </div>

      {/* ✅ Ensures content starts below the navbar */}
      <div className="flex-grow pt-[80px] bg-alternate">
          Put the Contents Here
      </div>

      {/* ✅ Footer stays at bottom */}
      <div className="w-full mt-auto bg-footer">
        <Footer />
      </div>
    </div>
  );
};
export default TermsAndConditions;

