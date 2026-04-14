import React from 'react';
import { MapPin, Clock, Star } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  restaurant: Restaurant;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ restaurant }) => {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-105"
        style={{ 
          backgroundImage: `url(${restaurant.hero_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'})`,
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-8 animate-fade-in">
        <div className="flex items-end gap-4">
          {/* Logo */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl flex-shrink-0 animate-scale-in">
            <img 
              src={restaurant.logo_url || '/logo-placeholder.png'} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text Info */}
          <div className="flex-1 text-white pb-2">
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg mb-2">
              {restaurant.name}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm md:text-base opacity-90">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address || 'Ubicación no disponible'}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{restaurant.schedule || 'Consultar horario'}</span>
              </div>
              
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span>4.8 (120+ reseñas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
