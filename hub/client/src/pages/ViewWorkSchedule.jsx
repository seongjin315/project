import React from 'react'
import { Link, Navigate } from 'react-router-dom'

export default function Workmanagement(){

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
    return(
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
      <h1 style={{ marginTop: '20%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        희망 근무표 보기
      </h1>

      </div>
        
    )
}
