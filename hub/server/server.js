const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql2');
const moment = require('moment');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'reactdata'
});

db.connect((err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err);
        throw err;
    }
    console.log('MySQL 데이터베이스에 연결되었습니다.');
});

app.use(express.json());
app.use(cors());

// 호스트 로그인 
app.post("/api/hostdata", (req, res) => {
    const { id, password } = req.body;

    const sql = "SELECT * FROM host WHERE id = ? AND password = ?";
    db.query(sql, [id, password], (err, results) => {
        if (err) {
            console.error('로그인 오류:', err);
            res.status(500).json({ error: '로그인 실패' });
        } else {
            if (results.length > 0) {
                const user = results[0]; // 첫 번째 결과를 사용자 정보로 가정
                res.json(user);
            } else {
                console.error('로그인 실패: 사용자 정보가 일치하지 않습니다.');
                res.status(401).json({ error: '로그인 실패: 사용자 정보가 일치하지 않습니다.' });
            }
        }
    });
});

// 호스트 데이터 확인
app.get('/api/hostdata', (req, res) => {
    const hostId = req.query.id;

    // 연결 확인용으로 수정된 SQL 쿼리
    const sql = "SELECT id, password, name FROM host"
    db.query(sql, (err, results) => {
        if (err) {
            console.error('호스트 데이터 조회 오류:', err);
            res.status(500).json({ error: '호스트 데이터 조회 실패' });
        } else {
            res.json(results);
        }
    });
});

// 근무 설정
app.post('/api/worksetting', (req, res) => {
    const { name, startTime, endTime, color, workparts } = req.body;

    const insertWorkSettingSql = 'INSERT INTO work_setting (name, start_time, end_time, color) VALUES (?, ?, ?, ?)';
    db.query(insertWorkSettingSql, [name, startTime, endTime, color], (err, result) => {
        if (err) {
            console.error('근무 생성 오류:', err);
            res.status(500).json({ error: '근무 생성 실패' });
        } else {
            const workSettingId = result.insertId;

            // work_setting_workpart 테이블에 파트 및 인원 추가
            const insertWorkpartSql = 'INSERT INTO work_setting_workpart (work_setting_id, workpart_id, partname, count) VALUES (?, ?, ?, ?)';
            workparts.forEach((workpart) => {
                db.query(insertWorkpartSql, [workSettingId, workpart.workpart_id, workpart.partname, workpart.count], (err) => {
                    if (err) {
                        console.error('파트 및 인원 추가 오류:', err);
                    }
                });
            });

            res.json({ message: '근무 생성 성공' });
        }
    });
});

