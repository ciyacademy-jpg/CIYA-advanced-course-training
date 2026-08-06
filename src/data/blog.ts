import { BlogArticle } from '../types';

export const blogArticles: BlogArticle[] = [
  {
    id: "post-1",
    title: "How to Store Fresh Tomatoes and Peppers in Nigeria Without Constant Electricity",
    category: "Food Storage",
    readTime: "5 mins read",
    author: {
      name: "Chef Amaka Bello",
      role: "Head Recipe Developer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    },
    date: "July 18, 2026",
    content: [
      "In Nigeria, maintaining fresh produce can be a challenge due to unpredictable electricity cycles. However, several traditional and smart hacks can keep your fresh tomatoes, Scotch bonnets (Atarodo), and bell peppers (Tatashe) crisp and mold-free for weeks.",
      "The first method is the 'Concentrated Fry'. If you buy a full basket of tomatoes, wash and blend them immediately with onions and ginger. Boil down the puree in a wide pot until all excess water completely evaporates. Once dry, fry the concentrate in hot vegetable oil for 5 minutes. Let it cool, then pack it into clean glass jars, covering the top with a thin layer of oil. This seals out air and can sit safely on your kitchen counter for up to 10 days without refrigeration!",
      "The second method is the 'Clay Pot Cooler' or Zeer Pot system. Put your tomatoes inside a smaller unglazed clay pot, place this pot inside a larger clay pot, and fill the space between them with wet sand. Cover the top with a damp jute bag. As the water evaporates from the sand through the porous outer clay, it drops the inner temperature by up to 10°C, preserving your veggies naturally for up to 2 weeks.",
      "Never store tomatoes in tight plastic bags as they trap moisture and ethylene gas, which accelerates rotting. Instead, keep them in open woven baskets where air can circulate freely."
    ],
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800",
    relatedProducts: ["prod-2", "prod-3"]
  },
  {
    id: "post-2",
    title: "Understanding Honey Beans (Oloyin) vs. White Beans: Nutrition, Taste, and Cooking",
    category: "Healthy Eating",
    readTime: "4 mins read",
    author: {
      name: "Dr. Kunle Shodeinde",
      role: "Nutritionist & Health Advocate",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
    },
    date: "July 10, 2026",
    content: [
      "Beans are the primary source of affordable plant-based protein in Nigeria, but there is always a debate: Honey Beans (Oloyin) or White Cowpeas? Which is better for your body and your taste buds?",
      "Oloyin beans (literally meaning 'honey-like' beans due to their sweet taste and light brown color) are prized for their high natural sugars and smooth, creamy texture when boiled. From a cooking standpoint, honey beans require zero parboiling and cook roughly 30% faster than standard white beans.",
      "Nutritiously, honey beans are exceptionally rich in soluble fiber, which aids digestion, lowers cholesterol, and maintains steady blood sugar levels. They are packed with minerals like iron, folate, and potassium, which are essential for active families and growing children.",
      "White beans, on the other hand, have a neutral starchy flavor and a firmer skin. They are perfect for grinding into a fine paste for making Akara (fried bean cakes) or Moi Moi (steamed bean pudding) because they hold air bubbles better, leading to fluffier textures.",
      "If you are looking for sweet, quick comfort food porridge, go for Oloyin Honey Beans. If you are preparing breakfast Akara or party Moi Moi, buy sorted White Cowpeas."
    ],
    imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=800",
    relatedProducts: ["prod-18", "prod-9"]
  }
];
