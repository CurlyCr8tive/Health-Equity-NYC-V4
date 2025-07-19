"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

/**
 * HealthEducation
 * Accessible educational content explaining health-condition categories.
 */
export default function HealthEducation() {
  return (
    <section aria-labelledby="health-edu-title" className="prose max-w-none lg:prose-lg mx-auto">
      <h2 id="health-edu-title" className="mb-4 text-xl font-semibold">
        Health Conditions Overview
      </h2>

      <p className="text-gray-700">
        Learn how different chronic and acute conditions impact New Yorkers and what community resources are available
        to address them.
      </p>

      <Accordion type="multiple" className="mt-6">
        {/* Chronic Respiratory ------------------------------------------------ */}
        <AccordionItem value="respiratory">
          <AccordionTrigger className="font-medium">🫁 Chronic Respiratory Conditions</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <h3 className="sr-only">Chronic Respiratory Conditions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Asthma :</strong> Affects over 10 % of NYC children. Key triggers include indoor allergens and
                outdoor air pollution.
              </li>
              <li>
                <strong>COPD :</strong> Often linked to smoking history. Early screening and smoking cessation programs
                reduce hospitalizations by up to 30 %.
              </li>
              <li>
                <strong>Allergies :</strong> Rising pollen counts contribute to longer symptomatic seasons—climate
                resilience efforts can help.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Cardiovascular & Metabolic ---------------------------------------- */}
        <AccordionItem value="cardio-metabolic">
          <AccordionTrigger className="font-medium">❤️ Cardiovascular &amp; Metabolic</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Heart Disease :</strong> Leading cause of death in NYC. Community blood-pressure screenings
                lower risk.
              </li>
              <li>
                <strong>Diabetes (Type 2) :</strong> Disproportionately impacts Black and Hispanic communities.
                Nutrition and exercise programs improve outcomes.
              </li>
              <li>
                <strong>Obesity :</strong> Linked to food insecurity and reduced green-space access. Policy changes
                around food deserts are critical.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Mental & Behavioral ---------------------------------------------- */}
        <AccordionItem value="mental-behavioral">
          <AccordionTrigger className="font-medium">🧠 Mental &amp; Behavioral Health</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <p>
              Mental health challenges affect 1 in 5 New Yorkers annually. Stigma-free services and culturally competent
              care improve engagement.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Depression &amp; Anxiety :</strong> Community-based support groups reduce isolation and increase
                treatment uptake.
              </li>
              <li>
                <strong>Substance Use :</strong> Harm-reduction programs such as safe-consumption sites have shown a 35
                % drop in overdoses.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Infectious Diseases ---------------------------------------------- */}
        <AccordionItem value="infectious">
          <AccordionTrigger className="font-medium">🦠 Infectious Diseases</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <p>Staying current with vaccinations and regular testing helps curb community transmission.</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>COVID-19 :</strong> Booster uptake and indoor air filtration remain key prevention strategies.
              </li>
              <li>
                <strong>HIV/AIDS :</strong> NYC’s “Ending the Epidemic” plan aims for <em>&lt; 750</em> new diagnoses
                annually.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Maternal & Child -------------------------------------------------- */}
        <AccordionItem value="maternal-child">
          <AccordionTrigger className="font-medium">👶 Maternal &amp; Child Health</AccordionTrigger>
          <AccordionContent className="text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Infant Mortality :</strong> Highest in neighborhoods with limited prenatal care access. Doula
                programs show marked improvement.
              </li>
              <li>
                <strong>Maternal Mortality :</strong> Black women face a mortality rate 9× higher than White women—a key
                health-equity focus.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
