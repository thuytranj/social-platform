import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { QK } from '../../constants';
import { postsApi } from '../../api/posts.api';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { RightMessagesPanel } from './RightMessagesPanel';

export const Feed = () => {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: QK.FEEDS,
      queryFn: ({ pageParam }) =>
        postsApi.getFeed(10, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });

  // Fetch next page when bottom element comes into view
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="p-4 lg:p-8 flex gap-6 items-start w-full">
      <div className="flex-1 max-w-2xl">
        <CreatePost />

        <div className="space-y-4">
          {status === 'pending' ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-surface-800 rounded-lg p-4 shadow-xs dark:shadow-dark-xs border border-border-subtle dark:border-gray-700"
              >
                <div className="flex gap-3 mb-4">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton width="40%" />
                    <Skeleton width="20%" height="0.8em" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton />
                  <Skeleton width="80%" />
                </div>
                <Skeleton variant="rectangular" height={240} />
              </div>
            ))
          ) : status === 'error' ? (
            <div className="text-center py-12 px-6 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40">
              <p className="font-semibold">
                Failed to load feed. Please try again.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-6 bg-surface dark:bg-surface-700 rounded-lg border-2 border-dashed border-border-variant">
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                No posts yet
              </h3>
              <p className="text-text-secondary">
                Find some friends to follow or create a post yourself!
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {/* Intersection observer target */}
              <div ref={ref} className="h-10 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <RightMessagesPanel />
    </div>
  );
};
