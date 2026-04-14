import React from 'react';
import { Clock } from 'lucide-react';
import { Menu } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';

interface MenuTabsProps {
  menus: Menu[];
  activeMenuId: string;
  onSelect: (id: string) => void;
}

export const MenuTabs: React.FC<MenuTabsProps> = ({ menus, activeMenuId, onSelect }) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
      <div className="container mx-auto px-4 flex gap-4 md:gap-8">
        {menus.map((menu) => {
          const isActive = activeMenuId === menu.id;
          const isClosed = !menu.isActive; // Simplified logic for demo

          return (
            <button
              key={menu.id}
              onClick={() => !isClosed && onSelect(menu.id)}
              disabled={isClosed && !menu.allowOutsideSchedule}
              className={cn(
                'relative py-4 px-2 whitespace-nowrap text-sm font-semibold transition-colors flex items-center gap-2',
                isActive ? 'text-foodify-orange' : 'text-gray-500 hover:text-gray-900',
                isClosed && !menu.allowOutsideSchedule && 'opacity-50 cursor-not-allowed'
              )}
            >
              {menu.name}
              
              {isClosed && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {!menu.allowOutsideSchedule && (
                    <Badge variant="cancelled" className="scale-75 origin-left">
                      Cerrado
                    </Badge>
                  )}
                </div>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foodify-orange rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
