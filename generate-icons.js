const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Create simple PNG icons (since sharp has issues on Windows)
async function generateIcons() {
  // 192x192 icon
  const canvas192 = createCanvas(192, 192);
  const ctx192 = canvas192.getContext('2d');
  
  // Draw background
  ctx192.fillStyle = '#0a0a0a';
  ctx192.beginPath();
  ctx192.roundRect(0, 0, 192, 192, 24);
  ctx192.fill();
  
  // Draw circle
  ctx192.strokeStyle = '#8b5cf6';
  ctx192.lineWidth = 6;
  ctx192.beginPath();
  ctx192.arc(96, 96, 60, 0, Math.PI * 2);
  ctx192.stroke();
  
  // Draw inner circle
  ctx192.fillStyle = '#8b5cf6';
  ctx192.beginPath();
  ctx192.arc(96, 96, 38, 0, Math.PI * 2);
  ctx192.fill();
  
  // Draw checkmark
  ctx192.strokeStyle = '#ffffff';
  ctx192.lineWidth = 6;
  ctx192.lineCap = 'round';
  ctx192.lineJoin = 'round';
  ctx192.beginPath();
  ctx192.moveTo(72, 96);
  ctx192.lineTo(92, 116);
  ctx192.lineTo(128, 80);
  ctx192.stroke();
  
  // Save 192x192
  const buffer192 = canvas192.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', 'icon-192.png'), buffer192);
  
  // 512x512 icon
  const canvas512 = createCanvas(512, 512);
  const ctx512 = canvas512.getContext('2d');
  
  // Draw background
  ctx512.fillStyle = '#0a0a0a';
  ctx512.beginPath();
  ctx512.roundRect(0, 0, 512, 512, 64);
  ctx512.fill();
  
  // Draw circle
  ctx512.strokeStyle = '#8b5cf6';
  ctx512.lineWidth = 12;
  ctx512.beginPath();
  ctx512.arc(256, 256, 160, 0, Math.PI * 2);
  ctx512.stroke();
  
  // Draw inner circle
  ctx512.fillStyle = '#8b5cf6';
  ctx512.beginPath();
  ctx512.arc(256, 256, 100, 0, Math.PI * 2);
  ctx512.fill();
  
  // Draw checkmark
  ctx512.strokeStyle = '#ffffff';
  ctx512.lineWidth = 12;
  ctx512.lineCap = 'round';
  ctx512.lineJoin = 'round';
  ctx512.beginPath();
  ctx512.moveTo(192, 256);
  ctx512.lineTo(242, 306);
  ctx512.lineTo(336, 212);
  ctx512.stroke();
  
  // Save 512x512
  const buffer512 = canvas512.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', 'icon-512.png'), buffer512);
  
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
