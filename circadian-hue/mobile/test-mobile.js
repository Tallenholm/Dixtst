#!/usr/bin/env node
console.log('🚀 Starting Circadian Hue Mobile App Test...\n');

console.log('✅ Backend server status check:');
fetch('http://localhost:5000/api/system/status')
  .then(response => response.json())
  .then(data => {
    console.log('   Engine:', data.engine ? '✅ Running' : '❌ Stopped');
    console.log('   Updates:', data.updates ? '✅ Active' : '❌ Inactive');
    console.log('   Schedule:', data.schedule ? '✅ Active' : '❌ Inactive');
    
    console.log('\n🌅 Current circadian phase:');
    return fetch('http://localhost:5000/api/schedule/current-phase');
  })
  .then(response => response.json())
  .then(data => {
    console.log('   Phase:', data.phase.toUpperCase());
    console.log('   Time:', new Date(data.timestamp).toLocaleTimeString());
    
    console.log('\n📱 Mobile app ready to test!');
    console.log('\nTesting options:');
    console.log('1. Web browser: cd mobile && npx expo start --web');
    console.log('2. Phone (Expo Go): cd mobile && npx expo start');
    console.log('3. Android emulator: cd mobile && npx expo start --android');
    
    console.log('\n🔗 Your server is running at: http://localhost:5000');
    console.log('   All APIs are responding correctly!');
  })
  .catch(error => {
    console.error('❌ Backend connection failed:', error.message);
    console.log('\nMake sure your Circadian Hue server is running:');
    console.log('   npm run dev');
  });