import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  className?: string;
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'relative w-full rounded-lg border p-4';
  
  const variantClasses = {
    default: 'bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive'
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="alert"
      {...props}
    />
  );
};

const AlertDescription: React.FC<AlertDescriptionProps> = ({ className = '', ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props} />
);

export { Alert, AlertDescription };