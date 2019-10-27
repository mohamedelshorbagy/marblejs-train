import { generateExpirationInHours, generateToken, authorize$ } from '@marblejs/middleware-jwt';


export const generateUserToken = (user: any) => ({
    id: user._id,
    name: user.name,
    exp: generateExpirationInHours(4)
});


