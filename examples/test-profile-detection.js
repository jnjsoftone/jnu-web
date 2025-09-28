// Test the enhanced profile finding functionality from playwright implementation
import { getSeleniumChromeProfileByEmail } from '../esm/index.js';

// 환경변수 명시적 설정
if (!process.env.CHROMIUM_USERDATA_PATH) {
  process.env.CHROMIUM_USERDATA_PATH = '/Users/youchan/Library/Application Support/Google/Chrome';
}

console.log('🔍 Enhanced Email-Based Profile Detection Test');
console.log('='.repeat(50));

async function testProfileDetection() {
  const testEmails = [
    'bigwhitekmc@gmail.com',
    'jnjsoftone@gmail.com', 
    'monblue@snu.ac.kr',
    'nonexistent@example.com'
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing email: ${email}`);
    
    try {
      const profileName = getSeleniumChromeProfileByEmail(email);
      
      if (profileName) {
        console.log(`✅ Profile found: ${profileName}`);
        
        // Check if it's a primary account by looking at the console logs
        // The enhanced logic prioritizes profiles where the email is the primary account
        
      } else {
        console.log(`❌ No profile found for: ${email}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${email}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Profile detection test completed!');
  console.log('\nKey features of enhanced profile detection:');
  console.log('• Prioritizes profiles where email is PRIMARY account (index 0)');
  console.log('• Falls back to secondary account if no primary found');
  console.log('• Returns null for non-existent emails');
  console.log('• Compatible with existing Selenium Chrome Profile class');
}

testProfileDetection().catch(console.error);