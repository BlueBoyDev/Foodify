import { cn } from '@/lib/utils';
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'available' | 'occupied' | 'reserved' | 'cleaning' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variantClasses = {
    pending: 'bg-blue-50 text-blue-500',
    preparing: 'bg-orange-50 text-foodify-orange',
    ready: 'bg-emerald-50 text-emerald-500',
    delivered: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-500',
    available: 'bg-emerald-50 text-emerald-500',
    occupied: 'bg-red-50 text-red-500',
    reserved: 'bg-amber-50 text-amber-500',
    cleaning: 'bg-gray-100 text-gray-500',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
