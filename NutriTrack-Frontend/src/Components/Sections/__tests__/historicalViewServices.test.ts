import axios from 'axios';
import { getHistoricalData, fillMissingDates, convertTrackingDatesToEpoch, convertEpochToFormattedDate, formatTrackingDates } from '../../..//Services/historicalViewServices';

// Stub env (uses import.meta, unsupported by ts-jest). Empty BACKEND_URL keeps
// service URLs same-origin relative (e.g. "/api/history"), matching assertions below.
jest.mock('../../../utils/env', () => ({ BACKEND_URL: '' }));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('historicalViewServices', () => {
    describe('getHistoricalData', () => {
        it('should fetch historical data and process it correctly', async () => {
            const mockData = {
                data: {
                    trackings: [
                        { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                        { aggTime: '2023-01-02', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
                    ]
                }
            };
            mockedAxios.get.mockResolvedValueOnce({ data: mockData });

            const result = await getHistoricalData('month', '2023-01-01', '2023-01-02');

            expect(mockedAxios.get).toHaveBeenCalledWith('/api/history', {
                params: {
                    timeAgg: 'month',
                    startDate: '2023-01-01',
                    endDate: '2023-01-02'
                },
                headers: {
                    Authorization: expect.any(String), // or set a specific token
                },

            });
            expect(result).toEqual(expect.any(Array));
        });

        it('should throw an error if the API call fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

            await expect(getHistoricalData('month', '2023-01-01', '2023-01-02')).rejects.toThrow('API Error');
            consoleErrorSpy.mockRestore();
        });

        it('should handle different types of errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

            await expect(getHistoricalData('month', '2023-01-01', '2023-01-02')).rejects.toThrow('Network Error');
            consoleErrorSpy.mockRestore();
        });

        it('should use default parameters when none are provided', async () => {
            const mockData = {
                data: {
                    trackings: [
                        { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                        { aggTime: '2023-01-02', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
                    ]
                }
            };
            mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    
            const result = await getHistoricalData();
    
            expect(mockedAxios.get).toHaveBeenCalledWith('/api/history', {
                params: {
                    timeAgg: 'month',
                    startDate: null,
                    endDate: null
                },
                headers: {
                    Authorization: expect.any(String), // or set a specific token
                },
            });
            expect(result).toEqual(expect.any(Array));
        });
    
        it('should handle null startDate and endDate', async () => {
            const mockData = {
                data: {
                    trackings: [
                        { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                        { aggTime: '2023-01-02', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
                    ]
                }
            };
            mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    
            const result = await getHistoricalData('month', null, null);
    
            expect(mockedAxios.get).toHaveBeenCalledWith('/api/history', {
                params: {
                    timeAgg: 'month',
                    startDate: null,
                    endDate: null
                },
                headers: {
                    Authorization: expect.any(String), // or set a specific token
                },
            });
            expect(result).toEqual(expect.any(Array));
        });
    });

    describe('fillMissingDates', () => {
        it('should fill missing dates in the trackings array', () => {
            const trackings = [
                { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                { aggTime: '2023-01-03', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' },
                { aggTime: '2023-01-05', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
            ];
            const result = fillMissingDates(trackings);

            expect(result.length).toBe(5);
            expect(result[1]).toEqual({
                aggTime: new Date('2023-01-02').toDateString(),
                totalCalories: undefined,
                totalProtein: undefined,
                totalFat: undefined,
                totalFiber: undefined,
                totalCarbohydrate: undefined,
                timeAgg: undefined
            });
        });

        it('should handle an empty array', () => {
            const trackings: any[] = [];
            const result = fillMissingDates(trackings);

            expect(result).toEqual([]);
        });

        it('should handle an array with one element', () => {
            const trackings = [
                { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' }
            ];
            const result = fillMissingDates(trackings);

            expect(result).toEqual(trackings);
        });

        it('should handle edge cases correctly', () => {
            const trackings = [
                { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                { aggTime: '2023-01-02', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
            ];
            const result = fillMissingDates(trackings);

            expect(result.length).toBe(2);
        });
    });

    describe('convertTrackingDatesToEpoch', () => {
        it('should convert tracking dates to epoch time', () => {
            const trackings = [
                { aggTime: '2023-01-01', totalCalories: 2000 },
                { aggTime: '2023-01-02', totalCalories: 1800 }
            ];
            const result = convertTrackingDatesToEpoch(trackings);

            expect(result[0].aggTime).toBe(new Date('2023-01-01').getTime());
            expect(result[1].aggTime).toBe(new Date('2023-01-02').getTime());
        });

        it('should handle invalid dates', () => {
            const trackings = [
                { aggTime: 'invalid-date', totalCalories: 2000 }
            ];
            const result = convertTrackingDatesToEpoch(trackings);

            expect(result[0].aggTime).toBeNaN();
        });
    });

    describe('convertEpochToFormattedDate', () => {
        it('should convert epoch time to formatted date string', () => {
            const epochTime = new Date('2023-01-01').getTime();
            const result = convertEpochToFormattedDate(epochTime);

            expect(result).toBe('01/01/23');
        });
    });

    describe('formatTrackingDates', () => {
        it('should format tracking dates to "en-GB" locale', () => {
            const trackings = [
                { aggTime: '2023-01-01', totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250, timeAgg: 'day' },
                { aggTime: '2023-01-02', totalCalories: 1800, totalProtein: 45, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230, timeAgg: 'day' }
            ];
            const result = formatTrackingDates(trackings);

            expect(result[0].aggTime).toBe('01/01/23');
            expect(result[1].aggTime).toBe('02/01/23');
        });

        it('should handle invalid dates', () => {
            const trackings = [
                { aggTime: 'invalid-date', totalCalories: 2000 }
            ];
            const result = formatTrackingDates(trackings);

            expect(result[0].aggTime).toBe('Invalid Date');
        });
    });
describe('getHistoricalData', () => {
    
});
});