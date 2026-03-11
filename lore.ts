export interface BestiaryEntry {
  id: string;
  name: string;
  type: 'fauna' | 'flora' | 'myth' | 'food';
  description: string;
  unlockRequirement: number; // Total chiguiros eaten to unlock
  icon: string; // Emoji or image URL
}

export const BESTIARY_ENTRIES: BestiaryEntry[] = [
  {
    id: 'chiguiro',
    name: 'Chigüiro (Capybara)',
    type: 'fauna',
    description: 'The largest rodent in the world. They are semi-aquatic and highly social, often found near bodies of water in the Llanos. They are the primary prey in this game!',
    unlockRequirement: 0,
    icon: '🦦'
  },
  {
    id: 'corocora',
    name: 'Corocora (Scarlet Ibis)',
    type: 'fauna',
    description: 'A brilliantly red bird native to the Orinoquía. Their vibrant color comes from their diet of crustaceans. Seeing a flock of Corocoras in flight is a breathtaking Llanero experience.',
    unlockRequirement: 10,
    icon: '🦩'
  },
  {
    id: 'oso_palmero',
    name: 'Oso Palmero (Giant Anteater)',
    type: 'fauna',
    description: 'Known for its elongated snout and massive bushy tail. It wanders the savannas seeking out ant and termite mounds, using its long, sticky tongue to feed.',
    unlockRequirement: 25,
    icon: '🐜'
  },
  {
    id: 'anaconda',
    name: 'Anaconda (Güio Negro)',
    type: 'fauna',
    description: 'One of the largest snakes in the world. In the Llanos, they are both feared and respected, often lurking in the flooded esteros during the rainy season.',
    unlockRequirement: 50,
    icon: '🐍'
  },
  {
    id: 'silbon',
    name: 'El Silbón (The Whistler)',
    type: 'myth',
    description: 'A legendary ghost of the Llanos. He is said to be a giant carrying a sack of bones. If his whistle sounds close, he is far away; if it sounds far, he is right behind you!',
    unlockRequirement: 100,
    icon: '👻'
  },
  {
    id: 'arpa',
    name: 'Arpa Llanera',
    type: 'flora', // using flora/culture
    description: 'The soul of Joropo music. The traditional Llanero harp has 32 or 33 strings and no pedals, requiring immense skill to play the rapid, rhythmic melodies of the plains.',
    unlockRequirement: 150,
    icon: '🎶'
  },
  {
    id: 'moriche',
    name: 'Palma de Moriche',
    type: 'flora',
    description: 'Known as the "Tree of Life" by indigenous communities. It grows in flooded areas (morichales) and provides fruit, fiber for weaving, and shelter for wildlife.',
    unlockRequirement: 200,
    icon: '🌴'
  },
  {
    id: 'llorona',
    name: 'La Llorona (The Weeping Woman)',
    type: 'myth',
    description: 'A tragic spirit of a woman who lost her children, forever wandering near rivers and lakes crying out for them. In the game, her presence brings sudden, blinding rain and sorrow.',
    unlockRequirement: 250,
    icon: '🌧️'
  }
];

export const DID_YOU_KNOW_FACTS = [
  "Did you know? The Llanos region is shared between Colombia and Venezuela, united by the Orinoco river basin.",
  "Did you know? 'Joropo' is not just music, it's a cultural gathering, a dance, and a musical style all at once.",
  "Did you know? During 'Invierno' (winter), up to 80% of the Llanos can be flooded, turning the plains into a massive inland sea.",
  "Did you know? The Chigüiro (Capybara) can hold its breath underwater for up to 5 minutes to hide from predators like Jaguars and Anacondas.",
  "Did you know? A traditional Llanero works barefoot or in simple sandals (alpargatas), riding horses through flooded plains and thick mud.",
  "Did you know? The 'Cuatro' is a small, four-stringed guitar essential to Llanero music, providing the driving rhythmic heartbeat of the Joropo.",
  "Did you know? The Orinoco Crocodile, found in the Llanos, is one of the most critically endangered crocodilians in the world.",
  "Did you know? 'Mamona' or 'Ternera a la llanera' is the traditional barbecue of the region, where meat is slow-roasted on wooden stakes around a fire.",
  "Did you know? The legend of 'La Llorona' (The Weeping Woman) is also very prominent in Llanero folklore, often heard near rivers at night."
];

export const FOOD_FACTS: Record<string, string> = {
  "Chigüiro": "Chigüiro meat is a traditional delicacy in the Llanos, especially consumed during Holy Week when red meat is traditionally avoided by some.",
  "Aguacate": "Avocados from the region are large and creamy, often served alongside traditional Llanero meals to balance the rich, salty meats.",
  "Café": "A 'Tinto' (black coffee) is the fuel of the Llanero, often drunk before dawn before heading out to milk the cows and tend the herd.",
  "Arepa": "The Arepa is a staple corn cake. In the Llanos, they are often roasted over an open fire and eaten with fresh cheese.",
  "Pabellón": "A traditional dish featuring shredded beef, black beans, rice, and fried plantains, representing the blending of cultures in the region."
};

export const getLlaneroTitle = (totalScore: number): string => {
  if (totalScore < 100) return "Peón (Ranch Hand)";
  if (totalScore < 500) return "Llanero (Plainsman)";
  if (totalScore < 1500) return "Caporal (Foreman)";
  if (totalScore < 3000) return "Dueño del Hato (Ranch Owner)";
  return "Leyenda del Llano (Legend of the Plains)";
};
