
export const ERROR_LOADING_SCANS = 'Error loading active scans';
export const ALL_SCANS = '$PARAM, you\'ve scanned all active scans';
export const NO_SCANS = 'There is no active scans';
export const ERROR_LOADING_SCAN = 'Error loading scan';
export const ERROR_ACTIVESCAN = 'Unable to update activescan';
export const ERROR_CODE = 'Unable to generate code';
export const ALREADY_SCANNED = "You've already scanned this $PARAM";
export const NO_LONGER_ACTIVE = '$PARAM is no longer active';
export const NOT_ACTIVE = "$PARAM isn't an active scan";
export const FIRST_SCAN = 'first scan';
export const SCANNED = 'scanned';

export const substitute = (message: string, ...args: string[]) => {
  let count = 0;
  return message.replaceAll(/(\$PARAM)/g, () => args[count++]);
};
