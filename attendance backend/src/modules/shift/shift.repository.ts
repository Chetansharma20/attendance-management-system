import Shift, { IShift } from "./shift.js";

export const findShiftByName = async (name: string): Promise<IShift | null> => {
  return await Shift.findOne({ name });
};

export const createShift = async (data: Partial<IShift>): Promise<IShift> => {
  return await Shift.create(data);
};

export const findAllShifts = async (): Promise<IShift[]> => {
  return await Shift.find().sort({ name: 1 });
};

export const deleteShiftById = async (id: string): Promise<IShift | null> => {
  return await Shift.findByIdAndDelete(id);
};
