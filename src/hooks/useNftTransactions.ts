import { 
  Address, 
  Token, 
  TokenTransfer, 
  Transaction,
  TransactionsFactoryConfig, 
  TransferTransactionsFactory, 
  TokenManagementTransactionsFactory, 
  SmartContractTransactionsFactory 
} from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';
import { signAndSendTransactions, type NormalizedNft } from '@/helpers';

interface UseNftTransactionsProps {
  walletAddress: string | null;
  network: any;
  setItems: React.Dispatch<React.SetStateAction<NormalizedNft[]>>;
  OOX_PAYMENT_TOKENS: any[];
  OOX_CONTRACT_ADDRESS: string;
}

export function useNftTransactions({
  walletAddress,
  network,
  setItems,
  OOX_PAYMENT_TOKENS,
  OOX_CONTRACT_ADDRESS
}: UseNftTransactionsProps) {

  const handleSendNft = async (
    nftToSend: NormalizedNft, 
    recipient: string, 
    sendQuantity: string,
    onSuccess?: () => void
  ) => {
    if (!walletAddress) return;

    try {
      // 1. Resolve recipient address and herotags
      const cleanRecipient = recipient.trim().replace(/^@/, '').replace(/\.elrond$/, '');

      let recipientAddr: Address;

      if (cleanRecipient.startsWith('erd1') && cleanRecipient.length === 62) {
        try {
          recipientAddr = new Address(cleanRecipient);
        } catch {
          throw new Error('Invalid ERD address format.');
        }
      } else {
        // Resolve herotag
        const response = await fetch(`${network.apiAddress}/usernames/${cleanRecipient}`);
        if (!response.ok) {
          throw new Error(`Herotag "${cleanRecipient}" not found on MultiversX.`);
        }
        const herotagData = await response.json();
        if (!herotagData.address) {
          throw new Error(`Could not resolve address for herotag "${cleanRecipient}".`);
        }
        recipientAddr = new Address(herotagData.address);
      }

      // 2. Build Transaction
      const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
      const factory = new TransferTransactionsFactory({ config: factoryConfig });

      const lastDashIndex = nftToSend.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToSend.identifier.substring(0, lastDashIndex);
      const nonce = parseInt(nftToSend.identifier.substring(lastDashIndex + 1), 16);

      const transfer = new TokenTransfer({
        token: new Token({ identifier: collection, nonce: BigInt(nonce) }),
        amount: BigInt(nftToSend.type === 'NFT' ? 1 : sendQuantity)
      });

      const txPromise = factory.createTransactionForESDTTokenTransfer(
        new Address(walletAddress),
        {
          receiver: recipientAddr,
          tokenTransfers: [transfer],
        }
      );

      const tx = await txPromise;

      await signAndSendTransactions({
        transactions: [Transaction.newFromPlainObject(tx.toPlainObject())],
        transactionsDisplayInfo: {
          processingMessage: `Sending ${sendQuantity} edition(s) of ${nftToSend.name}...`,
          errorMessage: 'Failed to send Asset.',
          successMessage: 'Asset sent successfully!'
        }
      });

      // 4. Optimistic UI Updates
      const sentId = nftToSend.identifier;
      const sentAmountRaw = parseInt(sendQuantity, 10);
      const sentAmount = isNaN(sentAmountRaw) ? 1 : sentAmountRaw;

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === sentId) {
            const currentBalance = parseInt(n.balance || '1', 10);
            if (currentBalance > sentAmount) {
              return { ...n, balance: (currentBalance - sentAmount).toString() };
            }
            return null; // Remove if balance becomes 0
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      setItems(prev => updateList(prev));
      onSuccess?.();

    } catch (err: unknown) {
      console.error('Failed to send NFT:', err);
      let message = err instanceof Error ? err.message : 'Check if the address or herotag is valid.';
      if (message.includes("invalid signature")) {
        message = "Signature failed. This could be due to a nonce mismatch or wrong network. Please try again or refresh the page.";
      }
      alert(`Error: ${message}`);
    }
  };

  const handleBurnNft = async (
    nftToBurn: NormalizedNft, 
    burnQuantity: string,
    onSuccess?: () => void
  ) => {
    if (!walletAddress) return;

    try {
      const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
      const factory = new TokenManagementTransactionsFactory({ config: factoryConfig });

      const lastDashIndex = nftToBurn.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToBurn.identifier.substring(0, lastDashIndex);
      const nonce = parseInt(nftToBurn.identifier.substring(lastDashIndex + 1), 16);

      const txPromise = factory.createTransactionForBurningQuantity(
        new Address(walletAddress),
        {
          tokenIdentifier: collection,
          tokenNonce: BigInt(nonce),
          quantity: BigInt(burnQuantity),
        }
      );

      const tx = await txPromise;
      tx.gasLimit = 10000000n; // Set explicit high gas limit for burning

      await signAndSendTransactions({
        transactions: [Transaction.newFromPlainObject(tx.toPlainObject())],
        transactionsDisplayInfo: {
          processingMessage: `Burning ${burnQuantity} edition(s) of ${nftToBurn.name}...`,
          errorMessage: 'Failed to burn Asset.',
          successMessage: 'Asset burned successfully!'
        }
      });

      // 3. Optimistic UI Updates
      const burnedId = nftToBurn.identifier;
      const burnedAmountRaw = parseInt(burnQuantity, 10);
      const burnedAmount = isNaN(burnedAmountRaw) ? 1 : burnedAmountRaw;

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === burnedId) {
            const currentBalance = parseInt(n.balance || '1', 10);
            if (currentBalance > burnedAmount) {
              return { ...n, balance: (currentBalance - burnedAmount).toString() };
            }
            return null; // Remove if balance becomes 0
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      setItems(prev => updateList(prev));
      onSuccess?.();

    } catch (err: unknown) {
      console.error('Failed to burn NFT:', err);
      const message = err instanceof Error ? err.message : 'Check balance and try again.';
      alert(`Error: ${message}`);
    }
  };

  const handleSellNft = async (
    nftToSell: NormalizedNft, 
    sellPrice: string, 
    sellQuantity: string, 
    selectedPaymentToken: string,
    onSuccess?: () => void
  ) => {
    if (!walletAddress) return;

    try {
      const toHex = (str: string) => Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const hexToUint8Array = (hex: string) => {
        const matches = hex.match(/.{1,2}/g);
        return new Uint8Array(matches ? matches.map(byte => parseInt(byte, 16)) : []);
      };

      const priceBN = new BigNumber(sellPrice);
      const tokenConfig = OOX_PAYMENT_TOKENS.find(t => t.identifier === selectedPaymentToken);
      const decimals = tokenConfig?.decimals ?? 18;
      const priceRaw = priceBN.times(new BigNumber(10).pow(decimals)).toFixed(0);
      
      const lastDashIndex = nftToSell.identifier.lastIndexOf('-');
      if (lastDashIndex === -1) throw new Error("Invalid NFT identifier format.");

      const collection = nftToSell.identifier.substring(0, lastDashIndex);
      const nonce = parseInt(nftToSell.identifier.substring(lastDashIndex + 1), 16);

      let priceHex = BigInt(priceRaw).toString(16);
      if (priceHex.length % 2 !== 0) priceHex = '0' + priceHex;

      const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 days
      let deadlineHex = deadline.toString(16);
      if (deadlineHex.length % 2 !== 0) deadlineHex = '0' + deadlineHex;

      const paymentTokenHex = toHex(selectedPaymentToken);
      const finalQuantity = nftToSell.type === 'NFT' ? 1 : (parseInt(sellQuantity, 10) || 1);

      const transfer = new TokenTransfer({
        token: new Token({ identifier: collection, nonce: BigInt(nonce) }),
        amount: BigInt(finalQuantity)
      });

      const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
      const factory = new SmartContractTransactionsFactory({ config: factoryConfig });

      const txPromise = factory.createTransactionForExecute(
        new Address(walletAddress),
        {
          contract: new Address(OOX_CONTRACT_ADDRESS),
          function: 'auctionToken',
          arguments: [
            hexToUint8Array(priceHex), // min_bid
            hexToUint8Array(priceHex), // max_bid
            hexToUint8Array(deadlineHex),
            hexToUint8Array(paymentTokenHex),
          ],
          tokenTransfers: [transfer],
          gasLimit: 15000000n,
        }
      );

      const tx = await txPromise;

      await signAndSendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: `Listing ${sellQuantity} edition(s) of ${nftToSell.name} for ${sellPrice} ${selectedPaymentToken.split('-')[0]}...`,
          errorMessage: 'Failed to list Asset.',
          successMessage: 'Asset listed successfully!'
        }
      });

      // Optimistic UI Update
      const listedId = nftToSell.identifier;
      const listedAmountRaw = parseInt(sellQuantity, 10);
      const listedAmount = isNaN(listedAmountRaw) ? 1 : listedAmountRaw;

      const updateList = (prev: NormalizedNft[]) => {
        return prev.map(n => {
          if (n.identifier === listedId) {
            const currentBalance = parseInt(n.balance || '1', 10);
            if (currentBalance > listedAmount) {
              return { ...n, balance: (currentBalance - listedAmount).toString() };
            }
            return null; // Remove if balance becomes 0
          }
          return n;
        }).filter((n): n is NormalizedNft => n !== null);
      };

      setItems(prev => updateList(prev));
      onSuccess?.();

    } catch (err: unknown) {
      console.error('Failed to sell NFT:', err);
      const message = err instanceof Error ? err.message : 'Check balance and try again.';
      alert(`Error: ${message}`);
    }
  };

  return {
    handleSendNft,
    handleBurnNft,
    handleSellNft
  };
}
