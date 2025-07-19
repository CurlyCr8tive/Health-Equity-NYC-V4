"use client"

import { Separator } from "@/components/ui/separator"

import * as React from "react"
import { useState, useMemo } from "react"
import { Search, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FilterPanelProps {
  filters: {
    healthConditions: string[]
    demographics: {
      ageGroups: string[]
      ethnicities: string[]
      incomeRanges: string[]
    }
    environmental: {
      airQuality: boolean
      greenSpace: boolean
      foodAccess: boolean
      transitAccess: boolean
      housingQuality: boolean
    }
    geographic: {
      boroughs: string[]
      neighborhoods: string[]
    }
  }
  onFiltersChange?: (filters: any) => void
  onFilterChange?: (filters: any) => void
  onApplyFilters?: () => void
  onDownloadData?: () => void
  isLoading?: boolean
}

const DEFAULT_FILTERS = {
  healthConditions: [],
  demographics: {
    ageGroups: [],
    ethnicities: [],
    incomeRanges: [],
  },
  environmental: {
    airQuality: false,
    greenSpace: false,
    foodAccess: false,
    transitAccess: false,
    housingQuality: false,
  },
  geographic: {
    boroughs: [],
    neighborhoods: [],
  },
}

/* -------------------------------------------------------------------------- */
/*                               option helpers                               */
/* -------------------------------------------------------------------------- */
const HEALTH_CONDITIONS = [
  "Asthma",
  "COPD",
  "Type 1 Diabetes",
  "Type 2 Diabetes",
  "Hypertension",
  "Stroke",
  "Heart Disease",
  "Depression",
  "Anxiety",
  "Bipolar Disorder",
  "Schizophrenia",
  "Breast Cancer",
  "Prostate Cancer",
  "Lung Cancer",
  "Colorectal Cancer",
  "Skin Cancer",
  "HIV / AIDS",
  "COVID-19",
  "Obesity",
  "Substance Use Disorder",
]

const AGE_GROUPS = [
  "Infants (0-1)",
  "Toddlers (1-4)",
  "Children (5-11)",
  "Adolescents (12-17)",
  "Young Adults (18-24)",
  "Adults (25-34)",
  "Adults (35-44)",
  "Adults (45-54)",
  "Adults (55-64)",
  "Seniors (65+)",
]

const ETHNICITIES = [
  "Black / African American",
  "White / Caucasian",
  "Hispanic / Latino",
  "Asian – East",
  "Asian – South",
  "Asian – Southeast",
  "Native American",
  "Pacific Islander",
  "Multiracial",
  "Other / Prefer not to say",
]

const INCOME_RANGES = [
  "Below $15 000",
  "$15 000 – $24 999",
  "$25 000 – $34 999",
  "$35 000 – $49 999",
  "$50 000 – $74 999",
  "$75 000 – $99 999",
  "$100 000 – $149 999",
  "$150 000 – $199 999",
  "$200 000+",
]

const BOROUGHS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"]

// Expanded neighborhoods
const NEIGHBORHOODS = [
  // Manhattan
  "Harlem",
  "East Harlem",
  "West Harlem",
  "Washington Heights",
  "Inwood",
  "Upper East Side",
  "Upper West Side",
  "Midtown",
  "Midtown East",
  "Midtown West",
  "Hell's Kitchen",
  "Chelsea",
  "Greenwich Village",
  "East Village",
  "SoHo",
  "Tribeca",
  "Lower East Side",
  "Chinatown",
  "Little Italy",
  "Financial District",
  "Battery Park City",
  "Murray Hill",
  "Gramercy",
  "Flatiron",
  "NoMad",
  "Kips Bay",
  "Turtle Bay",
  "Sutton Place",
  "Yorkville",
  "Carnegie Hill",
  "Lenox Hill",
  "Lincoln Square",
  "Morningside Heights",
  "Hamilton Heights",
  "Manhattanville",

  // Brooklyn
  "Brooklyn Heights",
  "DUMBO",
  "Downtown Brooklyn",
  "Fort Greene",
  "Boerum Hill",
  "Cobble Hill",
  "Carroll Gardens",
  "Red Hook",
  "Gowanus",
  "Park Slope",
  "Prospect Heights",
  "Crown Heights",
  "Bed-Stuy",
  "Bedford-Stuyvesant",
  "Williamsburg",
  "Greenpoint",
  "Bushwick",
  "East New York",
  "Brownsville",
  "Ocean Hill",
  "Stuyvesant Heights",
  "Clinton Hill",
  "Prospect Lefferts Gardens",
  "Flatbush",
  "East Flatbush",
  "Midwood",
  "Sheepshead Bay",
  "Brighton Beach",
  "Coney Island",
  "Bensonhurst",
  "Bay Ridge",
  "Sunset Park",
  "Windsor Terrace",
  "Kensington",
  "Borough Park",
  "Dyker Heights",
  "Bath Beach",
  "Gravesend",
  "Canarsie",
  "Mill Basin",
  "Bergen Beach",
  "Marine Park",
  "Gerritsen Beach",
  "Manhattan Beach",

  // Queens
  "Astoria",
  "Long Island City",
  "Sunnyside",
  "Woodside",
  "Elmhurst",
  "Jackson Heights",
  "Corona",
  "East Elmhurst",
  "Flushing",
  "College Point",
  "Whitestone",
  "Bayside",
  "Douglaston",
  "Little Neck",
  "Fresh Meadows",
  "Auburndale",
  "Murray Hill",
  "Flushing Meadows",
  "Kew Gardens",
  "Forest Hills",
  "Rego Park",
  "Middle Village",
  "Glendale",
  "Ridgewood",
  "Maspeth",
  "Woodhaven",
  "Richmond Hill",
  "Kew Gardens Hills",
  "Briarwood",
  "Jamaica",
  "Jamaica Estates",
  "Hollis",
  "Queens Village",
  "Bellerose",
  "Rosedale",
  "Laurelton",
  "Springfield Gardens",
  "St. Albans",
  "Cambria Heights",
  "South Jamaica",
  "South Ozone Park",
  "Howard Beach",
  "Ozone Park",
  "Woodhaven",
  "Richmond Hill",
  "Kew Gardens",
  "Forest Park",
  "Glendale",
  "Ridgewood",
  "Maspeth",
  "Middle Village",
  "Elmhurst",
  "Corona",
  "East Elmhurst",
  "Jackson Heights",
  "Woodside",
  "Sunnyside",
  "Long Island City",
  "Astoria",

  // Bronx
  "South Bronx",
  "Mott Haven",
  "Port Morris",
  "Melrose",
  "Morrisania",
  "Hunts Point",
  "Longwood",
  "Concourse",
  "Highbridge",
  "Morris Heights",
  "University Heights",
  "Fordham",
  "Belmont",
  "East Tremont",
  "West Farms",
  "Crotona Park East",
  "Soundview",
  "Castle Hill",
  "Clason Point",
  "Parkchester",
  "Westchester Square",
  "Throggs Neck",
  "Schuylerville",
  "Country Club",
  "City Island",
  "Pelham Bay",
  "Pelham Parkway",
  "Morris Park",
  "Van Nest",
  "Bronxdale",
  "Allerton",
  "Pelham Gardens",
  "Eastchester",
  "Baychester",
  "Edenwald",
  "Wakefield",
  "Williamsbridge",
  "Olinville",
  "Laconia",
  "Gun Hill",
  "Norwood",
  "Bedford Park",
  "Kingsbridge",
  "Kingsbridge Heights",
  "University Heights",
  "Tremont",
  "Mount Hope",
  "Claremont",
  "Concourse Village",
  "Yankee Stadium Area",
  "Grand Concourse",
  "Riverdale",
  "Spuyten Duyvil",
  "Fieldston",
  "North Riverdale",
  "Van Cortlandt Village",
  "Woodlawn",
  "Woodlawn Heights",

  // Staten Island
  "St. George",
  "Stapleton",
  "Clifton",
  "Park Hill",
  "Port Richmond",
  "West Brighton",
  "New Brighton",
  "Livingston",
  "Graniteville",
  "Mariners Harbor",
  "Arlington",
  "Elm Park",
  "Port Ivory",
  "Howland Hook",
  "Chelsea",
  "Travis",
  "Bulls Head",
  "Bloomfield",
  "Meiers Corners",
  "Willowbrook",
  "Heartland Village",
  "New Springville",
  "Todt Hill",
  "Emerson Hill",
  "Dongan Hills",
  "South Beach",
  "Midland Beach",
  "New Dorp",
  "Oakwood",
  "Bay Terrace",
  "Richmondtown",
  "Arden Heights",
  "Annadale",
  "Huguenot",
  "Prince's Bay",
  "Pleasant Plains",
  "Charleston",
  "Rossville",
  "Woodrow",
  "Great Kills",
  "Eltingville",
  "Greenridge",
  "Grant City",
  "New Dorp Beach",
  "Oakwood Beach",
  "Tottenville",
]

// Environmental factors
const ENVIRONMENTAL_FACTORS = [
  { key: "airQuality", label: "Air Quality" },
  { key: "greenSpace", label: "Green Space Access" },
  { key: "foodAccess", label: "Food Access" },
  { key: "transitAccess", label: "Transit Access" },
  { key: "housingQuality", label: "Housing Quality" },
]

export function FilterPanel({
  filters = DEFAULT_FILTERS,
  onFiltersChange,
  onFilterChange,
  onApplyFilters,
  onDownloadData,
  isLoading = false,
}: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    condition: new Set(filters.healthConditions),
    age: new Set(filters.demographics.ageGroups),
    ethnicity: new Set(filters.demographics.ethnicities),
    income: new Set(filters.demographics.incomeRanges),
    borough: new Set(filters.geographic.boroughs),
    neighborhood: new Set(filters.geographic.neighborhoods),
  })

  // Merge any partial `filters` object the parent passes with the defaults so
  // nested objects like `demographics` are never undefined.
  const safeFilters = useMemo(() => {
    return {
      ...DEFAULT_FILTERS,
      ...filters,
      demographics: {
        ...DEFAULT_FILTERS.demographics,
        ...(filters?.demographics || {}),
      },
      environmental: {
        ...DEFAULT_FILTERS.environmental,
        ...(filters?.environmental || {}),
      },
      geographic: {
        ...DEFAULT_FILTERS.geographic,
        ...(filters?.geographic || {}),
      },
    }
  }, [filters])

  // Support both prop names for backward compatibility
  const handleFiltersChange = onFiltersChange || onFilterChange

  const toggle = (group: keyof typeof selected, value: string) => {
    setSelected((prev) => {
      const next = new Set(prev[group])
      next.has(value) ? next.delete(value) : next.add(value)
      return { ...prev, [group]: next }
    })
  }

  const toggleEnvironmental = (key: string) => {
    if (!handleFiltersChange) return

    const newEnvironmental = {
      ...safeFilters.environmental,
      [key]: !safeFilters.environmental[key as keyof typeof safeFilters.environmental],
    }

    handleFiltersChange({
      ...safeFilters,
      environmental: newEnvironmental,
    })
  }

  /* ------------------------------- filtering ------------------------------ */
  const filterItems = React.useCallback(
    (arr: string[]) => arr.filter((item) => item.toLowerCase().includes(searchTerm.trim().toLowerCase())),
    [searchTerm],
  )

  const handleReset = () => {
    if (!handleFiltersChange) return
    handleFiltersChange(DEFAULT_FILTERS)
    setSearchTerm("")
  }

  const handleApplyFilters = () => {
    if (!handleFiltersChange) return

    // Trigger immediate filter application
    handleFiltersChange({
      healthConditions: Array.from(selected.condition),
      demographics: {
        ageGroups: Array.from(selected.age),
        ethnicities: Array.from(selected.ethnicity),
        incomeRanges: Array.from(selected.income),
      },
      environmental: safeFilters.environmental,
      geographic: {
        boroughs: Array.from(selected.borough),
        neighborhoods: Array.from(selected.neighborhood),
      },
    })

    // Call the onApplyFilters callback if provided
    onApplyFilters?.()
  }

  // Calculate total active filters
  const totalActiveFilters =
    Object.values(selected).reduce((acc, curr) => acc + curr.size, 0) +
    Object.values(safeFilters.environmental).filter(Boolean).length

  /* -------------------------------- render -------------------------------- */
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalActiveFilters} active
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search filters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-2">
          <Accordion
            type="multiple"
            defaultValue={["conditions", "age", "ethnicity", "income", "environmental", "borough", "neighborhood"]}
          >
            {/* Health Conditions ------------------------------------------------ */}
            <AccordionItem value="conditions">
              <AccordionTrigger>Health Conditions ({selected.condition.size})</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-48 pr-2">
                  <div className="space-y-2">
                    {filterItems(HEALTH_CONDITIONS).map((cond) => (
                      <Label key={cond} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selected.condition.has(cond)}
                          onCheckedChange={() => toggle("condition", cond)}
                        />
                        {cond}
                      </Label>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>

            {/* Age Groups ------------------------------------------------------ */}
            <AccordionItem value="age">
              <AccordionTrigger>Age Groups ({selected.age.size})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {filterItems(AGE_GROUPS).map((age) => (
                    <Label key={age} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selected.age.has(age)} onCheckedChange={() => toggle("age", age)} />
                      {age}
                    </Label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ethnicities ----------------------------------------------------- */}
            <AccordionItem value="ethnicity">
              <AccordionTrigger>Ethnicities ({selected.ethnicity.size})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {filterItems(ETHNICITIES).map((eth) => (
                    <Label key={eth} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selected.ethnicity.has(eth)}
                        onCheckedChange={() => toggle("ethnicity", eth)}
                      />
                      {eth}
                    </Label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Income Range ---------------------------------------------------- */}
            <AccordionItem value="income">
              <AccordionTrigger>Income Range ({selected.income.size})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {filterItems(INCOME_RANGES).map((inc) => (
                    <Label key={inc} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selected.income.has(inc)} onCheckedChange={() => toggle("income", inc)} />
                      {inc}
                    </Label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Environmental Factors ------------------------------------------- */}
            <AccordionItem value="environmental">
              <AccordionTrigger>
                Environmental Factors ({Object.values(safeFilters.environmental).filter(Boolean).length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {ENVIRONMENTAL_FACTORS.map((factor) => (
                    <Label key={factor.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={safeFilters.environmental[factor.key as keyof typeof safeFilters.environmental]}
                        onCheckedChange={() => toggleEnvironmental(factor.key)}
                      />
                      {factor.label}
                    </Label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Boroughs -------------------------------------------------------- */}
            <AccordionItem value="borough">
              <AccordionTrigger>Boroughs ({selected.borough.size})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {filterItems(BOROUGHS).map((b) => (
                    <Label key={b} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selected.borough.has(b)} onCheckedChange={() => toggle("borough", b)} />
                      {b}
                    </Label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Neighborhoods --------------------------------------------------- */}
            <AccordionItem value="neighborhood">
              <AccordionTrigger>Neighborhoods ({selected.neighborhood.size})</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {filterItems(NEIGHBORHOODS).map((neighborhood) => (
                      <Label key={neighborhood} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selected.neighborhood.has(neighborhood)}
                          onCheckedChange={() => toggle("neighborhood", neighborhood)}
                        />
                        {neighborhood}
                      </Label>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>

        <Separator className="flex-shrink-0" />

        {/* Action Buttons */}
        <div className="space-y-3 flex-shrink-0">
          <Button onClick={handleApplyFilters} className="w-full" disabled={isLoading}>
            {isLoading ? "Applying..." : "Apply Filters"}
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full bg-transparent" disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default FilterPanel
