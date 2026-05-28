import type { Address } from "viem";

export const NO_SHOW_DEPOSIT_ADDRESS =
  (process.env.NEXT_PUBLIC_NO_SHOW_DEPOSIT_ADDRESS ||
    process.env.NEXT_PUBLIC_DEPOSIT_CONTRACT_ADDRESS) as Address | undefined;

export const noShowDepositAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_reputationContractAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "appointmentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reservationTime",
        type: "uint256",
      },
    ],
    name: "DepositCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "appointmentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositAmount",
        type: "uint256",
      },
    ],
    name: "DepositPaid",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_appointmentId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_seller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_reservationTime",
        type: "uint256",
      },
    ],
    name: "createAndPayDeposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_appointmentId",
        type: "uint256",
      },
    ],
    name: "confirmBySeller",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_appointmentId",
        type: "uint256",
      },
    ],
    name: "confirmByConsumer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
