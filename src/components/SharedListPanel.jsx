import React from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

export default function SharedListPanel({
  showListPanel,
  setShowListPanel,
  newSharedListTitle,
  setNewSharedListTitle,
  createSharedList,
  sharedListGroups,
  selectedSharedListId,
  setSelectedSharedListId,
  deleteSharedList,
  newListItemText,
  setNewListItemText,
  addSharedListItem,
  listError,
  sharedListItems,
  toggleSharedListItem,
  editingListItemId,
  editingListText,
  setEditingListText,
  saveSharedListItemText,
  setEditingListItemId,
  startEditingListItem,
  removeSharedListItem,
}) {
  if (!showListPanel) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 border border-purple-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400">Shared Lists</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clean space for groceries, reminders, and quick to-dos.</p>
        </div>
        <button onClick={() => setShowListPanel(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border border-purple-100 dark:border-gray-600 mb-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newSharedListTitle}
            onChange={(e) => setNewSharedListTitle(e.target.value)}
            placeholder="Create new list title"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-1 focus:ring-purple-400"
            onKeyPress={(e) => e.key === 'Enter' && createSharedList()}
          />
          <button
            onClick={createSharedList}
            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Create list"
          >
            Create
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3">
        {sharedListGroups.map(group => (
          <button
            key={group.id}
            onClick={() => setSelectedSharedListId(group.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedSharedListId === group.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
          >
            {group.title}
          </button>
        ))}
        <button
          onClick={() => deleteSharedList(selectedSharedListId)}
          disabled={!selectedSharedListId}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 disabled:opacity-50"
          title="Delete selected list"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={newListItemText}
          onChange={(e) => setNewListItemText(e.target.value)}
          placeholder="Add an item..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-purple-400"
          onKeyPress={(e) => e.key === 'Enter' && addSharedListItem()}
          disabled={!selectedSharedListId}
        />
        <button
          onClick={addSharedListItem}
          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          title="Add item"
          disabled={!selectedSharedListId}
        >
          Add
        </button>
      </div>

      {listError && (
        <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-300">
          {listError}
        </div>
      )}

      <div className="space-y-1.5">
        {sharedListGroups.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Create your first list to get started.</p>
        )}
        {sharedListItems.length === 0 && selectedSharedListId && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items yet.</p>
        )}
        {sharedListItems.map(item => (
          <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
            <button
              onClick={() => toggleSharedListItem(item)}
              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}
              title={item.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.done ? '\u2713' : ''}
            </button>
            {editingListItemId === item.id ? (
              <input
                autoFocus
                value={editingListText}
                onChange={(e) => setEditingListText(e.target.value)}
                onBlur={() => saveSharedListItemText(item)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') saveSharedListItemText(item);
                  if (e.key === 'Escape') { setEditingListItemId(null); setEditingListText(''); }
                }}
                className="flex-1 text-sm px-2 py-1 border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-1 focus:ring-purple-400"
              />
            ) : (
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {item.text}
              </span>
            )}
            {editingListItemId !== item.id && (
              <button
                onClick={() => startEditingListItem(item)}
                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg"
                title="Edit item"
              >
                <Edit2 className="w-3.5 h-3.5 text-purple-500" />
              </button>
            )}
            <button
              onClick={() => removeSharedListItem(item.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
