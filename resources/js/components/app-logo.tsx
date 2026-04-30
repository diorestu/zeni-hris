import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex h-8 w-28 items-center overflow-hidden">
            <AppLogoIcon
                className="h-8 w-full object-contain object-left"
                alt="Logo aplikasi"
            />
        </div>
    );
}
