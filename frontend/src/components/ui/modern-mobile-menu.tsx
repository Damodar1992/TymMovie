import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  activeIndex?: number;
  onItemSelect?: (index: number, item: InteractiveMenuItem) => void;
  className?: string;
}

const defaultAccentColor = 'var(--component-active-color-default)';

export function InteractiveMenu({
  items,
  accentColor,
  activeIndex: controlledIndex,
  onItemSelect,
  className,
}: InteractiveMenuProps) {
  const finalItems = useMemo(() => {
    const valid =
      items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    return valid ? items! : [];
  }, [items]);

  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex! : internalIndex;

  useEffect(() => {
    if (!isControlled && activeIndex >= finalItems.length) {
      setInternalIndex(0);
    }
  }, [finalItems, activeIndex, isControlled]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemEl = itemRefs.current[activeIndex];
      const activeTextEl = textRefs.current[activeIndex];
      if (activeItemEl && activeTextEl) {
        const textWidth = activeTextEl.offsetWidth;
        activeItemEl.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };
    setLineWidth();
    window.addEventListener('resize', setLineWidth);
    return () => window.removeEventListener('resize', setLineWidth);
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    if (!isControlled) setInternalIndex(index);
    onItemSelect?.(index, finalItems[index]);
  };

  const navStyle = useMemo(() => {
    const active = accentColor || defaultAccentColor;
    return { '--component-active-color': active } as CSSProperties;
  }, [accentColor]);

  if (finalItems.length === 0) return null;

  return (
    <nav
      className={`menu${className ? ` ${className}` : ''}`}
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            className={`menu__item${isActive ? ' active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            style={{ '--lineWidth': '0px' } as CSSProperties}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="menu__icon">
              <Icon className="icon" />
            </span>
            <strong
              className={`menu__text${isActive ? ' active' : ''}`}
              ref={(el) => {
                textRefs.current[index] = el;
              }}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
}
