
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

export const useFirebaseFolders = (walletAddress: string | undefined) => {
    const [folders, setFolders] = useState<UserFolder[]>([]);
    const [folderContents, setFolderContents] = useState<Record<string, NormalizedNft[]>>({});
    const [favorites, setFavorites] = useState<NormalizedNft[]>([]);
    const [isPro, setIsPro] = useState(false);
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
        try {
            const userRef = doc(db, 'users', walletAddress);
            const snap = await getDoc(userRef);

            const currentFavs: NormalizedNft[] = snap.exists() ? (snap.data().favorites || []) : [];
            const isFav = currentFavs.some(f => f.identifier === nft.identifier);

            let nextFavs: NormalizedNft[];
            if (isFav) {
                nextFavs = currentFavs.filter(f => f.identifier !== nft.identifier);
            } else {
                const cleanNft = JSON.parse(JSON.stringify(nft)); // Firebase won't accept undefined values
                nextFavs = [...currentFavs, cleanNft];
            }

            await setDoc(userRef, { favorites: nextFavs }, { merge: true });
        } catch (err: unknown) {
            console.error("Firebase toggleFavorite error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not update favorites. Firebase limits or permissions errors.");
            }
        }
    };

    const createFolder = async (name: string, description: string) => {
        if (!walletAddress) return;
        const foldersRef = collection(db, 'users', walletAddress, 'folders');
        await addDoc(foldersRef, {
            name,
            description,
            items: [],
            createdAt: new Date()
        });
    };

    const deleteFolder = async (folderId: string) => {
        if (!walletAddress) return;
        const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
        await deleteDoc(folderRef);
    };

    const addItemToFolder = async (folderId: string, nft: NormalizedNft) => {
        if (!walletAddress) return;
        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const currentItems = snap.data().items || [];
                if (!currentItems.find((item: NormalizedNft) => item.identifier === nft.identifier)) {
                    const cleanNft = JSON.parse(JSON.stringify(nft));
                    await updateDoc(folderRef, {
                        items: [...currentItems, cleanNft]
                    });
                }
            }
        } catch (err: unknown) {
            console.error("Firebase addItemToFolder error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not add item. Firebase limits or permissions errors.");
            }
        }
    };

    const removeItemFromFolder = async (folderId: string, nftIdentifier: string) => {
        if (!walletAddress) return;
        try {
            const folderRef = doc(db, 'users', walletAddress, 'folders', folderId);
            const snap = await getDoc(folderRef);
            if (snap.exists()) {
                const currentItems = snap.data().items || [];
                const updatedItems = currentItems.filter((item: NormalizedNft) => item.identifier !== nftIdentifier);
                await updateDoc(folderRef, { items: updatedItems });
            }
        } catch (err: unknown) {
            console.error("Firebase removeItemFromFolder error:", err);
            const errMessage = err instanceof Error ? err.message : String(err);
            if (errMessage.includes("permissions") || errMessage.includes("Quota")) {
                alert("Could not remove item. Firebase limits or permissions errors.");
            }
        }
    };

    return { folders, folderContents, favorites, isPro, loading, createFolder, deleteFolder, addItemToFolder, removeItemFromFolder, toggleFavorite };
};
