import { ChoiceAndReason } from '../../types'
import { retryRequest } from '../../utils'
import AxiosFetchWrapper from '../../utils/fetch'
import { commandLine } from '../commands'
import { snapcliDebug } from '../prepare/debug'
import { walletStorage } from './wallet'
import colors from 'colors'

const headers = {
  'Accept-Encoding': 'gzip,deflate,compress',
  'content-type': 'application/json',
  authority: 'hub.snapshot.org',
  origin: 'https://snapshot.org',
  referer: 'https://snapshot.org/'
}
class SnapshotService {
  apiBase: string
  fetcher: AxiosFetchWrapper
  proposalCache: Record<string, any> = {}
  constructor() {
    this.apiBase = 'https://hub.snapshot.org/graphql'
    this.fetcher = new AxiosFetchWrapper(this.apiBase)
  }

  async getProposals(space: string) {
    const data = {
      operationName: 'Proposals',
      variables: {
        first: 100,
        state: 'active',
        space_in: [space],
        start_gte: Math.floor(Date.now() / 1000 - 2 * 7 * 24 * 60 * 60)
      },
      query: `query Proposals($first: Int!, $state: String!, $space_in: [String], $start_gte: Int) {
          proposals(
            first: $first
            where: {state: $state, space_in: $space_in, start_gte: $start_gte}
          ) {
            id
            title
            start
            end
            state
            space {
              id
              name
              avatar
            }
          }
        }`
    }
    snapcliDebug(`fetching proposals of ${space}`)
    if (!this.proposalCache[space]) {
      const proposalsRes = await retryRequest(async () => await this.fetcher.post('/', data, { headers }))

      // console.log('proposalsRes:', proposalsRes?.data?.proposals)
      this.proposalCache[space] = proposalsRes?.data?.proposals
    }
    return this.proposalCache[space]
  }

  async getProposalDetail(id: string, name: string) {
    const data = {
      operationName: 'Proposal',
      query: `query Proposal($id: String!) {
        proposal(id: $id) {
          id
          ipfs
          title
          body
          discussion
          choices
          start
          end
          snapshot
          state
          author
          created
          plugins
          network
          type
          quorum
          symbol
          privacy
          validation {
            name
            params
          }
          strategies {
            name
            network
            params
          }
          space {
            id
            name
          }
          scores_state
          scores
          scores_by_strategy
          scores_total
          votes
        }
      }
      `,
      variables: {
        id
      }
    }
    snapcliDebug(`fetching proposal detail of ${name}...`)
    if (!this.proposalCache[id]) {
      const proposalRes = await retryRequest(async () => await this.fetcher.post('/', data, { headers }))

      this.proposalCache[id] = proposalRes?.data?.proposal
    }
    return this.proposalCache[id]
  }

  async checkScore(proposal: any, address: string) {
    const apiUrl = 'https://score.snapshot.org/'
    const data = {
      id: null,
      jsonrpc: '2.0',
      method: 'get_vp',
      params: {
        address: `${address}`,
        network: proposal.network,
        strategies: proposal.strategies,
        snapshot: Number(proposal.snapshot),
        space: proposal.space.id,
        delegation: false
      }
    }
    snapcliDebug(`fetching checkScore of ${address}...`)
    const scoreRes = await retryRequest(async () => await this.fetcher.post(apiUrl, data, { headers }))
    const vp = scoreRes?.result?.vp
    return vp
  }

  async checkVoted(proposal: any, address: string) {
    const data = {
      operationName: 'Votes',
      variables: {
        id: proposal.id,
        orderBy: 'vp',
        orderDirection: 'desc',
        first: 1,
        voter: address,
        space: proposal.space.id
      },
      query: `query Votes($id: String!, $first: Int, $skip: Int, $orderBy: String, $orderDirection: OrderDirection, $voter: String, $space: String) {
        votes(
          first: $first
          skip: $skip
          where: {proposal: $id, vp_gt: 0, voter: $voter, space: $space}
          orderBy: $orderBy
          orderDirection: $orderDirection
        ) {
          ipfs
          voter
          choice
          vp
          vp_by_strategy
          reason
          created
        }
      }`
    }
    snapcliDebug(`fetching checkVoted of ${address}...`)
    const voteRes = await retryRequest(async () => await this.fetcher.post('/', data, { headers }))

    const votes = voteRes?.data?.votes
    // console.log('scoreRes:', vp)
    return votes
  }

  async sendVoteRequest(data: any) {
    const apiUrl = 'https://seq.snapshot.org/'

    snapcliDebug(`fetching sendVoteRequest of ${data.address as string}...`)
    const voteRes = await retryRequest(async () => await this.fetcher.post(apiUrl, data, { headers }))
    const id = voteRes?.id
    return id
  }

  async getSignature(signData: any) {
    const { domain, types, message } = signData.data
    const signer = walletStorage.getWallet()
    const sig = await signer._signTypedData(domain, types, message)
    return sig
  }

  async getChoice(proposalDetail: any): Promise<ChoiceAndReason> {
    const { type, choices } = proposalDetail
    let __choice: number | number[]
    let __reason = ''
    let prompt = 'please choose which your want to vote then press enter!'
    const choicesPrompt = `${(choices as string[]).map((choice: string, index: number) => `(${index + 1})${choice}`).join(' ')}: `
    if (type === 'single-choice') {
      console.log(colors.green(prompt))
      const choice = await commandLine(choicesPrompt)
      __choice = parseInt(choice!)
    }
    if (type === 'approval') {
      prompt = 'please choose which your want to vote(multiple choose with comma, like 1,2,3) then press enter!'
      console.log(colors.green(prompt))
      const choice = await commandLine(choicesPrompt)
      const choiceList = choice!.split(',').map((str: string) => str.trim()).filter(Boolean).map((str: string) => parseInt(str))
      __choice = choiceList
    }
    if (!__choice!) {
      __choice = await Promise.resolve(1)
    }
    prompt = 'please input your reason why vote this!'
    console.log(colors.green(prompt))
    __reason = await commandLine('Your reason: ', (str: string) => false, true) || ''
    return {
      choice: __choice,
      reason: __reason,
    }
  }

  async vote(data: any) {
    const { address, proposal, choice, reason = '' } = data
    const submitBody = {
      address,
      data: {
        domain: {
          name: 'snapshot',
          version: '0.1.4'
        },
        types: {
          Vote: [
            {
              name: 'from',
              type: 'address'
            },
            {
              name: 'space',
              type: 'string'
            },
            {
              name: 'timestamp',
              type: 'uint64'
            },
            {
              name: 'proposal',
              type: 'bytes32'
            },
            {
              name: 'choice',
              type: proposal.type === 'single-choice' ? 'uint32' : 'uint32[]'
            },
            {
              name: 'reason',
              type: 'string'
            },
            {
              name: 'app',
              type: 'string'
            },
            {
              name: 'metadata',
              type: 'string'
            }
          ]
        },
        message: {
          space: proposal?.space?.id,
          proposal: proposal?.id,
          choice,
          app: 'snapshot',
          reason,
          from: address,
          metadata: '{}',
          timestamp: Math.floor(Date.now() / 1000)
        }
      }
    };
    (submitBody as any).sig = await this.getSignature(submitBody)
    snapcliDebug(`get signature: ${data.sig as string} succeed!`)
    const id = await this.sendVoteRequest(submitBody)
    return id
  }
}

export const snapshot = new SnapshotService()
