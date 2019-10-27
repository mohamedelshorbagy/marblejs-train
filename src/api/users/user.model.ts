import * as mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: false
    },
    password: {
        type: String,
        required: false
    }
});



export const UserModel = mongoose.model('User', UserSchema);
