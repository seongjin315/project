import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

const Employee = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // '/api/users' 엔드포인트를 호출하여 사용자 정보를 가져옵니다.
    fetch('/api/users')
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('사용자 정보를 불러오는 중 오류 발생:', error);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    // 로그아웃 시 로그인 상태를 지우고 로그인 페이지로 이동
    localStorage.removeItem('isLoggedIn');
  };

  const handleDelete = (userId) => {
    fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('서버에서 오류가 발생했습니다.');
        }
        return response.json();
      })
      .then(() => {
        // 화면에서 사용자 삭제
        setUserData((prevData) => prevData.filter((user) => user.id !== userId));
      })
      .catch((error) => {
        console.error('사용자 삭제 중 오류 발생:', error);
      });
  };

  // 로그인 상태 확인
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // 만약 로그인 상태가 아니라면 로그인 페이지로 이동
  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <ul className="Top">
        <li className="Menu">
          <Link to="/Home">HOME</Link>
        </li>
        <li className="Menu">
          <Link to="/WorkRequest">근무 신청</Link>
            <div className="SubMenu">
                <Link to="/ViewWorkSchedule">희망 근무표 보기</Link>
            </div>
        </li>
        <li className="Menu">
          <Link to="/Worksetting">근무 설정</Link>
        </li>
        <li className="Menu">
          <Link to="/Employee">직원 관리</Link>
        </li>
        <li className="logout">
          <Link to="/" onClick={handleLogout}>
            로그아웃
          </Link>
        </li>
      </ul>

      <div className="userdata">
        <h1>회원목록</h1>
        {loading ? (
          <p style={{ textAlign: 'center' }}>데이터를 불러오는 중...</p>
        ) : (
          Array.isArray(userData) ? (
            userData.map((user) => (
              <div key={user.id}>
                <h6>이름: {user.name} 번호: {user.phoneNumber}</h6>
              </div>
            ))
          ) : (
            <p>서버와 연결되었습니다. 사용자 정보를 불러올 수 없습니다.</p>
          )
        )}

        <h1>회원 삭제</h1>
        <div>
          {Array.isArray(userData) &&
            userData.map((user) => (
              <div key={user.id}>
                <h6>
                  이름: {user.name} 번호: {user.phoneNumber}
                  <button onClick={() => handleDelete(user.id)}>삭제하기</button>
                </h6>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Employee;
