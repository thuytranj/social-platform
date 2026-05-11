import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';

export const Groups = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: QK.GROUPS,
    queryFn: () => groupsApi.getMyGroups(20),
  });

  const groups = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Groups</h1>
          <p className="text-ink-muted mt-1">Discover and join communities</p>
        </div>
        <Button onClick={() => navigate('/groups/create')} className="btn-gradient">
          <Plus size={18} className="mr-2" /> Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton variant="rectangular" height={120} className="mb-4" />
              <Skeleton width="70%" height={24} className="mb-2" />
              <Skeleton width="40%" className="mb-4" />
              <Skeleton height={36} />
            </div>
          ))
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-surface-50 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-ink-muted" />
            <h3 className="text-lg font-display font-medium text-ink mb-2">No groups yet</h3>
            <p className="text-ink-muted mb-6">Create a group or explore existing ones.</p>
            <Button onClick={() => navigate('/groups/create')} variant="outline">
              Create a Group
            </Button>
          </div>
        ) : (
          groups.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`} className="card overflow-hidden group hover:shadow-dark transition-shadow duration-200 block">
              <div className="h-32 bg-surface-200 relative overflow-hidden">
                {group.cover_url ? (
                  <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-accent-500/20">
                    <Users size={32} className="text-primary-500" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-ink text-lg truncate mb-1">{group.name}</h3>
                <p className="text-sm text-ink-muted mb-4">{group.member_count} members</p>
                <div className="flex items-center text-sm font-medium text-primary-500 group-hover:text-primary-600">
                  View Group →
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
