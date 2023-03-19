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
  "0xC4ed0A9Ea70d5bCC69f748547650d32cC219D882",
  tokenAbi,
  compromisedWallet
);

const tokensToClaim = ethers.parseEther('6750'); // input claimable tokens here

const functionSignature1 = claimContract.interface.encodeFunctionData("claim");

const functionSignature2 = tokenContract.interface.encodeFunctionData(
  "transfer",
  [safeWallet.address, tokensToClaim]
);


async function execute() {
  // send gas from safe wallet to compromised wallet
  safeWallet.sendTransaction({
    to: compromisedWallet.address,
    value: 2000000000000, // 0.0002 eth ~ $0.32
  });
  // claim arb tokens
  const tx1 = {
    to: claimContract.getAddress(),
    data: functionSignature1,
    nonce: 0,
  };
  // transfer arb tokens to safe wallet
  const tx2 = {
      to: tokenContract.getAddress(),
      data: functionSignature2,
      nonce: 0
    };

  const array = [tx1, tx2];

  let nonce = await provider.getTransactionCount(compromisedWallet.address);
  for (let i = 0; i < array.length; i++) {
    array[i].nonce = nonce;
    compromisedWallet.sendTransaction(array[i]);
    nonce+=1;
  }
}

execute();
