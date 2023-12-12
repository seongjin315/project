import { BrowserRouter, Route, Routes} from "react-router-dom"
import Login from "./Login";
import Home from "./pages/Home"
import Worksetting from "./pages/Worksetting"
import Employee from "./pages/Employee"
import WorkRequest from "./pages/WorkRequest"
import ViewWorkSchedule from "./pages/ViewWorkSchedule"




function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/Home" element={<Home/>} />
        <Route path="/Worksetting" element={<Worksetting/>}/>
        <Route path="/Employee" element={<Employee/>}/>
        <Route path="/WorkRequest" element={<WorkRequest/>}/>
        <Route path="/ViewWorkSchedule" element={<ViewWorkSchedule/>}/>
      </Routes>
    </BrowserRouter>
  );
  
}

export default App;