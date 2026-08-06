import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, ChefHat, AlertCircle, TrendingDown, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  suggestions?: { text: string; action: string; payload?: any }[];
}

interface SmartAssistantProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onNavigate: (view: string) => void;
}

export default function SmartAssistant({ products, onAddToCart, onNavigate }: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Ẹ lẹ́yà! I'm your FreshBasket Smart Shopping Assistant. I can suggest ingredient substitutions, build budget grocery packs, or help you find cooking ingredients. What are we preparing today?",
      timestamp: new Date(),
      suggestions: [
        { text: "🍲 List soup ingredients", action: "soup_ingredients" },
        { text: "🥑 Suggest substitutions", action: "substitutions" },
        { text: "💰 Student budget help", action: "budget_helper" },
        { text: "📅 Plan weekly meals", action: "meal_planner" }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const addMessage = (sender: 'ai' | 'user', text: string, suggestions?: Message['suggestions']) => {
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: new Date(),
        suggestions
      }
    ]);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    addMessage('user', text);
    setInputValue('');

    // Simulate AI thinking and replying
    setTimeout(() => {
      const query = text.toLowerCase();
      let replyText = "";
      let suggestions: Message['suggestions'] = [];

      if (query.includes('soup') || query.includes('stew') || query.includes('egusi') || query.includes('jollof')) {
        replyText = "Ah, planning a rich meal! For a classic Nigerian Stew/Soup, I highly recommend our Fresh Red Roma Tomatoes (Jos), Premium Pepper Mix (Atarodo/Tatashe), and Golden Vegetable Cooking Oil. Would you like me to add the basic stew bundle to your cart?";
        
        const tomatoes = products.find(p => p.id === 'prod-2');
        const peppers = products.find(p => p.id === 'prod-3');
        const oil = products.find(p => p.id === 'prod-6');

        suggestions = [
          { 
            text: "🛒 Add Stew Ingredients (₦13,500)", 
            action: "add_bundle", 
            payload: [
              { prod: tomatoes, qty: 1 },
              { prod: peppers, qty: 2 },
              { prod: oil, qty: 1 }
            ] 
          },
          { text: "📖 View Recipe Hub", action: "navigate", payload: "recipes" }
        ];
      } else if (query.includes('substitute') || query.includes('replace') || query.includes('alternat') || query.includes('out of stock')) {
        replyText = "No worries! Here are my smart AI kitchen substitutions:\n\n• If Fresh Tomatoes are out, use our Premium canned tomato pastes.\n• If Honey Beans (Oloyin) are low, White sorted Cowpeas cook beautifully if cooked with a tiny pinch of sugar.\n• For Fresh Scent Leaves, sweet scent basil or dried Uziza leaves serve as amazing fragrant replacements!";
        suggestions = [
          { text: "🌾 View Rice & Grains", action: "navigate", payload: "grains" },
          { text: "🥬 View Fresh Veggies", action: "navigate", payload: "vegetables" }
        ];
      } else if (query.includes('budget') || query.includes('cheap') || query.includes('student') || query.includes('cost')) {
        replyText = "Let's save some money! I've calculated a perfect Student Budget Grocery Bundle that lasts 2 weeks for just ₦12,900:\n\n• 400g Spicy Honey Chin Chin (Snack)\n• 1 Jumbo Loaf Agege Bread (Bakery)\n• 1 Crate (30) Grade-A Eggs\n• 1kg Sweet Gombe Honey Beans\nTotal estimated cost is highly optimized.";
        
        const chinchin = products.find(p => p.id === 'prod-14');
        const bread = products.find(p => p.id === 'prod-9');
        const eggs = products.find(p => p.id === 'prod-5');
        const beans = products.find(p => p.id === 'prod-18');

        suggestions = [
          { 
            text: "🛒 Add Budget Bundle (₦9,450)", 
            action: "add_bundle", 
            payload: [
              { prod: chinchin, qty: 1 },
              { prod: bread, qty: 1 },
              { prod: eggs, qty: 1 },
              { prod: beans, qty: 1 }
            ] 
          },
          { text: "💰 Go to Weekly Deals", action: "navigate", payload: "deals" }
        ];
      } else if (query.includes('delivery') || query.includes('track') || query.includes('where')) {
        replyText = "We offer lightning-fast, same-day delivery across Lekki, Ikeja, Surulere, and other major Lagos sectors. Fresh vegetables are delivered within 2 hours of harvesting!";
        suggestions = [
          { text: "🚚 Track Active Order", action: "navigate", payload: "tracking" },
          { text: "📍 Check Delivery Policy", action: "navigate", payload: "delivery-policy" }
        ];
      } else {
        replyText = "I can definitely help with that! At FreshBasket, we ensure direct-from-farm sourcing so you always eat fresh. Try asking about 'stew ingredients', 'substitutions', 'student budget helper', or 'delivery times'.";
        suggestions = [
          { text: "🍲 Soup ingredients", action: "soup_ingredients" },
          { text: "🥑 Substitutions", action: "substitutions" },
          { text: "💰 Student budget", action: "budget_helper" }
        ];
      }

      addMessage('ai', replyText, suggestions);
    }, 750);
  };

  const handleSuggestionClick = (suggestion: any) => {
    addMessage('user', suggestion.text);
    
    setTimeout(() => {
      if (suggestion.action === "soup_ingredients") {
        handleSendMessage("stew ingredients");
      } else if (suggestion.action === "substitutions") {
        handleSendMessage("substitute items");
      } else if (suggestion.action === "budget_helper") {
        handleSendMessage("student budget");
      } else if (suggestion.action === "meal_planner") {
        addMessage('ai', "Our Meal Planner generates tailored shopping lists based on your family scale. I can direct you to our visual Meal Planner layout!", [
          { text: "📅 Go to Meal Planner", action: "navigate", payload: "mealplanner" }
        ]);
      } else if (suggestion.action === "navigate") {
        onNavigate(suggestion.payload);
        addMessage('ai', `Navigating you straight to the ${suggestion.payload} section. Let me know if you need help selecting specific items!`);
      } else if (suggestion.action === "add_bundle") {
        suggestion.payload.forEach((item: any) => {
          if (item.prod) {
            onAddToCart(item.prod, item.qty);
          }
        });
        addMessage('ai', "Awesome! I've loaded those fresh essentials straight into your shopping basket. Check your cart to view quantities!", [
          { text: "🛒 View Shopping Cart", action: "navigate", payload: "cart" },
          { text: "💳 Proceed to Checkout", action: "navigate", payload: "checkout" }
        ]);
      }
    }, 400);
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          id="assistant-toggle-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-orange-500 text-[9px] font-bold text-white items-center justify-center">1</span>
            </span>
          )}
        </motion.button>
      </div>

      {/* Chat Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="assistant-panel"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between bg-emerald-900 p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-700/50 p-1.5">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white font-sans">AI Basket Assistant</h3>
                  <p className="text-[11px] text-emerald-200">Online • Sourcing fresh daily</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-emerald-200 hover:bg-emerald-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Helper Banner */}
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 border-b border-stone-100 text-emerald-800 text-xs">
              <ChefHat className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Ask for <b>egusi soup bundle</b> or <b>student budget</b></span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-stone-800 border border-stone-200 shadow-sm rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="block mt-1 text-[9px] text-stone-400 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Recommendations / Chips under AI Message */}
                  {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug)}
                          className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer"
                        >
                          {sug.text}
                          <ArrowRight className="h-3 w-3 text-emerald-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2 border-t border-stone-100 bg-white p-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask our chef assistant..."
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
