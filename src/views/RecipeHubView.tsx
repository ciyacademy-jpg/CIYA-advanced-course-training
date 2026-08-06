import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Users, Flame, ChefHat, Check, ArrowRight, X, Star, ShoppingBag } from 'lucide-react';
import { Recipe, Product } from '../types';

interface RecipeHubViewProps {
  recipes: Recipe[];
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onNavigate: (view: string) => void;
}

export default function RecipeHubView({
  recipes,
  products,
  onAddToCart,
  onNavigate
}: RecipeHubViewProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleAddIngredientsToCart = (recipe: Recipe) => {
    let addedCount = 0;
    recipe.ingredients.forEach((ing) => {
      if (ing.productId) {
        const foundProd = products.find(p => p.id === ing.productId);
        if (foundProd) {
          onAddToCart(foundProd, 1);
          addedCount++;
        }
      }
    });

    alert(`🥘 Added ${addedCount} recipe ingredients to your basket! We've automatically suggested alternatives for any unavailable items.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Header Banner */}
      <div className="border-b border-white/10 pb-4 mb-8">
        <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Kitchen Cookbooks</span>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">Recipe Ingredient Kits Hub</h2>
        <p className="text-xs text-white/60 mt-1">Cook like a premium chef. Browse recipes and purchase verified ingredients directly in one-click.</p>
      </div>

      {/* Grid of recipes */}
      <div className="grid md:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white/10 rounded-3xl border border-white/15 overflow-hidden shadow-2xl hover:border-[#16A34A] hover:bg-white/15 transition-all duration-300 flex flex-col group backdrop-blur-md"
          >
            <div className="h-48 w-full bg-white/5 border-b border-white/10 overflow-hidden relative">
              <img src={recipe.imageUrl} alt={recipe.name} className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full py-1 px-3 text-[9px] font-black uppercase tracking-wider text-[#FACC15] border border-white/10 shadow">
                {recipe.category}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                  {recipe.name}
                </h3>
                
                {/* Micro indicators */}
                <div className="flex gap-4 text-[10px] text-white/50 font-bold pt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-white/40" /> {recipe.cookingTime}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-white/40" /> {recipe.servingSize}</span>
                  <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-white/40" /> {recipe.calories} kcal</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="text-xs font-bold text-[#FACC15] hover:text-[#eab308] flex items-center gap-1 transition cursor-pointer"
                >
                  <span>View Instructions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleAddIngredientsToCart(recipe)}
                  className="rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white p-2.5 transition shrink-0 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Recipe Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
              className="absolute inset-0 bg-[#06180c]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl bg-[#0b2b16]/95 border border-white/10 p-5 lg:p-7 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-6 text-white"
            >
              {/* Header and media */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FACC15] tracking-wider bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                    {selectedRecipe.category} • {selectedRecipe.difficulty} Mode
                  </span>
                  <h3 className="text-base lg:text-lg font-bold text-white mt-1">{selectedRecipe.name}</h3>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="rounded-full hover:bg-white/10 p-1.5 shrink-0 cursor-pointer">
                  <X className="h-5.5 w-5.5 text-white/60 hover:text-white" />
                </button>
              </div>

              {/* Photo & metrics */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-white/5 border border-white/10">
                <img src={selectedRecipe.imageUrl} alt="" className="object-cover h-full w-full" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white flex justify-around text-center text-xs font-semibold">
                  <div>
                    <span className="block text-white/50 text-[10px] uppercase">Prep</span>
                    <span>{selectedRecipe.prepTime}</span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="block text-white/50 text-[10px] uppercase">Cooking</span>
                    <span>{selectedRecipe.cookingTime}</span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="block text-white/50 text-[10px] uppercase">Servings</span>
                    <span>{selectedRecipe.servingSize}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    📖 Recipe Ingredients ({selectedRecipe.ingredients.length})
                  </h4>
                  <button
                    onClick={() => handleAddIngredientsToCart(selectedRecipe)}
                    className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-1.5 px-4 text-[10px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-white" />
                    <span>Buy Bundle</span>
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between font-semibold text-white/80">
                      <span>• {ing.amount} {ing.name}</span>
                      {ing.alternative && (
                        <span className="text-[9px] text-[#FACC15] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-extrabold uppercase">
                          Sub: {ing.alternative}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-bold text-white">👩‍🍳 Step-by-Step Directions</h4>
                <ol className="space-y-3 text-xs text-white/80 leading-relaxed font-semibold">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="h-5 w-5 bg-white/10 border border-white/10 text-[#FACC15] rounded-full flex items-center justify-center shrink-0 font-black text-[11px]">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Chef secret tips */}
              {selectedRecipe.chefTips.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5 text-white font-medium text-xs">
                  <h4 className="font-extrabold flex items-center gap-1 leading-none text-[#FACC15]">
                    <ChefHat className="h-4.5 w-4.5 text-[#FACC15]" /> Chef Amaka&apos;s Secrets
                  </h4>
                  <ul className="space-y-1 pl-4 list-disc leading-relaxed font-semibold text-white/85">
                    {selectedRecipe.chefTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
