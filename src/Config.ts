import fs from 'fs'
import { A, D, F, G, O, flow, pipe } from '@mobily/ts-belt'
import { question, select } from '@topcli/prompts'
import chalk from 'chalk'
import * as Decorator from './Decorator'
import * as Step from './Step'
import { STEPS_KIND, STEPS_VARIANT } from './Step.Preset'

export type t = {
  steps: (STEPS_VARIANT | Step.t)[]
  unSafeBranchList: string[]
  sourceDir: string[]
  verbose: boolean
}

const CONFIG_PATH = 'tstw.config.json'

const fromJSONString = (json: string): O.Option<t> => {
  const parsedJSON = JSON.parse(json)
  const getArrayField = <T>(fieldName: string): O.Option<T[]> =>
    pipe(
      parsedJSON,
      D.get(fieldName),
      O.fromNullable,
      O.flatMap(O.fromPredicate(G.isArray))
    )

  const steps: [STEPS_VARIANT | [STEPS_VARIANT, string]][] = pipe(
    'steps',
    getArrayField,
    O.flatMap(
      O.fromPredicate(
        A.every((x) => {
          if (typeof x === 'string') STEPS_KIND.includes(x)
          else if (typeof x === 'object') return STEPS_KIND.includes(x[0])
        })
      )
    )
  ) as [STEPS_VARIANT | [STEPS_VARIANT, string]][]

  const unSafeBranchList = getArrayField<string>('unSafeBranchList')
  const sourceDir = getArrayField<string>('sourceDir')
  const verbose = pipe(
    parsedJSON.verbose,
    O.fromNullable,
    O.flatMap(O.fromPredicate(G.isBoolean)),
    O.getWithDefault(false)
  )

  return pipe(
    steps,
    O.flatMap((steps) =>
      pipe(
        unSafeBranchList,
        O.flatMap((unSafeBranchList) =>
          pipe(
            sourceDir,
            O.map((sourceDir) => ({
              steps,
              unSafeBranchList,
              sourceDir,
              verbose
            }))
          )
        )
      )
    )
  )
}

const toJson = (config: t): string => {
  return JSON.stringify(config)
}

const writeToFile = async (configJSON: string) => {
  Decorator.Line(`Writing config to ${CONFIG_PATH}`, chalk.yellow)
  await fs.promises.writeFile(CONFIG_PATH, configJSON)
}

const readFromFile = async (path: string): Promise<O.Option<t>> => {
  try {
    const json = await fs.promises.readFile(path)
    return fromJSONString(json.toString())
  } catch (e) {
    return O.None
  }
}

const askAndMake = async (): Promise<t> => {
  const askSteps = async (
    prevState: STEPS_VARIANT[]
  ): Promise<STEPS_VARIANT[]> => {
    const AVAILABLE_KINDS = (STEPS_KIND as STEPS_VARIANT[])
      .filter((x) => x !== '_ALWAYS_FAILING_ONLY_FOR_TESTING')
      .filter((kind: STEPS_VARIANT) => !prevState.includes(kind))
    const userResponse = await select('Select steps to run', {
      choices: ['done', ...AVAILABLE_KINDS].map((kind: string) => ({
        value: kind,
        label: kind
      }))
    })
    if (userResponse === 'done') return prevState
    return await askSteps([...prevState, userResponse] as STEPS_VARIANT[])
  }

  const unSafeBranchResponse = (
    await question(
      'Enter unsafe branch list (space separated, regexes allowed)'
    )
  ).split(' ')
  const sourceDirResponse = (
    await question('Enter source directory list (space separated)')
  ).split(' ')
  const stepsResponse = await askSteps([])

  return {
    steps: stepsResponse,
    unSafeBranchList: unSafeBranchResponse,
    sourceDir: sourceDirResponse,
    verbose: false
  }
}

export const load = async (): Promise<t> => {
  //TODO: Partially loaded config
  const loadedConfig = await readFromFile(CONFIG_PATH)
  if (O.isSome(loadedConfig)) return loadedConfig
  return pipe(await askAndMake(), F.tap(flow(toJson, writeToFile)))
}
