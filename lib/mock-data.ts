import type { HealthData, BoroughData, EnvironmentalData } from "@/types"

// Mock health data - simulating real NYC health department data
export const mockHealthData: HealthData[] = [
  // Asthma data
  {
    id: "1",
    borough: "Bronx",
    condition: "Asthma",
    rate: 18.5,
    ageGroup: "0-17",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "2",
    borough: "Brooklyn",
    condition: "Asthma",
    rate: 14.2,
    ageGroup: "0-17",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "3",
    borough: "Manhattan",
    condition: "Asthma",
    rate: 8.7,
    ageGroup: "0-17",
    raceEthnicity: "White",
    year: 2023,
  },
  { id: "4", borough: "Queens", condition: "Asthma", rate: 12.1, ageGroup: "0-17", raceEthnicity: "Asian", year: 2023 },
  {
    id: "5",
    borough: "Staten Island",
    condition: "Asthma",
    rate: 10.3,
    ageGroup: "0-17",
    raceEthnicity: "White",
    year: 2023,
  },

  // Diabetes data
  {
    id: "6",
    borough: "Bronx",
    condition: "Diabetes",
    rate: 16.8,
    ageGroup: "35-54",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "7",
    borough: "Brooklyn",
    condition: "Diabetes",
    rate: 13.4,
    ageGroup: "35-54",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "8",
    borough: "Manhattan",
    condition: "Diabetes",
    rate: 7.2,
    ageGroup: "35-54",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "9",
    borough: "Queens",
    condition: "Diabetes",
    rate: 11.9,
    ageGroup: "35-54",
    raceEthnicity: "Asian",
    year: 2023,
  },
  {
    id: "10",
    borough: "Staten Island",
    condition: "Diabetes",
    rate: 9.1,
    ageGroup: "35-54",
    raceEthnicity: "White",
    year: 2023,
  },

  // Hypertension data
  {
    id: "11",
    borough: "Bronx",
    condition: "Hypertension",
    rate: 32.1,
    ageGroup: "55-74",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "12",
    borough: "Brooklyn",
    condition: "Hypertension",
    rate: 28.7,
    ageGroup: "55-74",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "13",
    borough: "Manhattan",
    condition: "Hypertension",
    rate: 22.3,
    ageGroup: "55-74",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "14",
    borough: "Queens",
    condition: "Hypertension",
    rate: 25.8,
    ageGroup: "55-74",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "15",
    borough: "Staten Island",
    condition: "Hypertension",
    rate: 24.2,
    ageGroup: "55-74",
    raceEthnicity: "White",
    year: 2023,
  },

  // Depression data
  {
    id: "16",
    borough: "Manhattan",
    condition: "Depression",
    rate: 15.6,
    ageGroup: "18-34",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "17",
    borough: "Brooklyn",
    condition: "Depression",
    rate: 18.2,
    ageGroup: "18-34",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "18",
    borough: "Bronx",
    condition: "Depression",
    rate: 21.4,
    ageGroup: "18-34",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "19",
    borough: "Queens",
    condition: "Depression",
    rate: 12.8,
    ageGroup: "18-34",
    raceEthnicity: "Asian",
    year: 2023,
  },
  {
    id: "20",
    borough: "Staten Island",
    condition: "Depression",
    rate: 14.1,
    ageGroup: "18-34",
    raceEthnicity: "White",
    year: 2023,
  },

  // Obesity data
  {
    id: "21",
    borough: "Bronx",
    condition: "Obesity",
    rate: 35.2,
    ageGroup: "35-54",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "22",
    borough: "Brooklyn",
    condition: "Obesity",
    rate: 31.8,
    ageGroup: "35-54",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "23",
    borough: "Manhattan",
    condition: "Obesity",
    rate: 18.4,
    ageGroup: "35-54",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "24",
    borough: "Queens",
    condition: "Obesity",
    rate: 26.7,
    ageGroup: "35-54",
    raceEthnicity: "Asian",
    year: 2023,
  },
  {
    id: "25",
    borough: "Staten Island",
    condition: "Obesity",
    rate: 28.9,
    ageGroup: "35-54",
    raceEthnicity: "White",
    year: 2023,
  },

  // COVID-19 data
  {
    id: "26",
    borough: "Bronx",
    condition: "COVID-19",
    rate: 42.3,
    ageGroup: "75+",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "27",
    borough: "Brooklyn",
    condition: "COVID-19",
    rate: 38.1,
    ageGroup: "75+",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "28",
    borough: "Manhattan",
    condition: "COVID-19",
    rate: 28.7,
    ageGroup: "75+",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "29",
    borough: "Queens",
    condition: "COVID-19",
    rate: 35.4,
    ageGroup: "75+",
    raceEthnicity: "Asian",
    year: 2023,
  },
  {
    id: "30",
    borough: "Staten Island",
    condition: "COVID-19",
    rate: 31.2,
    ageGroup: "75+",
    raceEthnicity: "White",
    year: 2023,
  },

  // Additional conditions for more comprehensive data
  {
    id: "31",
    borough: "Bronx",
    condition: "COPD",
    rate: 8.9,
    ageGroup: "55-74",
    raceEthnicity: "Black/African American",
    year: 2023,
  },
  {
    id: "32",
    borough: "Brooklyn",
    condition: "High Cholesterol",
    rate: 24.6,
    ageGroup: "35-54",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "33",
    borough: "Manhattan",
    condition: "Anxiety",
    rate: 19.3,
    ageGroup: "18-34",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "34",
    borough: "Queens",
    condition: "Cancer",
    rate: 12.7,
    ageGroup: "55-74",
    raceEthnicity: "Asian",
    year: 2023,
  },
  {
    id: "35",
    borough: "Staten Island",
    condition: "Stroke",
    rate: 6.4,
    ageGroup: "75+",
    raceEthnicity: "White",
    year: 2023,
  },
  // Additional Asthma data to ensure 4th condition
  {
    id: "36",
    borough: "Manhattan",
    condition: "Asthma",
    rate: 12.4,
    ageGroup: "18-34",
    raceEthnicity: "White",
    year: 2023,
  },
  {
    id: "37",
    borough: "Queens",
    condition: "Asthma",
    rate: 15.8,
    ageGroup: "35-54",
    raceEthnicity: "Hispanic/Latino",
    year: 2023,
  },
  {
    id: "38",
    borough: "Staten Island",
    condition: "Asthma",
    rate: 11.2,
    ageGroup: "55-74",
    raceEthnicity: "White",
    year: 2023,
  },
]

