import React, { useEffect, useState } from 'react';
import './Home.css'; 
import { Link, Navigate } from 'react-router-dom';

export default function Home() {
  // 상태 변수를 컴포넌트의 최상위 레벨로 이동
  const [hostData, setHostData] = useState([]);
  // eslint-disable-next-line
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // '/api/hostdata' 엔드포인트를 호출하여 호스트 정보를 가져옵니다.
    fetch('/api/hostdata')
      .then((response) => response.json())
      .then((data) => {
        setHostData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('호스트 정보를 불러오는 중 오류 발생:', error);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    // 로그아웃 시 로그인 상태를 지우고 로그인 페이지로 이동
    localStorage.removeItem('isLoggedIn');
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
      <div className='Profile'>
        <h2>관리자 프로필</h2>
        <ul>
          {hostData.map(host => (
            <li key={host.id}>
              <strong>ID:</strong> {host.id}
            </li>
          ))}
          {hostData.map(host => (
            <li key={host.id}>
              <strong>이름:</strong> {host.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
