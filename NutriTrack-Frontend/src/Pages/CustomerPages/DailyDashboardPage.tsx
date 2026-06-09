import React, { useEffect, useState } from 'react';
import { Sidenav } from "../../Components/Sections";
import { getDailyData } from '../../Services/dailyDashboardServices';
import DailyPieChart from '@/Components/Sections/CustomerSections/DailyPieChart';
import { DailyPieChartProps } from '@/Components/Sections/CustomerSections/DailyPieChart';

const DailyDashboardPage: React.FC = () => {
    const [dailyData, setDailyData] = useState<DailyPieChartProps['dailyData'] | undefined>(undefined);

    useEffect(() => {
        getDailyData().then(setDailyData);
    }, []);

    return (
        <Sidenav>
            <div className="p-8">
                <div className="bg-white shadow-md rounded-lg p-0 mb-10">
                    <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Today's Nutrition Breakdown</h2>
                    </div>
                    <div className="p-6 text-[var(--dark-green)]">
                        <p className="text-base font-medium">
                            Visualize how your macronutrients add up today. Keep track of carbs, proteins, and fats to stay on top of your dietary goals.
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6">
                    {dailyData ? (
                        <DailyPieChart dailyData={dailyData} />
                    ) : (
                        <p>No meals today</p>
                    )}
                </div>
            </div>
        </Sidenav>
    );
};

export default DailyDashboardPage;
