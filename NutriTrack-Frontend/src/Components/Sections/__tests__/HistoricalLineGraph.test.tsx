import '@testing-library/jest-dom';
// Stub env (uses import.meta, unsupported by ts-jest) for the service imported transitively.
jest.mock('../../../utils/env', () => ({ BACKEND_URL: '' }));
import HistoricalLineGraph from '../../../Components/Sections/CustomerSections/HistoricalLineGraph';
import { render, screen, fireEvent } from '@testing-library/react';


test('renders HistoricalLineGraph component', () => {
  const historicalData = [
    { aggTime: 1627849200000, totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250 },
    { aggTime: 1627935600000, totalCalories: 1800, totalProtein: 60, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230 },
  ];


  render(<HistoricalLineGraph historicalData={historicalData} />);

  expect(screen.getByText(/totalCalories/i)).toBeInTheDocument();
});
test('renders HistoricalLineGraph component', () => {
  const historicalData = [
    { aggTime: 1627849200000, totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250 },
    { aggTime: 1627935600000, totalCalories: 1800, totalProtein: 60, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230 },
  ];

  render(<HistoricalLineGraph historicalData={historicalData} />);

  expect(screen.getByText(/totalCalories/i)).toBeInTheDocument();
});

test('toggles line visibility on legend click', () => {
  const historicalData = [
    { aggTime: 1627849200000, totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250 },
    { aggTime: 1627935600000, totalCalories: 1800, totalProtein: 60, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230 },
  ];

  render(<HistoricalLineGraph historicalData={historicalData} />);

  const legendItem = screen.getByText(/totalCalories/i);
  const legendParent = legendItem.closest('li');
  fireEvent.click(legendItem);

  // Assuming the line is hidden after clicking the legend item
  expect(legendParent?.classList.contains("inactive")).toBe(true);


  // Click again to toggle visibility back
  fireEvent.click(legendItem);
  expect(legendParent?.classList.contains("inactive")).toBe(false);
});

test('renders all lines initially', () => {
  const historicalData = [
    { aggTime: 1627849200000, totalCalories: 2000, totalProtein: 50, totalFat: 70, totalFiber: 30, totalCarbohydrate: 250 },
    { aggTime: 1627935600000, totalCalories: 1800, totalProtein: 60, totalFat: 65, totalFiber: 25, totalCarbohydrate: 230 },
  ];

  render(<HistoricalLineGraph historicalData={historicalData} />);

  expect(screen.getByText(/totalCalories/i)).toBeInTheDocument();
  expect(screen.getByText(/totalProtein/i)).toBeInTheDocument();
  expect(screen.getByText(/totalFat/i)).toBeInTheDocument();
  expect(screen.getByText(/totalFiber/i)).toBeInTheDocument();
  expect(screen.getByText(/totalCarbohydrate/i)).toBeInTheDocument();
});
