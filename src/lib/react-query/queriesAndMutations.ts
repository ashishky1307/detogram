import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
} from '@tanstack/react-query';
import { createUserAccount, SignInAccount } from '../appwrite/api';
import { INewUser } from '@/types';

// Helper to generate a valid userId (if needed)
import { ID } from 'appwrite';

// Updated createUserAccount to ensure valid userId
export const userCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => {
            // Ensure userId is valid
            const sanitizedUser = {
                ...user,
                userId: user.userId || ID.unique(), // Generate valid userId if not provided
            };
            return createUserAccount(sanitizedUser);
        },
    });
};

// Updated signInAccount with no changes to your existing lines
export const userSignInAccount = () => {
    return useMutation({
        mutationFn: (user: { email: string; password: string }) =>
            SignInAccount(user),
    });
};

export type { INewUser };
