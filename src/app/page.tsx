'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { EventHandler, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { NFTStorage, File } from 'nft.storage';
import { base64ToBlob } from '../utils/common';
import { useWriteContract } from 'wagmi';
import AiNft from '../abis/AiNft.json';
import { parseEther } from 'viem';

type Address = `0x${string}`;

export default function Home() {
  const { data: hash, isPending, writeContract } = useWriteContract();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { isConnected, address } = useAccount();
  const [image, setImage] = useState('');
  const [url, setURL] = useState('');
  const [canGenerate, setCanGenerate] = useState(false);
  const [canMint, setCanMint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpload, setIsUpload] = useState(false);

  useEffect(() => {
    if (isConnected && !!name && !!description) {
      setCanGenerate(true);
    } else {
      setCanGenerate(false);
    }
  }, [isConnected, name, description]);

  useEffect(() => {
    if (image && !isPending) {
      setCanMint(true);
    }
  }, [image, isPending]);

  const getImage = async () => {
    const res = await fetch('https://api.edenai.run/v2/image/generation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_EDENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        providers: 'stabilityai',
        text: description,
        resolution: '1024x1024',
        fallback_providers: ''
      })
    }).then((res) => res.json());

    setImage(res.stabilityai.items[0].image);
  };

  const handleSubmit = async () => {
    if (!name || !description) {
      return;
    }

    setLoading(true);
    setCanGenerate(false);
    await getImage();
    setLoading(false);
    setCanGenerate(true);
    // const storageUrl = await uploadImage(base64ToBlob(base64Image));
    // console.log('storageUrl', storageUrl);
    // mintNft(storageUrl);
  };

  const uploadImage = async (imageData: Blob) => {
    // Create instance to NFT.Storage
    const nftstorage = new NFTStorage({ token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY as string });

    // Send request to store image
    const { ipnft } = await nftstorage.store({
      image: new File([imageData], 'image.jpeg', { type: 'image/jpeg' }),
      name: name,
      description: description
    });

    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`;
    setURL(url);

    return url;
  };

  const mintNft = async () => {
    setIsUpload(true);

    const token = await uploadImage(base64ToBlob(image));

    setIsUpload(false);

    writeContract({
      address: AiNft['address'] as Address,
      abi: AiNft['abi'],
      functionName: 'mintNft',
      args: [token],
      value: parseEther('0.01')
    });
  };

  return (
    <div className="relative min-h-screen">
      {hash ? (
        <div className="bg-green-200 border-green-600 text-green-600 border-l-4 p-4 w-full md:w-1/2 mx-auto">
          <p className="font-bold">Success</p>
          <p>
            You can see your transaction on{' '}
            <a className="text-indigo-600 underline" href={`https://sepolia.etherscan.io/tx/${hash}`}>
              {`https://sepolia.etherscan.io/tx/${hash}`}
            </a>
          </p>
        </div>
      ) : null}

      <div className="mb-10 text-center relative p-12">
        <div className="text-2xl font-bold mx-auto text-indigo-600">AI NFT Generator</div>
        <div className="absolute right-5 top-10">
          <ConnectButton label="Connect" />
        </div>
      </div>

      <div className="w-full md:w-1/3 mx-auto">
        <div className="mb-10">
          <div className="mb-5">
            <input
              name="name"
              type="text"
              onChange={(e) => {
                setName(e.target.value);
              }}
              className="block pl-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              placeholder="input name..."
            />
          </div>
          <div className="mb-5">
            <textarea
              name="description"
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              className="block w-full pl-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              placeholder="input description..."
            />
          </div>
          <div className="flex gap-3">
            <button
              disabled={!canGenerate}
              className={`flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white ${!canGenerate ? 'opacity-50' : ''}`}
              onClick={() => {
                handleSubmit();
              }}
            >
              Generate
            </button>
            <button
              disabled={!canMint}
              className={`flex justify-center rounded-md text-indigo-600 px-3 py-1.5 text-sm font-semibold border border-indigo-600 ${!canMint ? 'opacity-50' : ''}`}
              onClick={() => {
                mintNft();
              }}
            >
              Mint
            </button>
          </div>
        </div>
      </div>
      {!image ? (
        <div className="w-48 h-48 border-2 text-xl border-indigo-600 mx-auto font-bold flex items-center justify-center">{loading ? 'Loading...' : ''}</div>
      ) : (
        <div className="w-48 h-48 mx-auto">
          <img className="w-full h-full" src={`data:png;base64,${image}`} alt="" />
        </div>
      )}
      {/* {hash && <div className="mt-3">Transaction Hash: {hash}</div>} */}
      {isUpload || isPending ? (
        <div className="h-full w-full absolute flex flex-col items-center justify-center top-0 bg-[rgba(0,0,0,.45)]">
          <div className="border-gray-300 h-20 w-20 animate-spin rounded-full border-8 border-t-blue-600" />
          {isUpload ? <div className="mt-3 text-xl text-white font-bold">Uploading</div> : null}
          {isPending ? <div className="mt-3 text-xl text-white font-bold">Pending</div> : null}
        </div>
      ) : null}
    </div>
  );
}
