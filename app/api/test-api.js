// 카테고리 API 테스트 스크립트
console.log('카테고리 API 테스트 시작');

// 카테고리 추가 테스트
async function testAddCategory() {
  try {
    const response = await fetch('http://localhost:3001/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '테스트 카테고리',
        label: 'test_category',
        description: '테스트 설명'
      })
    });
    
    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', data);
    
    if (response.ok) {
      console.log('카테고리 추가 성공!');
    } else {
      console.error('카테고리 추가 실패:', data.error);
    }
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
  }
}

// 카테고리 목록 조회 테스트
async function testGetCategories() {
  try {
    const response = await fetch('http://localhost:3001/api/categories', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('카테고리 목록:', data.categories);
    
    if (response.ok) {
      console.log('카테고리 목록 조회 성공!');
    } else {
      console.error('카테고리 목록 조회 실패:', data.error);
    }
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
  }
}

// 테스트 실행
async function runTests() {
  console.log('----- 카테고리 추가 테스트 -----');
  await testAddCategory();
  
  console.log('----- 카테고리 목록 조회 테스트 -----');
  await testGetCategories();
}

runTests(); 