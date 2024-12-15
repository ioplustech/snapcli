/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import colors from 'colors'
import { promises as fs, readFileSync } from 'fs'
import { ethers } from 'ethers'
import { readHomeEnv } from '../../utils'
import { snapcliDebug } from '../prepare/debug'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { appAuthPathKey, appEnvConfigPath, appAuthPath } from '../../constants'
import { checkAddress, checkActiveAddress, checkPrivateKey } from '../checker'

export interface WalletData {
  address: string
  encryptedPrivateKey: string
  iv: string
}

class EncryptedWalletStorage {
  // eslint-disable-next-line no-use-before-define
  static instance: EncryptedWalletStorage

  private readonly filePath: string
  private readonly masterKey: string
  private walletList: ethers.Wallet[] = []
  private activeWallet: ethers.Wallet | undefined

  constructor (filePath: string, masterKey: string = readHomeEnv(appAuthPathKey, appEnvConfigPath)) {
    this.filePath = filePath
    this.masterKey = masterKey
    this.initLoad()
  }

  public static getInstance (filePath: string, masterKey: string): EncryptedWalletStorage {
    if (!EncryptedWalletStorage.instance) {
      EncryptedWalletStorage.instance = new EncryptedWalletStorage(filePath, masterKey)
    }
    return EncryptedWalletStorage.instance
  }

  async addWallet (privateKey: string): Promise<WalletData> {
    checkPrivateKey(privateKey)
    const wallet = new ethers.Wallet(privateKey)
    const { address } = wallet
    checkAddress(address)
    if (!this.walletList.find((wallet) => wallet.address === address)) {
      this.walletList.push(wallet)
    }
    const existingWallet = (await this.getWallets()).find((wallet) => wallet.address === address)
    if (existingWallet) {
      snapcliDebug(`${existingWallet.address} already added!`)
      return existingWallet
    }
    const { encryptedPrivateKey, iv } = this.encryptPrivateKey(privateKey)
    const walletData: WalletData = { address, encryptedPrivateKey, iv }
    await this.saveWalletToFile(walletData)
    return walletData
  }

  async getWallets (): Promise<WalletData[]> {
    const walletDataList = await this.loadWalletsFromFile()
    return walletDataList
  }

  getWallet (force?: boolean): ethers.Wallet {
    if (!this.activeWallet || force) {
      this.activeWallet = this.walletList[this.walletList.length - 1]
    }
    return this.activeWallet
  }

  private async saveWalletToFile (walletData: WalletData): Promise<void> {
    const walletDataList = await this.loadWalletsFromFile()
    const existingWallet = walletDataList.find((wallet) => wallet.address === walletData.address)
    if (existingWallet) {
      existingWallet.encryptedPrivateKey = walletData.encryptedPrivateKey
      existingWallet.iv = walletData.iv
    } else {
      walletDataList.push(walletData)
    }
    const walletDataString = walletDataList.map(({ address, encryptedPrivateKey, iv }) => `${address},${encryptedPrivateKey},${iv}`).join('\n')
    await fs.writeFile(this.filePath, walletDataString)
    snapcliDebug(`saved wallet to ${this.filePath}`)
  }

  async setActiveAddress (address: string): Promise<void> {
    const walletDataList = await this.loadWalletsFromFile()
    checkActiveAddress(address, walletDataList)
    const newList = []
    let hostWa = walletDataList[walletDataList.length - 1]
    for (const wa of walletDataList) {
      if (wa.address === address) {
        hostWa = wa
        continue
      }
      newList.push(wa)
    }
    newList.push(hostWa)
    const walletDataString = newList.map(({ address, encryptedPrivateKey, iv }) => `${address},${encryptedPrivateKey},${iv}`).join('\n')
    await fs.writeFile(this.filePath, walletDataString)
    snapcliDebug(`setActiveAddress to ${this.filePath} succeed!`)
  }

  async delAddress (address: string): Promise<void> {
    const walletDataList = await this.loadWalletsFromFile()
    const newList = []
    for (const wa of walletDataList) {
      if (wa.address === address) {
        continue
      }
      newList.push(wa)
    }
    const walletDataString = newList.map(({ address, encryptedPrivateKey, iv }) => `${address},${encryptedPrivateKey},${iv}`).join('\n')
    await fs.writeFile(this.filePath, walletDataString)
    snapcliDebug(`write new ${this.filePath} succeed!`)
  }

  private async loadWalletsFromFile (): Promise<WalletData[]> {
    try {
      const fileContents = await fs.readFile(this.filePath, 'utf8')
      const walletDataList: WalletData[] = fileContents.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const [address, encryptedPrivateKey, iv] = line.split(',')
        if (!address || !encryptedPrivateKey || !iv) {
          snapcliDebug('loadWalletsFromFile Error: !address || !encryptedPrivateKey || !iv === false')
          console.log(colors.red('\nload local wallet error, please run snapcli clean auth\n'))
          process.exit(1)
          // throw new Error(`loadWallet error!`)
        }
        return { address, encryptedPrivateKey, iv }
      })
      return walletDataList
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  initLoad (): void {
    try {
      const fileContents = readFileSync(this.filePath, 'utf8')
      const walletDataList: WalletData[] = fileContents.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const [address, encryptedPrivateKey, iv] = line.split(',')
        return { address, encryptedPrivateKey, iv }
      })
      const privateKeyList = walletDataList.map((wallet) => this.getPrivateKey(wallet))
      this.walletList = privateKeyList.map((key) => new ethers.Wallet(key))
      snapcliDebug('initLoad walletList succeed!')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      snapcliDebug('initLoad Error: ', (error as Error).message);
      // console.log(colors.red('\nload local wallet error, please run snapcli clean auth\n'))
      // process.exit(1)
    }
  }

  getPrivateKey (walletData: WalletData): string {
    return this.decryptPrivateKey(walletData.encryptedPrivateKey, walletData.iv)
  }

  private encryptPrivateKey (privateKey: string): { encryptedPrivateKey: string, iv: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(this.masterKey), iv)
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex')
    encryptedPrivateKey += cipher.final('hex')
    return { encryptedPrivateKey, iv: iv.toString('hex') }
  }

  private decryptPrivateKey (encryptedPrivateKey: string, iv: string): string {
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(this.masterKey), Buffer.from(iv, 'hex'))
    return decipher.update(encryptedPrivateKey, 'hex', 'utf8') + decipher.final('utf8')
  }
}
const masterKey = readHomeEnv(appAuthPathKey, appEnvConfigPath)

export const walletStorage = EncryptedWalletStorage.getInstance(appAuthPath, masterKey)
