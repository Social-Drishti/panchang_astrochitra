export interface GrahaData {
  name: string;
  sanskritName: string;
  represents: string;
  karakatva: string;
  traits: string;
}

export const GRAHAS: GrahaData[] = [
  {
    name: "Sun",
    sanskritName: "Surya",
    represents: "Identity, confidence, authority, father and recognition",
    karakatva: "Father, soul, honor, fame and authority",
    traits: "The Sun is associated with confidence, leadership, self‑respect and the desire to take responsibility and be recognized."
  },
  {
    name: "Moon",
    sanskritName: "Chandra",
    represents: "Emotions, mind, intuition, mother and nurturing",
    karakatva: "Mother, mind, emotions, beauty, popularity and fluids",
    traits: "The Moon reflects receptivity, mood fluctuations, caring instincts and a need for emotional security."
  },
  {
    name: "Mars",
    sanskritName: "Mangal",
    represents: "Energy, courage, action, siblings and drive",
    karakatva: "Siblings, strength, courage, property and blood",
    traits: "Mars brings assertiveness, competitiveness, physical vitality and a tendency to act quickly."
  },
  {
    name: "Mercury",
    sanskritName: "Budha",
    represents: "Intellect, communication, learning, commerce and adaptability",
    karakatva: "Intellect, speech, maternal relatives, friends, skin and education",
    traits: "Mercury supports analytical thinking, clear expression, curiosity and skill in trade or writing."
  },
  {
    name: "Jupiter",
    sanskritName: "Guru",
    represents: "Wisdom, growth, spirituality, children and expansion",
    karakatva: "Wisdom, children, wealth, dharma, prestige and health",
    traits: "Jupiter encourages optimism, teaching, moral values and the pursuit of higher knowledge."
  },
  {
    name: "Venus",
    sanskritName: "Shukra",
    represents: "Love, beauty, relationships, arts and pleasure",
    karakatva: "Spouse, marriage, romance, arts, wealth, beauty, luxury and vehicles",
    traits: "Venus governs attraction, harmony, aesthetic appreciation and enjoyment of comforts."
  },
  {
    name: "Saturn",
    sanskritName: "Shani",
    represents: "Discipline, responsibility, time, karma and endurance",
    karakatva: "Sorrow, poverty, longevity, discipline, justice, labor and detachment",
    traits: "Saturn teaches patience, structure, perseverance and the value of hard work over time."
  },
  {
    name: "Rahu",
    sanskritName: "Rahu",
    represents: "Ambition, unconventional paths, foreign links and obsession",
    karakatva: "Paternal grandfather, foreign connections, hidden illness and scandal",
    traits: "Rahu drives intense desire for worldly experience, innovation and breaking boundaries."
  },
  {
    name: "Ketu",
    sanskritName: "Ketu",
    represents: "Detachment, spirituality, past‑life skills and liberation",
    karakatva: "Spirituality, moksha, maternal grandfather, scars and past‑life karmas",
    traits: "Ketu brings intuitive insight, disinterest in material gain and a pull toward inner exploration."
  }
];

export function getGrahaByName(name: string) {
  return GRAHAS.find(g => g.name === name);
}

export function getGrahaBySanskritName(name: string) {
  return GRAHAS.find(g => g.sanskritName === name);
}