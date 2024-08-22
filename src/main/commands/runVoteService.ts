import { debugLog, spinnerStart } from '../../utils'
import { snapcliDebug } from '../prepare/debug'
import { walletStorage } from '../service/wallet'
import { snapshot } from '../service/snapshot'
import { checkProposals, checkScore, checkWallets } from '../checker'
import { type Command } from 'commander'
import colors from 'colors'

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

export async function voteProposals (proposals: Proposal[]) {
  for (const proposal of proposals) {
    const proposalDetailSpin = spinnerStart(`starting to getProposalDetail [${proposal.title}]...`)
    const proposalDetail = await snapshot.getProposalDetail(proposal.id, proposal.title)
    debugLog('proposalDetail', proposalDetail)
    proposalDetailSpin.succeed('getProposalDetail succeed!')

    const checkScoreSpin = spinnerStart(`starting to checkScore [${proposal.title}]...`)
    const score = await snapshot.checkScore(proposalDetail, walletStorage.getWallet().address)
    checkScore(score, checkScoreSpin)
    checkScoreSpin.succeed(`checkScore: ${colors.green(String(score as number))} succeed!`)

    console.log(colors.yellow(`starting to vote with: ${proposal?.space?.id} - ${proposal?.title} ${score as number}`))
    const choice = await snapshot.getChoice(proposalDetail)
    const data = {
      address: walletStorage.getWallet().address,
      proposal: proposalDetail,
      choice
    }
    debugLog('voteData', data)
    const voteSpin = spinnerStart(`starting to vote [${proposal.title}]...`)
    const id = await snapshot.vote(data)
    debugLog('voteId', id)
    voteSpin.succeed(`vote: ${id as string} succeed!\n`)
  }
  process.exit(0)
}

export async function runVoteService (space: string, opts: Record<string, string>, command: Command) {
  snapcliDebug('runVoteService...')
  snapcliDebug('opts', opts)

  const getProposalsSpin = spinnerStart('starting to getProposals...')
  const proposals = await snapshot.getProposals(space)
  checkProposals(proposals, getProposalsSpin)
  debugLog('proposals', proposals)
  getProposalsSpin.succeed(`getProposals ${colors.green(String((proposals as string[]).length))} succeed!`)

  const wallets = await walletStorage.getWallets()
  checkWallets(wallets)
  await voteProposals(proposals)
}
