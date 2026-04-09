 quickThoughts = [
    { id: 1, text: 'Best tacos ever at La Taqueria', color: 'yellow' },
    { id: 2, text: "Mom's birthday gift idea: pottery class", color: 'pink' },
    { id: 3, text: 'Movie night idea: Drive My Car', color: 'blue' },
  ],
  
<div className="relative overflow-hidden rounded-3xl border-2 border-yellow-900/20 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-slate-900 dark:to-orange-950/20 p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                  <h3 className="font-handwritten text-2xl text-gray-900 dark:text-white">
                    Quick Thoughts
                  </h3>
                </div>
                <button 
                  onClick={onAddThought}
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {quickThoughts.map((thought) => (
                  <div 
                    key={thought.id}
                    className={`sticky-note p-3 rounded-lg ${
                      thought.color === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-900/50' :
                      thought.color === 'pink' ? 'bg-pink-200 dark:bg-pink-900/50' :
                      'bg-blue-200 dark:bg-blue-900/50'
                    }`}
                  >
                    <p className="font-handwritten text-lg text-gray-900 dark:text-white">
                      {thought.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>