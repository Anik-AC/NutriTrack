import HistoricalLineGraph from '@/Components/Sections/CustomerSections/HistoricalLineGraph.js';
import React, { useEffect, useState } from 'react';
import { Sidenav } from "../../Components/Sections/index.js";
import { getHistoricalData } from '../../Services/historicalViewServices.js';
import HistoricalFilterForm from '@/Components/Sections/CustomerSections/HistoricalFilterForm.js';
import { HistoricalLineGraphProps } from '@/Components/Sections/CustomerSections/HistoricalLineGraph.js';

const HistoricalViewPage: React.FC = () => {
    const [historicalData, setHistoricalData] = useState<HistoricalLineGraphProps['historicalData']>([]);

    useEffect(() => {
        getHistoricalData('month').then(setHistoricalData);
    }, []);

    const handleFormSubmit = (selectedValue: string = 'month', startDate?: string | null, endDate?: string | null) => {
        getHistoricalData(selectedValue, startDate, endDate).then(setHistoricalData);
    };

    return (
        <Sidenav>
            <div className="p-8">
                <div className="bg-white shadow-md rounded-lg p-0 mb-10">
                    <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Historical Nutrient Insights</h2>
                    </div>
                    <div className="p-6 text-[var(--dark-green)]">
                        <p className="text-base font-medium">
                            Track your nutrition journey over time. Use this dashboard to view your weekly or monthly intake patterns and adjust your habits accordingly.
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6">
                    <HistoricalFilterForm onSubmit={handleFormSubmit} />
                    <HistoricalLineGraph historicalData={historicalData} />
                </div>
            </div>
        </Sidenav>
    );
};

export default HistoricalViewPage;
