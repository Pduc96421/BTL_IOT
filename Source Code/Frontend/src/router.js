import { Route, Routes } from "react-router-dom";
import { ROUTERS } from "./utils/router";
import MasterUserLayout from "pages/user/theme/masterLayout";
import LoginPage from "pages/user/login";
import SignupPage from "pages/user/signup";
import DashboardPage from "pages/user/dashboard";
import HistoryPage from "pages/user/history";
import UsersPage from "pages/user/users";
import DevicesPage from "pages/user/devices";
import FaceLock from "pages/user/stream";

const RouterCustom = () => {
  const UserRouters = [
    {
      path: ROUTERS.USER.DASHBOARD,
      component: <DashboardPage />,
    },
    {
      path: ROUTERS.USER.HISTORY,
      component: <HistoryPage />,
    },
    {
      path: ROUTERS.USER.USERS,
      component: <UsersPage />,
    },
    {
      path: ROUTERS.USER.DEVICES,
      component: <DevicesPage />,
    },

    {
      path: ROUTERS.USER.SIGNUP,
      component: <SignupPage />,
    },
    {
      path: ROUTERS.USER.LOGIN,
      component: <LoginPage />,
    },
    {
      path: ROUTERS.USER.STREAM,
      component: <FaceLock />,
    },
  ];
  return (
    <MasterUserLayout>
      <Routes>
        {UserRouters.map((item, key) => (
          <Route key={key} path={item.path} element={item.component} />
        ))}
      </Routes>
    </MasterUserLayout>
  );
};

export default RouterCustom;
