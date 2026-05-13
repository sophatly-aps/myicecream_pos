import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    showRole = false,
}: {
    user: User & { photo?: string; role?: string };
    showEmail?: boolean;
    showRole?: boolean;
}) {
    const getInitials = useInitials();
    const avatarSrc = user.photo ? `/storage/${user.photo}` : user.avatar;

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full border border-slate-200">
                <AvatarImage src={avatarSrc} alt={user.name} className="object-cover" />
                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
                {showRole && (
                    <span className="truncate text-xs text-slate-500">
                        {user.role || 'Administrator'}
                    </span>
                )}
            </div>
        </>
    );
}
