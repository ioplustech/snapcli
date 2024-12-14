import commander from 'commander'
import type { Command as CommandOptions } from 'commander'
import colors from 'colors'
import pkg from '../../../package.json'
import { runVoteService } from '../commands/runVoteService'
import { runVoteAllService } from '../commands/runVoteAllService'
import { loginWithPrivateKey, loginWithKeystore } from './login'
import { cleanItem } from '../commands/clean'
import { listWallets, useWallet, delWallet } from '../commands/wallet'
import { updateCLI } from '../commands/updater'
// import { setProxy } from '../commands/proxy'
import { checkBeforeAction } from './checker'
import { snapcliDebug } from './debug'
import { checkSpace, checkClean } from '../checker'

const program = new commander.Command()

const setupProgram = () => {
  program
    .name(colors.green(Object.keys(pkg.bin)[0]))
    .usage(colors.yellow('<command> [options]'))
    .version(pkg.version)
    .description('Command-line tool for casting votes on Snapshot.org DAO proposals directly from your terminal.')
    .option('-d, --debug', 'show debug log', false)
}

const setupCommands = () => {
  program
    .command('login [privateKey]')
    .description('login with private key. Then you no need specify --privateKey anymore')
    .action(async (key) => {
      snapcliDebug('login with privateKey')
      await loginWithPrivateKey(key)
    })

  program
    .command('loginKeystore <keyStore> <password>')
    .description('login with keystore. input your keyStore file path or keyStore json and password')
    .action(async (keyStore, password) => {
      snapcliDebug('login with loginKeystore')
      console.log(keyStore, password)
      await loginWithKeystore(keyStore, password)
    })

  program
    .command('listWallets')
    .alias('list')
    .description('list your saved wallets and active wallet')
    .action(async () => {
      snapcliDebug('listWallets')
      await listWallets()
    })

  program
    .command('use [address]')
    .description('use wallet address')
    .action(async (address) => {
      snapcliDebug('use:', address)
      await useWallet(address)
    })

  program
    .command('del [address]')
    .alias('delete')
    .description('delete wallet address')
    .action(async (address) => {
      snapcliDebug('delete:', address)
      await delWallet(address)
    })

  program
    .command('vote [space]')
    .description('vote for specify space,like <aave.eth> You can find your spaces at https://snapshot.org/#/.')
    .option('-y, --yes', 'vote without confirm')
    .option('--refuse', 'refuse vote')
    .option('--accept', 'accept vote')
    .option('--forceVote', 'force vote')
    .option('--privateKey <privateKey>', 'input your private key')
    .action(async (space: string, options, command: CommandOptions) => {
      snapcliDebug('run:', space, options)
      checkSpace(space)
      await checkBeforeAction()
      await runVoteService(space, options, command)
    })

  program
    .command('voteAll [space]')
    .description('vote all wallets for specify space,like <aave.eth> You can find your spaces at https://snapshot.org/#/.')
    .option('-y, --yes', 'vote without confirm')
    .option('--refuse', 'refuse vote')
    .option('--accept', 'accept vote')
    .option('--forceVote', 'force vote')
    .option('--privateKey <privateKey>', 'input your private key')
    .action(async (space: string, options, command: CommandOptions) => {
      snapcliDebug('run:', space, options)
      checkSpace(space)
      await checkBeforeAction()
      await runVoteAllService(space, options, command)
    })

  program
    .command('clean [item]')
    .description('clean local settings')
    .action((item) => {
      snapcliDebug('clean:', item)
      checkClean(item)
      cleanItem(item)
    })

  program
    .command('update')
    .alias('u')
    .description('update snapcli')
    .action(async () => {
      snapcliDebug('update cli')
      await updateCLI()
    })
}

const setupEventHandlers = () => {
  program.on('option:debug', () => {
    process.env.LOG_LEVEL = program.opts().debug ? 'verbose' : 'info'
  })

  program.on('command:*', (obj: string[]) => {
    const availableCommands = program.commands.map((command) => command.name())
    if (!availableCommands.includes(obj[0])) {
      console.log(colors.red(`[Error]Unknown command: ${obj[0]}`))
      console.log(colors.green(`Available commands: ${availableCommands.join(',')}`))
      process.exit(1)
    }
  })
}

export async function register () {
  setupProgram()
  setupCommands()
  setupEventHandlers()

  program.parse(process.argv)

  if (program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}
