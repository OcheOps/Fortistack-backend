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
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const formSchema = z.object({
    tenant_name: z.string().min(3, 'Company name is required'),
    region: z.string().min(1, 'Please select a region'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function SignupPage() {
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tenant_name: '',
            region: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            await signup(values.tenant_name, values.region, values.email, values.password);
            toast.success('Account created successfully!');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Signup failed';
            toast.error('Signup failed', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4 py-12 sm:px-6 lg:px-8">
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
                            Start Your Audit
                        </CardTitle>
                        <CardDescription className="text-center text-[#A9B5C7] text-sm">
                            Create your FortiStack tenant in seconds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="tenant_name" className="text-[#A9B5C7] text-xs font-medium uppercase tracking-wider">Company Name</Label>
                                <Input
                                    id="tenant_name"
                                    placeholder="Acme Inc."
                                    {...register('tenant_name')}
                                    className="h-11 bg-[#0B1220] border-[#1D2A44] text-white placeholder:text-[#A9B5C7]/40 focus-visible:ring-[#2F7DFF] focus-visible:border-[#2F7DFF]/50 transition-colors"
                                />
                                {errors.tenant_name && (
                                    <p className="text-xs text-red-400">{errors.tenant_name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="region" className="text-[#A9B5C7] text-xs font-medium uppercase tracking-wider">Data Region</Label>
                                <div className="relative">
                                    <select
                                        id="region"
                                        {...register('region')}
                                        className="w-full h-11 bg-[#0B1220] border border-[#1D2A44] rounded-md px-3 py-2 text-white placeholder:text-[#A9B5C7]/40 focus:outline-none focus:ring-2 focus:ring-[#2F7DFF] focus:border-[#2F7DFF]/50 transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Select a region</option>
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="eu-west-1">Europe (Ireland)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                                {errors.region && (
                                    <p className="text-xs text-red-400">{errors.region.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#A9B5C7] text-xs font-medium uppercase tracking-wider">Work Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
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
                                    autoComplete="new-password"
                                    placeholder="••••••••"
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account…
                                    </>
                                ) : (
                                    <>
                                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-[#1D2A44] p-4 bg-[#0B1220]/30 rounded-b-lg">
                        <p className="text-sm text-[#A9B5C7]">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#2F7DFF] hover:text-[#5F9DFF] font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
