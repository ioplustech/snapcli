import { ethers } from 'ethers'
import { commandLine } from '../commands'
import { walletStorage } from '../service/wallet'
import colors from 'colors'

export const runLogin = async (privateKey?: string) => {
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
  console.log(colors.green(`login ${wallet.address} succeed!`))
  process.exit(0)
}
