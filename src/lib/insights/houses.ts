export interface HouseData {
  number: number;
  title: string;
  sanskrit: string;
  tags: string[];
  shortDesc: string;
  governs: string[];
  deeper: string;
}

export const HOUSES: HouseData[] = [
  { number: 1, title: "First House Self & Appearance", sanskrit: "जन्म स्थान · Birth / Central Place", tags: ["Identity", "Body", "Prestige"],
    shortDesc: "The 1st house represents you — your personality, physical appearance, health, natural temperament and how others perceive you.",
    governs: ["Physical appearance and body structure", "Personality traits and natural disposition", "Overall vitality and immunity", "First impressions and self‑image"],
    deeper: "Also called the Ascendant (Lagna), it sets the foundation for the entire chart. It describes your default approach to life and the lens through which you experience the world." },
  { number: 2, title: "Second House Wealth & Family", sanskrit: "धन / कुटुंब स्थान · Wealth / Family Place", tags: ["Wealth", "Family", "Speech"],
    shortDesc: "The 2nd house governs accumulated resources, family values, speech and the things you consider yours.",
    governs: ["Money, savings and material possessions", "Family lineage and early upbringing", "Speech, voice and communication style", "Food habits and facial features (teeth, lips)"],
    deeper: "Wealth here is not only money — it includes the values you inherit, the way you express yourself, and the security you build." },
  { number: 3, title: "Third House Courage & Communication", sanskrit: "साहस / भांडण स्थान · Courage / Conflict Place", tags: ["Courage", "Siblings", "Writing"],
    shortDesc: "The 3rd house covers personal effort, siblings, short journeys, communication, writing and hobbies.",
    governs: ["Courage, initiative and risk‑taking", "Siblings, cousins and close peers", "Writing, speaking, publishing and learning", "Short travels and manual dexterity"],
    deeper: "This house shows how you assert yourself in everyday situations and the style of your mental expression." },
  { number: 4, title: "Fourth House Home & Mother", sanskrit: "मातृ स्थान · Mother's Place", tags: ["Home", "Emotions", "Property"],
    shortDesc: "The 4th house represents your inner foundation — home, mother, emotional security and real estate.",
    governs: ["Home environment and domestic peace", "Mother and maternal influences", "Land, property, vehicles and comforts", "Education, heart and mental wellbeing"],
    deeper: "It reflects where you feel safe, your roots, and the emotional base from which you operate." },
  { number: 5, title: "Fifth House Creativity & Children", sanskrit: "विद्या / यांत्रिकी स्थान · Education / Creativity Place", tags: ["Education", "Children", "Romance"],
    shortDesc: "The 5th house governs creativity, intelligence, romance, children, speculation and spiritual practices.",
    governs: ["Education, learning and intellectual pursuits", "Children, pregnancy and parenting", "Love affairs, artistic expression and hobbies", "Speculative gains, mantra and philosophy"],
    deeper: "This house bridges joy and responsibility — what you create, whether ideas, art or the next generation." },
  { number: 6, title: "Sixth House Work & Health", sanskrit: "ऋतु स्थान · Seasons / Disease Place", tags: ["Health", "Service", "Challenges"],
    shortDesc: "The 6th house deals with daily work, health, obstacles, debts and service to others.",
    governs: ["Health, illness and recovery", "Routine work, employment and coworkers", "Conflicts, litigation and enemies", "Debts, habits and self‑improvement"],
    deeper: "Challenges here are not punishments but opportunities to develop discipline, resilience and practical skills." },
  { number: 7, title: "Seventh House Partnerships", sanskrit: "विवाह स्थान · Marriage Place", tags: ["Marriage", "Partnership", "Contracts"],
    shortDesc: "The 7th house represents committed relationships — marriage, business partnerships and significant one‑to‑one bonds.",
    governs: ["Spouse and marital life", "Business partners and contracts", "Public dealings and negotiations", "Balance between self and other"],
    deeper: "It mirrors how you relate to equals and what you seek in a partner, both personal and professional." },
  { number: 8, title: "Eighth House Transformation", sanskrit: "व्यय / मोक्ष स्थान · Transformation Place", tags: ["Transformation", "Secrets", "Shared Resources"],
    shortDesc: "The 8th house covers deep change, shared assets, inheritance, mysteries and psychological depth.",
    governs: ["Joint finances, inheritance and taxes", "Crisis, sudden events and rebirth", "Occult, research and hidden knowledge", "Longevity and intimate bonds"],
    deeper: "Though often feared, this house is where profound growth occurs through letting go and merging with something larger." },
  { number: 9, title: "Ninth House Belief & Fortune", sanskrit: "धर्म स्थान · Dharma / Fortune Place", tags: ["Faith", "Wisdom", "Travel"],
    shortDesc: "The 9th house governs higher learning, philosophy, religion, long journeys and good fortune.",
    governs: ["Spiritual beliefs, ethics and dharma", "Higher education, teachers and gurus", "Long‑distance travel and foreign cultures", "Luck, blessings and father's guidance"],
    deeper: "It shows the principles that guide your life and the expansion of mind through experience and study." },
  { number: 10, title: "Tenth House Career & Reputation", sanskrit: "कर्म स्थान · Karma / Career Place", tags: ["Career", "Authority", "Legacy"],
    shortDesc: "The 10th house represents your public role — career, status, authority and the legacy you build.",
    governs: ["Profession, vocation and achievements", "Public reputation and social standing", "Government, leadership and responsibility", "Father's influence and family honor"],
    deeper: "This is the summit of the chart — how you contribute to society and are recognized for your actions." },
  { number: 11, title: "Eleventh House Gains & Networks", sanskrit: "ग्राह स्थान · Gains / Friendship Place", tags: ["Gains", "Friends", "Aspirations"],
    shortDesc: "The 11th house shows income from efforts, friendships, social circles and fulfillment of desires.",
    governs: ["Earnings, profits and side income", "Friends, groups and community involvement", "Hopes, wishes and long‑term goals", "Elder siblings and network support"],
    deeper: "It reflects the rewards that come through collaboration and the realization of aspirations." },
  { number: 12, title: "Twelfth House Liberation & Loss", sanskrit: "मोक्ष स्थान · Liberation / Expense Place", tags: ["Spirituality", "Release", "Solitude"],
    shortDesc: "The 12th house deals with endings, expenses, seclusion, spirituality and the subconscious.",
    governs: ["Expenses, losses and charity", "Hospitals, retreats and foreign lands", "Dreams, intuition and hidden enemies", "Meditation, renunciation and moksha"],
    deeper: "While associated with loss, this house is the gateway to spiritual freedom — letting go of ego attachments." }
];

export function getHouseByNumber(num: number) {
  return HOUSES.find(h => h.number === num);
}