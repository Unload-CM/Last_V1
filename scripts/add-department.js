const fetch = require('node-fetch');

async function addDepartment() {
  try {
    const response = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '경영지원부',
        description: '경영 지원 담당'
      })
    });
    
    const data = await response.json();
    console.log('응답:', data);
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

addDepartment(); 