import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { QK } from '../../constants';
import { postsApi } from '../../api/posts.api';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { Skeleton } from '../../components/ui/Skeleton';

export const Feed = () => {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: QK.FEEDS,
    queryFn: ({ pageParam }) => postsApi.getFeed(10, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  // Fetch next page when bottom element comes into view
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="w-full max-w-2xl mx-auto pb-20">
      <CreatePost />

      <div className="space-y-6">
        {status === 'pending' ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-50 rounded-2xl p-5">
              <div className="flex gap-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton width="40%" />
                  <Skeleton width="20%" height="0.8em" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Skeleton />
                <Skeleton width="80%" />
              </div>
              <Skeleton variant="rectangular" height={200} />
            </div>
          ))
        ) : status === 'error' ? (
          <div className="text-center py-10 text-red-600 bg-red-50 dark:bg-red-500/10 rounded-2xl">
            Failed to load feed. Please try again.
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 dark:bg-surface-200 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed">
            <h3 className="text-lg font-display font-medium text-gray-900 dark:text-ink mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-ink-muted">Find some friends to follow or create a post yourself!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            
            {/* Intersection observer target */}
            <div ref={ref} className="h-10 flex items-center justify-center">
              {isFetchingNextPage && (
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
