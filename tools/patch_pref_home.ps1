$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

# 1-based to 0-based line numbers
$start = 23446 - 1
$end   = 23534 - 1
if ($start -lt 0 -or $end -ge $lines.Count -or $start -gt $end) {
  throw "Invalid line range. File has $($lines.Count) lines."
}

$snippet = @'
{preferCalendarHome && (
<div className="mb-6">
{/* Hero card with gradient and personality */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 p-6 sm:p-8 shadow-xl border border-white/50 dark:border-purple-800/30">
{/* Decorative blur elements */}
<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-pink-200/20 rounded-full blur-3xl" />
<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-blue-200/20 rounded-full blur-2xl" />
<div className="relative z-10">
{/* Time-based greeting */}
<div className="flex items-center gap-3 mb-6">
<span className="text-5xl">
{(() => {
const hour = new Date().getHours();
if (hour < 12) return '☀️';
if (hour < 17) return '🌤️';
if (hour < 20) return '🌆';
return '🌙';
})()}
</span>
<div>
<h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
{(() => {
const hour = new Date().getHours();
if (hour < 12) return 'Good morning!';
if (hour < 17) return 'Good afternoon!';
if (hour < 20) return 'Good evening!';
return 'Good night!';
})()}
</h2>
<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
</p>
</div>
</div>
{/* Event count or empty state */}
{overviewTodayEvents.length === 0 ? (
<div className="flex flex-col items-center justify-center py-8">
<div className="relative mb-4">
<div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
<span className="text-5xl">🌸</span>
</div>
<div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg">
<span className="text-lg">✨</span>
</div>
</div>
<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
Nothing planned today
</h3>
<p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs mb-4">
Take some time for yourself or start planning something amazing!
</p>
<button
onClick={() => { handleAddButtonClick(); setPreferCalendarHome(false); }}
className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
Add Something Fun
</button>
</div>
) : (
<>
{/* Event count badge */}
<div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
<span className="text-2xl">📅</span>
<span className="font-semibold text-gray-900 dark:text-white">
{overviewTodayEvents.length} {overviewTodayEvents.length === 1 ? 'thing' : 'things'} today
</span>
</div>
{/* Event cards - spacious */}
<div className="space-y-3">
{overviewTodayEvents.slice(0, 3).map((event, idx) => {
const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
const popupCard = (userTabPopupEvents || []).find((row) => String(row?.id || '') === String(event?.id || '')) || null;
const isPopupEvent = Boolean(popupMeta || popupCard);
const effectiveCategoryKey = isPopupEvent ? 'popup_event' : (event.category || 'other');
const category = categories[effectiveCategoryKey] || categories.other;
return (
<button
key={`${event.id}-${event.date}`}
type="button"
onClick={() => { openUserTabEvent(event, popupMeta || popupCard); }}
className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left border border-gray-100 dark:border-gray-700"
style={{
animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both`
}}
>
{/* Time badge */}
<div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 shrink-0">
{event.time ? (
<>
<span className="text-xs font-bold text-purple-600 dark:text-purple-400">
{formatTime(event.time).split(' ')[0]}
</span>
<span className="text-[10px] text-purple-500">
{formatTime(event.time).split(' ')[1]}
</span>
</>
) : (
<span className="text-xs font-bold text-purple-600 dark:text-purple-400">
All day
</span>
)}
</div>
{/* Event info */}
<div className="flex-1 min-w-0">
<div className="font-semibold text-base text-gray-900 dark:text-white mb-1">
{event.title}
</div>
{event.location && (
<div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
<MapPin className="w-3.5 h-3.5 shrink-0" />
<span className="truncate">{event.location}</span>
</div>
)}
<div className="mt-1 flex flex-wrap items-center gap-1">
{isPopupEvent && (
<span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
Pop-up
</span>
)}
</div>
</div>
{/* Arrow with hover effect */}
<div className="text-purple-400 text-xl group-hover:translate-x-1 transition-transform">
→
</div>
</button>
);
})}
{overviewTodayEvents.length > 3 && (
<button 
onClick={() => {
setSelectedDate(new Date());
setPreferCalendarHome(false);
}}
className="w-full py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
See {overviewTodayEvents.length - 3} more →
</button>
)}
</div>
</>
)}
</div>
</div>
<style jsx>{`
@keyframes fadeInUp {
from {
opacity: 0;
transform: translateY(20px);
}
to {
opacity: 1;
transform: translateY(0);
}
}
`}</style>
</div>
)}
'@ -split "`r?`n"

$head = $lines.GetRange(0, $start)
$tail = $lines.GetRange($end+1, $lines.Count - ($end+1))
$next = New-Object System.Collections.Generic.List[string]
$next.AddRange($head)
$next.AddRange($snippet)
$next.AddRange($tail)

[System.IO.File]::WriteAllLines($path, $next)
Write-Host "Patched $path (backup at $backup)."