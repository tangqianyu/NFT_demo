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
  const { data: hash, writeContract } = useWriteContract();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { isConnected, address } = useAccount();
  const [image, setImage] = useState('');
  const [url, setURL] = useState('');

  useEffect(() => {}, []);

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

    const img = `data:png;base64,` + res.stabilityai.items[0].image;
    setImage(img);

    return res.stabilityai.items[0].image;
  };

  const handleSubmit = async () => {
    if (!name || !description) {
      return;
    }

    const base64Image = await getImage();

    const storageUrl = await uploadImage(base64ToBlob(base64Image));

    console.log('storageUrl', storageUrl);

    mintNft(storageUrl);
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

  const mintNft = async (token: string) => {
    writeContract({
      address: AiNft['address'] as Address,
      abi: AiNft['abi'],
      functionName: 'mintNft',
      args: [token],
      value: parseEther('0.01')
    });
  };

  return (
    <div className="min-h-screen p-12">
      <div className="flex justify-between mb-10">
        <div className="text-xl font-bold">AI NFT Generator</div>
        <ConnectButton label="Connect" />
      </div>
      {isConnected ? (
        <>
          <div className="flex gap-16 justify-center">
            <div className="flex flex-col">
              <div>
                <div className="mb-3">
                  <input
                    name="name"
                    type="text"
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                    className="block pl-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    placeholder="input name..."
                  />
                </div>
                <div className="mb-3">
                  <input
                    name="description"
                    type="text"
                    onChange={(e) => {
                      setDescription(e.target.value);
                    }}
                    className="block pl-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    placeholder="input description..."
                  />
                </div>
                <div>
                  <button
                    className="flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() => {
                      handleSubmit();
                    }}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            {!image ? (
              <div className="w-40 h-40 border"></div>
            ) : (
              <div className="w-40 h-40 border">
                <img className="w-full h-full" src={image} alt="" />
              </div>
            )}
          </div>
          {hash && <div className="mt-3">Transaction Hash: {hash}</div>}
        </>
      ) : null}
    </div>
  );
}
