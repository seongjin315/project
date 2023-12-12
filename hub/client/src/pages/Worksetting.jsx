import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './Worksetting.css';

export default function Worksetting() {
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
  };

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const [workSettings, setWorkSettings] = useState([]);
  const [newid, setNewid] = useState('오픈');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newColor, setNewColor] = useState('#F78181');
  const [showNewWorkInput, setShowNewWorkInput] = useState(false);
  const [newPartList, setNewPartList] = useState([]);

  const handlePartChange = (index, value) => {
    const updatedPartList = [...newPartList];
    updatedPartList[index].partname = value;
    setNewPartList(updatedPartList);
  };
  
  const handleCountChange = (index, value) => {
    const updatedPartList = [...newPartList];
    updatedPartList[index].count = value;
    setNewPartList(updatedPartList);
  };
  
  const handleDeletePart = (index) => {
    const updatedPartList = [...newPartList];
    updatedPartList.splice(index, 1);
    setNewPartList(updatedPartList);
  };
  
  const handleAddPart = () => {
    setNewPartList([...newPartList, { partname: '포스', count: 1}]);
  };

  const fetchWorkSettings = () => {
    fetch('/api/worksetting')
      .then((response) => response.json())
      .then((data) => setWorkSettings(data))
      .catch((error) => console.error('근무 설정 가져오기 오류:', error));
  };

  useEffect(() => {
    fetchWorkSettings();
  }, []);

  const handleAddWork = () => {
    const newWork = {
      name: newid,
      startTime: newStartTime,
      endTime: newEndTime,
      color: newColor,
      workparts: newPartList.map((part) => ({
        partname: part.partname,
        count: part.count,
      })),
    };

    fetch('/api/worksetting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newWork),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('서버 응답:', result);
        fetchWorkSettings();
      })
      .catch((error) => {
        console.error('서버 오류:', error);
      });

    setNewid('오픈');
    setNewStartTime('');
    setNewEndTime('');
    setNewColor('#F78181');
    setNewPartList([{ partname: '포스', count: 1 }]);
    setShowNewWorkInput(false);
  };

  const handleDeleteWork = (workId) => {
    fetch(`/api/worksetting/${workId}`, {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('서버 응답:', result);
        fetchWorkSettings();
      })
      .catch((error) => {
        console.error('서버 오류:', error);
      });
  };

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
      <h2>근무시간 설정</h2>
      {showNewWorkInput ? (
        <div>
          <div>
            <label>근무 타임</label>
            <select value={newid} onChange={(e) => setNewid(e.target.value)}>
              <option value="오픈">오픈</option>
              <option value="오전">오전</option>
              <option value="오후">오후</option>
              <option value="마감">마감</option>
            </select>
          </div>
          <div>
            <label>시작 시간</label>
            <input
              type="time"
              value={newStartTime.slice(0, 5)} // 시와 분만 추출
              onChange={(e) => setNewStartTime(e.target.value)}
            />
          </div>
          <div>
            <label>종료 시간</label>
            <input
              type="time"
              value={newEndTime.slice(0, 5)} // 시와 분만 추출
              onChange={(e) => setNewEndTime(e.target.value)}
            />
          </div>
          <div>
            <label>색상 설정</label>
            <select value={newColor} onChange={(e) => setNewColor(e.target.value)}>
              <option value="#F78181">빨강</option>
              <option value="#82FA58">녹색</option>
              <option value="#81BEF7">파랑</option>
              <option value="#F2F5A9">노랑</option>
            </select>
          </div>
          <div>
            <label>근무 파트 및 인원</label>
            {newPartList.map((part, index) => (
              <div key={index}>
                <select onChange={(e) => handlePartChange(index, e.target.value)}>
                  <option value="포스">포스</option>
                  <option value="주방">주방</option>
                  <option value="배달">배달</option>
                </select>
                <input
                  type="number"
                  value={part.count}
                  onChange={(e) => handleCountChange(index, e.target.value)}
                />
                <button onClick={() => handleDeletePart(index)}>삭제</button>
              </div>
            ))}
            <button onClick={handleAddPart}>추가</button>
          </div>
          <button onClick={handleAddWork}>저장</button>
        </div>
      ) : (
        <button onClick={() => setShowNewWorkInput(true)}>근무생성</button>
      )}
      <h2>설정한 근무시간</h2>
      {workSettings.length > 0 && (
  <div>
    {workSettings.reduce((uniqueWorks, work) => {
      const existingWork = uniqueWorks.find((uniqueWork) => uniqueWork.id === work.id);

      if (!existingWork) {
        uniqueWorks.push({ ...work, total: work.count, partList: work.partname ? [{ partname: work.partname, count: work.count }] : [] });
      } else {
        existingWork.total += work.count;

        if (work.partname) {
          const existingPart = existingWork.partList.find((part) => part.partname === work.partname);

          if (existingPart) {
            existingPart.count += work.count;
          } else {
            existingWork.partList.push({ partname: work.partname, count: work.count });
          }
        }
      }

      return uniqueWorks;
    }, []).map((uniqueWork, index) => (
      <div key={index}>
        <p>근무 타임: {uniqueWork.name}</p>
        <p>시작 시간: {uniqueWork.start_time}</p>
        <p>종료 시간: {uniqueWork.end_time}</p>
        <p>색상 설정: <span style={{ backgroundColor: uniqueWork.color, padding: '10px' }}></span></p>

        {uniqueWork.partList && Array.isArray(uniqueWork.partList) && uniqueWork.partList.length > 0 && (
          <p>
            {uniqueWork.partList.map((part, partIndex) => (
              `근무 파트: ${part.partname}, 인원: ${part.count}${partIndex < uniqueWork.partList.length - 1 ? ' | ' : ''}`
            ))}
          </p>
        )}
        <button onClick={() => handleDeleteWork(uniqueWork.id)}>근무삭제</button>
      </div>
          ))}
        </div>
      )}
    </div>
  );
}