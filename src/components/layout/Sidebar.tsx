'use client';

/* =====================================================
   🥓 BACON WALLET - Sidebar Component
   Navigation and folder management with drag & drop
   ===================================================== */

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFolders } from '@/hooks/useFolders';
import { Folder } from '@/types/folders';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import {
    HomeIcon,
    ImageIcon,
    CoinsIcon,
    ActivityIcon,
    FolderIcon,
    StarIcon,
    DiamondIcon,
    TrashIcon,
    SettingsIcon,
    PlusIcon,
    XIcon,
    CrownIcon,
    FlameIcon,
    ChevronLeftIcon,
} from '@/components/ui/Icons';
import styles from './Sidebar.module.css';

// Navigation items with routes - using SVG icons for professional UI
interface NavItem {
    id: string;
    label: string;
    icon: ReactNode;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon size={18} />, href: '/' },
    { id: 'nfts', label: 'My NFTs', icon: <ImageIcon size={18} />, href: '/nfts' },
    { id: 'tokens', label: 'Tokens', icon: <CoinsIcon size={18} />, href: '/tokens' },
    { id: 'activity', label: 'Activity', icon: <ActivityIcon size={18} />, href: '/activity' },
];

// System folder icon mapping
const SYSTEM_FOLDER_ICONS: Record<string, ReactNode> = {
    'all': <FolderIcon size={16} />,
    'favorites': <StarIcon size={16} />,
    'high-rarity': <DiamondIcon size={16} />,
    'spam': <TrashIcon size={16} />,
};

// Custom folder icons (emojis for user personalization - acceptable per UX)
const FOLDER_ICONS = ['📁', '🎨', '🎮', '🎵', '📷', '💼', '🏆', '🌟', '💎', '🔥', '🎭', '🎪'];

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    folderCounts?: Record<string, number>;
}

