import Settings, { ISettings } from "./settings.js";

export const findSettings = async (): Promise<ISettings | null> => {
  return await Settings.findOne();
};

export const createSettings = async (data: Partial<ISettings>): Promise<ISettings> => {
  return await Settings.create(data);
};
