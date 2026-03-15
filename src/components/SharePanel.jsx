import React from 'react';
import { Plus, X } from 'lucide-react';

export default function SharePanel({
  showSharePanel,
  setShowSharePanel,
  setShareMessage,
  shareEmailInput,
  setShareEmailInput,
  handleShareCalendar,
  shareMessage,
  myShares,
  handleRemoveShare,
  sharedCalendars,
  sharedOwnerLabels,
  fallbackOwnerLabel,
}) {
  if (!showSharePanel) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">Share Calendar</h3>
        <button onClick={() => { setShowSharePanel(false); setShareMessage(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="mb-5">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Enter someone&apos;s email to give them access to your calendar. They&apos;ll see and be able to edit your events when they log in.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={shareEmailInput}
            onChange={(e) => { setShareEmailInput(e.target.value); setShareMessage(''); }}
            placeholder="wife@gmail.com"
            className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-400"
            onKeyPress={(e) => e.key === 'Enter' && handleShareCalendar()}
          />
          <button
            onClick={handleShareCalendar}
            className="px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {shareMessage && (
          <p className={`text-sm mt-2 ${shareMessage.startsWith('\u2705') ? 'text-green-600' : 'text-red-500'}`}>
            {shareMessage}
          </p>
        )}
      </div>

      {myShares.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Shared with:</h4>
          <div className="space-y-2">
            {myShares.map((share, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {share.shared_with_email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{share.shared_with_email}</span>
                </div>
                <button onClick={() => handleRemoveShare(share.shared_with_email)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all" title="Remove access">
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sharedCalendars.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calendars shared with you:</h4>
          <div className="space-y-2">
            {sharedCalendars.map((share, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
                <div className="w-7 h-7 rounded-full bg-green-400 flex items-center justify-center text-white text-xs">\uD83D\uDCC5</div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Shared by <strong>{sharedOwnerLabels[String(share.owner_id || '')] || fallbackOwnerLabel(share.owner_id)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {myShares.length === 0 && sharedCalendars.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">No shares yet. Add someone&apos;s email above to get started.</p>
      )}
    </div>
  );
}
