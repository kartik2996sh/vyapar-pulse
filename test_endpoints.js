// Test script for VyaparPulse API endpoints

async function runTests() {
  console.log('Testing VyaparPulse Endpoints...');

  // 1. Test Extractor with English credit sale
  const res1 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Sharma ji took 2400 rupees worth of groceries on 7 days credit' })
  });
  const data1 = await res1.json();
  console.log('\n[Test 1] Brain 1 Extractor (Credit Sale):');
  console.log(JSON.stringify(data1, null, 2));

  // 2. Test Extractor with Hinglish payment received
  const res2 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Ravi ne 500 rupaye chukaye aaj' })
  });
  const data2 = await res2.json();
  console.log('\n[Test 2] Brain 1 Extractor (Hinglish Payment):');
  console.log(JSON.stringify(data2, null, 2));

  // 3. Test Extractor with Cash sale
  const res3 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'sold rice and dal to Meena for 800, cash' })
  });
  const data3 = await res3.json();
  console.log('\n[Test 3] Brain 1 Extractor (Cash Sale):');
  console.log(JSON.stringify(data3, null, 2));

  // 4. Test Insights Generator (Brain Job 2)
  const res4 = await fetch('http://localhost:3000/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: {
        todaysSales: 4500,
        todaysCollections: 1200,
        totalOutstanding: 48000,
        totalOverdue: 24000,
        overdueCustomerCount: 5,
        totalReceivablesNext7Days: 38500,
        top3DebtorPercent: 62
      }
    })
  });
  const data4 = await res4.json();
  console.log('\n[Test 4] Brain 2 Insight Generator:');
  console.log(JSON.stringify(data4, null, 2));

  // 5. Test Reminder Writer (Brain Job 3)
  const res5 = await fetch('http://localhost:3000/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Sharma ji',
      amount: 2400,
      itemDescription: 'groceries',
      dueDate: '15 Sep',
      daysOverdue: 5,
      storeName: 'Gupta Supermarket'
    })
  });
  const data5 = await res5.json();
  console.log('\n[Test 5] Brain 3 Reminder Writer:');
  console.log(JSON.stringify(data5, null, 2));

  console.log('\nAll API tests completed successfully!');
}

runTests().catch(console.error);
