import React from 'react';
import { FaWrench, FaTruck, FaCar, FaBatteryFull } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface ServiceCardProps {
  title: string;
  description: string;
  iconType: 'wrench' | 'truck' | 'car' | 'battery';
  price?: string;
}

const iconMap: Record<string, IconType> = {
  wrench: FaWrench,
  truck: FaTruck,
  car: FaCar,
  battery: FaBatteryFull,
};

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, iconType, price }) => {
  const Icon = iconMap[iconType];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-primary-100 text-primary-600">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 mb-4 min-h-[60px]">{description}</p>
      {price && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-gray-600">À partir de</span>
          <span className="text-primary-600 font-bold text-xl">{price}</span>
        </div>
      )}
    </div>
  );
};

export default ServiceCard; 