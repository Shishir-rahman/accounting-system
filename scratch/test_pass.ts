import nodemailer from 'nodemailer';

async function testFromHeader() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sarkershishir4@gmail.com',
      pass: 'fumw wmbq uynb mtvn'
    }
  });

  try {
    const info = await transporter.sendMail({
      from: 'Sokrio Technologies <accounts@sokrio.com>',
      replyTo: 'accounts@sokrio.com',
      to: 'sahiuddin@sokrio.com',
      subject: 'Test Email From Accounts@sokrio.com',
      text: 'This email is sent with From header: accounts@sokrio.com'
    });
    console.log('SUCCESS_SEND:', info.messageId, info.response);
  } catch (err: any) {
    console.error('ERROR_SEND:', err.message);
  }
}

testFromHeader();