export function Sidebar({ isCollapsed = false, onToggle, folderCounts = {} }: SidebarProps) {
    const { address } = useGetAccount();
    const pathname = usePathname();
    const [activeFolder, setActiveFolder] = useState<string>('all');
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📁');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // Folder management hook
    const {
        systemFolders,
        customFolders,
        selectedFolderId,
        selectFolder,
        createFolder,
        deleteFolder,
        renameFolder,
        addToFolder,
        canCreateFolder,
        folderLimit,
    } = useFolders({
        isPremium: false,
        address: address || 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem'
    });

    // Check active nav item
    const getActiveNav = () => {
        if (pathname === '/') return 'dashboard';
        if (pathname.startsWith('/nfts')) return 'nfts';
        if (pathname.startsWith('/tokens')) return 'tokens';
        if (pathname.startsWith('/activity')) return 'activity';
        return '';
    };

    const activeNav = getActiveNav();

    // Handle folder selection
    const handleFolderClick = (folderId: string) => {
        setActiveFolder(folderId);
        selectFolder(folderId);
        // Emit event for NFTs page to filter
        window.dispatchEvent(new CustomEvent('folderSelected', { detail: { folderId } }));
    };

    // Handle create folder
    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const folder = createFolder(newFolderName.trim(), selectedIcon);
        if (folder) {
            setNewFolderName('');
            setSelectedIcon('📁');
            setIsCreating(false);
            setShowIconPicker(false);
        }
    };

    // Handle rename
    const handleSaveEdit = () => {
        if (editingFolderId && editingName.trim()) {
            renameFolder(editingFolderId, editingName.trim());
        }
        setEditingFolderId(null);
        setEditingName('');
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent, action: 'create' | 'edit') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (action === 'create') handleCreateFolder();
            else handleSaveEdit();
        } else if (e.key === 'Escape') {
            setIsCreating(false);
            setEditingFolderId(null);
            setShowIconPicker(false);
        }
    };

    // Get folder count - use external counts if provided, otherwise fallback
    const getFolderCount = (folderId: string): number => {
        if (folderCounts[folderId] !== undefined) {
            return folderCounts[folderId];
        }
        // Fallback mock numbers for now
        const defaultCounts: Record<string, number> = {
            'all': 142,
            'favorites': 23,
            'high-rarity': 8,
            'spam': 45,
        };
        return defaultCounts[folderId] || 0;
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent, folderId: string) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folderId);
        console.log('Drag Over:', folderId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverFolderId(null);
    };

    const handleDrop = (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        setDragOverFolderId(null);
        console.log('Dropped on folder:', folderId);

        try {
            const data = e.dataTransfer.getData('application/json');
            console.log('Drop data:', data);

            if (!data) return;

            const { type, nftId } = JSON.parse(data);

            if (type === 'nft' && nftId) {
                addToFolder([nftId], folderId);
                console.log(`Added NFT ${nftId} to folder ${folderId}`);

                // Force a refresh of the views if needed
                window.dispatchEvent(new CustomEvent('folderUpdated', { detail: { folderId } }));
            }
        } catch (error) {
            console.error('Error dropping item:', error);
        }
    };

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            {/* Collapse Toggle */}
            <button
                className={styles.collapseBtn}
                onClick={onToggle}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>

            {/* Navigation */}
            <nav className={styles.nav}>
                <span className={styles.sectionLabel}>Navigation</span>
                <ul className={styles.navList}>
                    {NAV_ITEMS.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={item.href}
                                className={`${styles.navItem} ${activeNav === item.id ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Folders / Trays */}
            <div className={styles.folders}>
                <div className={styles.foldersHeader}>
                    <span className={styles.sectionLabel}>Trays</span>
                    {!isCollapsed && (
                        <button
                            className={styles.addFolderBtn}
                            aria-label="Add folder"
                            onClick={() => setIsCreating(true)}
                            disabled={!canCreateFolder}
                            title={canCreateFolder ? 'Create folder' : 'Upgrade for more folders'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Create Folder Form */}
                {isCreating && !isCollapsed && (
                    <div className={styles.createForm}>
                        <div className={styles.iconPickerTrigger}>
                            <button
                                className={styles.selectedIconBtn}
                                onClick={() => setShowIconPicker(!showIconPicker)}
                            >
                                {selectedIcon}
                            </button>
                            {showIconPicker && (
                                <div className={styles.iconPicker}>
                                    {FOLDER_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            className={`${styles.iconOption} ${selectedIcon === icon ? styles.selected : ''}`}
                                            onClick={() => {
                                                setSelectedIcon(icon);
                                                setShowIconPicker(false);
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            className={styles.folderInput}
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => handleKeyPress(e, 'create')}
                            autoFocus
                            maxLength={20}
                        />
                        <button
                            className={styles.confirmBtn}
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim()}
                        >
                            ✓
                        </button>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => { setIsCreating(false); setNewFolderName(''); }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* System Folders */}
                <ul className={styles.folderList}>
                    {systemFolders.map((folder) => (
                        <li key={folder.id}>
                            <button
                                className={`${styles.folderItem} ${activeFolder === folder.id ? styles.active : ''}`}
                                onClick={() => handleFolderClick(folder.id)}
                            >
                                <span className={styles.folderIcon}>{folder.icon}</span>
                                {!isCollapsed && (
                                    <>
                                        <span className={styles.folderName}>{folder.name}</span>
                                        <span className={styles.folderCount}>{getFolderCount(folder.id)}</span>
                                    </>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Custom Folders */}
                {customFolders.length > 0 && (
                    <ul className={styles.folderList}>
                        {customFolders.map((folder) => (
                            <li key={folder.id} className={styles.customFolderItem}>
                                {editingFolderId === folder.id && !isCollapsed ? (
                                    <div className={styles.editForm}>
                                        <span className={styles.folderIcon}>{folder.icon}</span>
                                        <input
                                            type="text"
                                            className={styles.folderInput}
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            onKeyDown={e => handleKeyPress(e, 'edit')}
                                            onBlur={handleSaveEdit}
                                            autoFocus
                                            maxLength={20}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        className={`${styles.folderItem} ${activeFolder === folder.id ? styles.active : ''} ${dragOverFolderId === folder.id ? styles.dragOver : ''}`}
                                        onClick={() => handleFolderClick(folder.id)}
                                        onDoubleClick={() => {
                                            setEditingFolderId(folder.id);
                                            setEditingName(folder.name);
                                        }}
                                        onDragOver={(e) => handleDragOver(e, folder.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, folder.id)}
                                    >
                                        <span className={styles.folderIcon}>{folder.icon}</span>
                                        {!isCollapsed && (
                                            <>
                                                <span className={styles.folderName}>{folder.name}</span>
                                                <span className={styles.folderCount}>{getFolderCount(folder.id)}</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {!isCollapsed && (
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFolder(folder.id);
                                        }}
                                        title="Delete folder"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Empty custom folders message */}
                {customFolders.length === 0 && !isCreating && !isCollapsed && (
                    <div className={styles.emptyFolders}>
                        <button
                            className={styles.createFirstBtn}
                            onClick={() => setIsCreating(true)}
                            disabled={!canCreateFolder}
                        >
                            + Create folder
                        </button>
                    </div>
                )}

                {/* Folder limit indicator */}
                {!isCollapsed && !canCreateFolder && (
                    <div className={styles.limitReached}>
                        Upgrade to Premium for more folders
                    </div>
                )}
            </div>

            {/* Premium Upgrade Banner (for free users) */}
            {!isCollapsed && (
                <div className={styles.premiumBanner}>
                    <div className={styles.premiumIcon}>🥓</div>
                    <div className={styles.premiumContent}>
                        <span className={styles.premiumTitle}>Go Premium</span>
                        <span className={styles.premiumDesc}>Unlimited folders & more</span>
                    </div>
                    <button className={styles.premiumBtn}>Upgrade</button>
                </div>
            )}

            {/* Settings at Bottom */}
            <div className={styles.bottomNav}>
                <button className={styles.bottomNavItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    {!isCollapsed && <span>Settings</span>}
                </button>
            </div>
        </aside>
    );
}
