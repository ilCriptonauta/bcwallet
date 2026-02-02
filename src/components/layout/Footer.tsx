import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
    return (
        <footer className={styles.footer}>
            <p className={styles.text}>
                Bacon Wallet is built by{' '}
                <a
                    href="https://x.com/onionxlabs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.brandLink}
                >
                    OnionxLabs
                </a>{' '}
                powered by{' '}
                <a
                    href="https://oox.art"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.brandLink}
                >
                    OOX
                </a>
            </p>
        </footer>
    );
}
