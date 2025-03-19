import { Types } from "mongoose";

interface IAddress {
  address: string;
  city: string;
  state: string;
  postalCode: number;
}

export interface IClinic {
  _id: Types.ObjectId;
  ClinicName: string;
  address: IAddress;
  website: string;
  Patients: Types.ObjectId[];
  subscriptionPlan: string;
  Licenses: number;
  LogoUrl: string;
  Availibility: {
    days: Array<string>;
    timing: {
      openingTime: string;
      closingTime: string;
    };
    slotBreak: number;
  };
}
