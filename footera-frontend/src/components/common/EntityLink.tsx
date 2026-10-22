import React from 'react';
import type { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';

interface EntityLinkProps {
  section: NavigationSection;
  id?: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/** Inline navigation to an entity's detail view, while keeping parent cards usable. */
export const EntityLink: React.FC<EntityLinkProps> = ({ section, id, children, className = '', title }) => {
  const { navigateToResource } = useApp();
  if (!id) return <>{children}</>;

  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        navigateToResource(section, id);
      }}
      className={`cursor-pointer text-left hover:text-pitch-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pitch-primary ${className}`}
    >
      {children}
    </button>
  );
};
