//WorkRequest.jsx
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Calendar from './Calendar';
import './WorkRequest.css';

export default function WorkRequest() {

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
  };

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

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
      <Calendar/>
    </div>
  );
}