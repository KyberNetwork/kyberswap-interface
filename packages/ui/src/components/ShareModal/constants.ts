import { ShareOption, ShareType } from '@/components/ShareModal/types';

export const shareOptions: Record<ShareType, ShareOption[]> = {
  [ShareType.POOL_INFO]: [ShareOption.TOTAL_APR, ShareOption.LM_APR, ShareOption.EG_APR],
  [ShareType.POSITION_INFO]: [
    ShareOption.TOTAL_APR,
    ShareOption.LM_APR,
    ShareOption.EG_APR,
    ShareOption.TOTAL_EARNINGS,
  ],
  [ShareType.REWARD_INFO]: [ShareOption.TOTAL_REWARD, ShareOption.LM_REWARD, ShareOption.EG_REWARD],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const conflictOptions: Record<ShareType, { [key in ShareOption]?: ShareOption[] }> = {
  [ShareType.POOL_INFO]: {},
  [ShareType.POSITION_INFO]: {
    [ShareOption.LM_APR]: [ShareOption.TOTAL_EARNINGS],
    [ShareOption.EG_APR]: [ShareOption.TOTAL_EARNINGS],
    [ShareOption.TOTAL_EARNINGS]: [ShareOption.LM_APR, ShareOption.EG_APR],
  },
  [ShareType.REWARD_INFO]: {},
};

export const DEFAULT_SHARE_OPTION: Record<ShareType, ShareOption[]> = {
  [ShareType.POOL_INFO]: [ShareOption.TOTAL_APR],
  [ShareType.POSITION_INFO]: [ShareOption.TOTAL_EARNINGS, ShareOption.TOTAL_APR],
  [ShareType.REWARD_INFO]: [ShareOption.TOTAL_REWARD],
};

export const NON_FARMING_EXCLUDED_OPTIONS = [
  ShareOption.LM_APR,
  ShareOption.EG_APR,
  ShareOption.TOTAL_REWARD,
  ShareOption.LM_REWARD,
  ShareOption.EG_REWARD,
];

export const MAX_SELECTED_OPTIONS = 2;
