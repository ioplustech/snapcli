import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import readline from 'readline'
import os from 'os'
import dotenv from 'dotenv'
import { execSync, type SpawnOptions } from 'child_process'
import spawn from 'cross-spawn'
import { AbortController } from 'node-abort-controller'
import { snapcliDebug } from '../main/prepare/debug'
import { appAuthPath, appConfigPath } from '../constants'
import pkg from '../../package.json'
import path from 'path'
import ora, { type Ora } from 'ora'
import crypto from 'crypto'
import { ethers } from 'ethers'

import { ensureDirSync, ensureFileSync, readFileSync, writeFileSync } from 'fs-extra'
import { argv } from '../main/prepare/arg'

export const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 ',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Android 9; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
]

// Types
interface ConfirmResult {
  confirm: boolean
  answer: string
  close: () => void
}

interface ProcessResult {
  stdout: string
  stderr: string
}

interface EncryptResult {
  iv: string
  encryptedData: string
}

// Utility Functions
export const confirmReadline = async (
  question: string,
  passReg: RegExp = /y/gim
): Promise<ConfirmResult> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return await new Promise((resolve, reject) => {
    rl.on('error', (err) => {
      console.error("readline error:", err);
      reject(new Error(`readline error: ${err.message}`));
      rl.close();
    });
    rl.question(question, (answer: string) => {
      const confirm = passReg.test(answer) || answer === ''
      resolve({ confirm, answer, close: () => { rl.close() } })
    })
  })
}

export const asyncSleep = async (ms: number): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, ms)) }

export const randomUserAgent = (): string =>
  DEFAULT_USER_AGENTS[Math.floor(Math.random() * DEFAULT_USER_AGENTS.length)]

export const fetchApi = async (
  apiUrl: string,
  method = 'GET',
  params: Record<string, any> = {},
  body: Record<string, any> = {}
): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': randomUserAgent(),
    ...params.headers,
    ...body.headers
  }

  delete params.headers
  delete body.headers

  const options: AxiosRequestConfig = {
    method,
    headers,
    params,
    data: body,
    signal: params.signal
  }

  const response: AxiosResponse = await axios(apiUrl, options)
  return response.data
}

export const fetchApiWithTimeout = async (
  apiUrl: string,
  method = 'GET',
  params: Record<string, any> = {},
  body: Record<string, any> = {},
  timeout: number
): Promise<any> => {
  const spinner = ora('Checking Chaty version...').start()

  try {
    const controller = new AbortController()
    params.signal = controller.signal

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        controller.abort()
        reject(new Error('Request timed out'))
      }, timeout)
    })

    const fetchPromise = fetchApi(apiUrl, method, params, body)

    const result = await Promise.race([fetchPromise, timeoutPromise])
    spinner.succeed('Chaty version check succeeded')
    return result
  } catch (error) {
    spinner.fail('Chaty version check failed')
    snapcliDebug(`Check Chaty version error: ${(error as Error).message}`)
    throw error
  }
}

export const runChildProcess = (
  name: string,
  execPath: string,
  args: string[],
  options: SpawnOptions
): ReturnType<typeof spawn> => {
  const childProcess = spawn(execPath, args, options)
  snapcliDebug(`runChildProcess: ${name}, pid: ${childProcess.pid!}`)

  childProcess.stdout?.on('data', (data) => { console.log(data.toString()) })
  childProcess.stderr?.on('data', (data) => { console.error(data.toString()) })
  childProcess.on('exit', (code) => { snapcliDebug(`childProcess.on('exit'): ${name}, code: ${code ?? ''}`) }
  )

  return childProcess
}

export const runChildPromise = async (
  name: string,
  execPath: string,
  args: string[],
  options: SpawnOptions
): Promise<string> => await new Promise((resolve, reject) => {
  const childProcess = spawn(execPath, args, options)
  snapcliDebug(`runChildProcess: ${name}, pid: ${childProcess.pid!}`, execPath, args)

  let output = ''
  let errorOutput = ''

  childProcess.stdout?.on('data', (data: Buffer | string) => {
    output += data.toString()
    console.log(data.toString())
  })

  childProcess.stderr?.on('data', (data: Buffer | string) => {
    errorOutput += data.toString()
  })

  childProcess.on('exit', (code) => {
    snapcliDebug(`childProcess.on('exit'): ${name}, code: ${code ?? ''}`)
    snapcliDebug('output', output)
    if (code !== 0) {
      snapcliDebug('errorOutput', errorOutput)
    }
    resolve(output)
  })

  childProcess.on('error', (err) => {
    snapcliDebug(`childProcess.on('error'): ${name},`, err)
    reject(err)
  })
})

