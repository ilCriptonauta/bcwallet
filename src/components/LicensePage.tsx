'use client';

import React, { useMemo } from 'react';
import { useAccountNfts } from '@/helpers';
import { useGetAccountInfo } from '@/lib';
import { NftMedia } from './NftMedia';
import { ShieldCheck, Award, Hash, ArrowUpRight, X, Folder, Rocket, PlusCircle } from 'lucide-react';

const LICENSE_COLLECTION = 'BCNPASS-40e72d';

const LicensePage: React.FC = () => {
    const account = useGetAccountInfo()?.account;
    const address = account?.address;
    const { items: nfts, isLoading } = useAccountNfts({ address, enabled: !!address });

    const license = useMemo(() => {
        return nfts.find(nft =>
            nft.collection === LICENSE_COLLECTION ||
            nft.name.toLowerCase().includes('bacon pass')
        );
    }, [nfts]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Verifying License...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out flex flex-col items-center">
            {/* Top Badge - Asset Hub Style */}
            <div className="mb-12 text-center">
                <span className="px-6 py-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] inline-block">
                    Authentic Membership
                </span>
            </div>

            {/* Image Section - Centered 4:3 */}
            <div className="w-full max-w-[550px] relative group mb-16">
                <div className="absolute -inset-8 bg-gradient-to-tr from-brand-orange/20 to-brand-yellow/20 rounded-[3.5rem] opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-1000" />
                <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_48px_80px_-20px_rgba(0,0,0,0.4)] dark:shadow-[0_48px_80px_-20px_rgba(249,115,22,0.2)] bg-[#111] ring-1 ring-white/10 flex items-center justify-center">
                    {license ? (
                        <>
                            <NftMedia
                                src={license.originalImageUrl || license.imageUrl || ''}
                                alt={license.name}
                                mimeType={license.mimeType}
                                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                                thumbnailFallback={license.thumbnailUrl || undefined}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </>
                    ) : (
                        <div className="w-full h-full border-4 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 space-y-4 bg-white/[0.02]">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Award className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-center text-xs px-4">
                                Buy your license <a href="https://oox.art/marketplace/collections/BCNPASS-40e72d" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">here</a>
                            </p>
                        </div>
                    )}
                </div>

                {/* Floating Badge */}
                {license && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-10">
                        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 animate-bounce cursor-default">
                            <div className="p-2.5 bg-brand-orange rounded-xl shadow-lg shadow-orange-500/20">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section - Below Image */}
            <div className="w-full text-center space-y-12">
                <div className="space-y-6">
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
                        {license ? license.name : 'Bacon Pass'}
                    </h1>

                    <p className="text-slate-500 dark:text-gray-400 text-lg font-medium leading-relaxed max-w-xl mx-auto">
                        This unique SFT identifier grants you unlimited lifetime access to the entire <span className="text-slate-900 dark:text-white font-bold">Bacon Wallet</span> ecosystem, including advanced minting tools and analytics.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-brand-orange/30 transition-colors text-left">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500 mb-2">
                            <Hash className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Token ID</span>
                        </div>
                        <p className="text-sm font-black truncate">{license ? license.identifier : 'BCNPASS-40e72d-??'}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-brand-orange/30 transition-colors text-left">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-gray-400 mb-2">
                            <Award className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">Rights</span>
                        </div>
                        <p className="text-sm font-black">LIFETIME ACCESS</p>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${license ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                            {license ? (
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                            ) : (
                                <X className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                            <p className={`text-sm font-black ${license ? 'text-green-500' : 'text-gray-400'}`}>
                                {license ? 'Active License' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    {license && (
                        <div className="px-6 py-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            Pro Member
                        </div>
                    )}
                </div>

                {/* Benefits Section - Only visible if no license owned */}
                {!license && (
                    <div className="pt-16 w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <div className="text-left space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                                Exclusive Benefits
                            </h3>
                            <div className="h-1 w-12 bg-orange-500 rounded-full" />
                        </div>

                        <div className="grid gap-4">
                            {[
                                {
                                    icon: <Folder className="w-5 h-5 text-orange-500" />,
                                    title: "Advanced Organization",
                                    desc: "Up to 50 folders to organize your NFT collections exactly how you want."
                                },
                                {
                                    icon: <Rocket className="w-5 h-5 text-orange-500" />,
                                    title: "Simplified Collection Creation",
                                    desc: "Deploy new Smart Contract collections with a single click and no technical knowledge."
                                },
                                {
                                    icon: <PlusCircle className="w-5 h-5 text-orange-500" />,
                                    title: "One-Click Minting",
                                    desc: "Mint new NFTs and SFTs directly from your dashboard with optimized gas costs."
                                }
                            ].map((benefit, i) => (
                                <div key={i} className="flex gap-4 p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-brand-orange/20 transition-all">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {benefit.icon}
                                    </div>
                                    <div className="text-left space-y-1">
                                        <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                                            {benefit.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                                            {benefit.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LicensePage;
