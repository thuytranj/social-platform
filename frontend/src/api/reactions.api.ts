import api from './axios';
import { Reaction, ReactionType, ReactionTargetType, CursorPage } from '../types';

export const reactionsApi = {
  addReaction: (targetId: string, targetType: ReactionTargetType, type: ReactionType) => {
    const url = targetType === ReactionTargetType.POST
      ? `/posts/${targetId}/reactions`
      : `/comments/${targetId}/reactions`;
    return api.post<Reaction>(url, { type, target_type: targetType, target_id: targetId }).then((r) => r.data);
  },

  updateReaction: (targetId: string, targetType: ReactionTargetType, type: ReactionType) => {
    const url = targetType === ReactionTargetType.POST
      ? `/posts/${targetId}/reactions`
      : `/comments/${targetId}/reactions`;
    return api.patch<Reaction>(url, { type, target_type: targetType, target_id: targetId }).then((r) => r.data);
  },

  removeReaction: (targetId: string, targetType: ReactionTargetType) => {
    const url = targetType === ReactionTargetType.POST
      ? `/posts/${targetId}/reactions`
      : `/comments/${targetId}/reactions`;
    return api.delete(url).then((r) => r.data);
  },

  getReactions: (targetId: string, targetType: ReactionTargetType, limit = 10, cursor?: string, type?: ReactionType) => {
    const url = targetType === ReactionTargetType.POST
      ? `/posts/${targetId}/reactions`
      : `/comments/${targetId}/reactions`;
    return api.get<CursorPage<Reaction>>(url, { params: { limit, cursor, type } }).then((r) => r.data);
  },
};
