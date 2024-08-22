import colors from 'colors'
import { walletStorage } from '../service/wallet'

export async function listWallets () {
  const list = await walletStorage.getWallets()
  console.log(colors.green('local wallet list:'))
  console.log(list.map((wallet) => wallet.address))
  process.exit(0)
}

export async function activate (address: string) {
  await walletStorage.setActiveAddress(address)
  console.log(colors.green(`activate wallet:${address} succeed`))
  process.exit(0)
}
