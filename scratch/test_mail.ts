import fs from 'fs';
import path from 'path';

// Parse .env manually BEFORE importing anything else
try {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('#') || !line.includes('=')) return;
    const parts = line.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  });
} catch (e) {
  console.error('Failed to load .env file', e);
}

async function main() {
  console.log('Testing email sending to BEOL email address with dynamic import...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);

  const { sendEmail } = await import('../src/lib/mail');

  const res = await sendEmail({
    to: 'im.shishir.rahman@gmail.com', // BEOL email
    subject: 'Test Email from Sokrio System to BEOL',
    text: 'If you receive this, the email sending to external address is working perfectly!',
  });

  if (res.success) {
    console.log('Success! Message ID:', res.messageId);
  } else {
    console.error('Failed to send email:', res.error);
  }
}

main().catch(console.error);
