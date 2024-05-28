import { ethers } from "ethers";
import 'dotenv/config';

// Load the contract to interact with it
const contractAddress = "0xad65ffd273c30bc92777587929395be6f4078466";
const abi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "text",
        "type": "string"
      }
    ],
    "name": "encryptMessage",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEncryptedFlag",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
];

// Load the Alchemmy provider
const provider = new ethers.AlchemyProvider('sepolia', process.env.ALCHEMY_API_KEY);
const contract = new ethers.Contract(contractAddress, abi, provider);

// Function to get the encrypted flag
async function getEncryptedFlag() {
  const encryptedFlagHex = await contract.getEncryptedFlag();
  return Buffer.from(encryptedFlagHex.slice(2), 'hex'); // Converting the flag to a binary buffer
}

// Function to get the ciphertext of the known plaintext
async function getEncryptedKnownPlaintext(plainText) {
  const encrypted = await contract.encryptMessage(plainText);
  return Buffer.from(encrypted.slice(2), 'hex'); // Converting the ciphertext to a binary buffer
}

// Function to get the keystream out of the known plaintext and its ciphertext by XORing them
function generateKeystream(knownPlaintext, encryptedKnownPlaintext) {
  const keystream = Buffer.alloc(knownPlaintext.length);
  for (let i = 0; i < knownPlaintext.length; i++) {
    keystream[i] = knownPlaintext[i] ^ encryptedKnownPlaintext[i];
  }
  return keystream;
}

// Function to obtain the plain flag by XORing the encrypted flag with the keystream
function decryptFlag(encryptedFlag, keystream) {
  const decryptedFlag = Buffer.alloc(encryptedFlag.length);
  for (let i = 0; i < encryptedFlag.length; i++) {
    decryptedFlag[i] = encryptedFlag[i] ^ keystream[i % keystream.length];
  }
  return decryptedFlag.toString();
}

async function main() {
  const encryptedFlag = await getEncryptedFlag();

  // The known plaintext could be any string that is at least as long as the plaintext flag
  // If not as long, the key stream will not be long enough and will only decrypt the beginning of the flag
  // So here our known plaintext is the string "knownplaintext" repeated 7 times
  const knownPlaintext = Buffer.from("knownplaintextknownplaintextknownplaintextknownplaintextknownplaintextknownplaintextknownplaintext");
  const encryptedKnownPlaintext = await getEncryptedKnownPlaintext(knownPlaintext.toString());

  const keystream = generateKeystream(knownPlaintext, encryptedKnownPlaintext);
  const decryptedFlag = decryptFlag(encryptedFlag, keystream);

  console.log("Decrypted Flag:", decryptedFlag);
}

main().catch(console.error);