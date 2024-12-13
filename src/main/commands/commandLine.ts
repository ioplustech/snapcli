import { confirmReadline } from '../../utils'
import readline from 'readline'

export const commandLine = async (prompt: string, continueFn?: (ans: string) => boolean, allowEmpty: boolean = false) => {
  let stop = false
  while (!stop) {
    const { answer, close } = await confirmReadline(prompt)
    if ((answer.trim() === '' && !allowEmpty) || continueFn?.(answer.trim())) {
      close()
      continue
    }
    stop = true
    close()
    return answer
  }
}
