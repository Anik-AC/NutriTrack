import axios from 'axios';
import { BACKEND_URL } from '../utils/env';

interface Tracking {
    totalCalories?: number;
    totalProtein?: number;
    totalFat?: number;
    totalFiber?: number;
    totalCarbohydrate?: number;
    aggTime: string; // ISO date string
    timeAgg?: string; // Represents the aggregation period (e.g., "month")
  }

export const getHistoricalData = async (timeAggParam: string = 'month', startDate: string | null = null, endDate: string | null = null) => {
    try {
        const token = localStorage.getItem("token");
        console.log("Token being sent:", token); // Debug log

        const response = await axios.get(`${BACKEND_URL}/api/history`, {
            params: {
                timeAgg: timeAggParam,
                startDate: startDate,
                endDate: endDate
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        let filledTrackings = fillMissingDates(response.data.data.trackings);
        let dateFixedTrackings = convertTrackingDatesToEpoch(filledTrackings);
        console.log('Historical data:', dateFixedTrackings);
        return dateFixedTrackings;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
};




export const fillMissingDates = (trackings: Tracking[]): Tracking[] => {
    if (trackings.length === 0) return trackings;

    const filledTrackings : Tracking[] = [];
    const startDate = new Date(trackings[0].aggTime);
    const endDate = new Date(trackings[trackings.length - 1].aggTime);
    let currentDate = new Date(startDate);

    const trackingMap = new Map(trackings.map(tracking => [new Date(tracking.aggTime).toDateString(), tracking]));

    
    while (currentDate < endDate) {
        const dateString = currentDate.toDateString();
        if (trackingMap.has(dateString)) {
            filledTrackings.push(trackingMap.get(dateString)!);
        } else {
            filledTrackings.push({
                totalCalories: undefined,
                totalProtein: undefined,
                totalFat: undefined,
                totalFiber: undefined,
                totalCarbohydrate: undefined,
                aggTime: currentDate.toDateString(),
                timeAgg: undefined
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    filledTrackings.push(trackingMap.get(endDate.toDateString())!);
    return filledTrackings;
};

export const convertTrackingDatesToEpoch = (trackings: Tracking[]) => {
    return trackings.map(tracking => {
        const date = new Date(tracking.aggTime);
        const epochTime = date.getTime();
        return {
            ...tracking,
            aggTime: epochTime
        };
    });
};


export const convertEpochToFormattedDate = (epochTime: number): string => {
    const date = new Date(epochTime);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "UTC"
    });
};


export const formatTrackingDates = (trackings: Tracking[]): Tracking[] => {
    return trackings.map(tracking => {
        const date = new Date(tracking.aggTime);
        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            timeZone: "UTC"
          });
        return {
            ...tracking,
            aggTime: formattedDate
        };
    });
};
