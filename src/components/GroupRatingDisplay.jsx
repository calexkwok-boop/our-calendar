// GroupRatingDisplay.jsx - Personal ratings with group consensus
import React, { useState } from 'react';
import { 
  Star, ChevronDown, ChevronUp, CheckCircle, AlertCircle, 
  MessageCircle, Camera, Users, X, Eye, EyeOff 
} from 'lucide-react';

const getReviewPhotoSrc = (photo) => String(
  photo?.resolved_medium_url
  || photo?.resolved_url
  || photo?.resolved_original_url
  || photo?.medium_url
  || photo?.url
  || photo?.original_url
  || photo
  || ''
).trim();

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GroupRatingDisplay = ({
  // Event data
  event,
  
  // All ratings for this event
  ratings = [], // Array of { id, userId, userName, userAvatar, rating, reviewText, photos, isPublic, wouldReturn, createdAt }
  
  // Current user
  currentUserId,
  
  // Actions
  onAddRating, // (rating, isPublic, reviewText, wouldReturn) => void
  onUpdateRating, // (ratingId, updates) => void
  onDeleteRating, // (ratingId) => void

  // UX triggers
  openFormRating = null, // number | null - if provided, opens form prefilled with this rating
  onAfterSubmit = null, // callback after submit
  
  // Theme
  darkMode = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [forcedInitialRating, setForcedInitialRating] = useState(null);
  
  // Separate public and private ratings
  const publicRatings = ratings.filter(r => r.isPublic);
  const yourRating = ratings.find(r => r.userId === currentUserId);

  // If parent passes openFormRating, open modal prefilled
  React.useEffect(() => {
    if (openFormRating && !showRatingForm) {
      setForcedInitialRating(Number(openFormRating));
      setShowRatingForm(true);
    }
  }, [openFormRating]);
  
  // Calculate group statistics
  const groupAvg = publicRatings.length > 0
    ? publicRatings.reduce((sum, r) => sum + r.rating, 0) / publicRatings.length
    : 0;
  
  const wouldReturnCount = publicRatings.filter(r => r.wouldReturn).length;
  const totalReturnVotes = publicRatings.filter(r => r.wouldReturn !== null).length;
  
  // Calculate consensus (how much group agrees)
  const consensus = publicRatings.length > 1
    ? calculateConsensus(publicRatings.map(r => r.rating))
    : 1;
  
  return (
    <div className="group-rating-display">
      {/* Your rating (if exists) */}
      {yourRating && (
        <YourRatingCard
          rating={yourRating}
          onEdit={() => setShowRatingForm(true)}
          onDelete={() => onDeleteRating(yourRating.id)}
          darkMode={darkMode}
        />
      )}
      
      {/* Group summary (if multiple ratings) */}
      {publicRatings.length > 0 && (
        <GroupSummary
          groupAvg={groupAvg}
          totalRatings={publicRatings.length}
          consensus={consensus}
          wouldReturnCount={wouldReturnCount}
          totalReturnVotes={totalReturnVotes}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          darkMode={darkMode}
        />
      )}
      
      {/* Expanded individual ratings */}
      {expanded && publicRatings.length > 0 && (
        <IndividualRatings
          ratings={publicRatings}
          currentUserId={currentUserId}
          darkMode={darkMode}
        />
      )}
      
      {/* Rating form modal */}
      {showRatingForm && (
        <RatingFormModal
          event={event}
          existingRating={yourRating}
          initialRating={forcedInitialRating}
          onSubmit={(ratingData) => {
            if (yourRating) {
              onUpdateRating(yourRating.id, ratingData);
            } else {
              onAddRating(ratingData);
            }
            setShowRatingForm(false);
            setForcedInitialRating(null);
            if (typeof onAfterSubmit === 'function') onAfterSubmit();
          }}
          onClose={() => { setShowRatingForm(false); setForcedInitialRating(null); }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// ============================================================================
// YOUR RATING CARD
// ============================================================================

const YourRatingCard = ({ rating, onEdit, onDelete, darkMode }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="relative rounded-2xl border-2 border-purple-200 dark:border-purple-800 
                  bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                  p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Your Rating
          </span>
          {!rating.isPublic && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full 
                          bg-gray-200 dark:bg-gray-700 text-xs font-medium">
              <EyeOff className="w-3 h-3" />
              <span>Private</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
            <span className="text-xl">⋮</span>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 
                          rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 
                          overflow-hidden z-10 min-w-[120px]">
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                Edit
              </button>
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Star rating */}
      <div className="mb-3">
        <StarRating rating={rating.rating} size="lg" readonly />
      </div>
      
      {/* Review text */}
      {rating.reviewText && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          "{rating.reviewText}"
        </p>
      )}
      
      {/* Would return */}
      {rating.wouldReturn !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Would go back?</span>
          <span className={`font-semibold ${
            rating.wouldReturn 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {rating.wouldReturn ? '👍 Yes' : '👎 No'}
          </span>
        </div>
      )}
      
      {/* Photos */}
      {rating.photos && rating.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {rating.photos.map((photo, idx) => (
            <img
              key={idx}
              src={getReviewPhotoSrc(photo)}
              alt={`Photo ${idx + 1}`}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GROUP SUMMARY
// ============================================================================

const GroupSummary = ({ 
  groupAvg, 
  totalRatings, 
  consensus, 
  wouldReturnCount,
  totalReturnVotes,
  expanded, 
  onToggle,
  darkMode 
}) => (
  <button
    onClick={onToggle}
    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 
             border border-gray-200 dark:border-gray-700 p-4 mb-4
             hover:bg-gray-100 dark:hover:bg-gray-750 transition-all
             text-left">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="font-semibold text-gray-900 dark:text-white">
          Group Rating
        </span>
      </div>
      {expanded ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </div>
    
    <div className="flex items-center gap-4 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {groupAvg.toFixed(1)}
        </span>
        <StarRating rating={groupAvg} size="md" readonly partial />
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
      </div>
    </div>
    
    {/* Consensus indicator */}
    <div className="flex items-center gap-4">
      {consensus > 0.8 ? (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold">Group agrees</span>
        </div>
      ) : consensus > 0.5 ? (
        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span className="font-semibold">Mixed opinions</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span className="font-semibold">Divided</span>
        </div>
      )}
      
      {/* Would return summary */}
      {totalReturnVotes > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {wouldReturnCount} of {totalReturnVotes} would return
        </div>
      )}
    </div>
  </button>
);

// ============================================================================
// INDIVIDUAL RATINGS
// ============================================================================

const IndividualRatings = ({ ratings, currentUserId, darkMode }) => {
  // Sort by rating (highest first)
  const sortedRatings = [...ratings].sort((a, b) => b.rating - a.rating);
  
  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
        Individual Ratings
      </h4>
      
      {sortedRatings.map(rating => (
        <div
          key={rating.id}
          className={`flex items-start gap-3 p-3 rounded-xl 
                   ${rating.userId === currentUserId 
                     ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700' 
                     : 'bg-white dark:bg-gray-700'
                   }`}>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                        flex items-center justify-center shrink-0">
            {rating.userAvatar ? (
              <img src={rating.userAvatar} alt={rating.userName} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-white text-sm font-bold">
                {rating.userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {rating.userId === currentUserId ? 'You' : rating.userName}
              </span>
              <StarRating rating={rating.rating} size="sm" readonly />
            </div>
            
            {rating.reviewText && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                "{rating.reviewText}"
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
              {rating.wouldReturn !== null && (
                <span className={rating.wouldReturn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {rating.wouldReturn ? '👍 Would return' : '👎 Wouldn\'t return'}
                </span>
              )}
              {rating.photos && rating.photos.length > 0 && (
                <span className="flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {rating.photos.length}
                </span>
              )}
            </div>
            
            {/* Photos */}
            {rating.photos && rating.photos.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {rating.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={getReviewPhotoSrc(photo)}
                    alt={`Photo ${idx + 1}`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// RATING FORM MODAL
// ============================================================================

const RatingFormModal = ({ event, existingRating, initialRating = null, onSubmit, onClose, darkMode }) => {
  const [rating, setRating] = useState(initialRating != null ? initialRating : (existingRating?.rating || 0));
  const [reviewText, setReviewText] = useState(existingRating?.reviewText || '');
  const [isPublic, setIsPublic] = useState(existingRating?.isPublic ?? true);
  const [wouldReturn, setWouldReturn] = useState(existingRating?.wouldReturn ?? null);
  const [photos, setPhotos] = useState(existingRating?.photos || []);
  
  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    onSubmit({
      rating,
      reviewText: reviewText.trim(),
      isPublic,
      wouldReturn,
      photos,
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center 
                    bg-black/50 px-0 sm:px-4"
         onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl 
                   w-full sm:max-w-lg max-h-[90vh] overflow-y-auto
                   shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
                      px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {existingRating ? 'Edit Rating' : 'Rate This'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event info */}
          <div className="text-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              {event.title}
            </h3>
            {event.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📍 {event.location}
              </p>
            )}
          </div>
          
          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Your Rating *
            </label>
            <div className="flex justify-center">
              <StarRating rating={rating} onRate={setRating} size="xl" />
            </div>
          </div>
          
          {/* Review text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 outline-none resize-none text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          {/* Would return */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Would you go back?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setWouldReturn(true)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  wouldReturn === true
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                👍 Yes
              </button>
              <button
                onClick={() => setWouldReturn(false)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  wouldReturn === false
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                👎 No
              </button>
              {wouldReturn !== null && (
                <button
                  onClick={() => setWouldReturn(null)}
                  className="px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Privacy toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {isPublic ? 'Share with group' : 'Keep private'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isPublic 
                    ? 'Everyone on this trip can see your rating' 
                    : 'Only you can see this rating'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isPublic ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                     text-white font-bold text-lg hover:shadow-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STAR RATING COMPONENT
// ============================================================================

const StarRating = ({ rating = 0, onRate, size = 'md', readonly = false, partial = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const fillPercent = partial 
          ? Math.min(100, Math.max(0, (rating - star + 1) * 100))
          : (hoverRating || rating) >= star ? 100 : 0;
        
        return (
          <button
            key={star}
            disabled={readonly}
            onClick={() => !readonly && onRate && onRate(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`relative transition-all duration-200 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}>
            <Star className={`${sizes[size]} text-gray-300 dark:text-gray-600`} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}>
              <Star className={`${sizes[size]} fill-yellow-400 text-yellow-400`} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate consensus score (0-1, how much group agrees)
 * Uses standard deviation as measure of agreement
 */
const calculateConsensus = (ratings) => {
  if (ratings.length <= 1) return 1;
  
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to 0-1 scale (lower stdDev = higher consensus)
  // Max possible stdDev for 1-5 scale is 2
  return Math.max(0, 1 - (stdDev / 2));
};

// ============================================================================
// EXPORT
// ============================================================================

export default GroupRatingDisplay;
export {
  YourRatingCard,
  GroupSummary,
  IndividualRatings,
  RatingFormModal,
  StarRating,
  calculateConsensus,
};
