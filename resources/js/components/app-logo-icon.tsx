import { ImgHTMLAttributes } from 'react';

interface AppLogoIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    className?: string;
}

export default function AppLogoIcon({ className = '', ...props }: AppLogoIconProps) {
    // Remove SVG-specific classes that don't apply to images
    const cleanClassName = className
        .replace(/fill-current/g, '')
        .replace(/text-\w+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    return (
        <img 
            {...props}
            src="/logo-pu.png" 
            alt="Logo Dinas PU" 
            className={`object-contain w-8 h-8 ${cleanClassName}`}
        />
    );
}
