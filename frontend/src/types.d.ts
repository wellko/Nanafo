export interface RegisterMutation {
  username: string;
  password: string;
  displayName: string;
  phoneNumber: string;
}

export interface User {
  _id: string;
  username: string;
  token: string;
  role: string;
  displayName: string;
  phoneNumber: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface GlobalSuccess {
  message: string;
}

export interface ValidationError {
  errors: {
    [key: string]: {
      name: string;
      message: string;
    };
  };
  message: string;
  name: string;
  _name: string;
}

export interface LoginMutation {
  username: string;
  password: string;
}

export interface GlobalError {
  error: string;
}

export interface CategoryTypeProps {
  _id: string;
  name: string;
}

export interface DealTypeProps {
  _id: string;
  tradeOn: string;
  isPublished: boolean;
  title: string;
  description: string;
  purchasePrice: number;
  image: string;
  condition: string;
  category: CategoryType;
  owner: User;
}

export interface DealType extends Omit<DealTypeProps, '_id'> {
  category: string;
  owner: string;
  image: File | null;
}

export interface DealTypeWithId extends DealType {
  _id: string;
}

export interface CategoryType {
  _id: string;
  name: string;
}

export interface CategoryMutation {
  name: string;
}

export interface MessageType {
  date: Date;
  to?: User;
  type: string;
  text: string;
  author: User;
  room: string;
  whisper: boolean;
}
