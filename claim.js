require("dotenv").config();
const { ethers, parseEther } = require("ethers");
const claimAbi = require("./claimAbi.json");
const tokenAbi = require("./tokenAbi.json");

const providerRPC = {
  arbitrum: {
    name: "arbitrum",
    rpc: "https://endpoints.omniatech.io/v1/arbitrum/one/public",
    chainId: 42161,
  },
};

const provider = new ethers.JsonRpcProvider(
  providerRPC.arbitrum.rpc, {
  chainId: providerRPC.arbitrum.chainId,
  name: providerRPC.arbitrum.name,
});

let compromisedWallet = new ethers.Wallet(
  process.env.COMPROMISED_PRIVATE_KEY,
  provider
);
let safeWallet = new ethers.Wallet(
  process.env.SAFE_PRIVATE_KEY,
  provider);

const claimContract = new ethers.Contract(
  "0x67a24CE4321aB3aF51c2D0a4801c3E111D88C9d9",
  claimAbi,
  compromisedWallet
);

const tokenContract = new ethers.Contract(
  "0x912CE59144191C1204E64559FE8253a0e49E6548",
  tokenAbi,
  compromisedWallet
);

const compromisedWalletNonce = await provider.getTransactionCount(compromisedWallet.address);
const safeWalletNonce = await provider.getTransactionCount(safeWallet.address);

const tokensToClaim = ethers.parseEther('6750'); // input claimable tokens here

const functionSignature1 = claimContract.interface.encodeFunctionData("claim");

const functionSignature2 = tokenContract.interface.encodeFunctionData(
  "transfer",
  [safeWallet.address, tokensToClaim]
);

// send gas from safe wallet to compromised wallet
const tx0 = {
  to: compromisedWallet.address,
  value: 200000000000000, // 0.0002 eth ~ $0.32 // adjust accordingly
  nonce: safeWalletNonce,
};

// claim arb tokens
const tx1 = {
  to: claimContract.getAddress(),
  data: functionSignature1,
  nonce: compromisedWalletNonce,
};
// transfer arb tokens to safe wallet
const tx2 = {
  to: tokenContract.getAddress(),
  data: functionSignature2,
  nonce: compromisedWalletNonce + 1,
};

const signedTx0 = await safeWallet.signTransaction(tx0);
const signedTx1 = await compromisedWallet.signTransaction(tx1);
const signedTx2 = await compromisedWallet.signTransaction(tx2);

const array = [tx0, tx1, tx2];

async function execute() {
  for (let i = 0; i < array.length; i++) {
    provider.sendTransaction(array[i]);
  }
}

execute();