// Mock borough data with NYC coordinates
export const mockBoroughData: BoroughData[] = [
  {
    name: "Manhattan",
    population: 1694251,
    coordinates: [40.7831, -73.9712],
  },
  {
    name: "Brooklyn",
    population: 2736074,
    coordinates: [40.6782, -73.9442],
  },
  {
    name: "Queens",
    population: 2405464,
    coordinates: [40.7282, -73.7949],
  },
  {
    name: "Bronx",
    population: 1472654,
    coordinates: [40.8448, -73.8648],
  },
  {
    name: "Staten Island",
    population: 495747,
    coordinates: [40.5795, -74.1502],
  },
]

// Mock environmental data
export const mockEnvironmentalData: EnvironmentalData[] = [
  {
    zipCode: "10451",
    borough: "Bronx",
    foodDeserts: true,
    snapAccess: 78.2,
    greenSpaceAcres: 12.4,
    airQualityIndex: 85,
    fastFoodDensity: 24.1,
    freshFoodAccess: 32.6,
  },
  {
    zipCode: "11201",
    borough: "Brooklyn",
    foodDeserts: false,
    snapAccess: 45.3,
    greenSpaceAcres: 28.7,
    airQualityIndex: 72,
    fastFoodDensity: 18.9,
    freshFoodAccess: 67.4,
  },
  {
    zipCode: "10001",
    borough: "Manhattan",
    foodDeserts: false,
    snapAccess: 23.1,
    greenSpaceAcres: 45.2,
    airQualityIndex: 68,
    fastFoodDensity: 15.3,
    freshFoodAccess: 89.2,
  },
  {
    zipCode: "11354",
    borough: "Queens",
    foodDeserts: false,
    snapAccess: 52.7,
    greenSpaceAcres: 34.8,
    airQualityIndex: 74,
    fastFoodDensity: 19.6,
    freshFoodAccess: 58.9,
  },
  {
    zipCode: "10301",
    borough: "Staten Island",
    foodDeserts: true,
    snapAccess: 38.4,
    greenSpaceAcres: 67.3,
    airQualityIndex: 71,
    fastFoodDensity: 16.2,
    freshFoodAccess: 54.7,
  },
]

// Helper function to get filtered data (simulates database query)
export function getFilteredHealthData(filters: {
  healthCondition?: string
  borough?: string
  ageGroup?: string
  raceEthnicity?: string
}): HealthData[] {
  return mockHealthData.filter((item) => {
    if (filters.healthCondition && item.condition !== filters.healthCondition) return false
    if (filters.borough && item.borough !== filters.borough) return false
    if (filters.ageGroup && item.ageGroup !== filters.ageGroup) return false
    if (filters.raceEthnicity && item.raceEthnicity !== filters.raceEthnicity) return false
    return true
  })
}

// Helper function to get environmental data by borough
export function getEnvironmentalDataByBorough(borough: string): EnvironmentalData[] {
  return mockEnvironmentalData.filter((item) => item.borough === borough)
}
