import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, ArrowRight, User, X } from 'lucide-react';
import { BlogArticle } from '../types';

interface BlogViewProps {
  posts: BlogArticle[];
}

export default function BlogView({ posts }: BlogViewProps) {
  const [selectedPost, setSelectedPost] = useState<BlogArticle | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-4 mb-8">
        <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">FreshBasket Journals</span>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">Healthy Living Blog</h2>
        <p className="text-xs text-white/60 mt-1">Discover organic farming benefits, food hygiene standards, and localized Nigerian nutritional advice.</p>
      </div>

      {/* Grid of articles */}
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/10 rounded-3xl border border-white/15 overflow-hidden shadow-2xl backdrop-blur-xl hover:border-[#16A34A] hover:shadow-2xl transition-all duration-300 flex flex-col group text-white"
          >
            <div className="h-48 w-full bg-white/5 overflow-hidden relative">
              <img src={post.imageUrl} alt={post.title} className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FACC15]">
                  {post.category}
                </span>
                <h3 className="text-xs font-extrabold text-white leading-snug line-clamp-2 cursor-pointer group-hover:text-[#FACC15] transition" onClick={() => setSelectedPost(post)}>
                  {post.title}
                </h3>
                
                <div className="flex gap-4 text-[10px] text-white/40 font-bold pt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-white/30" /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-white/30" /> {post.readTime}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={() => setSelectedPost(post)}
                  className="text-xs font-bold text-[#16A34A] hover:text-[#22c55e] flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Read Article</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Article Reader overlay */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-[#0b2b16]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl bg-[#0b2b16]/95 p-5 lg:p-7 border border-white/15 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-5 text-white backdrop-blur-xl"
            >
              {/* Header and media */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FACC15] tracking-wider">
                    {selectedPost.category} • Published {selectedPost.date}
                  </span>
                  <h3 className="text-sm lg:text-base font-bold text-white mt-1">{selectedPost.title}</h3>
                </div>
                <button onClick={() => setSelectedPost(null)} className="rounded-full hover:bg-white/10 p-1.5 shrink-0 cursor-pointer text-white/50 hover:text-white transition">
                  <X className="h-5.5 w-5.5" />
                </button>
              </div>

              {/* Photo */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-white/5 border border-white/10">
                <img src={selectedPost.imageUrl} alt="" className="object-cover h-full w-full" />
                <div className="absolute bottom-4 left-4 bg-[#0b2b16]/90 backdrop-blur-md rounded-xl py-1.5 px-3.5 text-white flex items-center gap-2 text-[10px] font-semibold border border-white/10">
                  <User className="h-3.5 w-3.5 text-white/60" />
                  <span>By {selectedPost.author.name} ({selectedPost.author.role})</span>
                  <div className="h-3 w-px bg-white/10" />
                  <span>⏱️ {selectedPost.readTime}</span>
                </div>
              </div>

              {/* Article Content Body (support multiline/paragraphs) */}
              <div className="space-y-4 text-xs text-white/70 leading-relaxed font-semibold">
                {selectedPost.content.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Back CTA */}
              <div className="pt-4 border-t border-white/10 text-right">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 px-5 text-xs shadow-lg transition cursor-pointer"
                >
                  Close Article Reader
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
