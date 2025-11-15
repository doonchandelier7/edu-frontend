import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card: React.FC<CardProps> = ({ className = '', ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);

const CardHeader: React.FC<CardHeaderProps> = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle: React.FC<CardTitleProps> = ({ className = '', children, ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent: React.FC<CardContentProps> = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export { Card, CardHeader, CardTitle, CardContent };