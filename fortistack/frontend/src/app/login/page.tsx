'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // If not working, use 'zod/lib/index' or ensure zod is in package.json
// I can assume zod is there.

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const { login } = useAuth();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await login(values.email, values.password);
        } catch (e: any) {
            alert("Login failed: " + (e.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Login to FortiStack</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Email"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                {...form.register('password')}
                            />
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
