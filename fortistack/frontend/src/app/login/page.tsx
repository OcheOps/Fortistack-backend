'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            await login(values.email, values.password);
            toast.success('Welcome back!');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Invalid credentials';
            toast.error('Login failed', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4 py-12 sm:px-6 lg:px-8">
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <div className="relative w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-2xl bg-[#111A2E] p-4 text-[#2F7DFF] shadow-lg shadow-[#2F7DFF]/10 ring-1 ring-[#1D2A44] mb-6">
                        <ShieldCheck className="h-10 w-10" />
                    </div>
                </div>

                <Card className="border-[#1D2A44] bg-[#111A2E]/80 backdrop-blur-md shadow-2xl shadow-black/30">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
                            FortiStack
                        </CardTitle>
                        <CardDescription className="text-center text-[#A9B5C7] text-sm">
                            Sign in to your infrastructure assurance dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#A9B5C7] text-xs font-medium uppercase tracking-wider">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@fortistack.local"
                                    autoComplete="email"
                                    {...register('email')}
                                    className="h-11 bg-[#0B1220] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/40 focus-visible:ring-[#2F7DFF] focus-visible:border-[#2F7DFF]/50 transition-colors"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-400">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#A9B5C7] text-xs font-medium uppercase tracking-wider">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...register('password')}
                                    className="h-11 bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF] focus-visible:border-[#2F7DFF]/50 transition-colors"
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#2F7DFF] hover:bg-[#1E6AE1] text-white font-medium shadow-[0_0_20px_rgba(47,125,255,0.25)] hover:shadow-[0_0_25px_rgba(47,125,255,0.35)] transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-[#1D2A44] p-4 bg-[#0B1220]/30 rounded-b-lg">
                        <p className="text-xs text-[#A9B5C7]/60">
                            Protected by FortiStack Security
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
