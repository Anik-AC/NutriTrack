import { useState } from 'react';
import { Slider } from '../../ui/slider';

const sliderClasses =
  "[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-[var(--bright-green)] [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-[var(--bright-green)]";

const BmiCalculatorBox = () => {
  const [height, setHeight] = useState(170); // cm
  const [weight, setWeight] = useState(70); // kg

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

  const getBmiFeedback = (bmi: number) => {
    if (bmi < 18.5) return 'You are underweight. Consider a balanced diet.';
    if (bmi >= 18.5 && bmi < 25) return 'Great going! You are in a healthy BMI range.';
    if (bmi >= 25 && bmi < 30) return 'You are overweight. Consider some lifestyle changes.';
    return 'You are in the obese category. Please consult a health professional.';
  };

  return (
    <>
    <div className="bg-[var(--bright-green)] w-full py-6">
        <h2 className="text-[clamp(4rem,10vw,5rem)] text-center font-[Deacon,sans-serif] font-extrabold text-[var(--dark-green)] tracking-wide">
            CHECK YOUR BMI
        </h2>
    </div>
    <div className="bg-[var(--dark-green)] text-white px-8 py-20 shadow-md">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left Side - Sliders */}
        <div className="flex-1">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-4xl font-bold text-[var(--bright-green)]">Height (cm)</h3>
              <p className="mt-1 text-2xl">{height} cm</p>
              <Slider
                min={100}
                max={220}
                value={[height]}
                onValueChange={(v) => setHeight(v[0])}
                className={sliderClasses}
              />
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[var(--bright-green)]">Weight (kg)</h3>
              <p className="mt-1 text-2xl">{weight} kg</p>
              <Slider
                min={30}
                max={150}
                value={[weight]}
                onValueChange={(v) => setWeight(v[0])}
                className={sliderClasses}
              />
            </div>
          </div>
        </div>

        {/* Right Side - BMI Display */}
        <div className="flex-1 pt-6 pl-8">
          <h3 className="text-4xl font-bold text-[var(--bright-green)] mb-4">Your BMI</h3>
          <p className="text-7xl font-bold mb-2">{bmi}</p>
          <p className="text-2xl">{getBmiFeedback(bmi)}</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default BmiCalculatorBox;
