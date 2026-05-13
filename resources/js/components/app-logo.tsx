export default function AppLogo() {
    return (
        <>
            {/* <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div> */}
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-red-500">
                <img
                    src="/images/logo.png"
                    alt="Ice Cream POS"
                    className="size-full object-cover"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    LSP POS
                </span>
            </div>
        </>
    );
}
