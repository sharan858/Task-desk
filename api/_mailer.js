import nodemailer from 'nodemailer';

let transporter;

function getTransporter(){
  if(!transporter){
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if(!user || !pass){
      throw new Error('Missing GMAIL_USER/GMAIL_APP_PASSWORD environment variables');
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }){
  const from = `TaskDesk <${process.env.GMAIL_USER}>`;
  await getTransporter().sendMail({ from, to, subject, html, text });
}
