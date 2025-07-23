export const validateDeadlineString = (str: string): boolean => {
  const value = Number.parseInt(str, 10);

  // must not be longer than 10000 (5 chars)
  if (str.length > '10000'.length) {
    return false;
  }

  // must be an integer
  if (Number.isNaN(value) || String(Math.floor(value)) !== str) {
    return false;
  }

  // must be in (0, 1000)
  if (0 < value && value < 10000) {
    return true;
  }

  return false;
};

export const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100);

export const validateSlippageInput = (
  str: string,
  suggestedSlippage: number,
): { isValid: boolean; message?: string } => {
  if (str === '') {
    return {
      isValid: true,
    };
  }

  const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  const rawSlippage = parseSlippageInput(str);

  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  } else if (rawSlippage < suggestedSlippage / 2) {
    return {
      isValid: true,
      message: `Your slippage is set lower than usual, increasing the risk of transaction failure.`,
    };
    // max slippage
  } else if (rawSlippage > 5000) {
    return {
      isValid: false,
      message: `Enter a smaller slippage percentage`,
    };
  } else if (rawSlippage > 2 * suggestedSlippage) {
    return {
      isValid: true,
      message: `Your slippage is set higher than usual, which may cause unexpected losses.`,
    };
  }

  return {
    isValid: true,
  };
};
