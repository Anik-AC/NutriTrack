import axios from 'axios';
import { BACKEND_URL } from '../utils/env';
import { DailyPieChartProps } from '@/Components/Sections/CustomerSections/DailyPieChart';

export const getDailyData = async (): Promise<DailyPieChartProps['dailyData'] | undefined> => {
    try {
        const token = localStorage.getItem("token");
        console.log("Token being sent:", token); // Debug log
        const response = await axios.get(`${BACKEND_URL}/api/history`, {
            // TO DO: change to current date
            params: {
                timeAgg: 'day',
                startDate: new Date().toLocaleDateString('en-CA'),
                endDate: new Date().toLocaleDateString('en-CA')
            }
            ,headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        let result = undefined;
        console.log(response);
        if (response.data.data.trackings.length > 0) {
            const tracking = response.data.data.trackings[0];
            const nutrientData = [
                { name: 'totalCarbohydrate', value: tracking.totalCarbohydrate },
                { name: 'totalFat', value: tracking.totalFat },
                { name: 'totalFiber', value: tracking.totalFiber },
                { name: 'totalProtein', value: tracking.totalProtein }
            ];
            const calorieData = [
                { name: 'Calories', totalCalories: tracking.totalCalories }
            ]
            result = { nutrientData, calorieData };
        }
        console.log('Historical data:', result);
        return result;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
};
