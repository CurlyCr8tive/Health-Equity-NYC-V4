"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

/**
 * EnvironmentalEducation
 * Explains environmental & infrastructure factors with ARIA-compliant content.
 */
export default function EnvironmentalEducation() {
  return (
    <section aria-labelledby="env-edu-title" className="prose max-w-none lg:prose-lg mx-auto">
      <h2 id="env-edu-title" className="mb-4 text-xl font-semibold">
        Environmental &amp; Infrastructure Factors
      </h2>

      <p className="text-gray-700">
        Environmental conditions contribute up to 40 % of health outcomes. Learn how local infrastructure shapes
        community well-being.
      </p>

      <Accordion type="multiple" className="mt-6">
        {/* Food Access -------------------------------------------------------- */}
        <AccordionItem value="food-access">
          <AccordionTrigger className="font-medium">🍎 Food Access &amp; Nutrition</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Food Deserts :</strong> Areas with limited full-service grocery options. Incentivizing
                fresh-food vendors improves diet quality.
              </li>
              <li>
                <strong>SNAP Access :</strong> Enrollment assistance lifts thousands out of food insecurity each year.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Physical Activity -------------------------------------------------- */}
        <AccordionItem value="physical-activity">
          <AccordionTrigger className="font-medium">🏃 Physical Activity &amp; Green Space</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <p>Access to parks and recreation correlates with lower obesity and chronic-disease prevalence.</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Park Access :</strong> NYC’s <em>Community Parks Initiative</em> revitalizes under-served green
                spaces.
              </li>
              <li>
                <strong>Walkability :</strong> Each 10-point increase in Walk Score is linked to 5 % more daily
                physical-activity minutes.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Environmental Exposure -------------------------------------------- */}
        <AccordionItem value="environmental-exposure">
          <AccordionTrigger className="font-medium">☁️ Environmental Exposure</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Air Quality :</strong> Fine-particulate pollution exacerbates asthma and heart disease;
                tree-canopy expansion mitigates exposure.
              </li>
              <li>
                <strong>Heat Vulnerability :</strong> Cooling-center outreach reduces heat-related mortality during
                summer months.
              </li>
              <li>
                <strong>Water Quality :</strong> Lead-service-line replacement is critical for child health.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Community Access --------------------------------------------------- */}
        <AccordionItem value="community-access">
          <AccordionTrigger className="font-medium">🏥 Community Access &amp; Services</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <p>
              Reliable transit and healthcare facilities improve timely care access and reduce chronic-disease
              complications.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Healthcare Access :</strong> Federally Qualified Health Centers (FQHCs) provide sliding-scale
                services.
              </li>
              <li>
                <strong>Transit Access :</strong> 25 % of NYC households lack a vehicle; transit outages
                disproportionately affect low-income neighborhoods.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
