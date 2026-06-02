'use client';

import { useState } from 'react';
import { Star, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { id: string; fullName: string; avatarUrl: string | null };
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onUpdate?: (reviewId: string, rating: number, comment: string) => Promise<any>;
  onDelete?: (reviewId: string) => Promise<any>;
}

export function ReviewCard({
  review,
  currentUserId,
  onUpdate,
  onDelete,
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId === review?.customer?.id;

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleUpdate = async () => {
    if (!onUpdate || editRating === 0 || !editComment.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdate(review.id, editRating, editComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update review:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this review?')) return;
    setIsDeleting(true);
    try {
      await onDelete(review.id);
    } catch (error) {
      console.error('Failed to delete review:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 border border-gray-300">
            <span className="font-bold text-gray-700 text-sm">
              {review?.customer?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm">
              {review?.customer?.fullName || 'Anonymous'}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
              title="Edit review"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete review"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Rating - always visible */}
      {!isEditing && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < review.rating
                    ? 'fill-gray-900 text-gray-900'
                    : 'text-gray-200'
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {(review?.rating || 0).toFixed(1)} / 5.0
          </span>
        </div>
      )}

      {/* Comment */}
      {isEditing ? (
        <div className="space-y-4">
          {/* Edit Rating */}
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setEditRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-5 w-5 transition-colors',
                    star <= (editRating || 0)
                      ? 'fill-gray-900 text-gray-900'
                      : 'text-gray-200 hover:text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Edit Comment */}
          <Textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Share your updated thoughts..."
            className="min-h-[100px] rounded-lg border-gray-200 focus-visible:ring-gray-400 resize-none text-sm"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditRating(review.rating);
                setEditComment(review.comment || '');
              }}
              className="rounded-lg border-gray-200 font-semibold text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating || editRating === 0 || !editComment.trim()}
              className="rounded-lg font-semibold text-xs uppercase tracking-wider"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 text-sm leading-relaxed font-medium">
          {review.comment}
        </p>
      )}
    </div>
  );
}
