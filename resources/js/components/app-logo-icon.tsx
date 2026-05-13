import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            {/* We use w-48 (192px) here to force it larger */}
            <div className="mb-14 flex w-32 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm">
                <img
                    src="/images/logo.png"
                    alt="Ice Cream POS"
                    className="h-auto w-full object-contain"
                />
            </div>
        </div>
    );
}
