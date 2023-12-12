import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [pwValid, setPwValid] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailValid(validateEmail(e.target.value));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPwValid(validatePassword(e.target.value));
  };

  const validateEmail = (email) => {
    const regex =
      /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const onClickLoginButton = async () => {
    try {
      const response = await axios.post('/api/hostdata', {
        id: email,
        password: password,
      });
  
      if (response.data.id) {
        alert('로그인에 성공했습니다.');
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/Home');
      } else {
        alert('로그인 실패: 사용자 정보가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('아이디와 비밀번호를 확인해 주세요');
    }
  };
  

  return (
    <div className="page">
      <div className="titleWrap">
        ID와 비밀번호를
        <br />
        입력해주세요
      </div>

      <div className="contentWrap">
        <div className="inputTitle">ID</div>
        <div className="inputWrap">
          <input
            className="input"
            type="text"
            placeholder="test@gmail.com"
            value={email}
            onChange={handleEmailChange}
          />
        </div>
        <div className="errorMessageWrap">
          {!emailValid && email.length > 0 && (
            <div>올바른 이메일을 입력해주세요.</div>
          )}
        </div>

        <div style={{ marginTop: '26px' }} className="inputTitle">
          비밀번호
        </div>
        <div className="inputWrap">
          <input
            className="input"
            type="password"
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <div className="errorMessageWrap">
          {!pwValid && password.length > 0 && (
            <div>영문, 숫자, 특수문자 포함 8자 이상 입력해주세요.</div>
          )}
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={onClickLoginButton}
          className="bottomButton"
        >
          로그인
        </button>
      </div>
    </div>
  );
}
