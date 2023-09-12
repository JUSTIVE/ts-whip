import * as EnvSet from "./EnvSet.mjs";
export type t = (EnvSet: EnvSet.t) => boolean;
export const NO_TYPESCRIPT_FILES: t = ({ TSFilesList }) =>
  TSFilesList.length === 0;
export const NO_STAGED_FILES: t = ({ stagedFileList }) =>
  stagedFileList.length === 0;
export const NO_PRODUCT_TYPESCRIPT_FILES: t = ({ ProductTSFilesList }) =>
  ProductTSFilesList.length === 0;
export const NO_COMMAND = (command:string):t=>({availableCommands})=>{
  return !availableCommands.includes(command);
}

export const NO_TEST_FILES:t = ({testFileExists})=>!testFileExists