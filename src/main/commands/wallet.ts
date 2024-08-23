import colors from 'colors'
import { walletStorage } from '../service/wallet'

export async function listWallets () {
  const list = await walletStorage.getWallets()
  console.log(colors.green('wallet list:'))
  const addressList = list.map((wallet) => wallet.address)
  console.log(addressList)
  console.log(colors.green(`active: ${addressList[addressList.length - 1]}`))
  process.exit(0)
}

export async function useWallet (address: string) {
  await walletStorage.setActiveAddress(address)
  console.log(colors.green(`useWallet: ${address} succeed`))
  process.exit(0)
}
export async function delWallet (address: string) {
  await walletStorage.delAddress(address)
  console.log(colors.green(`delete: ${address} succeed`))
  process.exit(0)
}
