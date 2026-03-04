
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    onSnapshot,
    query,
    addDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { type NormalizedNft } from '@/helpers';

export interface UserFolder {
    id: string;
    name: string;
    description?: string;
    itemCount: number;
    previewImages: string[];
}

export interface UserPreferences {
    viewMode?: string;
    activeTab?: string;
    isLargeGrid?: boolean;
}

export const useFirebaseFolders = (walletAddress: string | undefined) => {
    const [folders, setFolders] = useState<UserFolder[]>([]);
    const [folderContents, setFolderContents] = useState<Record<string, NormalizedNft[]>>({});
    const [favorites, setFavorites] = useState<NormalizedNft[]>([]);
    const [isPro, setIsPro] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!walletAddress) {
            setFolders([]);
            setFolderContents({});
            setFavorites([]);
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', walletAddress);

        const unsubUser = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setIsPro(data.isPro || false);
                setFavorites(data.favorites || []);
                if (data.preferences) {
                    setPreferences(data.preferences);
                }
            } else {
                setDoc(userRef, { isPro: false, favorites: [] }, { merge: true });
            }
        });

        const foldersRef = collection(db, 'users', walletAddress, 'folders');
        const q = query(foldersRef);

        const unsubFolders = onSnapshot(q, (snap) => {
            const foldersData: UserFolder[] = [];
            const contentsData: Record<string, NormalizedNft[]> = {};

            snap.forEach((doc) => {
                const data = doc.data();
                foldersData.push({
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    itemCount: (data.items || []).length,
                    previewImages: (data.items || []).slice(0, 4).map((item: NormalizedNft) => item.imageUrl || item.identifier)
                });
                contentsData[doc.id] = data.items || [];
            });

            setFolders(foldersData);
            setFolderContents(contentsData);
            setLoading(false);
        });

        return () => {
            unsubUser();
            unsubFolders();
        };
    }, [walletAddress]);

    const toggleFavorite = async (nft: NormalizedNft) => {
        if (!walletAddress) return;

        // Save current state for rollback
        const prevFavs = [...favorites];
        const isFav = prevFavs.some(f => f.identifier === nft.identifier);

        // Optimistic update
        const nextFavsUI = isFav
            ? prevFavs.filter(f => f.identifier !== nft.identifier)
            : [...prevFavs, JSON.parse(JSON.stringify(nft))];

        setFavorites(nextFavsUI);

        try {
            const userRef = doc(db, 'users', walletAddress);
            const snap = await getDoc(userRef);

            const currentFavs: NormalizedNft[] = snap.exists() ? (snap.data().favorites || []) : [];
            const isFavRemote = currentFavs.some(f => f.identifier === nft.identifier);

            let nextFavs: NormalizedNft[];
            if (isFavRemote) {
                nextFavs = currentFavs.filter(f => f.identifier !== nft.identifier);
            } else {
                const cleanNft = JSON.parse(JSON.stringify(nft)); // Firebase won't accept undefined values
                nextFavs = [...currentFavs, cleanNft];
            }

            await setDoc(userRef, { favorites: nextFavs }, { merge: true });
        } catch (err: unknown) {
            // Revert state on error
            setFavorites(prevFavs);
            console.error("Firebase toggleFavorite error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not update favorites. Firebase limits or permissions errors.");
            }
        }
    };

    const createFolder = async (name: string, description: string) => {
        if (!walletAddress) return;

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const newFolder: UserFolder = { id: tempId, name, description, itemCount: 0, previewImages: [] };
        setFolders(prev => [...prev, newFolder]);
        setFolderContents(prev => ({ ...prev, [tempId]: [] }));

        const foldersRef = collection(db, 'users', walletAddress, 'folders');
        try {
            const docRef = await addDoc(foldersRef, {
                name,
                description,
                items: [],
                createdAt: new Date()
            });
            return docRef.id;
        } catch (error) {
            // Revert state on error (note: onSnapshot will naturally sync this, but manual revert is safer for edge cases)
            setFolders(prev => prev.filter(f => f.id !== tempId));
            setFolderContents(prev => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
            throw error;
        }
    };

    const deleteFolder = async (folderId: string) => {
        if (!walletAddress) return;

        // Save previous state for rollback
        const prevFolders = [...folders];
        const prevContents = { ...folderContents };

        // Optimistic UI update
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setFolderContents(prev => {
            const next = { ...prev };
            delete next[folderId];
            return next;
        });

        const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
        try {
            await deleteDoc(folderRef);
        } catch (error) {
            // Revert on error
            setFolders(prevFolders);
            setFolderContents(prevContents);
            throw error;
        }
    };

    const addItemToFolder = async (folderId: string, nft: NormalizedNft) => {
        if (!walletAddress) return;

        // Save previous contents for rollback
        const currentItems = folderContents[folderId] || [];

        // Optimistic update
        if (!currentItems.find(item => item.identifier === nft.identifier)) {
            const newItems = [...currentItems, JSON.parse(JSON.stringify(nft))];
            setFolderContents(prev => ({ ...prev, [folderId]: newItems }));
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: newItems.length, previewImages: newItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));
        }

        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const remoteItems = snap.data().items || [];
                if (!remoteItems.find((item: NormalizedNft) => item.identifier === nft.identifier)) {
                    const cleanNft = JSON.parse(JSON.stringify(nft));
                    await updateDoc(folderRef, {
                        items: [...remoteItems, cleanNft]
                    });
                }
            }
        } catch (err: unknown) {
            // Revert state on error
            setFolderContents(prev => ({ ...prev, [folderId]: currentItems }));
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: currentItems.length, previewImages: currentItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));
            console.error("Firebase addItemToFolder error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not add item. Firebase limits or permissions errors.");
            }
        }
    };

    const addItemsToFolder = async (folderId: string, nfts: NormalizedNft[]) => {
        if (!walletAddress || nfts.length === 0) return;

        const currentItems = folderContents[folderId] || [];
        const newItemsToAdd = nfts.filter(nft => !currentItems.some(item => item.identifier === nft.identifier)).map(n => JSON.parse(JSON.stringify(n)));

        if (newItemsToAdd.length === 0) return;

        const newItems = [...currentItems, ...newItemsToAdd];

        setFolderContents(prev => ({ ...prev, [folderId]: newItems }));
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: newItems.length, previewImages: newItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));

        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const remoteItems = snap.data().items || [];
                const missingRemoteItems = newItemsToAdd.filter(nft => !remoteItems.find((item: NormalizedNft) => item.identifier === nft.identifier));

                if (missingRemoteItems.length > 0) {
                    await updateDoc(folderRef, {
                        items: [...remoteItems, ...missingRemoteItems]
                    });
                }
            }
        } catch (err: unknown) {
            setFolderContents(prev => ({ ...prev, [folderId]: currentItems }));
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: currentItems.length, previewImages: currentItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));
            console.error("Firebase addItemsToFolder error:", err);
        }
    };

    const removeItemFromFolder = async (folderId: string, nftIdentifier: string) => {
        if (!walletAddress) return;

        // Save previous contents for rollback
        const currentItems = folderContents[folderId] || [];

        // Optimistic update
        const updatedItems = currentItems.filter((item) => item.identifier !== nftIdentifier);
        setFolderContents(prev => ({ ...prev, [folderId]: updatedItems }));
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: updatedItems.length, previewImages: updatedItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));

        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const remoteItems = snap.data().items || [];
                const finalItems = remoteItems.filter((item: NormalizedNft) => item.identifier !== nftIdentifier);
                await updateDoc(folderRef, { items: finalItems });
            }
        } catch (err: unknown) {
            // Revert state on error
            setFolderContents(prev => ({ ...prev, [folderId]: currentItems }));
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: currentItems.length, previewImages: currentItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));
            console.error("Firebase removeItemFromFolder error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not remove item. Firebase limits or permissions errors.");
            }
        }
    };

    const removeItemsFromFolder = async (folderId: string, nftIdentifiers: string[]) => {
        if (!walletAddress || nftIdentifiers.length === 0) return;

        const currentItems = folderContents[folderId] || [];
        const identifiersSet = new Set(nftIdentifiers);
        const updatedItems = currentItems.filter(item => !identifiersSet.has(item.identifier));

        if (updatedItems.length === currentItems.length) return;

        setFolderContents(prev => ({ ...prev, [folderId]: updatedItems }));
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: updatedItems.length, previewImages: updatedItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));

        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const remoteItems = snap.data().items || [];
                const finalItems = remoteItems.filter((item: NormalizedNft) => !identifiersSet.has(item.identifier));
                await updateDoc(folderRef, { items: finalItems });
            }
        } catch (err: unknown) {
            setFolderContents(prev => ({ ...prev, [folderId]: currentItems }));
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: currentItems.length, previewImages: currentItems.slice(0, 4).map(i => i.imageUrl || i.identifier) } : f));
            console.error("Firebase removeItemsFromFolder error:", err);
        }
    };

    const updatePreferences = async (prefs: Partial<UserPreferences>) => {
        if (!walletAddress) return;
        const merged = { ...preferences, ...prefs };
        setPreferences(merged);
        try {
            const userRef = doc(db, 'users', walletAddress);
            await setDoc(userRef, { preferences: merged }, { merge: true });
        } catch (err) {
            console.error('Firebase updatePreferences error:', err);
        }
    };

    return { folders, folderContents, favorites, isPro, preferences, loading, createFolder, deleteFolder, addItemToFolder, addItemsToFolder, removeItemFromFolder, removeItemsFromFolder, toggleFavorite, updatePreferences };
};
