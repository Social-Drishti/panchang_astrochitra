import { createTranslatedProxy } from "@/content/languageStore";

const _GRAHAS = [
  {
    name: "Sun", sanskritName: "Surya", number: "01", image: "/grahs/optimized/sun.webp",
    represents: "Soul, ego, authority, father, government",
    profile: [
      { label: "Gender", value: "Purusha (Masculine)" }, { label: "Element", value: "Agni • Fire" }, { label: "Varna", value: "Kshatriya • Warrior, Leader" }, { label: "Taste", value: "Pungent" }, { label: "Direction", value: "East" }, { label: "Color", value: "Reddish-Orange" }, { label: "Guna", value: "Sattva • Pure" }, { label: "Rising", value: "From the back; effects felt later in period" }, { label: "Karakatva", value: "Father, soul, honor, fame, authority" }, { label: "Body Parts", value: "Heart, spine, head, nerves" }, { label: "Favorable Rashis", value: "Aries, Leo, Sagittarius, Cancer, Pisces, Scorpio" }, { label: "Unfavorable Rashis", value: "Libra (weakest), Taurus, Capricorn" },
    ],
    traits: "Square face, strong bones, natural leadership, desire for respect and recognition. Surya-dominant individuals carry an innate authority – confident, radiant, and self-possessed.",
    strongEffects: ["Leadership and authority", "Strong willpower and confidence", "Government favor and recognition", "Spiritual clarity and purpose", "Excellent health and vitality"],
    weakEffects: ["Arrogance and ego conflicts", "Strained relationship with father", "Eye and heart ailments", "Government opposition or legal trouble", "Burnout from overexertion"],
    detailedDescription: [
      "Surya – the Sun – is the sovereign of the celestial court, the singular luminary around which all of Vedic cosmology revolves. In the ancient Navagraha tradition, the Sun is not merely a star; it is the living representative of the Atman, the individuated soul that journeys through lifetimes accumulating karma and seeking liberation.",
      "Surya is a Purusha Graha (masculine planet) belonging to the Agni Tattva – the fire element – which makes it hot, radiant, and full of vital energy. It is simultaneously the Atma-karaka (significator of the soul) and the Prana-karaka (significator of life force). It is also the Pitru-karaka – the significator of the father.",
      "From a psychological lens, a strongly placed Sun produces individuals of commanding presence – people who walk into rooms and alter the atmosphere. Their confidence is not performance; it is a natural emanation of an inner certainty about who they are and why they are here.",
      "Surya rules the Leo sign and the Uttara Phalguni, Krittika, and Uttara Ashadha nakshatras. Its Mahadasha lasts six years – shorter than most planets – yet its impact can be profoundly transformative.",
      "When Surya is afflicted – hemmed by malefics or placed in debilitation in Libra – its shadow manifests as pride turned to hubris, authority turned to tyranny, or a deep wound around paternal relationships.",
      "Remedies for a weak Sun include practicing Surya Namaskar at dawn, offering water to the rising sun, wearing ruby on the ring finger of the right hand, and reciting the Aditya Hridayam.",
    ],
  },
  {
    name: "Moon", sanskritName: "Chandra", number: "02", image: "/grahs/optimized/moon.webp",
    represents: "Mind, emotions, mother, nurturing, intuition",
    profile: [
      { label: "Gender", value: "Stri (Feminine)" }, { label: "Element", value: "Jala • Water" }, { label: "Constitution", value: "Kapha Prakriti" }, { label: "Taste", value: "Salty" }, { label: "Direction", value: "Northwest" }, { label: "Color", value: "White, Silver" }, { label: "Guna", value: "Sattva • Pure, Calm" }, { label: "Rising", value: "From the head; effects felt early in period" }, { label: "Karakatva", value: "Mother, mind, emotions, beauty, popularity, fluids" }, { label: "Body Parts", value: "Stomach, breasts, fluids, lymph, reproductive cycles" }, { label: "Favorable Rashis", value: "Taurus, Cancer, Leo, Gemini, Virgo, Sagittarius, Pisces" }, { label: "Unfavorable Rashis", value: "Capricorn, Libra, Aquarius, Scorpio" },
    ],
    traits: "Round face, fair complexion, soft voice, emotional nature. Gentle, imaginative, compassionate – with strong intuition and a deep bond with mother, family, and homeland.",
    strongEffects: ["Emotional intelligence and empathy", "Strong intuition and psychic sensitivity", "Nurturing relationships and popularity", "Good memory and creative imagination", "Prosperity through public or maternal support"],
    weakEffects: ["Anxiety, mood swings, depression", "Emotional dependency and codependency", "Sleep disorders and restlessness", "Strained relationship with mother", "Vulnerability to psychic disturbances"],
    detailedDescription: [
      "Chandra, the Moon, is the mirror of the soul – the luminous, shifting counterpart to the Sun's fixed radiance. Where the Sun represents who we fundamentally are, the Moon reveals how we feel, how we respond, and how the tides of emotion shape our daily existence.",
      "Chandra is a Stri Graha (feminine planet) belonging to the Jala Tattva – the water element – making it cool, nourishing, and deeply emotional. It is the Matr-karaka – the significator of the mother and maternal love.",
      "The Moon's placement by sign and nakshatra at birth forms the Janma Rashi – the natal Moon sign – which Vedic astrologers consider even more important than the Sun sign. It is the filter through which all experience is processed emotionally.",
      "Chandra's strength varies dramatically with its lunar phase. During Shukla Paksha (waxing), the Moon is strong, nourishing, and uplifting. At Amavasya (new moon) it is at its weakest – the mind feels most unstable.",
      "Chandra also controls digestion, nourishment, and fluids in the body. It influences fertility, menstrual cycles, and emotional health. Its position in the sky affects human moods, ocean tides, and plant growth.",
      "Pearl (Moti) is the gemstone of the Moon, worn on Monday in the little finger of the right hand. Offering milk to a Shiva lingam, worshipping Goddess Lakshmi on full moon nights, and fasting on Mondays are classical remedies.",
    ],
  },
  {
    name: "Mars", sanskritName: "Mangal", number: "03", image: "/grahs/optimized/mangal.webp",
    represents: "Courage, will, siblings, property, passion",
    profile: [
      { label: "Gender", value: "Purusha (Masculine)" }, { label: "Element", value: "Agni • Fire" }, { label: "Varna", value: "Kshatriya • Warrior, Leader" }, { label: "Taste", value: "Bitter" }, { label: "Direction", value: "South" }, { label: "Color", value: "Red" }, { label: "Guna", value: "Tamas • Active, Fiery" }, { label: "Rising", value: "From the back; effects felt later in period" }, { label: "Karakatva", value: "Siblings, strength, courage, property, blood" }, { label: "Body Parts", value: "Blood, muscles, bone marrow" }, { label: "Favorable Rashis", value: "Aries, Scorpio, Capricorn, Cancer, Pisces" }, { label: "Unfavorable Rashis", value: "Libra, Taurus (generally challenging)" },
    ],
    traits: "Strong physique, athletic build, bold and direct speech, fearless demeanor. Competitive, decisive, and fiercely protective – Mangal-dominant people act where others merely intend.",
    strongEffects: ["Fierce courage and decisive action", "Athletic ability and physical stamina", "Success in competitive fields", "Strong property and real estate gains", "Leadership in military or technical fields"],
    weakEffects: ["Aggression, impulsiveness, violence", "Accidents and injuries, especially burns", "Conflict with siblings and partners", "Blood disorders and high blood pressure", "Manglik dosha affecting marriage"],
    detailedDescription: [
      "Mangal – Mars – is the warrior-planet, the embodiment of will made kinetic. In the Navagraha pantheon, Mangal commands respect and wariness in equal measure. It is the planet that separates those who act from those who merely intend.",
      "Mangal is a Purusha Graha (masculine planet) belonging to the Agni Tattva – the fire element. It is of Kshatriya varna, reflecting its warrior nature. Its Karakatva covers younger siblings, physical strength, courage, landed property, and the blood.",
      "A well-placed Mars produces individuals of extraordinary courage – soldiers, surgeons, athletes, engineers, and entrepreneurs who thrive under pressure. They do not shrink from confrontation; they lean into it.",
      "Mars rules Aries and Scorpio – two very different expressions of the same fiery will. In Aries, Mars is outward, direct, and spontaneous. In Scorpio, it turns inward, becoming investigative and psychologically penetrating.",
      "The infamous Manglik Dosha – affliction of Mars in the 1st, 4th, 7th, 8th, or 12th house – does not doom marriage; rather, it indicates that the individual's fiery, independent nature requires a partner of equal strength.",
      "To harmonize a challenging Mars, Vedic tradition recommends worshipping Lord Hanuman with red flowers and sesame oil lamps on Tuesdays. Wearing red coral (Moonga) in the ring finger, reciting the Mangal Stotra are powerful approaches.",
    ],
  },
  {
    name: "Mercury", sanskritName: "Budha", number: "04", image: "/grahs/optimized/budh.webp",
    represents: "Intellect, speech, commerce, youth, analysis",
    profile: [
      { label: "Gender", value: "Napunsaka (Neutral)" }, { label: "Element", value: "Prithvi • Earth" }, { label: "Varna", value: "Vaishya • Business, Trade" }, { label: "Taste", value: "Mixed" }, { label: "Direction", value: "North" }, { label: "Color", value: "Green" }, { label: "Guna", value: "Rajas • Active, Curious" }, { label: "Rising", value: "From the head; effects felt early in period" }, { label: "Karakatva", value: "Intellect, speech, maternal relatives, friends, skin, education" }, { label: "Body Parts", value: "Tongue, skin, hands, nervous system" }, { label: "Favorable Rashis", value: "Gemini, Virgo (own signs); 3, 6, 2, 7, 5, 10, 11" }, { label: "Unfavorable Rashis", value: "Pisces (debilitation); 9, 1, 8, 4" },
    ],
    traits: "Sharp intellect, witty, humorous, adaptable. Skilled in writing, speaking, and communication. Business-minded and calculative – can be restless or indecisive when afflicted.",
    strongEffects: ["Sharp analytical and logical ability", "Eloquence in speech and writing", "Success in business and trade", "Strong networking and social intelligence", "Quick learning and adaptability"],
    weakEffects: ["Anxiety, nervousness, overthinking", "Inconsistency and indecisiveness", "Skin conditions and nervous disorders", "Dishonesty or manipulative speech", "Difficulty concentrating or completing tasks"],
    detailedDescription: [
      "Budha – Mercury – is the trickster-sage of the Navagrahas, the divine messenger who moves with quicksilver agility between realms. Mercury governs the entire domain of the mind as it relates to the external world: language, logic, commerce, analysis, and communication.",
      "Budha is the Buddhi-karaka – the significator of intellect – and governs Vyavahari Buddhi (practical intelligence). It is a Napunsaka Graha (neutral planet), deeply adaptable. Its nature takes on the coloring of the planets it associates with.",
      "Budha belongs to the Prithvi Tattva (earth element), giving it qualities of balance, practicality, and perseverance. It is of Vaishya varna – reflecting its natural tendency toward business, trade, and communication.",
      "Mercury's seventeen-year Mahadasha is among the longest and most intellectually fertile periods in the dasha cycle. Communication-based careers – journalism, teaching, law, technology, sales, publishing – often flourish.",
      "The shadow of Mercury lies in its love of complexity. When afflicted, the mind can become its own prison – overanalyzing, second-guessing, and spinning narratives that serve anxiety rather than clarity.",
      "Green emerald (Panna) is the gem of Mercury, worn on the little finger. Worshipping Lord Vishnu on Wednesdays, feeding green grass to cows, and chanting the Budha Mantra are traditional remedies.",
    ],
  },
  {
    name: "Jupiter", sanskritName: "Guru", number: "05", image: "/grahs/optimized/guru.webp",
    represents: "Wisdom, dharma, guru, children, wealth expansion",
    profile: [
      { label: "Gender", value: "Purusha (Masculine)" }, { label: "Element", value: "Akasha • Ether" }, { label: "Varna", value: "Brahmana • Wise, Spiritual" }, { label: "Taste", value: "Sweet (Madhura)" }, { label: "Direction", value: "Northeast" }, { label: "Color", value: "Golden-Yellow" }, { label: "Guna", value: "Sattva • Pure, Righteous" }, { label: "Rising", value: "From both sides; effects felt in the middle of period" }, { label: "Karakatva", value: "Wisdom, children, wealth, dharma, prestige, health" }, { label: "Body Parts", value: "Stomach, digestion, fat tissues, liver, blood growth" }, { label: "Favorable Rashis", value: "Aries, Leo, Scorpio, Sagittarius, Pisces, Cancer" }, { label: "Unfavorable Rashis", value: "Taurus, Gemini, Virgo, Capricorn" },
    ],
    traits: "Fair complexion, calm nature, broad body, wise speech. Deep respect for tradition and a natural inclination toward spirituality, teaching, and service to others.",
    strongEffects: ["Wisdom, philosophy, and higher learning", "Abundance and financial expansion", "Excellent for marriage and children", "Spiritual growth and dharmic clarity", "Protection and blessings from the divine"],
    weakEffects: ["Over-optimism and poor judgment", "Weight gain and liver issues", "Difficulty with commitment or discipline", "Issues with teachers, mentors, or faith", "Legal or ethical complications"],
    detailedDescription: [
      "Guru – Jupiter – is the most beloved of the Navagrahas, the Great Benefic whose mere presence in a house illuminates it with wisdom, grace, and possibility. Jupiter is not merely a planet; it is the archetype of the Guru – the enlightened teacher.",
      "Guru is considered the Deva Guru (teacher of the gods) and is a Sattvic Graha. It belongs to the Akasha Tattva (ether element), symbolizing vastness, purity, and spiritual breadth.",
      "Jupiter's expansive nature is its defining quality. It magnifies whatever it touches – for better or for worse. When placed in the chart of a spiritually oriented person, Jupiter becomes a lamp in the darkness.",
      "The planet of dharma governs not just religion but right action – the alignment between one's inner truth and outer behavior. Those with a strong Jupiter often carry a natural ethical sensitivity.",
      "Jupiter's sixteen-year Mahadasha is widely considered the most auspicious period in the Vimshottari cycle. For many, this period brings marriage, children, professional elevation, and financial expansion.",
      "Yellow sapphire (Pukhraj) is Jupiter's gem, worn on the index finger of the right hand on Thursday. Serving teachers and elders, studying sacred texts, donating yellow foods and turmeric are among Jupiter's classical remedies.",
    ],
  },
  {
    name: "Venus", sanskritName: "Shukra", number: "06", image: "/grahs/optimized/shukar.webp",
    represents: "Love, beauty, art, luxury, marriage, desire",
    profile: [
      { label: "Gender", value: "Stri (Feminine)" }, { label: "Element", value: "Jala • Water" }, { label: "Varna", value: "Brahmana • Refined, Artistic" }, { label: "Taste", value: "Sour" }, { label: "Direction", value: "Southeast" }, { label: "Color", value: "White, Cream, Light Pink" }, { label: "Guna", value: "Rajas • Passion, Desire" }, { label: "Rising", value: "From the head; effects felt early in period" }, { label: "Karakatva", value: "Wife, marriage, romance, arts, wealth, beauty, luxury, vehicles" }, { label: "Body Parts", value: "Eyes, hair, reproductive organs, kidneys" }, { label: "Favorable Rashis", value: "Taurus, Libra, Pisces" }, { label: "Unfavorable Rashis", value: "Aries, Virgo, Scorpio, Capricorn, Leo" },
    ],
    traits: "Attractive personality, charming smile, graceful appearance. Medium build, beautiful eyes, radiant skin. Fond of luxury, music, dance, poetry, and the fine arts.",
    strongEffects: ["Magnetic charm and physical beauty", "Happy, harmonious marriage", "Artistic talent and aesthetic refinement", "Wealth through luxury goods and beauty industry", "Sensual enjoyment and pleasurable experiences"],
    weakEffects: ["Excessive indulgence and addiction", "Infidelity or relationship complications", "Kidney disorders and hormonal issues", "Vanity, superficiality, and materialism", "Financial instability through overspending"],
    detailedDescription: [
      "Shukra – Venus – is the planet of desire made beautiful, the luminous evening star that has captivated human hearts since the first poets looked skyward and reached for metaphor. Venus is the teacher of the asuras – the divine preceptor of those who walk the razor's edge between worldly enjoyment and spiritual liberation.",
      "Shukra is a Stri Graha (feminine planet) belonging to the Jala Tattva – the water element – making it emotional, imaginative, and deeply relational. It governs marriage, conjugal happiness, luxury, art, music, dance, drama, and all forms of entertainment.",
      "A well-placed Venus in the birth chart bestows what the ancients called Lakshmi Yoga – the grace of the goddess of prosperity and beauty. These individuals move through the world with an almost effortless magnetism.",
      "Venus rules both Taurus and Libra. In Taurus, Venus is sensuous and grounded. In Libra, it becomes social, relational, and oriented toward balance. Its twenty-year Mahadasha is the longest in the Vimshottari cycle.",
      "Shukra in Vedic mythology teaches a peculiarly difficult lesson: how to enjoy the world fully without being enslaved by it. This is the yoga of aesthetic awareness – the capacity to be moved by beauty without clinging to it.",
      "Diamond (Heera) is the gem of Venus, worn on the middle or ring finger. Worshipping Goddess Lakshmi on Fridays, offering white flowers and sweets, and practicing Bhakti arts are among Venus's classical remedies.",
    ],
  },
  {
    name: "Saturn", sanskritName: "Shani", number: "07", image: "/grahs/optimized/shanidev.webp",
    represents: "Karma, discipline, longevity, service, delays",
    profile: [
      { label: "Gender", value: "Napunsaka (Neutral)" }, { label: "Element", value: "Vayu • Air" }, { label: "Varna", value: "Shudra • Labor, Discipline, Service" }, { label: "Taste", value: "Astringent" }, { label: "Direction", value: "West" }, { label: "Color", value: "Black, Dark Blue" }, { label: "Guna", value: "Tamas • Heavy, Obstructive" }, { label: "Rising", value: "From the back; slow and steady, effects felt late in period" }, { label: "Karakatva", value: "Sorrow, poverty, longevity, discipline, justice, labor, detachment" }, { label: "Body Parts", value: "Bones, joints, teeth, nervous system, chronic diseases" }, { label: "Favorable Rashis", value: "Capricorn, Aquarius, Libra (exaltation), Taurus, Gemini" }, { label: "Unfavorable Rashis", value: "Aries (debilitation), Cancer, Leo, Scorpio" },
    ],
    traits: "Serious, disciplined, hardworking, patient, reserved. Often tall and lean with strong bones. May face struggles early in life but gains wisdom, stability, and quiet authority later.",
    strongEffects: ["Extraordinary discipline and endurance", "Long-term success through sustained effort", "Mastery in technical or service fields", "Deep philosophical wisdom and detachment", "Longevity and structural stability in life"],
    weakEffects: ["Chronic delays, obstacles, and depression", "Joint pain, bone issues, chronic illness", "Poverty, isolation, or social marginalization", "Fear, pessimism, and existential despair", "Conflict with authority and the law"],
    detailedDescription: [
      "Shani – Saturn – is perhaps the most misunderstood and feared of the Navagrahas, and also the most profound teacher. In the Vedic tradition, Saturn is the great equalizer – the cosmic force that ensures no karma, good or ill, goes unwitnessed.",
      "Shani is a Napunsaka Graha (neutral planet) belonging to the Vayu Tattva – the air element. It is both the Ayushya-karaka (significator of longevity) and the Dukh-karaka (significator of sorrow, poverty, and obstacles).",
      "To encounter Saturn in its fullness – through Sade Sati, through Saturn's own Mahadasha, or through a prominent natal placement – is to be invited into a fundamental reckoning with reality. Saturn strips away illusions and false identities.",
      "Saturn rules Capricorn and Aquarius – the signs of structure, society, and systemic thinking. Those with strong Saturn placements are often the builders, the administrators, the long-game players.",
      "The nineteen-year Mahadasha of Saturn is rarely comfortable – but often enormously productive for those who approach it with humility and consistent effort. Saturn rewards work, responsibility, and service.",
      "Blue sapphire (Neelam) is Saturn's stone – powerful and fast-acting, which is why it must be tested carefully before wearing. Serving the elderly, poor, and disabled; donating black sesame on Saturdays are traditional remedies.",
    ],
  },
  {
    name: "Rahu", sanskritName: "Rahu", number: "08", image: "/grahs/optimized/rahu.webp",
    represents: "Obsession, illusion, foreign connections, unconventional paths",
    profile: [
      { label: "Nature", value: "Chhaya Graha • Shadow Planet (no physical body)" }, { label: "Gender", value: "Napunsaka (Neutral)" }, { label: "Element", value: "Vayu (Air) + Jala (Water)" }, { label: "Taste", value: "Smoky, Indeterminate" }, { label: "Direction", value: "Southwest" }, { label: "Color", value: "Smoky, Dull, Cloudy" }, { label: "Guna", value: "Tamas • Darkness, Illusion" }, { label: "Behavior", value: "Acts like Shani • delays, illusion, karmic lessons" }, { label: "Karakatva", value: "Paternal grandfather, foreign connections, hidden illness, scandal" }, { label: "Body Parts", value: "Brain, nervous system, poison-related conditions" }, { label: "Favorable Houses", value: "9th, 3rd, 4th, 8th, 10th • can give power, fame, authority" }, { label: "Unfavorable Houses", value: "6th, 8th, 12th • diseases; 2nd, 4th, 7th • domestic strife" },
    ],
    traits: "Magnetic, unconventional, intensely ambitious. Rahu-dominant individuals are drawn toward foreign environments, novel experiences, and paths outside social norms.",
    strongEffects: ["Extraordinary ambition and worldly success", "Fame and recognition, especially through foreign means", "Breakthroughs in technology and innovation", "Magnetic, unconventional charisma", "Rapid material advancement"],
    weakEffects: ["Deception, illusion, and confusion", "Addiction and obsessive behavior", "Mysterious illnesses hard to diagnose", "Paranoia and fear of the unseen", "Sudden falls from success"],
    detailedDescription: [
      "Rahu is the cosmic point of desire unfulfilled – the ascending node of the Moon, a shadow entity with no physical body but profound gravitational influence over human consciousness. In Vedic mythology, Rahu and Ketu were born from the severing of the demon Svarbhanu.",
      "Rahu is not a physical planet but a Chhaya Graha (shadow planet). It behaves much like Shani – carrying qualities of delay, illusion, obstacles, and karmic lessons. Its nature is Tamas – darkness, illusion, and the compulsive pull toward what has not yet been mastered.",
      "Rahu's nature is fundamentally insatiable. It represents those desires from past lives that were never fulfilled – experiences the soul craves with a hunger that transcends rational explanation.",
      "Rahu amplifies whatever house and sign it occupies. In the 10th house it creates career obsession. In the 7th it creates relationship hunger. Its eighteen-year Mahadasha is often the most dramatically transformative period in a native's life.",
      "Rahu is the Karaka of poisonous creatures – snakes, scorpions, and venom. It rules over poison, toxins, infections, and urinary troubles. When strong, it can grant Yash (fame), Pratishtha (prestige), and Rajyoga (authority).",
      "Hessonite garnet (Gomed) is the traditional gem for Rahu. The deepest work with Rahu involves developing the discriminative wisdom to distinguish genuine inspiration from compulsive craving.",
    ],
  },
  {
    name: "Ketu", sanskritName: "Ketu", number: "09", image: "/grahs/optimized/ketu.webp",
    represents: "Liberation, spirituality, past life, psychic gifts, detachment",
    profile: [
      { label: "Nature", value: "Chhaya Graha • Shadow Planet (no physical body)" }, { label: "Element", value: "Akasha • Ether" }, { label: "Varna", value: "Mixed / Outcast • unconventional, mystical" }, { label: "Taste", value: "Pungent, Smoky" }, { label: "Direction", value: "Southwest" }, { label: "Color", value: "Dull Grey, Smoky, Ashy" }, { label: "Guna", value: "Tamas (base) • transforms to Sattva at spiritual peak" }, { label: "Rising", value: "Sudden, unexpected • brings abrupt karmic shifts" }, { label: "Karakatva", value: "Spirituality, moksha, maternal grandfather, scars, past-life karmas" }, { label: "Body Parts", value: "Scars, mysterious diseases, immune system, psychic centers" }, { label: "Favorable Rashis", value: "Sagittarius, Pisces, Taurus, Libra, Aries, Scorpio" }, { label: "Unfavorable Rashis", value: "1, 2, 3, 5, 7, 10 • worldly disruption, identity confusion" },
    ],
    traits: "Deeply spiritual, detached from material pleasures, intuitive, mystical, sometimes eccentric. May experience sudden losses or separations – but these often redirect the soul toward higher truth.",
    strongEffects: ["Profound spiritual insight and psychic ability", "Mastery in mystical and occult sciences", "Liberation from material bondage", "Strong intuition and precognitive ability", "Excellence in research, healing, and isolation work"],
    weakEffects: ["Isolation, detachment from family", "Mysterious or hard-to-diagnose illnesses", "Confusion about identity and purpose", "Sudden losses and separations", "Escapism and spiritual bypassing"],
    detailedDescription: [
      "Ketu – the South Node of the Moon – is the most otherworldly of the Navagrahas, the headless half of the severed Svarbhanu whose tail still travels the zodiac in perpetual retrograde. Where Rahu hungers for what it has not yet experienced, Ketu has already been there.",
      "Ketu is a Chhaya Graha (shadow planet) belonging to the Akasha Tattva (ether element), symbolizing spiritual wisdom, detachment, purity, and cosmic consciousness. It is associated with sanyasa (renunciation), tyaga (sacrifice), tapasya (penance), and upasana (devotion).",
      "Ketu's influence in a chart is characteristically unworldly. Wherever Ketu sits, the native often shows extraordinary natural talent but a curious detachment from it. The gifts are real; the attachment is absent.",
      "This is Ketu's paradox and its gift: it shows us what we have mastered across lifetimes, and in doing so, it frees us from the illusion that mastery in these areas will make us whole.",
      "The seven-year Mahadasha of Ketu is often one of the most spiritually potent and materially disorienting periods of a native's life. Circumstances conspire to strip away identifications – not from cruelty but from cosmic precision.",
      "Cat's eye (Lehsunia) is Ketu's gemstone. Meditation – particularly practices that cultivate witness consciousness and the art of non-attachment – is perhaps the most effective modern remedy for Ketu.",
    ],
  },
];

export const GRAHAS = _GRAHAS;
export const grahas = createTranslatedProxy(_GRAHAS);
