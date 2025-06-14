"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faImage, faImages, faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default function MobileNavigation({ activePanel, onPanelChange, hasImage, imageCount }) {
  const navItems = [
    {
      id: 'generate',
      label: 'Generate',
      icon: faMagic,
      color: 'blue',
      badge: null
    },
    {
      id: 'image',
      label: 'Image',
      icon: faImage,
      color: 'purple',
      badge: hasImage ? '1' : null,
      disabled: !hasImage
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: faImages,
      color: 'green',
      badge: imageCount > 0 ? imageCount.toString() : null,
      disabled: imageCount === 0
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onPanelChange(item.id)}
            disabled={item.disabled}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 relative ${
              activePanel === item.id
                ? `bg-${item.color}-100 text-${item.color}-600`
                : item.disabled
                ? 'text-gray-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <FontAwesomeIcon 
                icon={item.icon} 
                className={`w-5 h-5 mb-1 ${
                  activePanel === item.id ? 'scale-110' : ''
                } transition-transform duration-200`} 
              />
              {item.badge && (
                <span className={`absolute -top-2 -right-2 bg-${item.color}-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${
              activePanel === item.id ? 'font-semibold' : ''
            }`}>
              {item.label}
            </span>
            
            {/* Active indicator */}
            {activePanel === item.id && (
              <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-${item.color}-500 rounded-full`} />
            )}
          </button>
        ))}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}