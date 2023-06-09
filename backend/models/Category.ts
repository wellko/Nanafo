import mongoose from 'mongoose';
import { CategoryType } from '../types';

const Schema = mongoose.Schema;
const CategorySchema = new Schema<CategoryType>({
  name: {
    type: String,
    unique: true,
    required: true,
  },
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;
