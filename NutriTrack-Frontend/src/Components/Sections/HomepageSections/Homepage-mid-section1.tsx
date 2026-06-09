'use client'

import {
  MdFastfood,
  MdOutlineTrackChanges,
  MdPerson,
  MdGroup,
  MdPlaylistAdd,
  MdTimeline,
  MdWaterDrop,
  MdDashboard,
} from 'react-icons/md'

import { IconType } from 'react-icons';

interface FeatureProps {
  heading: string;
  text: string;
  icon: IconType;
}

const Feature = ({ heading, text, icon }: FeatureProps) => {
  const IconComp = icon;
  return (
    <div className="text-center">
      <div className="flex justify-center items-center bg-[var(--dark-green)] rounded-full w-16 h-16 mb-4 mx-auto">
        <IconComp className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {heading}
      </h3>
      <p className="text-base text-gray-600">
        {text}
      </p>
    </div>
  )
}

export default function HomepageMidSection1() {
  return (
    <>
    <div className="bg-yellow-400 w-full py-6">
        <h2 className="text-[clamp(4rem,10vw,6rem)] text-center font-[Deacon,sans-serif] font-extrabold text-[var(--dark-green)] tracking-wide">
            FEATURES
        </h2>
    </div>


    <div className="flex w-full bg-[#FFF9DB] py-12">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 md:gap-16">
          <Feature
            icon={MdFastfood}
            heading={'Personalized Meal Plans'}
            text={'Get customized meal plans and recipes tailored to your dietary needs, preferences, and goals.'}
          />
          <Feature
            icon={MdOutlineTrackChanges}
            heading={'Nutrition Tracking'}
            text={'Track your daily calorie, protein, and nutrient intake to stay on top of your health goals.'}
          />
          <Feature
            icon={MdPerson}
            heading={'Profile Setup'}
            text={'Set up your profile to calculate your daily calorie and protein needs based on your age, weight, height, and activity level.'}
          />
          <Feature
            icon={MdGroup}
            heading={'Community Support'}
            text={'Join a community of like-minded individuals to share your journey, tips, and progress.'}
          />
          <Feature
            icon={MdPlaylistAdd}
            heading={'Custom Food Tracking'}
            text={'Add and track custom foods that are not available in the standard database.'}
          />
          <Feature
            icon={MdTimeline}
            heading={'Historical Data'}
            text={'View your historical progress, including meals consumed, activity levels, and weight changes over time.'}
          />
          <Feature
            icon={MdWaterDrop}
            heading={'Hydration Tracker'}
            text={'Monitor your daily water intake to ensure you stay hydrated and healthy.'}
          />
          <Feature
            icon={MdDashboard}
            heading={'Dashboard Insights'}
            text={'Access a comprehensive dashboard with insights into your daily calorie needs, BMI, and protein requirements.'}
          />
        </div>
      </div>
    </div>
    </>
  )
}
