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
import ora from 'ora'
import crypto from 'crypto'
import { ethers } from 'ethers'

import { ensureDirSync, ensureFileSync, readFileSync, writeFileSync } from 'fs-extra'
import { argv } from '../main/prepare/arg'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const confirmReadline = async (
  question: string,
  passReg: RegExp = /y/gim
): Promise<any> => await new Promise((resolve) => {
  rl.question(question, (answer: string) => {
    if (passReg.test(answer) || answer === '' /* enter key */) {
      resolve({ confirm: true, answer, close: () => { rl.close() } }); return
    }
    resolve({ confirm: false, answer, close: () => { rl.close() } })
  })
})
export const asyncSleep = async (number: number) => {
  await new Promise((resolve) => {
    setTimeout(resolve, number)
  })
}
export const defaultUserAgent = [
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
export const randomUserAgent = () => defaultUserAgent[Math.trunc(Math.random() * defaultUserAgent.length)]
export const fetchApi = async (
  apiUrl: string,
  method = 'GET',
  params: any,
  body: any
) => {
  let defineHeaders = {}
  let type: any = { 'Content-Type': 'application/json' }
  if (
    (params?.type && params.type !== 'json') ||
    (body?.type && body.type !== 'json')
  ) {
    type = {}
  }
  if (params?.headers) {
    defineHeaders = { ...defineHeaders, ...params.headers }
    delete params.headers
  }
  if (body?.headers) {
    defineHeaders = { ...defineHeaders, ...body.headers }
    delete body.headers
  }
  if (params) delete params.type
  if (body) delete body.type
  const headers = {
    ...type,
    ...defineHeaders,
    'User-Agent': randomUserAgent()
  }
  const options: AxiosRequestConfig = {
    method,
    headers,
    params: { null: null },
    data: { null: null }
  }
  if (params) options.params = params
  if (body) options.data = body
  if (params?.signal) {
    options.signal = params?.signal
  }
  return await axios(apiUrl, options).then((res: AxiosResponse) => res.data)
}

export const fetchApiWithTimeout = async (
  apiUrl: string,
  method = 'GET',
  params: any,
  body: any,
  timeout: string | number
) => await new Promise((resolve, reject) => {
  const start = ora('start to check chaty version...').start()
  try {
    const controller = new AbortController()
    if (params) {
      params.signal = controller.signal
    }
    const timer = setTimeout(() => {
      start.stop()
      controller.abort()
      resolve('timeout')
      snapcliDebug('check chaty version timeout')
    }, Number(timeout))
    fetchApi(apiUrl, method, params, body)
      .then((res) => {
        start.succeed('check chaty version succeed')
        resolve(res)
      })
      .catch((err) => {
        snapcliDebug(`check chaty version error: ${(err as Error).message}`)
        start.stop()
        reject(err)
      })
      .finally(() => {
        clearTimeout(timer)
      })
  } catch (err) {
    snapcliDebug((err as Error).message)
    snapcliDebug('check chaty version error')
    start.stop()
    reject(err)
  }
})

export const runChildProcess = (
  name: string,
  execPath: string,
  args: string[],
  options: any
) => {
  const childProcess = spawn(execPath, args, options)
  snapcliDebug(`runChildProcess: ${name}, pid: ${String(childProcess.pid)}`)
  childProcess.stdout?.on('data', (data) => {
    console.log(data.toString())
  })
  childProcess.stderr?.on('data', (data) => {
    console.log(data.toString())
  })
  childProcess.on('exit', (code) => {
    snapcliDebug(`childProcess.on('exit'): ${name}, data: ${String(code)}`)
  })
  return childProcess
}
export const runChildPromise = async (
  name: string,
  execPath: string,
  args: string[],
  options: any
) => await new Promise((resolve, reject) => {
  const childProcess = spawn(execPath, args, options)
  snapcliDebug(`runChildProcess: ${name}, pid: ${String(childProcess.pid)}`, execPath, args)
  let output = ''
  childProcess.stdout?.on('data', (data) => {
    output += data.toString() as string
    console.log(data.toString() as string)
  })
  let errorOut = ''
  childProcess.stderr?.on('data', (data) => {
    errorOut += data.toString() as string
  })
  childProcess.on('exit', (code) => {
    snapcliDebug(`childProcess.on('exit'): ${name}, data: ${String(code)}`)
    snapcliDebug('output', output)
    if (code !== 0) {
      snapcliDebug('errorOut', errorOut)
    }
    resolve(output)
  })
  childProcess.on('error', (err) => {
    snapcliDebug(`childProcess.on('error'): ${name},`, err)
    reject(err)
  })
  return childProcess
})
interface ProcessResult {
  stdout: string
  stderr: string
}

/**
 * Runs a command in a child process using spawn.
 * @param command - The command to run.
 * @param args - An array of arguments to pass to the command.
 * @param options - Options to pass to spawn.
 * @returns A promise that resolves with stdout and stderr strings.
 */
export async function runProcess (command: string, args: string[] = [], options: SpawnOptions = {}, showLog = false): Promise<ProcessResult> {
  return await new Promise((resolve, reject) => {
    const process = spawn(command, args, options)

    let stdout = ''
    let stderr = ''

    process.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString()
      showLog && console.log(`stdout: ${data.toString()}`)
    })

    process.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
      showLog && console.error(`stderr: ${data.toString()}`)
    })

    process.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`Process exited with code ${String(code)}\nstderr: ${stderr}`))
      }
    })

    process.on('error', (err: Error) => {
      reject(new Error(`Failed to start process: ${err.message}`))
    })
  })
}
export const runChildProcessSync = (execStr: string, options: any) => {
  try {
    const res = execSync(execStr, options)
    snapcliDebug(res.toString())
  } catch (err) {
    console.log(err)
  }
}
export const writeHomeEnv = function (prop: string, value: string) {
  const destEnvPath = path.resolve(appConfigPath, '.env')
  ensureFileSync(destEnvPath)
  const destKey = dotenv.parse(readFileSync(destEnvPath, 'utf-8'))
  destKey[prop] = value
  let newContent = ''
  for (const line in destKey) {
    const content = `${os.EOL}${line}=${destKey[line]}${os.EOL}`
    newContent += content
  }
  writeFileSync(destEnvPath, newContent, 'utf-8')
}

