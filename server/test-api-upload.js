const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config({path: './.env'});

async function test() {
  const form = new FormData();
  form.append('image', Buffer.from('test'), { filename: 'test.png', contentType: 'image/png' });

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: 'user123', role: 'citizen' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  try {
    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: form,
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Status:', res.status, res.statusText);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
