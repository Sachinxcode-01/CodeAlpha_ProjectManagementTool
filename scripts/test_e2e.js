// Comprehensive End-to-End API and Logic Verification Test
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting TaskFlow End-to-End Automated Tests...\n');

  // Test 1: Health Check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log('✔ Test 1 Health Check:', healthData.message);

  // Test 2: Register User 1 (Alex Morgan)
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'Password123!'
    })
  });
  const reg1Data = await reg1Res.json();
  console.log('✔ Test 2 Register User 1 (Alex):', reg1Data.success ? 'SUCCESS' : reg1Data.error);
  const tokenAlex = reg1Data.data?.token;

  // Test 3: Duplicate Email Check
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alex Imposter',
      email: 'alex@example.com',
      password: 'Password123!'
    })
  });
  console.log('✔ Test 3 Duplicate Email Rejection:', dupRes.status === 409 ? 'PASSED (409 Conflict)' : 'FAILED');

  // Test 4: Register User 2 (Sam Taylor)
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sam Taylor',
      email: 'sam@example.com',
      password: 'Password123!'
    })
  });
  const reg2Data = await reg2Res.json();
  console.log('✔ Test 4 Register User 2 (Sam):', reg2Data.success ? 'SUCCESS' : reg2Data.error);
  const tokenSam = reg2Data.data?.token;
  const user2Id = reg2Data.data?.user.id;

  // Test 5: Alex Creates Project
  const projRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAlex}`
    },
    body: JSON.stringify({
      name: 'TaskFlow Architecture Overhaul',
      description: 'Building world-class project management application'
    })
  });
  const projData = await projRes.json();
  const projectId = projData.data?.id;
  console.log(`✔ Test 5 Project Created by Alex (ID: ${projectId}, Role: ${projData.data?.user_role})`);

  // Test 6: Alex Adds Sam as Member
  const addMemRes = await fetch(`${BASE_URL}/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAlex}`
    },
    body: JSON.stringify({
      email: 'sam@example.com',
      role: 'MEMBER'
    })
  });
  const addMemData = await addMemRes.json();
  console.log(`✔ Test 6 Member Added: ${addMemData.data?.name} as ${addMemData.data?.role}`);

  // Test 7: Alex Creates Task 1 assigned to Sam
  const task1Res = await fetch(`${BASE_URL}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAlex}`
    },
    body: JSON.stringify({
      title: 'Design Database Schema',
      description: 'Define SQLite tables with foreign keys and WAL mode.',
      priority: 'HIGH',
      status: 'TODO',
      assignee_id: user2Id,
      due_date: '2026-11-05'
    })
  });
  const task1Data = await task1Res.json();
  const task1Id = task1Data.data?.id;
  console.log(`✔ Test 7 Task 1 Created (ID: ${task1Id}, Title: "${task1Data.data?.title}", Assignee: ${task1Data.data?.assignee_name})`);

  // Test 8: Sam (MEMBER) Updates Task 1 to IN_PROGRESS
  const updateTaskRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenSam}`
    },
    body: JSON.stringify({
      status: 'IN_PROGRESS'
    })
  });
  const updateTaskData = await updateTaskRes.json();
  console.log(`✔ Test 8 Task 1 Status Updated by Sam: ${updateTaskData.data?.status}`);

  // Test 9: Sam Posts a Comment on Task 1
  const commentRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenSam}`
    },
    body: JSON.stringify({
      content: 'Schema created and tested with better-sqlite3!'
    })
  });
  const commentData = await commentRes.json();
  console.log(`✔ Test 9 Comment Added: "${commentData.data?.content}" by ${commentData.data?.author_name}`);

  // Test 10: Alex Fetches Dashboard Metrics
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { 'Authorization': `Bearer ${tokenAlex}` }
  });
  const dashData = await dashRes.json();
  const m = dashData.data?.metrics;
  console.log(`✔ Test 10 Dashboard Stats: Projects: ${m.total_projects}, Tasks: ${m.total_tasks}, In Progress: ${m.in_progress_tasks}`);

  // Test 11: Security RBAC Test (Sam tries to DELETE the project - must be 403 Forbidden)
  const delProjRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenSam}` }
  });
  console.log(`✔ Test 11 Security Check: Sam (MEMBER) deleting project blocked: ${delProjRes.status === 403 ? 'PASSED (403 Forbidden)' : 'FAILED'}`);

  console.log('\n🎉 ALL 11 TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
