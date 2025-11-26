// packages/types/src/user.ts
export interface UserModelType {
  userName: string;
  email: string;
}

export type IUserCreate = UserModelType & {};

export const a = 6;
