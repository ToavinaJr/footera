import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type RouteModalMode = 'create' | 'detail' | null;

export const useRouteModal = (basePath: string) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const detailMatch = pathname.match(new RegExp(`^${basePath}/([^/]+)$`));
  const isCreate = pathname === `${basePath}/new`;
  const resourceId = detailMatch && detailMatch[1] !== 'new'
    ? decodeURIComponent(detailMatch[1])
    : undefined;

  const openCreate = useCallback(() => navigate(`${basePath}/new`), [basePath, navigate]);
  const openDetail = useCallback((id: string, replace = false) => {
    navigate(`${basePath}/${encodeURIComponent(id)}`, { replace });
  }, [basePath, navigate]);
  const close = useCallback(() => navigate(basePath, { replace: true }), [basePath, navigate]);

  const mode: RouteModalMode = isCreate ? 'create' : resourceId ? 'detail' : null;
  return { mode, resourceId, openCreate, openDetail, close };
};
