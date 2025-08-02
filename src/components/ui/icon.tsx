import React from 'react';
import {
  UtensilsCrossed,
  Car,
  Gamepad2,
  ShoppingBag,
  Heart,
  Home,
  GraduationCap,
  Plane,
  Coffee,
  Gift,
  Shirt,
  Smartphone,
  Book,
  Music,
  MoreHorizontal,
  DollarSign,
  LucideProps
} from 'lucide-react';

const iconMap = {
  UtensilsCrossed,
  Car,
  Gamepad2,
  ShoppingBag,
  Heart,
  Home,
  GraduationCap,
  Plane,
  Coffee,
  Gift,
  Shirt,
  Smartphone,
  Book,
  Music,
  MoreHorizontal,
  DollarSign,
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof iconMap;
}

export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = iconMap[name];
  
  if (!LucideIcon) {
    return <DollarSign {...props} />;
  }
  
  return <LucideIcon {...props} />;
};

export const availableIcons = Object.keys(iconMap) as Array<keyof typeof iconMap>;

// Mapeo de nombres a emojis para fallback
export const iconToEmoji: Record<keyof typeof iconMap, string> = {
  UtensilsCrossed: '🍽️',
  Car: '🚗',
  Gamepad2: '🎮',
  ShoppingBag: '🛍️',
  Heart: '❤️',
  Home: '🏠',
  GraduationCap: '🎓',
  Plane: '✈️',
  Coffee: '☕',
  Gift: '🎁',
  Shirt: '👕',
  Smartphone: '📱',
  Book: '📚',
  Music: '🎵',
  MoreHorizontal: '⋯',
  DollarSign: '💰',
};