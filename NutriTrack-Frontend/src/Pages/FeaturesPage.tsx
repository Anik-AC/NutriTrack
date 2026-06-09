import { Navbar, Footer } from "../Components/Sections";
import { Check } from "lucide-react";
import { FeaturesList } from "../Constants";

const features = FeaturesList;

const Features = () => {
  return (
    <div className="w-full min-h-screen flex flex-col bg-green-50">
      {/* ✅ Fixed Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-navbar">
        <Navbar />
      </div>

      {/* ✅ Ensures content starts below the navbar */}
      <div className="flex-grow pt-[80px]">
        <div className="p-4 pt-[50px] pb-[50px]">
          <div className="flex flex-col gap-4 mx-auto w-full max-w-3xl text-center">
            <h1 className="text-3xl font-bold">NutriTrack Features</h1>
            <p className="text-gray-600 text-xl">
              Discover the amazing features NutriTrack offers to help you stay
              on top of your health and fitness goals.
            </p>
          </div>

          <div className="mx-auto w-full max-w-6xl mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="feature-box flex items-start gap-2" /* Apply the CSS class */
                >
                  <div className="text-green-400 px-2">
                    <Check />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="feature-title">{feature.title}</p>
                    <p className="feature-text">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Footer stays at bottom */}
      <div className="w-full mt-auto bg-footer">
        <Footer />
      </div>
    </div>
  );
};

export default Features;
