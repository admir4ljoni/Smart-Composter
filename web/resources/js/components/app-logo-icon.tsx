import type { SVGAttributes } from 'react';

/** The composter box: lid, body, compost line and two rising bubbles. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4h8v4h-2V6h-4v2h-2z" />
            <path d="M5 8h22v3H5z" />
            <path fillRule="evenodd" d="M7 12h18v17H7zm2.5 2.5v12h13v-12z" />
            <path d="M9.5 20.5c2.2-1 4.3-.2 6.5-.6s4.3-1.1 6.5-.3v6.9h-13z" />
            <circle cx="13" cy="17" r="1.2" />
            <circle cx="18" cy="16" r="0.9" />
        </svg>
    );
}
