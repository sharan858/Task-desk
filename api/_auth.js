import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const COOKIE_NAME = 'td_session';

function secret(){
  const s = process.env.JWT_SECRET;
  if(!s) throw new Error('Missing JWT_SECRET environment variable');
  return s;
}

export function signToken(user){
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret(), { expiresIn: '30d' });
}

export function setSessionCookie(res, token){
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }));
}

export function clearSessionCookie(res){
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  }));
}

export function getUserFromReq(req){
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if(!token) return null;
  try{
    const payload = jwt.verify(token, secret());
    return { id: payload.sub, email: payload.email, name: payload.name };
  }catch(e){
    return null;
  }
}

export function requireAuth(req, res){
  const user = getUserFromReq(req);
  if(!user){
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return user;
}
