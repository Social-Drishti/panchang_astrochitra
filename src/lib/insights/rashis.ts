export interface RashiData {
  id: number;
  name: string;
  sanskritName: string;
  lord: string;
  nature: string;
  gender: string;
  element: string;
  guna: string;
  varna: string;
  nakshatras: string;
  personality: string;
  represents: string;
  traits: string;
  tags?: string[];
}

export const RASHIS: RashiData[] = [
  {
    id: 1,
    name: "Aries",
    sanskritName: "Mesh",
    lord: "Mars (Mangal)",
    nature: "Movable (Char)",
    gender: "Masculine (Purush)",
    element: "Fire",
    guna: "Rajas",
    varna: "Kshatriya",
    nakshatras: "Ashwini, Bharani, Krittika (1st Charan)",
    personality: "Energetic, courageous, independent and action‑oriented. Tends to approach situations directly and prefers taking initiative.",
    represents: "Head, bold initiative, raw energy, leadership",
    traits: "Aries natives are quick to act, confident, and enjoy challenges. They value freedom and can be impatient with delays."
  },
  {
    id: 2,
    name: "Taurus",
    sanskritName: "Vrishabh",
    lord: "Venus (Shukra)",
    nature: "Fixed (Sthir)",
    gender: "Feminine (Stree)",
    element: "Earth",
    guna: "Rajas",
    varna: "Vaishya",
    nakshatras: "Krittika (2nd‑4th Charan), Rohini, Mrigashira (1st‑2nd Charan)",
    personality: "Steady, patient and practical. Values stability, comfort, security and things that can be built and maintained over time.",
    represents: "Throat, senses, wealth, beauty, endurance",
    traits: "Taurus natives are reliable, enjoy material comforts, and work persistently toward long‑term goals."
  },
  {
    id: 3,
    name: "Gemini",
    sanskritName: "Mithun",
    lord: "Mercury (Budh)",
    nature: "Dual (Dwisvabhavy)",
    gender: "Masculine (Purush)",
    element: "Air",
    guna: "Sattva",
    varna: "Shudra",
    nakshatras: "Mrigashira (3rd‑4th Charan), Ardra, Punarvasu (1st‑3rd Charan)",
    personality: "Curious, communicative and adaptable. Enjoys learning, variety and exchanging ideas.",
    represents: "Arms, communication, intellect, adaptability",
    traits: "Gemini natives are quick‑witted, versatile and often juggle multiple interests at once."
  },
  {
    id: 4,
    name: "Cancer",
    sanskritName: "Karka",
    lord: "Moon (Chandra)",
    nature: "Movable (Char)",
    gender: "Feminine (Stree)",
    element: "Water",
    guna: "Sattva",
    varna: "Vipra (Brahmin)",
    nakshatras: "Punarvasu (4th Charan), Pushya, Ashlesha",
    personality: "Sensitive, nurturing and protective. Deeply connected to home, family and emotional security.",
    represents: "Chest, heart, emotions, home, motherhood",
    traits: "Cancer natives are intuitive, caring, and value close relationships and a sense of belonging."
  },
  {
    id: 5,
    name: "Leo",
    sanskritName: "Simha",
    lord: "Sun (Ravi)",
    nature: "Fixed (Sthir)",
    gender: "Masculine (Purush)",
    element: "Fire",
    guna: "Rajas",
    varna: "Kshatriya",
    nakshatras: "Magha, Purva Phalguni, Uttara Phalguni (1st Charan)",
    personality: "Confident, generous and expressive. Seeks recognition, creativity and a sense of purpose.",
    represents: "Heart, spine, leadership, self‑expression, authority",
    traits: "Leo natives are warm, loyal, and enjoy being in the spotlight while supporting those they care about."
  },
  {
    id: 6,
    name: "Virgo",
    sanskritName: "Kanya",
    lord: "Mercury (Budh)",
    nature: "Dual (Dwisvabhavy)",
    gender: "Feminine (Stree)",
    element: "Earth",
    guna: "Sattva",
    varna: "Vaishya",
    nakshatras: "Uttara Phalguni (2nd‑4th Charan), Hasta, Chitra (1st‑2nd Charan)",
    personality: "Analytical, detail‑oriented and service‑minded. Prefers order, practicality and continuous improvement.",
    represents: "Stomach, intestines, analysis, service, purification",
    traits: "Virgo natives are diligent, observant, and excel at organizing, problem‑solving and helping others."
  },
  {
    id: 7,
    name: "Libra",
    sanskritName: "Tula",
    lord: "Venus (Shukra)",
    nature: "Movable (Char)",
    gender: "Masculine (Purush)",
    element: "Air",
    guna: "Rajas",
    varna: "Shudra",
    nakshatras: "Chitra (3rd‑4th Charan), Swati, Vishakha (1st‑3rd Charan)",
    personality: "Diplomatic, fairness‑seeking and aesthetically inclined. Values harmony, partnership and balance.",
    represents: "Waist, kidneys, balance, partnerships, diplomacy",
    traits: "Libra natives are sociable, consider multiple perspectives, and strive for equitable outcomes."
  },
  {
    id: 8,
    name: "Scorpio",
    sanskritName: "Vrishchik",
    lord: "Mars (Mangal)",
    nature: "Fixed (Sthir)",
    gender: "Feminine (Stree)",
    element: "Water",
    guna: "Tamas",
    varna: "Vipra (Brahmin)",
    nakshatras: "Vishakha (4th Charan), Anuradha, Jyeshtha",
    personality: "Intense, perceptive and resilient. Drawn to depth, transformation and uncovering hidden truths.",
    represents: "Reproductive organs, transformation, hidden depths, secrecy",
    traits: "Scorpio natives are determined, private, and possess strong emotional stamina."
  },
  {
    id: 9,
    name: "Sagittarius",
    sanskritName: "Dhanu",
    lord: "Jupiter (Guru)",
    nature: "Dual (Dwisvabhavy)",
    gender: "Masculine (Purush)",
    element: "Fire",
    guna: "Sattva",
    varna: "Kshatriya",
    nakshatras: "Mula, Purva Ashadha, Uttara Ashadha (1st Charan)",
    personality: "Optimistic, philosophical and freedom‑loving. Enjoys exploration, higher learning and broad perspectives.",
    represents: "Thighs, higher wisdom, dharma, exploration, philosophy",
    traits: "Sagittarius natives are adventurous, honest, and seek meaning through experience and knowledge."
  },
  {
    id: 10,
    name: "Capricorn",
    sanskritName: "Makar",
    lord: "Saturn (Shani)",
    nature: "Movable (Char)",
    gender: "Feminine (Stree)",
    element: "Earth",
    guna: "Tamas",
    varna: "Vaishya",
    nakshatras: "Uttara Ashadha (2nd‑4th Charan), Shravan, Dhanishta (1st‑2nd Charan)",
    personality: "Disciplined, ambitious and pragmatic. Focuses on long‑term achievement, responsibility and structure.",
    represents: "Knees, bones, discipline, structure, career, reputation",
    traits: "Capricorn natives are patient, reliable, and build lasting results through steady effort."
  },
  {
    id: 11,
    name: "Aquarius",
    sanskritName: "Kumbh",
    lord: "Saturn (Shani)",
    nature: "Fixed (Sthir)",
    gender: "Masculine (Purush)",
    element: "Air",
    guna: "Tamas",
    varna: "Shudra",
    nakshatras: "Dhanishta (3rd‑4th Charan), Shatabhisha, Purva Bhadrapada (1st‑3rd Charan)",
    personality: "Innovative, independent and community‑oriented. Values progress, originality and collective welfare.",
    represents: "Calves, ankles, innovation, humanitarianism, collective vision",
    traits: "Aquarius natives think ahead, enjoy unconventional ideas, and often work toward social improvement."
  },
  {
    id: 12,
    name: "Pisces",
    sanskritName: "Meen",
    lord: "Jupiter (Guru)",
    nature: "Dual (Dwisvabhavy)",
    gender: "Feminine (Stree)",
    element: "Water",
    guna: "Sattva",
    varna: "Vipra (Brahmin)",
    nakshatras: "Purva Bhadrapada (4th Charan), Uttara Bhadrapada, Revati",
    personality: "Compassionate, imaginative and intuitive. Feels deeply, seeks spiritual connection and creative expression.",
    represents: "Feet, liberation, compassion, spiritual surrender, dissolution",
    traits: "Pisces natives are empathetic, artistic, and often blur the line between self and others."
  }
];

export function getRashiByName(name: string) {
  return RASHIS.find(r => r.name === name);
}

export function getRashiBySanskritName(name: string) {
  return RASHIS.find(r => r.sanskritName === name);
}

export function getRashiById(id: number) {
  return RASHIS.find(r => r.id === id);
}