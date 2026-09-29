export const GENERIC_INSIGHTS = {
  ascendant:
    "Your Ascendant (Lagna) represents you — your personality, physical appearance, natural behavior, vitality, and the way you approach life. It is also the starting point from which the 12 houses of your Kundli are understood.",

  rashi:
    "Your Rashi shows the style in which a planet or the Ascendant expresses itself. It adds qualities such as temperament, energy, stability, communication, emotions, and approach to different situations.",

  nakshatra:
    "Your Nakshatra adds a deeper layer to a planetary placement. It describes finer personality tendencies, habits, motivations, and the way a planet's qualities are naturally expressed.",

  house:
    "Each house in your Kundli represents a different area of life. For example, the 1st house relates to you, the 2nd to wealth and family, the 7th to relationships, and the 10th to career. A planet placed in a house brings its qualities into that area of life.",

  karakatva:
    "Karakatva means what a planet naturally represents. For example, the Sun represents authority and father, the Moon represents the mind and mother, Mars represents courage and siblings, and Venus represents love and marriage.",

  planet:
    "Each planet represents a different set of qualities and life themes. The Sun represents identity and authority, the Moon represents emotions and the mind, Mars represents courage and action, and so on. Its position in your Kundli shows where these qualities become important.",

  dasha:
    "A Dasha is a planetary time period. The planet ruling the current period highlights certain themes in life, while the smaller sub‑periods add more detail to that influence."
} as const;

export type GenericInsightKey = keyof typeof GENERIC_INSIGHTS;