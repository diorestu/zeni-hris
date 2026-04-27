import type { ComponentProps } from 'react';

export default function AppLogoIcon(props: ComponentProps<'img'>) {
    return <img {...props} src="/logo.png" alt={props.alt ?? 'Logo aplikasi'} />;
}