app.get('/api/worksetting', (req, res) => {
    const sql = `
        SELECT ws.id, ws.name, ws.start_time, ws.end_time, ws.color, 
               wsw.workpart_id, wsw.partname, wsw.count
        FROM work_setting AS ws
        LEFT JOIN work_setting_workpart AS wsw ON ws.id = wsw.work_setting_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('근무 설정 조회 오류:', err);
            res.status(500).json({ error: '근무 설정 조회 실패' });
        } else {
            res.json(results);
        }
    });
});

// 근무 설정 삭제
app.delete('/api/worksetting/:id', (req, res) => {
    const workSettingId = req.params.id;

    // work_setting_workpart 테이블에서 해당 근무 타임에 대한 행을 먼저 삭제
    const deleteWorkpartSql = 'DELETE FROM work_setting_workpart WHERE work_setting_id = ?';
    db.query(deleteWorkpartSql, [workSettingId], (err) => {
        if (err) {
            console.error('파트 및 인원 삭제 오류:', err);
            res.status(500).json({ error: '파트 및 인원 삭제 실패' });
        } else {
            // 근무 설정 삭제
            const deleteWorkSettingSql = 'DELETE FROM work_setting WHERE id = ?';
            db.query(deleteWorkSettingSql, [workSettingId], (err) => {
                if (err) {
                    console.error('근무 삭제 오류:', err);
                    res.status(500).json({ error: '근무 삭제 실패' });
                } else {
                    res.json({ message: '근무 삭제 성공' });
                }
            });
        }
    });
});


// 호스트 근무 설정 저장
app.post('/api/workrequest', async (req, res) => {
    try {
        const workRequestData = req.body;

        // 근무 설정에서 해당 근무 타입과 파트에 대한 count 값 조회
        const getWorkSettingCountSql = 'SELECT count FROM work_setting_workpart WHERE workpart_id IS NULL AND work_setting_id = (SELECT id FROM work_setting WHERE name = ?)';
        const [row] = await db.promise().query(getWorkSettingCountSql, [workRequestData.work_type]);

        if (!row || row.length === 0 || row[0].count <= 0) {
            // 해당 근무 타입에 대한 count 값이 유효하지 않은 경우
            console.error('유효하지 않은 근무 설정 count 값');
            res.status(400).json({ error: '유효하지 않은 근무 설정 count 값' });
            return;
        }

        // 이미 지원한 인원 수 조회
        const getAppliedCountSql = 'SELECT COUNT(*) AS applied_count FROM apply_for_work WHERE work_type = ? AND work_day = ?';
        const [appliedCountRow] = await db.promise().query(getAppliedCountSql, [workRequestData.work_type, workRequestData.work_day]);
        const appliedCount = appliedCountRow[0].applied_count;

        if (appliedCount >= row[0].count) {
            // 이미 설정된 count 값 이상으로 지원한 경우
            console.error('최대 신청 인원을 초과했습니다.');
            res.status(400).json({ error: '최대 신청 인원을 초과했습니다.' });
            return;
        }

        // 근무 신청 저장
        const insertWorkRequestSql = 'INSERT INTO apply_for_work SET ?';
        const result = await db.promise().query(insertWorkRequestSql, {
            ...workRequestData,
            host_id: workRequestData.host_id, 
            host_name: workRequestData.host_name,  
            work_day: moment(workRequestData.work_day).format('YYYY-MM-DD'),// 날짜 가공
            
        });

        res.status(200).json({ message: '근무 신청이 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('근무 신청 저장 중 오류 발생:', error);
        res.status(500).send('내부 서버 오류');
    }
});

// 호스트 근무 일정을 확인
app.get('/api/workrequest', async (req, res) => {
    try {
      const host_id = req.query.host_id;
      const selectWorkScheduleSql = 'SELECT * FROM apply_for_work WHERE host_id IS NOT NULL';
  
      // 추가적인 필터링이 필요한 경우 host_id에 대한 조건을 추가
      if (host_id) {
        selectWorkScheduleSql += ' AND host_id = ?';
      }
  
      const [result] = await db.promise().query(selectWorkScheduleSql, host_id ? [host_id] : []);
  
      const workScheduleData = result.map((work) => ({
        workType: work.work_type,
        workPart: work.work_part,
        workColor: work.work_color,
        host_id: work.host_id,
        host_name: work.host_name,
        work_day: moment(work.work_day).format('YYYY-MM-DD'), // 날짜 가공
      }));
  
      res.status(200).json(workScheduleData);
    } catch (error) {
      console.error('Error while fetching work schedule. SQL Query:', selectWorkScheduleSql, 'Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  



// 호스트 근무 신청 취소 엔드포인트
app.post('/api/cancelworkrequest', async (req, res) => {
    try {
        const { host_id, work_day } = req.body;

        // 근무 신청 삭제
        const deleteWorkRequestSql = 'DELETE FROM apply_for_work WHERE host_id = ? AND work_day = ?';
        const result = await db.promise().query(deleteWorkRequestSql, [host_id, work_day]);

        if (result[0].affectedRows > 0) {
            // 취소 성공
            res.status(200).json({ message: 'Work request canceled successfully' });
        } else {
            // 해당 날짜에 대한 근무 신청이 없는 경우
            console.error('No work request found for the specified date');
            res.status(404).json({ error: 'No work request found for the specified date' });
        }
    } catch (error) {
        console.error('Error while canceling work request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 유저 정보 삭제
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
  
    const sql = 'DELETE FROM user WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('사용자 삭제 중 오류 발생:', err);
        res.status(500).json({ success: false, error: '사용자 삭제 실패' });
      } else {
        res.json({ success: true, message: '사용자 삭제 성공' });
      }
    });
  });

// 여기부터 유저

// 유저 회원가입
app.post('/api/signup', (req, res) => {
    const { id, password, name, phoneNumber, address } = req.body;

    // 데이터베이스에 회원 데이터를 user 테이블에 추가 로직을 구현합니다.
    const sql = "INSERT INTO user (id, password, name, phoneNumber, address) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [id, password, name, phoneNumber, address], (err, results) => {
        if (err) {
            console.error('회원가입 오류:', err);
            res.status(500).json({ error: '회원가입 실패' });
        } else {
            res.json({ message: '회원가입 성공' });
        }
    });
});

// 유저 데이터 확인
app.get('/api/users', (req, res) => {
    // 'user' 테이블에서 id, name, phoneNumber, address 정보를 조회합니다.
    const sql = "SELECT id, name, password, phoneNumber, address FROM user";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('사용자 정보 조회 오류:', err);
            res.status(500).json({ error: '사용자 정보 조회 실패' });
        } else {
            // 조회된 정보를 클라이언트에게 반환합니다.
            res.json(results);
        }
    });
});

// 유저 로그인
app.post("/api/users", (req, res) => {
    const { id, password } = req.body;

    const sql = "SELECT * FROM user WHERE id = ? AND password = ?";
    db.query(sql, [id, password], (err, results) => {
        if (err) {
            console.error('로그인 오류:', err);
            res.status(500).json({ error: '로그인 실패' });
        } else {
            if (results.length > 0) {
                const user = results[0]; // 첫 번째 결과를 사용자 정보로 가정
                res.json(user);
            } else {
                console.error('로그인 실패: 사용자 정보가 일치하지 않습니다.');
                res.status(401).json({ error: '로그인 실패: 사용자 정보가 일치하지 않습니다.' });
            }
        }
    });
});

// 유저 데이터 수정
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, phoneNumber, address } = req.body;

    // 비밀번호를 변경하지 않고 사용자 정보를 업데이트하는 별도의 SQL 쿼리 사용
    const updateSql = 'UPDATE user SET name = ?, phoneNumber = ?, address = ? WHERE id = ?';

    db.query(updateSql, [name, phoneNumber, address, userId], (err, results) => {
        if (err) {
            console.error('사용자 정보 수정 오류:', err);
            res.status(500).json({ error: '사용자 정보 수정 실패' });
        } else {
            res.json({ message: '사용자 정보가 성공적으로 수정되었습니다.' });
        }
    });
});



// 유저 근무 설정 저장
app.post('/api/userworkrequest', async (req, res) => {
    try {
        const workRequestData = req.body;
        // 로그인한 사용자 정보 설정
        const loggedInUser = req.user;  

        // 근무 설정에서 해당 근무 타입과 파트에 대한 count 값 조회
        const getWorkSettingCountSql = 'SELECT count FROM work_setting_workpart WHERE workpart_id IS NULL AND work_setting_id = (SELECT id FROM work_setting WHERE name = ?)';
        const [row] = await db.promise().query(getWorkSettingCountSql, [workRequestData.work_type]);

        if (!row || row.length === 0 || row[0].count <= 0) {
            // 해당 근무 타입에 대한 count 값이 유효하지 않은 경우
            console.error('유효하지 않은 근무 설정 count 값');
            res.status(400).json({ error: '유효하지 않은 근무 설정 count 값' });
            return;
        }

        // 이미 지원한 인원 수 조회
        const getAppliedCountSql = 'SELECT COUNT(*) AS applied_count FROM apply_for_work WHERE work_type = ? AND work_day = ?';
        const [appliedCountRow] = await db.promise().query(getAppliedCountSql, [workRequestData.work_type, workRequestData.work_day]);
        const appliedCount = appliedCountRow[0].applied_count;

        if (appliedCount >= row[0].count) {
            // 이미 설정된 count 값 이상으로 지원한 경우
            console.error('최대 신청 인원을 초과했습니다.');
            res.status(400).json({ error: '최대 신청 인원을 초과했습니다.' });
            return;
        }

        // 근무 신청 저장
        const insertWorkRequestSql = 'INSERT INTO apply_for_work SET ?';
        const result = await db.promise().query(insertWorkRequestSql, {
            ...workRequestData,
            user_id: loggedInUser.id, 
            user_name: loggedInUser.name,  
            work_day: moment(workRequestData.work_day).format('YYYY-MM-DD'),// 날짜 가공
            
        });

        res.status(200).json({ message: '근무 신청이 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('근무 신청 저장 중 오류 발생:', error);
        res.status(500).send('내부 서버 오류');
    }
});

// 유저 근무 일정을 확인
app.get('/api/userworkrequest', async (req, res) => {
    try {
      const user_id = req.query.user_id;
      const selectWorkScheduleSql = 'SELECT * FROM apply_for_work WHERE user_id IS NOT NULL';
  
      // 추가적인 필터링이 필요한 경우 user_id에 대한 조건을 추가
      if (user_id) {
        selectWorkScheduleSql += ' AND user_id = ?';
      }
  
      const [result] = await db.promise().query(selectWorkScheduleSql, user_id ? [user_id] : []);
  
      const workScheduleData = result.map((work) => ({
        workType: work.work_type,
        workPart: work.work_part,
        workColor: work.work_color,
        user_id: work.user_id,
        user_name: work.user_name,
        work_day: moment(work.work_day).format('YYYY-MM-DD'), // 날짜 가공
      }));
  
      res.status(200).json(workScheduleData);
    } catch (error) {
      console.error('Error while fetching work schedule. SQL Query:', selectWorkScheduleSql, 'Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// 유저 근무 신청 취소 엔드포인트
app.post('/api/usercancelworkrequest', async (req, res) => {
    try {
        const { user_id, work_day } = req.body;

        // 근무 신청 삭제
        const deleteWorkRequestSql = 'DELETE FROM apply_for_work WHERE user_id = ? AND work_day = ?';
        const result = await db.promise().query(deleteWorkRequestSql, [user_id, work_day]);

        if (result[0].affectedRows > 0) {
            // 취소 성공
            res.status(200).json({ message: 'Work request canceled successfully' });
        } else {
            // 해당 날짜에 대한 근무 신청이 없는 경우
            console.error('No work request found for the specified date');
            res.status(404).json({ error: 'No work request found for the specified date' });
        }
    } catch (error) {
        console.error('Error while canceling work request:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(4000, () => {
    console.log("Server started on port 4000");
});
