'use client';

/* =====================================================
   🥓 BACON WALLET - Organization Modal
   Manage tags and folders for a specific NFT
   ===================================================== */

import { useState, useRef, useEffect } from 'react';
import { Tag, Folder, TAG_COLORS } from '@/types/folders';
import styles from './TagSelectionModal.module.css';

interface TagSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;

    // Data
    allTags: Tag[];
    assignedTags: Tag[];
    folders: Folder[]; // Custom folders
    currentFolderId?: string | null;

    // Actions
    onAddTag: (tagId: string) => void;
    onRemoveTag: (tagId: string) => void;
    onCreateTag: (name: string, color?: string) => void;
    onMoveToFolder: (folderId: string) => void;
    onRemoveFromFolder: () => void;
}

export function TagSelectionModal({
    isOpen,
    onClose,
    allTags,
    assignedTags,
    folders,
    currentFolderId,
    onAddTag,
    onRemoveTag,
    onCreateTag,
    onMoveToFolder,
    onRemoveFromFolder,
}: TagSelectionModalProps) {
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const assignedTagIds = new Set(assignedTags.map(t => t.id));

    const handleToggleTag = (tag: Tag) => {
        if (assignedTagIds.has(tag.id)) {
            onRemoveTag(tag.id);
        } else {
            onAddTag(tag.id);
        }
    };

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;
        onCreateTag(newTagName.trim(), selectedColor);
        setNewTagName('');
        // Cycle colors
        const currentIndex = TAG_COLORS.indexOf(selectedColor);
        const nextIndex = (currentIndex + 1) % TAG_COLORS.length;
        setSelectedColor(TAG_COLORS[nextIndex]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateTag();
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Organize NFT</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Folders Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Folder</div>
                        <div className={styles.folderList}>
                            {/* "None" option */}
                            <button
                                className={`${styles.folderItem} ${!currentFolderId ? styles.selectedFolder : ''}`}
                                onClick={onRemoveFromFolder}
                            >
                                <span className={styles.folderIcon}>📂</span>
                                <span className={styles.folderName}>All (No Folder)</span>
                                {!currentFolderId && <span className={styles.check}>✓</span>}
                            </button>

                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    className={`${styles.folderItem} ${currentFolderId === folder.id ? styles.selectedFolder : ''}`}
                                    onClick={() => onMoveToFolder(folder.id)}
                                >
                                    <span className={styles.folderIcon}>{folder.icon}</span>
                                    <span className={styles.folderName}>{folder.name}</span>
                                    {currentFolderId === folder.id && <span className={styles.check}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.divider} />

                    {/* Tags Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Tags</div>

                        {/* Create New Tag */}
                        <div className={styles.createForm}>
                            <div className={styles.inputGroup}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={styles.input}
                                    placeholder="New tag..."
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    maxLength={20}
                                />
                                <button
                                    className={styles.createBtn}
                                    onClick={handleCreateTag}
                                    disabled={!newTagName.trim()}
                                >
                                    +
                                </button>
                            </div>

                            {/* Color Picker (Mini) */}
                            {newTagName.trim().length > 0 && (
                                <div className={styles.colorRow}>
                                    {TAG_COLORS.slice(0, 5).map((color) => (
                                        <button
                                            key={color}
                                            className={`${styles.colorOption} ${selectedColor === color ? styles.selectedColor : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tag List */}
                        <div className={styles.tagList}>
                            {allTags.map((tag) => {
                                const isSelected = assignedTagIds.has(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        className={`${styles.tagItem} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => handleToggleTag(tag)}
                                    >
                                        <span
                                            className={styles.tagColor}
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className={styles.tagName}>{tag.name}</span>
                                        {isSelected && <span className={styles.tagCheck}>✓</span>}
                                    </button>
                                );
                            })}
                            {allTags.length === 0 && (
                                <p className={styles.emptyText}>No tags yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
