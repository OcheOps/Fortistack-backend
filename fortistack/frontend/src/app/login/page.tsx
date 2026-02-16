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
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
        setError('');
        try {
            await login(values.email, values.password);
            // toast.success('Welcome back!'); // Sonner toast if available
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-[#1D2A44] p-4 text-[#2F7DFF] shadow-lg shadow-[#2F7DFF]/20 ring-1 ring-[#1D2A44]">
                        <ShieldCheck className="h-10 w-10" />
                    </div>
                </div>

                <Card className="border-[#1D2A44] bg-[#111A2E]/80 backdrop-blur-sm shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
                            FortiStack
                        </CardTitle>
                        <CardDescription className="text-center text-[#A9B5C7]">
                            Infrastructure Assurance Platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#E6EEF8]">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@fortistack.local"
                                    {...register('email')}
                                    className="bg-[#0B1220] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/50 focus-visible:ring-[#2F7DFF]"
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#E6EEF8]">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    className="bg-[#0B1220] border-[#1D2A44] text-white focus-visible:ring-[#2F7DFF]"
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-[#2F7DFF] hover:bg-[#2F7DFF]/90 text-white font-medium shadow-[0_0_15px_rgba(47,125,255,0.3)]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-[#1D2A44] p-4 bg-[#0B1220]/30">
                        <p className="text-xs text-[#A9B5C7]">
                            Protected by FortiStack Security
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
