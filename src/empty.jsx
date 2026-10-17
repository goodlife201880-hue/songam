import React from 'react';
export const Empty = ({children, ...props}) => <div {...props}>{children}</div>;
export const EmptyHeader = ({children}) => <div className="empty-header">{children}</div>;
export const EmptyMedia = ({children}) => <div data-slot="empty-icon">{children}</div>;
export const EmptyTitle = ({children}) => <h2 className="empty-title">{children}</h2>;
export const EmptyDescription = ({children}) => <p data-slot="empty-description">{children}</p>;
