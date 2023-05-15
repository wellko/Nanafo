import { createAsyncThunk } from '@reduxjs/toolkit';
import { DealType, DealTypeProps, ValidationError } from '../../types';
import axiosApi from '../../axios-api';
import { isAxiosError } from 'axios';

export const getDeals = createAsyncThunk<DealTypeProps[]>('deals/getAll', async () => {
  try {
    const response = await axiosApi.get<DealTypeProps[]>('deals');
    return response.data;
  } catch {
    throw new Error();
  }
});

export const createDeal = createAsyncThunk<void, DealType, { rejectValue: ValidationError }>(
  'deals/createDeal',
  async (dealData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      const keys = Object.keys(dealData) as (keyof DealType)[];
      keys.forEach((key) => {
        const value = dealData[key];
        if (value !== null) {
          formData.append(key, value as string | Blob);
        }
      });
      await axiosApi.post('/deals', formData);
    } catch (e) {
      if (isAxiosError(e) && e.response && e.response.status === 400) {
        return rejectWithValue(e.response.data as ValidationError);
      }
      throw e;
    }
  },
);