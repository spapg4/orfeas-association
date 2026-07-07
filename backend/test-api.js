// Automated Integration Test for Orfeas Association API endpoints
// This script runs using Node.js built-in fetch

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Ξεκινάει ο αυτόματος έλεγχος των API endpoints του "Ορφέα"...\n');

  try {
    // 1. Get initial activities
    console.log('1. Ανάκτηση αρχικών δραστηριοτήτων...');
    const actRes = await fetch(`${BASE_URL}/activities`);
    const activities = await actRes.json();
    console.log(`✅ Επιτυχία! Βρέθηκαν ${activities.length} δραστηριότητες.\n`);

    // 2. Register a new member
    console.log('2. Υποβολή νέας αίτησης εγγραφής μέλους...');
    const memberData = {
      fullname: 'Γεώργιος Δημητρίου',
      father_name: 'Αθανάσιος',
      phone: '6912345678',
      email: 'george.dem@gmail.com',
      address: 'Κεντρική Πλατεία, Μεγάλο Ελευθεροχώρι, 40200',
      gdpr_consent: 'true'
    };

    // Construct request body
    const regRes = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    const regResult = await regRes.json();
    if (!regRes.ok) throw new Error(regResult.message);
    const memberId = regResult.id;
    console.log(`✅ Επιτυχία! Δημιουργήθηκε μέλος με ID: ${memberId}. Μήνυμα: "${regResult.message}"\n`);

    // 3. Admin login
    console.log('3. Σύνδεση Διαχειριστή (Admin Login)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'adminorfeas123' })
    });
    const loginResult = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginResult.message);
    const token = loginResult.token;
    console.log(`✅ Επιτυχία! Συνδέθηκε ο χρήστης: ${loginResult.username}. Token λήφθηκε.\n`);

    // 4. Admin reads members list
    console.log('4. Ανάκτηση λίστας μελών από τον Διαχειριστή...');
    const getMemRes = await fetch(`${BASE_URL}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const membersList = await getMemRes.json();
    if (!getMemRes.ok) throw new Error(membersList.message);
    console.log(`✅ Επιτυχία! Βρέθηκαν ${membersList.length} αιτήσεις μελών στη βάση δεδομένων.\n`);

    // 5. Admin approves member
    console.log(`5. Έγκριση μέλους με ID: ${memberId}...`);
    const appRes = await fetch(`${BASE_URL}/members/${memberId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status: 'Approved' })
    });
    const appResult = await appRes.json();
    if (!appRes.ok) throw new Error(appResult.message);
    console.log(`✅ Επιτυχία! Η κατάσταση του μέλους ενημερώθηκε σε: ${appResult.status}\n`);

    // 6. Admin updates payment status to Paid
    console.log(`6. Σήμανση συνδρομής ως ΠΛΗΡΩΜΕΝΗ για το μέλος με ID: ${memberId}...`);
    const payRes = await fetch(`${BASE_URL}/members/${memberId}/paid`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ paid_status: 'Paid' })
    });
    const payResult = await payRes.json();
    if (!payRes.ok) throw new Error(payResult.message);
    console.log(`✅ Επιτυχία! Η κατάσταση συνδρομής ενημερώθηκε σε: ${payResult.paid_status}\n`);

    // 7. Admin creates a new activity
    console.log('7. Δημιουργία νέας ανακοίνωσης (Activity)...');
    const activityData = {
      title: 'Πρόσκληση σε Γενική Συνέλευση 2026',
      content: 'Καλούνται όλα τα μέλη του Μορφωτικού & Εξωραϊστικού Συλλόγου "Ορφέας" στη Γενική Συνέλευση του Συλλόγου που θα πραγματοποιηθεί την Κυριακή 15 Ιουλίου 2026 και ώρα 11:00 π.μ. στην αίθουσα εκδηλώσεων του Συλλόγου.',
      image_url: ''
    };
    const newActRes = await fetch(`${BASE_URL}/activities`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(activityData)
    });
    const newActResult = await newActRes.json();
    if (!newActRes.ok) throw new Error(newActResult.message);
    console.log(`✅ Επιτυχία! Δημιουργήθηκε νέα ανακοίνωση με ID: ${newActResult.id}\n`);

    // 8. Verify public activities feeds contains the newly created activity
    console.log('8. Επαλήθευση εμφάνισης ανακοίνωσης στη δημόσια ροή...');
    const checkActRes = await fetch(`${BASE_URL}/activities`);
    const updatedActivities = await checkActRes.json();
    const found = updatedActivities.find(a => a.id === newActResult.id);
    if (!found) {
      throw new Error('Η νέα ανακοίνωση δεν βρέθηκε στη δημόσια ροή!');
    }
    console.log(`✅ Επιτυχία! Η ανακοίνωση "${found.title}" εμφανίζεται στη δημόσια ροή.\n`);

    console.log('🎉 Όλα τα API endpoints δοκιμάστηκαν επιτυχώς και η βάση δεδομένων λειτουργεί άψογα! 🎉');
  } catch (error) {
    console.error('❌ Το τεστ απέτυχε με σφάλμα:', error.message);
  }
}

runTests();
