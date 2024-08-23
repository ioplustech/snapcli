import { ethers } from 'ethers'
import { commandLine } from '../commands'
import { walletStorage } from '../service/wallet'
import colors from 'colors'
import { checkKeystore } from '../checker'

export const loginWithKeystore = async (keystore: string, password: string) => {
  const { privateKey } = checkKeystore(keystore, password)
  const wallet = await walletStorage.addWallet(privateKey)
  console.clear()
  console.log(colors.green(`login ${wallet.address} succeed!`))
  process.exit(0)
}

export const loginWithPrivateKey = async (privateKey?: string) => {
  if (!privateKey) {
    const prompt = 'please input your privateKey:'
    const continueFn = (key: string) => {
      try {
        const wa = new ethers.Wallet(key)
        return !wa
      } catch (err) {
        return true
      }
    }
    privateKey = await commandLine(prompt, continueFn)
  }
  const wallet = await walletStorage.addWallet(privateKey!)
  console.clear()
  console.log(colors.green(`login ${wallet.address} succeed!`))
  process.exit(0)
}
