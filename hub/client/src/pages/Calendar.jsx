// Calendar.jsx
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './Calendar.css';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [workSettings, setWorkSettings] = useState({});
  const [workNames, setWorkNames] = useState([]);
  const [selectedWorkPart, setSelectedWorkPart] = useState('');
  const [selectedWork, setSelectedWork] = useState('');
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [workSchedule, setWorkSchedule] = useState([]);
  const [workColors, setWorkColors] = useState({});
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const fetchWorkSettings = async () => {
      try {
        // api/worksetting 정보가져오기 
        const response = await fetch('/api/worksetting');
        const workSettingData = await response.json();

        // api/workrequest 정보 가져오기
        const responseSchedule = await fetch('/api/workrequest');
        const workScheduleData = await responseSchedule.json();
  
        // 근무 이름이 같으면 하나의 근무로 보기
        const groupedWorkSettings = groupBy(workSettingData, 'name');
        setWorkSettings(groupedWorkSettings);
        const uniqueWorkNames = Array.from(new Set(workSettingData.map((work) => work.name)));
        setWorkNames(uniqueWorkNames);
  
        // 근무 설정 데이터에서 색상 정보를 추출하여 상태로 저장
        const colors = {};
        workSettingData.forEach((work) => {
          colors[work.name] = work.color;
        });

        setWorkColors(colors);
        setWorkSchedule(workScheduleData);
        
      } catch (error) {
        console.error('근무 설정을 불러오는 데 실패했습니다:', error);
      }
    };
    
    fetchWorkSettings();
  }, []);

  const groupBy = (array, key) => {
    return array.reduce((result, item) => {
      const keyValue = item[key];
      (result[keyValue] = result[keyValue] || []).push(item);
      return result;
    }, {});
  };

  const fetchWorkSchedule = async () => {
    try {
      const responseSchedule = await fetch('/api/workrequest');
      const updatedWorkScheduleData = await responseSchedule.json();
  
      // Moment.js를 사용하여 날짜 형식 변환
      updatedWorkScheduleData.forEach(work => {
        work.work_day = moment(work.work_day).format('YYYY-MM-DD');
      });
  
      setWorkSchedule(updatedWorkScheduleData);
    } catch (error) {
      console.error('근무 일정을 불러오는 데 실패했습니다:', error);
    }
  };
  

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setSelectedWork('');
    setSelectedWorkPart('');
  };

  const handleWorkChange = (selectedWork) => {
    setSelectedWork(selectedWork);
  };
  
  const handleApply = async () => {
    if (selectedDate && selectedWork && selectedWorkPart) {
      try {
        const response = await fetch('/api/workrequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host_id: 'qwer@naver.com',
            host_name: '관리자',
            work_day: selectedDate.format('YYYY-MM-DD'),
            work_type: selectedWork,
            work_part: selectedWorkPart,
            work_color: workColors[selectedWork],
          }),
        });

        if (response.ok) {
          // 성공적으로 저장된 경우의 처리
          setPopupMessage('근무 신청이 성공적으로 저장되었습니다.');
          fetchWorkSchedule(); // 근무 일정 다시 불러오기
          handlePopupClose();
        } else {
          const errorMessage = await response.text();
          console.error(`근무 요청 저장 실패: ${errorMessage}`);
        }
      } catch (error) {
        console.error('근무 요청 저장 중 오류 발생:', error);
      }
    } else {
      console.error('유효하지 않은 선택입니다. 날짜, 근무, 파트를 선택해 주세요.');
    }
  };

  const handlePopupClose = () => {
    setSelectedDate(null);
    setSelectedWork('');
    setSelectedWorkPart('');
    setPopupMessage(''); // 팝업이 닫힐 때 팝업 메시지 초기화
  };

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <span onClick={prevMonth}>&#9665;</span>
        <span>{currentMonth.format('MMMM YYYY')}</span>
        <span onClick={nextMonth}>&#9655;</span>
      </div>
    );
  };

  const renderDays = () => {
    const weekdays = moment.weekdaysShort();
    return weekdays.map((day) => (
      <span key={day} className="calendar-day">{day}</span>
    ));
  };

  const renderCells = () => {
    const monthStart = moment(currentMonth).startOf('month');
    const monthEnd = moment(currentMonth).endOf('month');
    const startDate = moment(monthStart).startOf('week');
    const endDate = moment(monthEnd).endOf('week');
  
    const calendarRows = [];
  
    let day = startDate;
  
    while (day <= endDate) {
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const dateKey = day.clone().startOf('day').format('YYYY-MM-DD');
        const workInfo = workSchedule.find((work) => work.work_day === dateKey); // 수정된 부분
  
        const cellDay = moment(day);
  
        weekDays.push(
          <div
            key={dateKey}
            className={`calendar-cell ${cellDay.isSame(currentMonth, 'month') ? '' : 'disabled'}`}
            onClick={() => handleDateClick(cellDay)}
            style={workInfo ? { backgroundColor: workInfo.workColor } : null}
          >
            <span className="date">{cellDay.format('D')}</span>
            {workInfo && (
              <div className="work-info">
                <span className="work-part">{workInfo.workPart}</span>
                <button onClick={(e) => { e.stopPropagation(); handleCancel(dateKey); }}>신청취소</button>
              </div>
            )}
          </div>
        );
  
        day = moment(day).add(1, 'day');
      }
  
      calendarRows.push(<div key={weekDays[0].key} className="calendar-row">{[...weekDays]}</div>);
    }
  
    return calendarRows;
  };

  //근무신청 취소
  const handleCancel = async (dateKey) => {
    try {
        const response = await fetch('/api/cancelworkrequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host_id: 'qwer@naver.com',
                work_day: dateKey,
            }),
        });

        if (response.ok) {
          fetchWorkSchedule(); // 근무 일정 다시 불러오기
        } else {
            const errorMessage = await response.text();
            console.error(`근무 취소 실패: ${errorMessage}`);
        }
    } catch (error) {
        console.error('근무 취소 중 오류 발생:', error);
    }
  };
  
  const nextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, 'month'));
  };

  const prevMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  };

  return (
    <div className="calendar">
      {renderHeader()}
      <div className="calendar-days">{renderDays()}</div>
      {renderCells()}
      {selectedDate && (
        <div className="popup">
          <div className="popup-content">
            <p>날짜: {selectedDate.format('YYYY-MM-DD')}</p>
            <div>
              <label>근무 선택:</label>
              <select onChange={(e) => handleWorkChange(e.target.value)}>
                <option value="">근무 선택</option>
                {workNames.map((workName) => (
                  <option key={workName} value={workName}>
                    {workName}
                  </option>
                ))}
              </select>
            </div>
            {selectedWork && (
              <div>
                <label>파트 선택:</label>
                <select onChange={(e) => setSelectedWorkPart(e.target.value)}>
                  <option value="">파트 선택</option>
                  {workSettings[selectedWork]?.map((work) => (
                    <option key={work.id} value={work.partname}>
                      {work.partname} ({work.count}명)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={handlePopupClose}>닫기</button>
            <button onClick={handleApply}>신청하기</button>
          </div>
        </div>
      )}
      {popupMessage && (
        <div className="popup-message">
          {popupMessage}
        </div>
      )}
    </div>
  );
};

export default Calendar;
