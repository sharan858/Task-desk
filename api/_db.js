import pg from 'pg';

let pool;

function getPool(){
  if(!pool){
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if(!connectionString){
      throw new Error('Missing DATABASE_URL/POSTGRES_URL environment variable');
    }
    pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query(text, params){
  const client = await getPool().connect();
  try{
    return await client.query(text, params);
  }finally{
    client.release();
  }
}
