import { Recipe } from '../types';

export const recipes: Recipe[] = [
  {
    id: "rec-1",
    name: "Classic Party Style Nigerian Jollof Rice",
    category: "Rice Dishes",
    prepTime: "20 mins",
    cookingTime: "45 mins",
    difficulty: "Medium",
    servingSize: "4-6 persons",
    calories: 450,
    nutritionFacts: {
      protein: "14g",
      carbs: "68g",
      fat: "11g"
    },
    ingredients: [
      { productId: "prod-1", name: "Premium Long Grain Nigerian Rice", amount: "4 Cups (Approx. 1kg)", alternative: "Ofada Rice" },
      { productId: "prod-2", name: "Fresh Red Roma Tomatoes", amount: "5 Medium Pieces", alternative: "Tomato Paste Tin" },
      { productId: "prod-3", name: "Premium Pepper Mix (Atarodo & Tatashe)", amount: "1 Pack (shombo & rodo)", alternative: "Habanero Pepper Powder" },
      { productId: "prod-6", name: "Golden Pure Vegetable Cooking Oil", amount: "1/2 Cup (120ml)", alternative: "Canola Oil" },
      { productId: "prod-8", name: "Fresh Frozen Chicken Cutlets", amount: "1kg Pack (for boiling and frying)", alternative: "Beef Cutlets" },
      { name: "Seasoning Cubes (Knorr/Maggi)", amount: "3 cubes" },
      { name: "Red Onions", amount: "2 medium, chopped" },
      { name: "Thyme & Curry Powder", amount: "1 tbsp each" },
      { name: "Bay Leaves", amount: "4 leaves" },
      { name: "Butter", amount: "1 tbsp (for shining texture)" }
    ],
    instructions: [
      "Wash the rice thoroughly with warm salted water until the water runs completely clear, then parboil for 10 minutes and drain.",
      "Blend the tomatoes, Tatashe (bell peppers), Atarodo (scotch bonnet), and 1 onion together until completely smooth. Pour the blended mixture into a pot and boil down to a thick paste.",
      "In a large iron pot (for that authentic party-smoky flavor), heat up the vegetable oil and fry the sliced onions for 3-5 minutes on medium heat.",
      "Add the concentrated boiled-down tomato and pepper paste. Fry on medium heat for 12-15 minutes, stirring continuously, until oil starts to separate at the top and the sourness is completely gone.",
      "Stir in the seasonings (curry, thyme, seasoning cubes, bay leaves, salt) and let fry for 1 more minute.",
      "Pour in the parboiled rice and mix thoroughly until every grain is coated in the red tomato base.",
      "Pour in chicken stock (from boiling your chicken cutlets) until it just barely covers the rice. Cover with foil paper first, then close the tight lid to seal the steam in.",
      "Cook on very low heat for 25-30 minutes. Let the bottom burn slightly for 5 minutes at the end to get that rich, authentic smoky party flavor.",
      "Stir in a tablespoon of butter, sliced round onions, and cover for 3 minutes. Serve hot with fried chicken and fried plantains (Dodo)."
    ],
    chefTips: [
      "The secret to rich party Jollof is trapping steam using foil. Never add too much water; let the trapped steam cook the rice.",
      "Smokiness comes from letting the bottom crust burn slightly in a cast iron pot on very low heat."
    ],
    rating: 4.9,
    commentsCount: 312,
    imageUrl: "https://images.unsplash.com/photo-1634863265893-677a2ebc96f2?auto=format&fit=crop&q=80&w=800",
    isNigerian: true
  },
  {
    id: "rec-2",
    name: "Fisherman Point-and-Kill Catfish Pepper Soup",
    category: "Soups",
    prepTime: "15 mins",
    cookingTime: "25 mins",
    difficulty: "Easy",
    servingSize: "3-4 persons",
    calories: 280,
    nutritionFacts: {
      protein: "28g",
      carbs: "4g",
      fat: "6g"
    },
    ingredients: [
      { productId: "prod-4", name: "Fresh Whole Live-Sorted Catfish", amount: "1kg (cleaned and sliced)", alternative: "Croaker Fish" },
      { productId: "prod-3", name: "Premium Pepper Mix (Atarodo & Tatashe)", amount: "1/2 Pack (mainly Scotch Bonnet)", alternative: "Cayenne Pepper" },
      { name: "Local Pepper Soup Spice Blend (Ehuru, Uziza, Uda)", amount: "2 tbsp", alternative: "All-purpose spice blend" },
      { name: "Fresh Scent Leaves (Efirin) or Uziza Leaves", amount: "Handful, chopped", alternative: "Basil leaves" },
      { name: "Chopped Onions", amount: "1 small piece" },
      { name: "Crayfish powder", amount: "1 tbsp" },
      { name: "Salt & Seasoning Cubes", amount: "To taste" }
    ],
    instructions: [
      "Place the sliced catfish pieces in a bowl, pour boiling hot water over them to remove the slimy outer coat, let sit for 1 minute, wash off thoroughly with cold water and lime, and drain.",
      "In a medium pot, add 4-5 cups of clean water, the chopped onions, blended Scotch bonnet peppers (Atarodo), and bring to a rolling boil.",
      "Stir in the dry local pepper soup spices (Ehuru, Uda, Uziza blend) and the ground crayfish.",
      "Add the seasoned fish slices gently into the boiling spiced water, ensuring they are submerged. Season with 2 Maggi cubes and a pinch of salt.",
      "Cover the pot and cook on medium-low heat for 15-18 minutes so the fish absorbing the spices doesn't break apart. Do not stir aggressively; shake the pot instead.",
      "Stir in the freshly chopped scent leaves (Efirin) or Uziza leaves. Simmer for another 2-3 minutes.",
      "Adjust salt to taste and serve steaming hot. Perfect with boiled yams, plantains, or as a soothing evening soup."
    ],
    chefTips: [
      "Washing catfish with hot water or lime is crucial to strip the sticky slime and prevent the soup from clouding.",
      "Never stir catfish soup with a spoon once the fish starts cooking, as the flesh is delicate. Swirl the pot gently by the handles."
    ],
    rating: 4.8,
    commentsCount: 184,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    isNigerian: true
  },
  {
    id: "rec-3",
    name: "Oloyin Honey Beans & Pillowy Soft Agege Bread",
    category: "Breakfast",
    prepTime: "10 mins",
    cookingTime: "50 mins",
    difficulty: "Easy",
    servingSize: "3 persons",
    calories: 510,
    nutritionFacts: {
      protein: "22g",
      carbs: "84g",
      fat: "9g"
    },
    ingredients: [
      { productId: "prod-18", name: "Premium Nigerian Brown Beans", amount: "500g (Oloyin Beans)", alternative: "White Cowpeas" },
      { productId: "prod-9", name: "Shed-Baked Traditional Agege Bread", amount: "1 Jumbo Loaf (fresh)", alternative: "Wheat Bread Sliced" },
      { productId: "prod-6", name: "Golden Pure Vegetable Cooking Oil", amount: "1/4 Cup (for frying stew)", alternative: "Palm Oil" },
      { productId: "prod-2", name: "Fresh Red Roma Tomatoes", amount: "2 pieces, chopped", alternative: "Tomato Paste" },
      { name: "Ground Crayfish", amount: "1 tbsp" },
      { name: "Onions", amount: "1 large, chopped" },
      { name: "Salt & Seasoning Cubes", amount: "To taste" }
    ],
    instructions: [
      "Rinse the honey beans thoroughly in a sieve, removing any outer hulls or foreign elements.",
      "In a deep pot, add the beans with plenty of water and half of the chopped onions. Bring to a boil and cook on medium heat for 40-45 minutes until the beans are super soft and mushy (add hot water as needed).",
      "While the beans cook, prepare the stew. Heat up vegetable oil or palm oil in a skillet, sauté the remaining onions until translucent.",
      "Add blended or chopped tomatoes and red peppers. Fry for 8-10 minutes until the water evaporates.",
      "Stir crayfish powder, seasoning, and salt into the fried sauce. Cook for another 2 minutes and take off heat.",
      "Once the beans are cooked soft, mash them slightly with a wooden spoon for a creamy porridge texture. Stir in a portion of the fried sauce directly, or leave them clean and sweet to be topped with the sauce later.",
      "Slice open your fresh, stretchy Agege bread.",
      "Serve the warm, sweet creamy beans with a generous spoonful of spicy onion sauce, and use the soft bread to scoop it up."
    ],
    chefTips: [
      "Oloyin beans are naturally sweet and cook twice as fast as white beans. Do not parboil them; cook directly with onions to lock in flavor.",
      "The best way to eat this is sandwiching the creamy beans inside the warm Agege bread (known locally as Bread & Ewa)."
    ],
    rating: 4.9,
    commentsCount: 96,
    imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=800",
    isNigerian: true
  }
];
