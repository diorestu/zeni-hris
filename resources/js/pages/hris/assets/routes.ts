const baseUrl = '/hris/assets';

export const index = {
    url: () => baseUrl,
};

export const store = {
    url: () => baseUrl,
};

export const update = {
    url: (assetId: number) => `${baseUrl}/${assetId}`,
};

export const destroy = {
    url: (assetId: number) => `${baseUrl}/${assetId}`,
};
