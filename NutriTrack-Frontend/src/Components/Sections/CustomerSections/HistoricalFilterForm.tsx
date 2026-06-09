import React, { useState } from 'react';

interface HistoricalFilterFormProps {
    onSubmit: (selectedOption: string, startDate?: string, endDate?: string) => void;
}

const HistoricalFilterForm: React.FC<HistoricalFilterFormProps> = ({ onSubmit }) => {
    const [selectedOption, setSelectedOption] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedOption !== null) {
            onSubmit(selectedOption, startDate, endDate); // Pass selected value to parent
        }
    };

    return (
        <form className="w-full max-w-full flex justify-center" onSubmit={handleSubmit}>
            
            <div className="flex flex-row items-center gap-x-4">
                <label className="inline-flex items-center mt-2">
                    <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="timeAgg"
                        value="week"
                        checked={selectedOption === 'week'}
                        onChange={() => setSelectedOption('week')}
                    />
                    <span className="ml-2">Weekly</span>
                </label>
                <label className="inline-flex items-center mt-2">
                    <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="timeAgg"
                        value="month"
                        checked={selectedOption === 'month'}
                        onChange={() => setSelectedOption('month')}
                    />
                    <span className="ml-2">Monthly</span>
                </label>
                <label className="inline-flex items-center mt-2">
                    <span className="ml-2">Start Date:</span>
                    <input
                        type="date"
                        className="form-input ml-2"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>
                <label className="inline-flex items-center mt-2">
                    <span className="ml-2">End Date:</span>
                    <input
                        type="date"
                        className="form-input ml-2"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>
                <button type="submit" className="mt-4 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
                Submit
                </button>
            </div>
        </form>
    );
};

export default HistoricalFilterForm;
