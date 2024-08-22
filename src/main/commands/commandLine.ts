import { confirmReadline } from '../../utils'

export const commandLine = async (prompt: string, continueFn?: (ans: string) => boolean) => {
  let stop = false
  while (!stop) {
    const { answer } = await confirmReadline(prompt)
    if (answer.trim() === '' || continueFn?.(answer.trim())) {
      continue
    }
    stop = true
    // close
    return answer
  }
}
