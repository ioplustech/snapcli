import colors from 'colors'
import { type WalletData } from '../service/wallet'
import { isAddress } from 'ethers/lib/utils'
import { ethers } from 'ethers'
import { snapcliDebug } from '../prepare/debug'
import type ora from 'ora'

export enum errors {
  ADDRESS_IS_INVALID = 'address is invalid!',
  PRIVATEKEY_IS_NEEDED = 'privatekey is needed!',
  PRIVATEKEY_IS_INVALID = 'privatekey is invalid!',
  WALLET_IS_NEEDED = 'please login first or specify with --privateKey 0xxxxxx !',
  NO_PROPOSALS = 'no proposals!',
  NO_SCORE = 'cannot vote while you don\'t have enough score!',
  NO_SPACE = 'need space!',
}

export const checkSpace = (value: string) => {
  if (!value) {
    console.error(colors.red(errors.NO_SPACE))
    process.exit(1)
  }
  return true
}
export const checkAddress = (value: string) => {
  if (!isAddress(value)) {
    console.error(colors.red(errors.ADDRESS_IS_INVALID))
    process.exit(1)
  }
  return true
}
export const checkPrivateKey = (privateKey: string) => {
  if (!privateKey) {
    console.error(colors.red(errors.PRIVATEKEY_IS_NEEDED))
    process.exit(1)
  }
  try {
    const { address } = new ethers.Wallet(privateKey)
    snapcliDebug(`check ${address} succeed`)
  } catch (err) {
    snapcliDebug('checkPrivateKey Error:', (err as Error).message)
    console.error(colors.red(errors.PRIVATEKEY_IS_INVALID))
    process.exit(1)
  }

  return true
}
export const checkWallets = (wallets: WalletData[]) => {
  if (!wallets?.length) {
    console.error(colors.red(errors.WALLET_IS_NEEDED))
    process.exit(1)
  }
  return true
}
export const checkProposals = (proposals: any[], spinner: ora.Ora) => {
  if (!proposals?.length) {
    spinner.clear()
    console.error(colors.red(errors.NO_PROPOSALS))
    process.exit(1)
  }
  return true
}
export const checkScore = (score: number, spinner: ora.Ora) => {
  if (!score) {
    spinner.clear()
    console.error(colors.red(errors.NO_SCORE))
    process.exit(1)
  }
  return true
}
