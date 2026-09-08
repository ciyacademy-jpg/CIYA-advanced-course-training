import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus, Trash2, ShoppingBag, Flame, Layers, Award, Sparkles } from 'lucide-react';
import { Recipe, Product } from '../types';

interface MealPlannerViewProps {
  recipes: Recipe[];
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onNavigate: (view: string) => void;
}

interface PlannedMeal {
  id: string;
  day: string; // "Monday", "Tuesday", etc.
  slot: 'Breakfast' | 'Lunch' | 'Dinner';
  recipe: Recipe;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MealPlannerView({
  recipes = [],
  products = [],
  onAddToCart,
  onNavigate
}: MealPlannerViewProps) {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(() => {
    const safeRecipes = Array.isArray(recipes) ? recipes : [];
    const initial: PlannedMeal[] = [];
    if (safeRecipes[0]) {
      initial.push({ id: "p1", day: "Monday", slot: "Lunch", recipe: safeRecipes[0] });
    }
    if (safeRecipes[1]) {
      initial.push({ id: "p2", day: "Tuesday", slot: "Dinner", recipe: safeRecipes[1] });
    }
    return initial;
  });
  const [showAddMenu, setShowAddMenu] = useState<{ day: string; slot: 'Breakfast' | 'Lunch' | 'Dinner' } | null>(null);

  // Math calculated nutrition summary
  const totalNutrition = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    plannedMeals.forEach((m) => {
      if (!m || !m.recipe) return;
      // Split nutrition fact strings e.g., "45g" -> 45
      const pFact = parseFloat(m.recipe.nutritionFacts?.protein || "0");
      const cFact = parseFloat(m.recipe.nutritionFacts?.carbs || "0");
      const fFact = parseFloat(m.recipe.nutritionFacts?.fat || "0");
      
      calories += m.recipe.calories || 0;
      protein += pFact;
      carbs += cFact;
      fat += fFact;
    });

    return { calories, protein, carbs, fat };
  }, [plannedMeals]);

  const handleAddMeal = (recipe: Recipe) => {
    if (!showAddMenu) return;
    const newMeal: PlannedMeal = {
      id: `pm-${Date.now()}`,
      day: showAddMenu.day,
      slot: showAddMenu.slot,
      recipe
    };
    setPlannedMeals(prev => [...prev, newMeal]);
    setShowAddMenu(null);
  };

  const handleRemoveMeal = (id: string) => {
    setPlannedMeals(prev => prev.filter(m => m.id !== id));
  };

  // Compile unified checklist
  const handleCompileBasket = () => {
    let addCount = 0;
    const allProdIds = new Set<string>();

    plannedMeals.forEach((m) => {
      m.recipe.ingredients.forEach((ing) => {
        if (ing.productId) {
          allProdIds.add(ing.productId);
        }
      });
    });

    allProdIds.forEach((pid) => {
      const prod = products.find(p => p.id === pid);
      if (prod) {
        onAddToCart(prod, 1);
        addCount++;
      }
    });

    if (addCount > 0) {
      alert(`🛒 Sourced ${addCount} distinct farm ingredients matching your complete 7-day meal plan! Check your basket summary.`);
    } else {
      alert("⚠️ Your planner is currently empty. Add recipes to the calendar first!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-4 mb-8">
        <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Health & Fitness Trackers</span>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">Smart Meal Planner</h2>
        <p className="text-xs text-white/60 mt-1">Build nutritional programs, review daily calorie indexes, and auto-aggregate complete raw market baskets.</p>
      </div>

      {/* Dynamic macros widget bar */}
      <div className="bg-white/10 rounded-3xl border border-white/15 p-5 mb-8 grid sm:grid-cols-4 gap-4 text-center backdrop-blur-xl shadow-2xl">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" /> Planned Calories
          </span>
          <p className="text-lg font-black text-[#FACC15] mt-1">{totalNutrition.calories} kcal</p>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
            🌿 Protein Target
          </span>
          <p className="text-lg font-black text-[#FACC15] mt-1">{totalNutrition.protein}g</p>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
            ⚡ Carbohydrates
          </span>
          <p className="text-lg font-black text-[#FACC15] mt-1">{totalNutrition.carbs}g</p>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
            🥑 Fats Limit
          </span>
          <p className="text-lg font-black text-[#FACC15] mt-1">{totalNutrition.fat}g</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Day selector column */}
        <div className="lg:col-span-3 bg-white/10 border border-white/15 rounded-3xl p-4 space-y-1.5 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2.5 px-3">
            7-Day Program Calendar
          </h3>
          {daysOfWeek.map((day) => {
            const count = plannedMeals.filter(m => m.day === day).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold transition text-left cursor-pointer ${
                  selectedDay === day
                    ? 'bg-[#16A34A] text-white font-extrabold shadow-sm'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black text-white">
                    {count} Meals
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleCompileBasket}
              className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 text-[10px] flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Compile Grocery Baskets</span>
            </button>
          </div>
        </div>

        {/* Right Active Day details column */}
        <div className="lg:col-span-9 bg-white/10 border border-white/15 rounded-3xl p-5 lg:p-6 shadow-2xl backdrop-blur-xl min-h-[400px] space-y-6">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white">{selectedDay} Meal Program</h3>
            <span className="text-xs text-white/50 font-bold">Organize meal times</span>
          </div>

          {/* Three core daily slots: Breakfast, Lunch, Dinner */}
          {(['Breakfast', 'Lunch', 'Dinner'] as const).map((slot) => {
            const items = plannedMeals.filter(m => m.day === selectedDay && m.slot === slot);
            
            return (
              <div key={slot} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1">
                    ☕ {slot} slot
                  </h4>
                  <button
                    onClick={() => setShowAddMenu({ day: selectedDay, slot })}
                    className="text-[10px] font-bold text-[#FACC15] hover:text-[#eab308] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5" /> <span>Add Recipe</span>
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((it) => (
                      <div key={it.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 w-full sm:w-auto">
                          <img src={it.recipe?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'} alt="" className="h-14 w-14 object-cover rounded-xl shrink-0" />
                          <div>
                            <h5 className="text-xs font-bold text-white leading-snug">{it.recipe?.name || 'Assigned Meal'}</h5>
                            <div className="flex gap-3 text-[10px] text-white/50 font-semibold mt-1">
                              <span>🔥 {it.recipe?.calories || 0} kcal</span>
                              <span>⏱️ {it.recipe?.cookingTime || '30 mins'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMeal(it.id)}
                          className="rounded-xl border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/10 text-white/40 hover:text-orange-500 p-2.5 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40 italic">No meal assigned to this slot yet.</p>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Modal for assigning recipes */}
      {showAddMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06180c]/80 backdrop-blur-md" onClick={() => setShowAddMenu(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b2b16]/95 border border-white/10 p-5 shadow-2xl z-10 max-h-[75vh] overflow-y-auto space-y-4 text-white">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2.5">
              Select Recipe for {showAddMenu.day} ({showAddMenu.slot})
            </h3>
            <div className="space-y-2">
              {recipes.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleAddMeal(rec)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 flex gap-3 text-left hover:border-[#16A34A] hover:bg-white/10 transition group cursor-pointer"
                >
                  <img src={rec.imageUrl} alt="" className="h-12 w-12 object-cover rounded-xl shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#FACC15] leading-tight transition">{rec.name}</h4>
                    <p className="text-[10px] text-white/40 font-semibold mt-1">⏱️ {rec.cookingTime} • 🔥 {rec.calories} kcal</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
