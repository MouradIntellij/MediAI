const riskKeywords = {
  chest: 3,
  dyspnea: 3,
  fever: 2,
  dizziness: 2,
  bleeding: 3,
  pregnancy: 2,
  diabetes: 2,
  hypertension: 2,
  allergy: 2,
  pain: 1
};

const interactionRules = [
  {
    a: "warfarin",
    b: "ibuprofen",
    severity: "high",
    message: "Risque augmente de saignement avec anticoagulant et AINS."
  },
  {
    a: "metformin",
    b: "contrast",
    severity: "medium",
    message: "Surveiller la fonction renale lors d'un produit de contraste."
  },
  {
    a: "lisinopril",
    b: "spironolactone",
    severity: "medium",
    message: "Risque d'hyperkaliemie, controle du potassium recommande."
  }
];

export function summarizeClinicalText(text = "") {
  const sentences = text
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return {
    summary:
      sentences.slice(0, 2).join(". ") ||
      "Aucun contenu clinique suffisant pour produire un resume.",
    detectedTerms: Object.keys(riskKeywords).filter((keyword) =>
      text.toLowerCase().includes(keyword)
    )
  };
}

export function estimatePatientRisk({ patient, vitals = {}, notes = "" }) {
  let score = 0;
  const reasons = [];

  if (patient?.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age >= 70) {
      score += 2;
      reasons.push("Age avance");
    }
  }

  const systolic = Number(vitals.systolic || 0);
  const temperature = Number(vitals.temperature || 0);
  const oxygen = Number(vitals.oxygen || 100);

  if (systolic >= 160) {
    score += 2;
    reasons.push("Pression arterielle elevee");
  }
  if (temperature >= 38.5) {
    score += 2;
    reasons.push("Fievre significative");
  }
  if (oxygen && oxygen < 94) {
    score += 3;
    reasons.push("Saturation en oxygene basse");
  }

  const lowerNotes = notes.toLowerCase();
  for (const [keyword, weight] of Object.entries(riskKeywords)) {
    if (lowerNotes.includes(keyword)) {
      score += weight;
      reasons.push(`Terme clinique detecte: ${keyword}`);
    }
  }

  const level = score >= 7 ? "high" : score >= 4 ? "medium" : "low";
  return {
    score,
    level,
    reasons,
    recommendation:
      level === "high"
        ? "Prioriser une evaluation medicale rapide."
        : level === "medium"
          ? "Planifier un suivi rapproche et verifier les constantes."
          : "Suivi standard recommande."
  };
}

export function detectMedicationInteractions(medications = []) {
  const normalized = medications.map((item) => item.toLowerCase());
  return interactionRules.filter(
    (rule) =>
      normalized.some((name) => name.includes(rule.a)) &&
      normalized.some((name) => name.includes(rule.b))
  );
}
