import { debugLog, spinnerStart } from '../../utils'
import { snapcliDebug } from '../prepare/debug'
import { walletStorage } from '../service/wallet'
import { snapshot } from '../service/snapshot'
import { checkProposals, checkScore, checkWallets } from '../checker'
import { type Command } from 'commander'
import colors from 'colors'
import { argv } from '../prepare/arg'

export interface Proposal {
  id: 'string'
  title: 'string'
  start: number
  end: number
  state: 'string'
  space: {
    id: 'string'
    name: 'string'
    avatar: 'string'
  }
}

export async function voteProposals(proposals: Proposal[], noExit = true) {
  for (const proposal of proposals) {
    const proposalDetailSpin = spinnerStart(`start to get proposal detail [${proposal.title}]...`)
    const proposalDetail = await snapshot.getProposalDetail(proposal.id, proposal.title)
    debugLog('proposalDetail', proposalDetail)
    proposalDetailSpin.succeed('get proposal detail succeed!')
    if (noExit) { walletStorage.initLoad() }
    const checkVotedSpin = spinnerStart(`start to checkVoted [${proposal.title}]...`)
    const voted = await snapshot.checkVoted(proposalDetail, walletStorage.getWallet(noExit).address)
    checkVotedSpin.succeed('checkVoted succeed!')
    if (voted.length) {
      const { choice, reason } = voted[0]
      console.log(`voted: choice: ${choice}, reason: ${reason}`)
      if (!argv.forceVote) {
        console.log('skip voted!\n')
        continue
      }
    }

    const checkScoreSpin = spinnerStart(`start to checkScore [${proposal.title}]...`)
    const score = await snapshot.checkScore(proposalDetail, walletStorage.getWallet().address)
    checkScore(score, checkScoreSpin)
    checkScoreSpin.succeed(`checkScore: ${colors.green(String(score as number))} succeed!`)

    console.log(colors.yellow(`start to vote with: ${proposal?.space?.id} - ${proposal?.title} ${score as number}`))
    let choice: number | number[]
    if (argv.accept) {
      debugLog('specify --accept:', argv.accept)
      choice = 1
    }
    if (argv.refuse) {
      debugLog('specify --refuse:', argv.refuse)
      choice = 2
    }
    let reason = ''
    if (choice! === undefined) {
      const { choice: inputChoice, reason: inputReason } = await snapshot.getChoice(proposalDetail)
      choice = inputChoice
      reason = inputReason
    }
    const data = {
      address: walletStorage.getWallet().address,
      proposal: proposalDetail,
      choice,
      reason
    }
    debugLog('voteData', data)
    const voteSpin = spinnerStart(`start to vote [${proposal.title}]...`)
    const id = await snapshot.vote(data)
    debugLog('voteId', id)
    voteSpin.succeed(`[${walletStorage.getWallet().address}]vote: ${id as string} succeed!\n`)
  }
  if (!noExit) {
    process.exit(0)
  }
}

export async function runVoteAllService(space: string, opts: Record<string, string>, command: Command) {
  snapcliDebug('runVoteAllService...')
  snapcliDebug('opts', opts)

  const getProposalsSpin = spinnerStart('start to getProposals...')
  const proposals = await snapshot.getProposals(space)
  checkProposals(proposals, getProposalsSpin)
  debugLog('proposals', proposals)
  getProposalsSpin.succeed(`getProposals ${colors.green(String((proposals as string[]).length))} succeed!`)

  const wallets = await walletStorage.getWallets()
  checkWallets(wallets)
  const walletAddressList = wallets.map((wa) => wa.address)
  const currentActive = walletAddressList[walletAddressList.length - 1]

  while (walletAddressList.length) {
    const active = walletAddressList.pop()!
    await walletStorage.setActiveAddress(active)
    console.log('set active:', active)
    await voteProposals(proposals, true)
  }
  console.log('voted all finished!')
  await walletStorage.setActiveAddress(currentActive)
}
