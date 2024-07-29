import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
        <Header />
        <Banner />
        <Outlet />
        <Footer />
    </>
  )
};

export default Layout;