export const runProcess = async (
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
  showLog = false
): Promise<ProcessResult> => await new Promise((resolve, reject) => {
  const process = spawn(command, args, options)
  let stdout = ''
  let stderr = ''

  process.stdout?.on('data', (data: Buffer) => {
    stdout += data.toString()
    if (showLog) console.log(`stdout: ${data.toString()}`)
  })

  process.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString()
    if (showLog) console.error(`stderr: ${data.toString()}`)
  })

  process.on('close', (code: number | null) => {
    if (code === 0) {
      resolve({ stdout, stderr })
    } else {
      reject(new Error(`Process exited with code ${code ?? ''}\nstderr: ${stderr}`))
    }
  })

  process.on('error', (err: Error) => {
    reject(new Error(`Failed to start process: ${err.message}`))
  })
})

export const runChildProcessSync = (execStr: string, options: any): void => {
  try {
    const res = execSync(execStr, options)
    snapcliDebug(res.toString())
  } catch (err) {
    console.error(err)
  }
}

export const writeHomeEnv = (prop: string, value: string): void => {
  const destEnvPath = path.resolve(appConfigPath, '.env')
  ensureFileSync(destEnvPath)
  const destKey = dotenv.parse(readFileSync(destEnvPath, 'utf-8'))
  destKey[prop] = value
  const newContent = Object.entries(destKey)
    .map(([key, val]) => `${key}=${val}`)
    .join(os.EOL)
  writeFileSync(destEnvPath, newContent, 'utf-8')
}

export const spinnerStart = (loadingMsg = 'loading'): Ora => ora({
  text: `${loadingMsg}...`,
  spinner: {
    interval: 80,
    frames: '|/-\\'.split('')
  }
}).start()

export const isValidUrl = (urlStr: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(urlStr)
    return true
  } catch (e) {
    return false
  }
}

export const readHomeEnv = (prop: string, envPath: string): string => {
  if (!prop || !envPath) throw new Error('prop and envPath are required!')
  const envConfig = dotenv.parse(readFileSync(envPath, 'utf-8'))
  return envConfig[prop]
}

export const generateKey = (): string => crypto.randomBytes(16).toString('hex')

export const encrypt = (text: string, key: string): EncryptResult => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

export const decrypt = (iv: string, encryptedData: string, key: string): string => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'))
  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'))
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export const writeHomeAuth = (prop: string, value: string): void => {
  ensureFileSync(appAuthPath)
  const destKey = dotenv.parse(readFileSync(appAuthPath, 'utf-8'))
  destKey[prop] = value
  const newContent = Object.entries(destKey)
    .map(([key, val]) => `${key}=${val}`)
    .join(os.EOL)
  writeFileSync(appAuthPath, newContent, 'utf-8')
}

export const writeJSON = (filePath: string, json: any): void => {
  writeFileSync(filePath, JSON.stringify(json, null, 2))
}

export const writeTmpJSON = (name: string, json: any): void => {
  const tmpDir = path.resolve(appConfigPath, 'tmp')
  ensureDirSync(tmpDir)
  const filePath = path.resolve(tmpDir, `${name}.json`)
  writeJSON(filePath, json)
}

export const debugLog = (name: string, json: any): void => {
  if (argv.debug || argv.d) {
    snapcliDebug(`debugLog: ${name}`)
    writeTmpJSON(name, json)
  }
}

export const pkgName = pkg?.name?.includes('/') ? pkg?.name?.split('/')[1] : pkg?.name

const ethereum = {
  https:
    'https://rpc.flashbots.net',
  // https: "https://eth-mainnet.public.blastapi.io/",
  websocket: '',
  apiList: [
    'https://eth.meowrpc.com',
    'https://eth.llamarpc.com',
    'https://rpc.lokibuilder.xyz',
    'https://eth.merkle.io',
    'https://rpc.payload.de',
    'https://rpc.ankr.com/eth',
    'https://ethereum-rpc.publicnode.com',
    'https://1rpc.io/eth',
    'https://rpc.mevblocker.io',
    'https://rpc.flashbots.net',
    'https://eth.drpc.org',
    'https://eth.merkle.io'
  ]
}

export const getProvider = (chainId?: number): ethers.providers.JsonRpcProvider => {
  const { apiList } = ethereum
  return new ethers.providers.JsonRpcProvider(apiList[Math.trunc(Math.random() * apiList.length)])
}

export const getDelegation = async (safeAddress: string): Promise<string> => {
  const delegatorAddress = '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446'
  const ABI = [
    'function delegation(address input, bytes32 safeBytes) view returns (address delegator)'
  ]
  const delegatorContract = new ethers.Contract(delegatorAddress, ABI, getProvider())
  const delegator = await delegatorContract.delegation(safeAddress, ethers.utils.formatBytes32String('safe.eth'))
  return delegator
}
