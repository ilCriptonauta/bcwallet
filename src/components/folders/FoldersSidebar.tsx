'use client';

/* =====================================================
   🥓 BACON WALLET - Folders Sidebar Component
   Sidebar for folder navigation and management
   ===================================================== */

import { useState, useCallback } from 'react';
import { Folder, SystemFolderID } from '@/types/folders';
import styles from './FoldersSidebar.module.css';

interface FoldersSidebarProps {
    systemFolders: Folder[];
    customFolders: Folder[];
    selectedFolderId: string;
    onSelectFolder: (folderId: string) => void;
    onCreateFolder: (name: string, icon?: string) => Folder | null;
    onDeleteFolder: (folderId: string) => boolean;
    onRenameFolder: (folderId: string, newName: string) => boolean;
    getFolderCount: (folderId: string) => number;
    canCreateFolder: boolean;
    folderLimit: number;
    isPremium?: boolean;
    onUpgradeClick?: () => void;
}

const FOLDER_ICONS = ['📁', '🎨', '🎮', '🎵', '📷', '💼', '🏆', '🌟', '💎', '🔥', '🎭', '🎪'];

export function FoldersSidebar({
    systemFolders,
    customFolders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    getFolderCount,
    canCreateFolder,
    folderLimit,
    isPremium = false,
    onUpgradeClick,
}: FoldersSidebarProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📁');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);

    // Create folder
    const handleCreateFolder = useCallback(() => {
        if (!newFolderName.trim()) return;

        const folder = onCreateFolder(newFolderName.trim(), selectedIcon);
        if (folder) {
            setNewFolderName('');
            setSelectedIcon('📁');
            setIsCreating(false);
            setShowIconPicker(false);
        }
    }, [newFolderName, selectedIcon, onCreateFolder]);

    // Start editing
    const handleStartEdit = useCallback((folder: Folder) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
    }, []);

    // Save edit
    const handleSaveEdit = useCallback(() => {
        if (editingFolderId && editingName.trim()) {
            onRenameFolder(editingFolderId, editingName.trim());
        }
        setEditingFolderId(null);
        setEditingName('');
    }, [editingFolderId, editingName, onRenameFolder]);

    // Cancel
    const handleCancel = useCallback(() => {
        setIsCreating(false);
        setNewFolderName('');
        setEditingFolderId(null);
        setEditingName('');
        setShowIconPicker(false);
    }, []);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent, action: 'create' | 'edit') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (action === 'create') {
                handleCreateFolder();
            } else {
                handleSaveEdit();
            }
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [handleCreateFolder, handleSaveEdit, handleCancel]);

    return (
        <div className={styles.sidebar}>
            {/* System Folders Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>Library</span>
                </div>
                <div className={styles.folderList}>
                    {systemFolders.map(folder => (
                        <button
                            key={folder.id}
                            className={`${styles.folderItem} ${selectedFolderId === folder.id ? styles.active : ''}`}
                            onClick={() => onSelectFolder(folder.id)}
                        >
                            <span className={styles.folderIcon}>{folder.icon}</span>
                            <span className={styles.folderName}>{folder.name}</span>
                            <span className={styles.folderCount}>{getFolderCount(folder.id)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Folders Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>Folders</span>
                    {!isPremium && (
                        <span className={styles.folderLimitBadge}>
                            {customFolders.length}/{folderLimit}
                        </span>
                    )}
                    <button
                        className={styles.addButton}
                        onClick={() => setIsCreating(true)}
                        disabled={!canCreateFolder}
                        title={canCreateFolder ? 'Create folder' : 'Upgrade to Premium for more folders'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>

                {/* Create Folder Form */}
                {isCreating && (
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
                            maxLength={30}
                        />
                        <button
                            className={styles.confirmBtn}
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim()}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        </button>
                        <button
                            className={styles.cancelBtn}
                            onClick={handleCancel}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Custom Folders List */}
                <div className={styles.folderList}>
                    {customFolders.map(folder => (
                        <div
                            key={folder.id}
                            className={`${styles.folderItem} ${selectedFolderId === folder.id ? styles.active : ''}`}
                        >
                            {editingFolderId === folder.id ? (
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
                                        maxLength={30}
                                    />
                                </div>
                            ) : (
                                <button
                                    className={styles.folderButton}
                                    onClick={() => onSelectFolder(folder.id)}
                                    onDoubleClick={() => handleStartEdit(folder)}
                                >
                                    <span className={styles.folderIcon}>{folder.icon}</span>
                                    <span className={styles.folderName}>{folder.name}</span>
                                    <span className={styles.folderCount}>{getFolderCount(folder.id)}</span>
                                </button>
                            )}

                            {/* Folder Actions */}
                            <div className={styles.folderActions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => handleStartEdit(folder)}
                                    title="Rename"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => onDeleteFolder(folder.id)}
                                    title="Delete"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {customFolders.length === 0 && !isCreating && (
                        <div className={styles.emptyFolders}>
                            <span className={styles.emptyIcon}>📁</span>
                            <p>No custom folders yet</p>
                            {canCreateFolder && (
                                <button
                                    className={styles.createFirstBtn}
                                    onClick={() => setIsCreating(true)}
                                >
                                    Create your first folder
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Upgrade Banner */}
            {!isPremium && (
                <div className={styles.premiumBanner}>
                    <div className={styles.premiumIcon}>🥓</div>
                    <div className={styles.premiumContent}>
                        <span className={styles.premiumTitle}>Go Premium</span>
                        <span className={styles.premiumDesc}>Unlimited folders & more</span>
                    </div>
                    <button
                        className={styles.upgradeBtn}
                        onClick={onUpgradeClick}
                    >
                        Upgrade
                    </button>
                </div>
            )}
        </div>
    );
}
