import React from 'react';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/types';
import * as Icons from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ 
  categories, 
  activeCategoryId, 
  onSelect,
  orientation = 'horizontal'
}) => {
  // Helper to render icon
  const renderIcon = (iconName: string = 'Utensils') => {
    const IconComponent = (Icons as any)[iconName] || Icons.Utensils;
    return <IconComponent className="w-4 h-4" />;
  };

  if (orientation === 'vertical') {
    return (
      <aside className="hidden lg:block w-60 sticky top-24 self-start space-y-2 pr-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">
          Categorías
        </h3>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all transition-all",
              activeCategoryId === cat.id 
                ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                : "text-text-secondary hover:bg-white hover:text-foodify-orange"
            )}
          >
            {renderIcon(cat.icon)}
            {cat.name}
          </button>
        ))}
      </aside>
    );
  }

  return (
    <div className="flex lg:hidden gap-3 overflow-x-auto scrollbar-hide py-4 px-4 bg-bg-app">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
            activeCategoryId === cat.id 
              ? "bg-foodify-orange text-white border-foodify-orange shadow-md" 
              : "bg-white text-text-secondary border-gray-100"
          )}
        >
          {renderIcon(cat.icon)}
          {cat.name}
        </button>
      ))}
    </div>
  );
};
