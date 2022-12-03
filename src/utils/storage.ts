type StorageResult = {
  [key: string]: any;
};

const storage = {
  get: async (key: string | Array<string>): Promise<StorageResult> => {
    return new Promise((resolve, reject) => {
      const keys = Array.isArray(key) ? [...key] : [key];

      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        resolve(result);
      });
    });
  },
  set: async (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        resolve();
      });
    });
  },
};

export default storage;
