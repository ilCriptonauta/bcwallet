'use client';

import React, { useState, useEffect } from 'react';
import { useGetAccountInfo, Transaction, Address, useGetNetworkConfig } from '@/lib';
import { signAndSendTransactions } from '@/helpers';
import {
  Layers, Diamond, Plus, ArrowRight, X, Hash,
  AlignLeft, ShieldCheck, Zap, Type, Tags, PlusCircle,
  Trash2, Boxes, Database, Upload,
  ArrowLeft
} from 'lucide-react';

interface ToolsPageProps {
  isFullVersion: boolean;
}

type ModalType = 'collection' | 'asset';

const ToolsPage: React.FC<ToolsPageProps> = ({ isFullVersion }) => {
  const [modalType, setModalType] = useState<ModalType | null>(null);

  const [collectionForm, setCollectionForm] = useState({
    name: '',
    ticker: '',
    description: '',
    type: 'NFT' as 'NFT' | 'SFT'
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    description: '',
    type: 'NFT' as 'NFT' | 'SFT',
    supply: '1',
    royalties: 5,
    tags: '',
    mediaUrl: '',
    collection: '',
    properties: [{ key: '', value: '' }, { key: '', value: '' }]
  });

  // Field-level validation errors for the asset form
  const [assetErrors, setAssetErrors] = useState<Record<string, string>>({});
  const [isMinting, setIsMinting] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mintStep, setMintStep] = useState(1);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // IPFS upload via backend
  type IpfsState = 'idle' | 'uploading' | 'done' | 'error';
  const [ipfsState, setIpfsState] = useState<IpfsState>('idle');

  // Set Role modal state
  const [showSetRoleModal, setShowSetRoleModal] = useState(false);
  const [collectionsWithoutRole, setCollectionsWithoutRole] = useState<Array<{ id: string, name: string, type: string }>>([]);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [assigningRoleFor, setAssigningRoleFor] = useState<string | null>(null);

  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const [userCollections, setUserCollections] = useState<Array<{ id: string, name: string, type: string }>>([]);
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchCollections = async () => {
      setIsFetchingCollections(true);
      try {
        const response = await fetch(`https://api.multiversx.com/collections?creator=${address}&size=100`);
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((c: { collection: string; name: string; type: string }) => ({
            id: c.collection,
            name: c.name,
            type: c.type === 'SemiFungibleESDT' ? 'SFT' : 'NFT'
          }));
          setUserCollections(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setIsFetchingCollections(false);
      }
    };

    fetchCollections();
  }, [address]);

  const tools: Array<{
    id: ModalType;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }> = [
      {
        id: 'collection',
        title: "New Collection",
        desc: "Initialize a collection identifier on the blockchain.",
        icon: <Layers className="w-8 h-8 text-brand-orange" />,
        color: "from-brand-orange/20 to-brand-orange/5"
      },
      {
        id: 'asset',
        title: "Create NFT",
        desc: "Mint unique assets or SFTs directly into your collection.",
        icon: <Diamond className="w-8 h-8 text-brand-yellow" />,
        color: "from-brand-yellow/20 to-brand-yellow/5"
      }
    ];

  const handleCloseModal = () => {
    setModalType(null);
    setCollectionForm({ name: '', ticker: '', description: '', type: 'NFT' });
    setAssetForm({
      name: '',
      description: '',
      type: 'NFT',
      supply: '1',
      royalties: 5,
      tags: '',
      mediaUrl: '',
      collection: '',
      properties: [{ key: '', value: '' }, { key: '', value: '' }]
    });
    setAssetErrors({});
    setImageFile(null);
    setIpfsState('idle');
    setImagePreview(null);
    setMintStep(1);
  };

  const uploadToIPFS = async (file: File): Promise<string | null> => {
    setIpfsState('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('Server upload failed:', await res.text());
        setIpfsState('error');
        return null;
      }

      const data = await res.json();
      if (!data.cid) {
        setIpfsState('error');
        return null;
      }

      const ipfsUrl = `ipfs://${data.cid}`;
      setAssetForm(prev => ({ ...prev, mediaUrl: ipfsUrl }));
      setIpfsState('done');
      return ipfsUrl;
    } catch (err) {
      console.error('IPFS upload error:', err);
      setIpfsState('error');
      return null;
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setIpfsState('idle');
    // Reset previously auto-filled mediaUrl when a new file is chosen
    setAssetForm(prev => ({ ...prev, mediaUrl: '' }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImagePreview(e.target?.result as string);
      await uploadToIPFS(file);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const addProperty = () => {
    setAssetForm({
      ...assetForm,
      properties: [...assetForm.properties, { key: '', value: '' }]
    });
  };

  const updateProperty = (index: number, field: 'key' | 'value', value: string) => {
    const newProps = [...assetForm.properties];
    newProps[index][field] = value;
    setAssetForm({ ...assetForm, properties: newProps });
  };

  const removeProperty = (index: number) => {
    if (assetForm.properties.length <= 1) return;
    const newProps = assetForm.properties.filter((_, i) => i !== index);
    setAssetForm({ ...assetForm, properties: newProps });
  };

  const toHex = (str: string) => Buffer.from(str).toString('hex');
  // Address to hex (bech32 -> bytes -> hex via Address class)
  const addressToHex = (bech32: string) => Buffer.from(new Address(bech32).getPublicKey()).toString('hex');

  // ESDT System Smart Contract address (same on all networks)
  const ESDT_SYSTEM_SC = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
  // 0.05 EGLD required for collection issuance
  const ISSUANCE_VALUE = BigInt('50000000000000000');
  const ISSUANCE_GAS_LIMIT = BigInt('60000000');

  // ── Fetch collections that don't have ESDTRoleNFTCreate yet ──
  const fetchCollectionsWithoutCreateRole = async () => {
    if (!address) return;
    setIsFetchingRoles(true);
    try {
      // Fetch all collections created by this address
      const res = await fetch(
        `https://api.multiversx.com/collections?creator=${address}&size=100`
      );
      if (!res.ok) return;
      const data: Array<{ collection: string; name: string; type: string; roles?: Array<{ role: string }> }> = await res.json();

      const withoutRole = data
        .filter((c) => {
          // A collection has the creator role if roles array contains ESDTRoleNFTCreate
          const hasRole = (c.roles ?? []).some((r) => r.role === 'ESDTRoleNFTCreate');
          return !hasRole;
        })
        .map((c) => ({
          id: c.collection,
          name: c.name,
          type: c.type === 'SemiFungibleESDT' ? 'SFT' : 'NFT',
        }));

      setCollectionsWithoutRole(withoutRole);
    } catch (err) {
      console.error('Failed to fetch role info:', err);
    } finally {
      setIsFetchingRoles(false);
    }
  };

  // ── Set ESDTRoleNFTCreate (+ ESDTRoleNFTAddQuantity for SFT) ──
  const setCreatorRole = async (collectionId: string, colType: string) => {
    if (!address) return;
    setAssigningRoleFor(collectionId);
    try {
      const collHex = toHex(collectionId);
      const addrHex = addressToHex(address);
      const createRoleHex = toHex('ESDTRoleNFTCreate');

      // SFTs also need ESDTRoleNFTAddQuantity to mint more
      const data = colType === 'SFT'
        ? `setSpecialRole@${collHex}@${addrHex}@${createRoleHex}@${toHex('ESDTRoleNFTAddQuantity')}`
        : `setSpecialRole@${collHex}@${addrHex}@${createRoleHex}`;

      const tx = new Transaction({
        nonce: 0n,
        value: 0n,
        receiver: new Address(ESDT_SYSTEM_SC),
        sender: new Address(address),
        gasLimit: ISSUANCE_GAS_LIMIT,
        chainID: network.chainId,
        data: Buffer.from(data),
        version: 1,
        gasPrice: 1000000000n,
      });

      await signAndSendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: `Setting creator role for ${collectionId}…`,
          errorMessage: 'Failed to set creator role.',
          successMessage: `Creator role assigned to ${collectionId}!`,
        },
      });

      // Remove from the "without role" list optimistically
      setCollectionsWithoutRole((prev) => prev.filter((c) => c.id !== collectionId));
    } catch (err) {
      console.error('setSpecialRole failed:', err);
    } finally {
      setAssigningRoleFor(null);
    }
  };

  const createCollection = async () => {
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }

    const name = collectionForm.name.trim();
    const ticker = collectionForm.ticker.trim().toUpperCase();

    if (!name) {
      alert('Please enter a collection name.');
      return;
    }
    if (!ticker || !/^[A-Z0-9]{3,10}$/.test(ticker)) {
      alert('Ticker must be 3-10 uppercase alphanumeric characters (e.g. BACON).');
      return;
    }

    setIsCreatingCollection(true);
    try {
      const funcName = collectionForm.type === 'NFT'
        ? 'issueNonFungible'
        : 'issueSemiFungible';

      const nameHex = toHex(name);
      const tickerHex = toHex(ticker);
      const data = `${funcName}@${nameHex}@${tickerHex}`;

      const tx = new Transaction({
        nonce: 0n,
        value: ISSUANCE_VALUE,
        receiver: new Address(ESDT_SYSTEM_SC),
        sender: new Address(address),
        gasLimit: ISSUANCE_GAS_LIMIT,
        chainID: network.chainId,
        data: Buffer.from(data),
        version: 1,
        gasPrice: 1000000000n,
      });

      await signAndSendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: `Creating ${collectionForm.type} collection "${name}"…`,
          errorMessage: 'Collection creation failed.',
          successMessage: `Collection "${name}" (${ticker}) created successfully!`,
        },
      });

      // ── Optimistic update: show the new collection immediately ──
      // The real identifier will contain a random suffix assigned by the chain
      // (e.g. BACON-a1b2c3). We display "TICKER-pending" as a placeholder
      // and re-fetch after ~15 s when the blockchain has likely finalized it.
      const optimisticId = `${ticker}-pending`;
      setUserCollections((prev) => [
        { id: optimisticId, name, type: collectionForm.type },
        ...prev.filter((c) => c.id !== optimisticId),
      ]);

      // Re-fetch after 15 s to get the real identifier from the API
      setTimeout(async () => {
        try {
          const res = await fetch(
            `https://api.multiversx.com/collections?creator=${address}&size=100`
          );
          if (res.ok) {
            const data = await res.json();
            const formatted = data.map(
              (c: { collection: string; name: string; type: string }) => ({
                id: c.collection,
                name: c.name,
                type: c.type === 'SemiFungibleESDT' ? 'SFT' : 'NFT',
              })
            );
            setUserCollections(formatted);
          }
        } catch {
          // silently ignore – the optimistic entry stays visible
        }
      }, 15000);

      handleCloseModal();

    } catch (err) {
      console.error('Collection creation failed:', err);
      alert('Transaction failed. See console for details.');
    } finally {
      setIsCreatingCollection(false);
    }
  };

  // Helper: number to even-length hex
  const numToHex = (n: number) => {
    const h = n.toString(16);
    return h.length % 2 === 0 ? h : '0' + h;
  };

  const createSftNftMesdtTokens = async () => {
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }

    // ── Field validation ──
    const errors: Record<string, string> = {};

    if (!assetForm.name.trim()) {
      errors.name = 'Asset name is required.';
    }
    if (!assetForm.collection) {
      errors.collection = 'You must select a target collection.';
    }
    if (!assetForm.mediaUrl.trim()) {
      errors.mediaUrl = 'A public media URL (IPFS or HTTPS) is required.';
    } else if (!/^https?:\/\//i.test(assetForm.mediaUrl.trim()) && !/^ipfs:\/\//i.test(assetForm.mediaUrl.trim())) {
      errors.mediaUrl = 'URL must start with https://, http://, or ipfs://';
    }
    if (assetForm.type === 'SFT') {
      const sup = parseInt(assetForm.supply);
      if (!assetForm.supply || isNaN(sup) || sup < 1) {
        errors.supply = 'Supply must be a positive integer.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setAssetErrors(errors);
      return;
    }
    setAssetErrors({});

    setIsMinting(true);
    try {
      // ── 1. Create and Upload Metadata JSON to IPFS ──
      const metadata = {
        name: assetForm.name.trim(),
        description: assetForm.description.trim(),
        image: assetForm.mediaUrl.trim(),
        attributes: assetForm.properties.filter(p => p.key && p.value).map(p => ({
          trait_type: p.key.trim(),
          value: p.value.trim()
        })),
        compiler: "Bacon Wallet"
      };

      const formData = new FormData();
      formData.append('file', new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }), 'metadata.json');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload metadata JSON to IPFS.');
      }

      const uploadData = await uploadRes.json();
      const metadataCid = uploadData.cid;
      if (!metadataCid) throw new Error('Invalid metadata CID returned.');

      // ── 2. Hex encoding helpers ──
      const collectionHex = toHex(assetForm.collection);
      const quantity = assetForm.type === 'NFT' ? 1 : parseInt(assetForm.supply || '1');
      const quantityHex = numToHex(quantity);
      const nameHex = toHex(assetForm.name.trim());

      // Royalties: MultiversX stores as basis points (1% = 100, max 10000)
      const royaltiesValue = Math.min(Math.round(assetForm.royalties * 100), 10000);
      const royaltiesHex = numToHex(royaltiesValue);

      // Hash: empty (users can provide their own later)
      const hashHex = '';

      // Attributes: metadata:cid;tags:value
      const attrParts: string[] = [];
      if (assetForm.tags.trim()) {
        attrParts.push(`tags:${assetForm.tags.trim()}`);
      }
      attrParts.push(`metadata:${metadataCid}`);

      const attributesHex = toHex(attrParts.join(';'));

      // URIs: 1st is typically media URL, 2nd is metadata URL.
      // This ensures explorers can read both if needed.
      const uri1Hex = toHex(assetForm.mediaUrl.trim());
      const uri2Hex = toHex(`ipfs://${metadataCid}`);

      // ── 3. Build data string ──
      // ESDTNFTCreate@collection@qty@name@royalties@hash@attributes@uri1@uri2
      const data = `ESDTNFTCreate@${collectionHex}@${quantityHex}@${nameHex}@${royaltiesHex}@${hashHex}@${attributesHex}@${uri1Hex}@${uri2Hex}`;

      // ── Dynamic gas limit ──
      // Base: 3_000_000 + 1_500 per data byte + 50_000 per attribute byte (stored on trie)
      const dataBytes = Buffer.from(data).length;
      const attrBytes = Buffer.from(attrParts.join(';')).length;
      const gasLimit = BigInt(3_000_000 + dataBytes * 1_500 + attrBytes * 50_000);

      const tx = new Transaction({
        nonce: 0n,
        value: 0n,
        receiver: new Address(address), // ESDTNFTCreate is sent to self
        sender: new Address(address),
        gasLimit,
        chainID: network.chainId,
        data: Buffer.from(data),
        version: 1,
        gasPrice: 1000000000n,
      });

      await signAndSendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: `Minting your ${assetForm.type} "${assetForm.name}"…`,
          errorMessage: `Failed to mint ${assetForm.type}.`,
          successMessage: `${assetForm.type} "${assetForm.name}" created successfully! 🎉`,
        },
      });

      handleCloseModal();
    } catch (err) {
      console.error('Minting failed:', err);
      alert('Minting failed. Check the console for details.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="py-10 max-w-5xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
          Let&apos;s <span className="text-brand-orange">Cook</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
          Professional tools for blockchain creation{isFullVersion ? '.' : ' (demo mode).'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setModalType(tool.id)}
            className="group relative p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 cursor-pointer hover:shadow-2xl hover:shadow-brand-orange/10 transition-all hover:-translate-y-2 active:scale-[0.98] overflow-hidden"
          >
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${tool.color} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 border dark:border-white/10">
                {tool.icon}
              </div>
              <h3 className="text-3xl font-black mb-4 group-hover:text-brand-orange transition-colors">{tool.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">{tool.desc}</p>
              <div className="flex items-center space-x-2 text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-orange">
                <span>Start</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── My Collections ─── */}
      {address && (
        <div className="mt-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black dark:text-white text-gray-900">My Collections</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Collections you created on-chain
              </p>
            </div>
            {isFetchingCollections && (
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading…
              </div>
            )}
          </div>

          {!isFetchingCollections && userCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center gap-4">
              <Layers className="w-10 h-10 text-slate-300 dark:text-white/20" />
              <p className="text-sm font-bold text-slate-400">No collections yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {userCollections.map((col) => {
                const isPending = col.id.endsWith('-pending');
                return (
                  <div
                    key={col.id}
                    className={`group flex items-center gap-5 px-6 py-5 rounded-2xl border transition-all active:scale-[0.98] ${isPending
                      ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 opacity-80'
                      : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 hover:border-brand-orange/30 hover:shadow-lg hover:shadow-brand-orange/5'
                      }`}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${col.type === 'NFT' ? 'bg-brand-orange/10' : 'bg-brand-yellow/10'}`}>
                      {col.type === 'NFT'
                        ? <Layers className="w-5 h-5 text-brand-orange" />
                        : <Diamond className="w-5 h-5 text-brand-yellow" />
                      }
                    </div>

                    {/* Name + id */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black dark:text-white text-gray-900 truncate group-hover:text-brand-orange transition-colors">
                        {col.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 truncate">
                        {isPending ? 'Identifier assigned after confirmation…' : col.id}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPending && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400">
                          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Confirming
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${col.type === 'NFT'
                        ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'
                        : 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow'
                        }`}>
                        {col.type}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-brand-orange transition-colors z-20 active:scale-90"><X /></button>
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2">
              {modalType === 'collection' ? (
                <><Layers className="text-brand-orange" /><span>New Collection</span></>
              ) : (
                <><Diamond className="text-brand-yellow" /><span>Mint New Asset</span></>
              )}
            </h2>

            {modalType === 'collection' ? (
              <div className="space-y-6">
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-2">
                  <button onClick={() => setCollectionForm({ ...collectionForm, type: 'NFT' })} className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${collectionForm.type === 'NFT' ? 'bg-white dark:bg-white/10 text-brand-orange shadow-md' : 'text-slate-400'}`}>NFT Standard</button>
                  <button onClick={() => setCollectionForm({ ...collectionForm, type: 'SFT' })} className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${collectionForm.type === 'SFT' ? 'bg-white dark:bg-white/10 text-brand-orange shadow-md' : 'text-slate-400'}`}>SFT Standard</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1"><Type className="w-3 h-3" /> Collection Name</label>
                    <input type="text" value={collectionForm.name} onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })} placeholder="e.g. Bacon Legends" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange/50 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1"><Hash className="w-3 h-3" /> Ticker</label>
                    <input type="text" value={collectionForm.ticker} onChange={(e) => setCollectionForm({ ...collectionForm, ticker: e.target.value })} placeholder="e.g. BACON" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange/50 transition-all outline-none" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={createCollection}
                    disabled={isCreatingCollection}
                    className="flex-1 py-4 bg-brand-orange text-black font-black rounded-2xl shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {isCreatingCollection ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Creating…</span>
                      </>
                    ) : (
                      <><Plus className="w-5 h-5" /><span>Create Collection</span></>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      fetchCollectionsWithoutCreateRole();
                      setShowSetRoleModal(true);
                      handleCloseModal();
                    }}
                    className="flex-1 py-4 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-300 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5 text-brand-yellow" /><span>Set Role</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {mintStep === 1 ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center space-y-2 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-yellow">Step 1 of 2</p>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">Upload your media</h3>
                    </div>

                    {/* Large Image Upload Area */}
                    <div
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative group h-72 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDragging
                        ? 'border-brand-yellow bg-brand-yellow/10 scale-[1.02]'
                        : imagePreview
                          ? 'border-white/5 bg-black/20'
                          : 'border-slate-200 dark:border-white/10 hover:border-brand-yellow/50 hover:bg-brand-yellow/5'
                        }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                        accept="image/*"
                      />

                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-black text-xs uppercase tracking-widest">Change Image</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                            className="absolute top-6 right-6 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:text-red-500 transition-colors shadow-xl"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center space-y-4 pointer-events-none">
                          <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-white/5 mx-auto flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 box-content p-2">
                            <Upload className="w-10 h-10 text-brand-yellow" />
                          </div>
                          <div>
                            <p className="text-lg font-black dark:text-white mb-2">Drag and drop your asset</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">High Quality PNG, JPG or GIF<br />(Max 20MB)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-4">

                      {/* ── IPFS Status ── */}
                      {imagePreview && (
                        <div className={`rounded-2xl border p-4 space-y-2 transition-all ${ipfsState === 'done'
                          ? 'bg-green-500/5 border-green-500/20'
                          : ipfsState === 'uploading'
                            ? 'bg-brand-yellow/5 border-brand-yellow/20'
                            : ipfsState === 'error'
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                          }`}>
                          <div className="flex items-center gap-2">
                            {ipfsState === 'uploading' && (
                              <>
                                <svg className="animate-spin w-4 h-4 text-brand-yellow flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-xs font-black text-brand-yellow">Uploading to IPFS via Pinata…</span>
                              </>
                            )}
                            {ipfsState === 'done' && (
                              <>
                                <span className="text-green-400 text-sm">✓</span>
                                <span className="text-xs font-black text-green-400">Uploaded to IPFS!</span>
                                <span className="text-[10px] font-bold text-slate-400 truncate ml-1">{assetForm.mediaUrl}</span>
                              </>
                            )}
                            {ipfsState === 'error' && (
                              <>
                                <span className="text-red-400 text-sm">✗</span>
                                <span className="text-xs font-black text-red-400">IPFS upload failed — enter URL manually in Step 2.</span>
                              </>
                            )}
                            {ipfsState === 'idle' && (
                              <>
                                <svg className="animate-spin w-4 h-4 text-brand-yellow flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-xs font-black text-brand-yellow">Preparing upload…</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        disabled={!imagePreview || ipfsState === 'uploading'}
                        onClick={() => setMintStep(2)}
                        className="w-full py-5 bg-brand-yellow text-black font-black rounded-3xl shadow-2xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-lg">Continue to Details</span>
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setMintStep(1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-yellow transition-colors group">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Media</span>
                      </button>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-yellow">Step 2 of 2</p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border dark:border-white/5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-yellow/20 relative group">
                        <img src={imagePreview!} alt="Selected" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setMintStep(1)}>
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-brand-yellow tracking-widest mb-1">Asset Preview</p>
                        <p className="text-xs font-bold dark:text-white text-gray-900 truncate max-w-[200px]">{assetForm.name || 'Set asset name below...'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Asset Name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                          <Type className="w-3 h-3" /> Asset Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={assetForm.name}
                          onChange={(e) => {
                            setAssetForm({ ...assetForm, name: e.target.value });
                            if (assetErrors.name) setAssetErrors({ ...assetErrors, name: '' });
                          }}
                          placeholder="e.g. Golden Bacon #001"
                          className={`w-full bg-slate-100 dark:bg-white/5 border rounded-2xl p-4 text-sm font-bold focus:ring-2 transition-all outline-none ${assetErrors.name
                            ? 'border-red-500/60 focus:ring-red-500/30 bg-red-500/5'
                            : 'border-transparent focus:ring-brand-yellow/50'
                            }`}
                        />
                        {assetErrors.name && (
                          <p className="text-[10px] font-bold text-red-400 px-1 flex items-center gap-1"><span>⚠</span> {assetErrors.name}</p>
                        )}
                      </div>

                      {/* Target Collection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                          <Boxes className="w-3 h-3" /> Target Collection <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={assetForm.collection}
                          onChange={(e) => {
                            setAssetForm({ ...assetForm, collection: e.target.value });
                            if (assetErrors.collection) setAssetErrors({ ...assetErrors, collection: '' });
                          }}
                          className={`w-full bg-slate-100 dark:bg-white/5 border rounded-2xl p-4 text-sm font-bold focus:ring-2 transition-all outline-none appearance-none cursor-pointer ${assetErrors.collection
                            ? 'border-red-500/60 focus:ring-red-500/30 bg-red-500/5'
                            : 'border-transparent focus:ring-brand-yellow/50'
                            }`}
                        >
                          {isFetchingCollections ? (
                            <option disabled>Loading your collections...</option>
                          ) : (
                            <>
                              <option value="" disabled>Select a {assetForm.type} collection</option>
                              {userCollections.filter(c => c.type === assetForm.type).map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                              ))}
                              {userCollections.filter(c => c.type === assetForm.type).length === 0 && (
                                <option value="" disabled>No {assetForm.type} collections found</option>
                              )}
                            </>
                          )}
                        </select>
                        {assetErrors.collection && (
                          <p className="text-[10px] font-bold text-red-400 px-1 flex items-center gap-1"><span>⚠</span> {assetErrors.collection}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1"><AlignLeft className="w-3 h-3" /> Description</label>
                      <textarea value={assetForm.description} onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })} placeholder="Metadata details..." rows={2} className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-yellow/50 transition-all outline-none resize-none" />
                    </div>

                    {/* ── Media URL (auto-filled by Pinata or manual) ── */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <span>🔗</span> Media URL <span className="text-red-400">*</span>
                        </label>
                        {ipfsState === 'done' && (
                          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                            <span>✓</span> Auto-filled via Pinata
                          </span>
                        )}
                      </div>
                      {ipfsState === 'done' ? (
                        <div className="w-full bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                          <span className="text-green-400 text-lg flex-shrink-0">✓</span>
                          <span className="text-xs font-bold text-green-300 break-all">{assetForm.mediaUrl}</span>
                          <button
                            onClick={() => { setIpfsState('idle'); setAssetForm(prev => ({ ...prev, mediaUrl: '' })); }}
                            className="ml-auto text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 text-lg"
                            title="Clear and enter manually"
                          >×</button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="url"
                            value={assetForm.mediaUrl}
                            onChange={(e) => {
                              setAssetForm({ ...assetForm, mediaUrl: e.target.value });
                              if (assetErrors.mediaUrl) setAssetErrors({ ...assetErrors, mediaUrl: '' });
                            }}
                            placeholder="ipfs://Qm... or https://..."
                            className={`w-full bg-slate-100 dark:bg-white/5 border rounded-2xl p-4 text-sm font-bold focus:ring-2 transition-all outline-none ${assetErrors.mediaUrl
                              ? 'border-red-500/60 focus:ring-red-500/30 bg-red-500/5'
                              : 'border-transparent focus:ring-brand-yellow/50'
                              }`}
                          />
                          {assetErrors.mediaUrl && (
                            <p className="text-[10px] font-bold text-red-400 px-1 flex items-center gap-1"><span>⚠</span> {assetErrors.mediaUrl}</p>
                          )}
                          {ipfsState === 'error' && (
                            <button
                              onClick={() => imageFile && uploadToIPFS(imageFile)}
                              className="text-[10px] font-black text-brand-yellow uppercase tracking-widest hover:text-brand-orange transition-colors px-1 flex items-center gap-1"
                            >
                              ↺ Retry Pinata upload
                            </button>
                          )}
                          <p className="text-[10px] text-slate-400 font-bold px-1 leading-relaxed">
                            Must be a public <span className="text-brand-yellow">IPFS</span> or <span className="text-brand-yellow">HTTPS</span> link.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border dark:border-white/5">
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Asset Standard</label>
                        <div className="flex p-1 bg-slate-200 dark:bg-white/5 rounded-2xl">
                          <button onClick={() => setAssetForm({ ...assetForm, type: 'NFT', supply: '1', collection: '' })} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${assetForm.type === 'NFT' ? 'bg-white dark:bg-white/10 text-brand-yellow shadow-sm' : 'text-slate-500'}`}>NFT (1/1)</button>
                          <button onClick={() => setAssetForm({ ...assetForm, type: 'SFT', collection: '' })} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${assetForm.type === 'SFT' ? 'bg-white dark:bg-white/10 text-brand-yellow shadow-sm' : 'text-slate-500'}`}>SFT (Supply)</button>
                        </div>
                      </div>
                      {assetForm.type === 'SFT' && (
                        <div className="flex-1 space-y-1.5 animate-in slide-in-from-left-2 duration-300">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                            <Hash className="w-3 h-3" /> Initial Supply <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={assetForm.supply}
                            onChange={(e) => {
                              setAssetForm({ ...assetForm, supply: e.target.value });
                              if (assetErrors.supply) setAssetErrors({ ...assetErrors, supply: '' });
                            }}
                            placeholder="e.g. 1000"
                            className={`w-full bg-slate-100 dark:bg-white/5 border rounded-2xl p-4 text-sm font-bold focus:ring-2 transition-all outline-none ${assetErrors.supply
                              ? 'border-red-500/60 focus:ring-red-500/30 bg-red-500/5'
                              : 'border-transparent focus:ring-brand-yellow/50'
                              }`}
                          />
                          {assetErrors.supply && (
                            <p className="text-[10px] font-bold text-red-400 px-1 flex items-center gap-1"><span>⚠</span> {assetErrors.supply}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Database className="w-3 h-3" /> Attributes</label>
                        <button onClick={addProperty} className="text-brand-yellow hover:text-brand-yellow/80 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"><PlusCircle className="w-4 h-4" /> Add Row</button>
                      </div>
                      <div className="space-y-3">
                        {assetForm.properties.map((prop, idx) => (
                          <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1">
                            <input type="text" value={prop.key} onChange={(e) => updateProperty(idx, 'key', e.target.value)} placeholder="Trait" className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-brand-yellow/50 transition-all outline-none" />
                            <input type="text" value={prop.value} onChange={(e) => updateProperty(idx, 'value', e.target.value)} placeholder="Value" className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-brand-yellow/50 transition-all outline-none" />
                            <button onClick={() => removeProperty(idx)} disabled={assetForm.properties.length <= 1} className="p-3.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1"><Tags className="w-3 h-3" /> Keywords & Tags</label>
                      <input type="text" value={assetForm.tags} onChange={(e) => setAssetForm({ ...assetForm, tags: e.target.value })} placeholder="rare, genesis..." className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-yellow/50 transition-all outline-none" />
                    </div>

                    {/* ─── Royalties Slider ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <span>💎</span> Royalties
                        </label>
                        <div className="flex items-center gap-1">
                          <span className={`text-xl font-black tabular-nums ${assetForm.royalties === 0 ? 'text-slate-400'
                            : assetForm.royalties <= 10 ? 'text-brand-yellow'
                              : assetForm.royalties <= 25 ? 'text-brand-orange'
                                : 'text-red-400'
                            }`}>{assetForm.royalties}</span>
                          <span className="text-xs font-black text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="relative px-1">
                        {/* Track background */}
                        <div className="relative h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-yellow to-brand-orange transition-all"
                            style={{ width: `${assetForm.royalties}%` }}
                          />
                        </div>
                        {/* Slider input */}
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={assetForm.royalties}
                          onChange={(e) => setAssetForm({ ...assetForm, royalties: parseFloat(e.target.value) })}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                        />
                      </div>

                      {/* Quick-pick buttons */}
                      <div className="flex gap-2">
                        {[0, 2.5, 5, 7.5, 10].map((v) => (
                          <button
                            key={v}
                            onClick={() => setAssetForm({ ...assetForm, royalties: v })}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${assetForm.royalties === v
                              ? 'bg-brand-yellow/20 border-brand-yellow/40 text-brand-yellow'
                              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-yellow/30'
                              }`}
                          >
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      {/* Summary of validation errors, if any */}
                      {Object.keys(assetErrors).length > 0 && (
                        <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1">
                          <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">⚠ Please fix the following</p>
                          {Object.values(assetErrors).filter(Boolean).map((msg, i) => (
                            <p key={i} className="text-xs text-red-400 font-bold">• {msg}</p>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={createSftNftMesdtTokens}
                        disabled={isMinting}
                        className="w-full py-5 bg-brand-yellow text-black font-black rounded-3xl shadow-2xl shadow-brand-yellow/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {isMinting ? (
                          <>
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span className="text-lg">Signing & Sending…</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-6 h-6 fill-current" />
                            <span className="text-lg">Mint {assetForm.type} Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Set Role Modal ─── */}
      {showSetRoleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSetRoleModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setShowSetRoleModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-brand-orange transition-colors z-20"
            >
              <X />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-7 h-7 text-brand-yellow" />
              <h2 className="text-2xl font-black dark:text-white">Set Creator Role</h2>
            </div>
            <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">
              On MultiversX, collection owners must explicitly grant themselves the{' '}
              <span className="text-brand-yellow font-black">ESDTRoleNFTCreate</span> role
              before they can mint tokens. Select a collection below and sign the transaction.
            </p>

            {/* Loading */}
            {isFetchingRoles && (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-400 text-sm font-bold">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Checking your collections…
              </div>
            )}

            {/* Empty — all collections have role already */}
            {!isFetchingRoles && collectionsWithoutRole.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                <ShieldCheck className="w-10 h-10 text-brand-yellow" />
                <p className="text-sm font-bold text-slate-400 text-center">
                  All your collections already have the creator role! 🎉
                </p>
              </div>
            )}

            {/* List — collections without ESDTRoleNFTCreate */}
            {!isFetchingRoles && collectionsWithoutRole.length > 0 && (
              <div className="flex flex-col gap-3">
                {collectionsWithoutRole.map((col) => {
                  const isAssigning = assigningRoleFor === col.id;
                  return (
                    <div
                      key={col.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4"
                    >
                      {/* Info row */}
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${col.type === 'NFT' ? 'bg-brand-orange/10' : 'bg-brand-yellow/10'}`}>
                          {col.type === 'NFT'
                            ? <Layers className="w-5 h-5 text-brand-orange" />
                            : <Diamond className="w-5 h-5 text-brand-yellow" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black dark:text-white text-gray-900 truncate">{col.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">{col.id}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${col.type === 'NFT'
                          ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'
                          : 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow'
                          }`}>{col.type}</span>
                      </div>

                      {/* Roles to be assigned */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                          ✗ ESDTRoleNFTCreate
                        </span>
                        {col.type === 'SFT' && (
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            ✗ ESDTRoleNFTAddQuantity
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => setCreatorRole(col.id, col.type)}
                        disabled={isAssigning || assigningRoleFor !== null}
                        className="w-full py-3.5 bg-brand-yellow text-black font-black rounded-xl shadow-lg shadow-brand-yellow/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {isAssigning ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Signing…</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Assign Role & Sign</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