export function spinnerStart (loadingMsg = 'loading') {
  const spinner = ora({
    text: `${loadingMsg}...`,
    spinner: {
      interval: 80,
      frames: '|/-\\'.split('')
    }
  }).start()
  return spinner
}
export const isValidUrl = (urlStr: string) => {
  try {
    return Boolean(new URL(urlStr))
  } catch (e) {
    return false
  }
}
export const readHomeEnv = (prop: string, envPath: string) => {
  if (!prop || !envPath) throw new Error('prop and envPath are needed!')
  const envConfig = dotenv.parse(readFileSync(envPath, 'utf-8'))
  return envConfig[prop]
}

export function generateKey () {
  return crypto.randomBytes(16).toString('hex')
}

export function encrypt (text: string, key: string) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

export function decrypt (_iv: string, _encryptedData: string, key: string) {
  const iv = Buffer.from(_iv, 'hex')
  const encryptedText = Buffer.from(_encryptedData, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export const writeHomeAuth = function (prop: string, value: string) {
  ensureFileSync(appAuthPath)
  const destKey = dotenv.parse(readFileSync(appAuthPath, 'utf-8'))
  destKey[prop] = value
  let newContent = ''
  for (const line in destKey) {
    const content = `${os.EOL}${line}=${destKey[line]}${os.EOL}`
    newContent += content
  }
  writeFileSync(appAuthPath, newContent, 'utf-8')
}

export const wirteJSON = (path: string, json: any) => {
  writeFileSync(path, JSON.stringify(json, null, 2))
}

export const writeTmpJSON = (name: string, json: any) => {
  const tmpDir = path.resolve(appConfigPath, 'tmp')
  ensureDirSync(tmpDir)
  const p = path.resolve(tmpDir, `${name}.json`)
  wirteJSON(p, json)
}

export const debugLog = (name: string, json: any) => {
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
