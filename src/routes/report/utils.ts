import type { DemographicCategory } from "@crownshy/api-client/api";

// Maps categories to Items for demographics 
// sections
export function toCategoryItems(categories: DemographicCategory[]) {
	return categories.map((c, i) => ({
		label: c.value ? c.value : "Not Provided",
		color: c.value ? chartColors[i % chartColors.length] : 'bg-chart-undefined',
		count: c.count
	}));
}


// Standard chart colors to use. These are specified in the css variables 
export const chartColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6'];
